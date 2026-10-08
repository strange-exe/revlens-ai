#!/usr/bin/env bash
# RevLens: full Phase 2 + 3 pipeline on a single NVIDIA B200.
#
#   cd ml && bash run_b200.sh            # everything; re-run to resume after any interruption
#   STAGES="eval export" bash run_b200.sh  # only some stages
#
# Each stage writes runs/.done_<stage> when it finishes and is skipped on the next run.
# Delete that file to redo a stage. All output is logged to runs/logs/<stage>.log.
set -euo pipefail
cd "$(dirname "$0")"
# Ignore the image's own Python stack (e.g. a system PyTorch 2.7 pinned by /etc/pip/constraint.txt)
source ./python_env.sh
isolate_python_env

# ── settings (override with environment variables) ───────────────────────
# Sized to the GPU memory actually visible: a MIG slice (e.g. "B200 MIG 1g.23gb") has a fraction of the card.
gpu_gb() {  # visible GPU memory in GB; override with GPU_GB=<n>
  local mib name
  # 1. Full GPUs report memory directly. On MIG slices this prints "[Insufficient Permissions]".
  mib=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ' || true)
  if [[ $mib =~ ^[0-9]+$ ]]; then echo $(( mib / 1024 )); return; fi
  # 2. MIG slices carry their size in the name, e.g. "MIG 1g.23gb"
  name=$(nvidia-smi -L 2>/dev/null | grep -oE '[0-9]+g\.[0-9]+gb' | head -1 || true)
  if [[ -n $name ]]; then name=${name#*.}; echo "${name%gb}"; return; fi
  # 3. Unknown: assume a small GPU (the safe choice; it only means a smaller teacher)
  echo "Could not read GPU memory; assuming a small GPU. Set GPU_GB=<n> to override." >&2
  echo 0
}
GPU_GB="${GPU_GB:-$(gpu_gb)}"
if   (( GPU_GB >= 80 )); then D_MODEL=Qwen/Qwen3-32B D_BATCH=48 D_LIMIT=60000 D_TRAIN_BS=64  # bf16 ~65 GB
elif (( GPU_GB >= 40 )); then D_MODEL=Qwen/Qwen3-14B D_BATCH=32 D_LIMIT=40000 D_TRAIN_BS=64  # bf16 ~30 GB
else                          D_MODEL=Qwen/Qwen3-8B  D_BATCH=16 D_LIMIT=20000 D_TRAIN_BS=32  # bf16 ~17 GB: fits a 23 GB slice
fi
TEACHER_MODEL="${TEACHER_MODEL:-$D_MODEL}"         # any instruct model vLLM can serve with JSON-schema output
TEACHER_BACKEND="${TEACHER_BACKEND:-auto}"         # auto: vLLM if it works on this driver, else hf (transformers)
HF_BATCH="${HF_BATCH:-$D_BATCH}"                   # hf backend: reviews per generation batch
TEACHER_PORT="${TEACHER_PORT:-8001}"
TEACHER_WORKERS="${TEACHER_WORKERS:-64}"
LIMIT_TRAIN="${LIMIT_TRAIN:-$D_LIMIT}"             # train reviews labelled by the teacher
LIMIT_VAL="${LIMIT_VAL:-5000}"
BACKBONES="${BACKBONES:-microsoft/deberta-v3-xsmall microsoft/deberta-v3-small microsoft/deberta-v3-base}"
EPOCHS="${EPOCHS:-3}"
BATCH_SIZE="${BATCH_SIZE:-$D_TRAIN_BS}"
SEEDS="${SEEDS:-13}"                              # e.g. "13 14 15" to report mean ± std
RUN_SUFFIX="${RUN_SUFFIX:-}"                      # e.g. -food: names runs/artifacts/zip so a retrain never reuses old names
STAGES="${STAGES:-setup test data teacher baselines train eval export}"
TORCH_CUDA="${TORCH_CUDA:-}"                      # e.g. cu128; empty = match the installed NVIDIA driver

DATA=data/processed
TEACHER_NAME="${TEACHER_MODEL##*/}"
mkdir -p runs/logs

log()  { printf '\n\033[1m[%s] %s\033[0m\n' "$(date +%H:%M:%S)" "$*"; }
done_() { [[ -f "runs/.done_$1" ]]; }
mark() { date > "runs/.done_$1"; }
want() { [[ " $STAGES " == *" $1 "* ]]; }
stage() {  # stage <name> <function>: run unless already done, tee output to a log
  local name=$1 fn=$2
  if ! want "$name"; then return; fi
  if done_ "$name"; then log "skip $name (done; rm runs/.done_$name to redo)"; return; fi
  log "stage: $name"
  # Run the stage in a subshell with errexit on, and only mark it done if it really succeeded.
  set +e
  ( set -e; "$fn" ) 2>&1 | tee "runs/logs/$name.log"
  local rc=${PIPESTATUS[0]}
  set -e
  if (( rc != 0 )); then log "FAILED: $name (exit $rc). Log: runs/logs/$name.log. Fix it and re-run; finished stages are skipped."; exit "$rc"; fi
  mark "$name"
}

# ── stages ───────────────────────────────────────────────────────────────
driver_cuda_tag() {  # the PyTorch CUDA build this driver can run (B200/Blackwell needs CUDA >= 12.8)
  local v major minor
  v=$(nvidia-smi | grep -oE 'CUDA Version: [0-9]+\.[0-9]+' | grep -oE '[0-9]+\.[0-9]+')
  major=${v%.*}; minor=${v#*.}
  if (( major >= 13 )); then echo cu130
  elif (( major == 12 && minor >= 8 )); then echo cu128
  else echo "Driver supports CUDA $v; a B200 needs a driver for CUDA >= 12.8. Ask the admin to update it." >&2; return 1
  fi
}

gpu_ok() { "$1" -c "import torch; torch.zeros(1).cuda(); print('GPU:', torch.cuda.get_device_name(), '| torch', torch.__version__, '| CUDA', torch.version.cuda)"; }

setup() {
  local tag; tag=${TORCH_CUDA:-$(driver_cuda_tag)}
  echo "driver -> PyTorch build: $tag | GPU memory ${GPU_GB} GB -> teacher $TEACHER_MODEL, hf batch $HF_BATCH, $LIMIT_TRAIN train labels"

  # Training env: PyTorch built for this driver. Never install vLLM here: it pulls a torch for a newer driver.
  # If the env can't use the GPU (e.g. something replaced torch), rebuild it from scratch.
  # Also rebuild a venv that can see the system packages, or whose torch is the image's own install.
  if [[ -d .venv ]] && { grep -qiE '^include-system-site-packages *= *true' .venv/pyvenv.cfg \
       || ! gpu_ok .venv/bin/python 2>/dev/null || ! torch_is_ours .venv >/dev/null 2>&1; }; then
    echo ".venv is not a clean, GPU-ready env of its own (system torch visible or replaced?): rebuilding it"; rm -rf .venv
  fi
  [[ -d .venv ]] || python3 -m venv .venv
  .venv/bin/pip install --upgrade pip
  if ! gpu_ok .venv/bin/python 2>/dev/null || ! torch_is_ours .venv >/dev/null 2>&1; then
    .venv/bin/pip install --force-reinstall torch --index-url "https://download.pytorch.org/whl/$tag"
  fi
  torch_is_ours .venv                           # fail here, loudly, if the system torch still wins
  # Pin the working torch so no requirement can upgrade it (pip errors loudly instead of breaking the GPU)
  .venv/bin/python -c "import torch; print('torch==' + torch.__version__)" > runs/torch-pin.txt
  .venv/bin/pip install -r requirements.txt -c runs/torch-pin.txt
  gpu_ok .venv/bin/python                       # fail here, loudly, rather than mid-training
  .venv/bin/pip freeze > runs/pip-freeze.txt

  # Teacher env: vLLM with a torch for the same driver (uv picks the matching PyTorch index)
  rm -f runs/vllm_ok
  if [[ "$TEACHER_BACKEND" != hf ]]; then
    [[ -d .venv-teacher ]] || python3 -m venv .venv-teacher
    .venv-teacher/bin/pip install --upgrade pip uv
    # Recent vLLM wheels are built for CUDA 13 (libcudart.so.13), which a 12.8 driver cannot load:
    # on cu128 pin the last release line whose default wheel targets CUDA 12.8 (override with VLLM_SPEC).
    # vLLM 0.11 predates transformers 5 (which removed tokenizer attributes it uses), so cap transformers too.
    local spec=(vllm)
    if [[ $tag == cu128 ]]; then spec=("vllm==0.11.0" "transformers>=4.56,<5"); fi
    if [[ -n ${VLLM_SPEC:-} ]]; then read -ra spec <<< "$VLLM_SPEC"; fi
    if .venv-teacher/bin/uv pip install --python .venv-teacher/bin/python "${spec[@]}" --torch-backend="$tag" \
       && gpu_ok .venv-teacher/bin/python && torch_is_ours .venv-teacher \
       && .venv-teacher/bin/python -c "import vllm; print('vLLM', vllm.__version__)"; then
      touch runs/vllm_ok
    else
      echo "vLLM is not usable with this driver: the teacher stage will use the hf (transformers) backend."
    fi
  fi
}

test_() { pytest tests -q; }

data() {
  python -m revlens_ml.data --out "$DATA"
  python -c "import json; m=json.load(open('$DATA/manifest.json')); print('rows', m['rows']); print('FROZEN test_sha256:', m['test_sha256'])"
}

wait_for_server() {
  for _ in $(seq 1 180); do
    if curl -sf "http://localhost:$TEACHER_PORT/health" >/dev/null; then return 0; fi
    if ! kill -0 "$1" 2>/dev/null; then echo "vLLM exited; see runs/logs/vllm.log"; return 1; fi
    sleep 10
  done
  echo "vLLM did not become ready in 30 min"; return 1
}

teacher() {
  local backend=$TEACHER_BACKEND T
  if [[ $backend == auto ]]; then backend=$([[ -f runs/vllm_ok ]] && echo vllm || echo hf); fi
  echo "teacher backend: $backend ($TEACHER_MODEL)"
  if [[ $backend == vllm ]]; then
    .venv-teacher/bin/vllm serve "$TEACHER_MODEL" --port "$TEACHER_PORT" --max-model-len 4096 \
      --gpu-memory-utilization 0.85 > runs/logs/vllm.log 2>&1 &
    VLLM_PID=$!
    # Stages run in a subshell (piped to tee), so EXIT fires on success *and* failure: always free the GPU
    trap 'kill "$VLLM_PID" 2>/dev/null || true' EXIT
    if wait_for_server "$VLLM_PID"; then
      T=(--backend openai --base-url "http://localhost:$TEACHER_PORT/v1" --model "$TEACHER_MODEL"
         --no-thinking --workers "$TEACHER_WORKERS" --data "$DATA")
    else
      # Don't stop the whole run: label with the same model through transformers instead (slower, same labels)
      echo "vLLM server did not start (runs/logs/vllm.log): falling back to the hf backend"
      tail -n 5 runs/logs/vllm.log || true
      kill "$VLLM_PID" 2>/dev/null || true; wait "$VLLM_PID" 2>/dev/null || true   # free the GPU first
      backend=hf
    fi
  fi
  if [[ $backend == hf ]]; then
    T=(--backend hf --model "$TEACHER_MODEL" --batch-size "$HF_BATCH" --data "$DATA")
  fi
  python -m revlens_ml.teacher "${T[@]}" --split train --limit 200
  python -c "
import json, itertools
rows = [json.loads(l) for l in itertools.islice(open('$DATA/teacher/train.$TEACHER_NAME.jsonl'), 5)]
for r in rows: print(r)" # spot-check: these should look sensible
  python -m revlens_ml.teacher "${T[@]}" --split train --limit "$LIMIT_TRAIN"
  python -m revlens_ml.teacher "${T[@]}" --split val --limit "$LIMIT_VAL"
  python -m revlens_ml.teacher "${T[@]}" --split test --eval-sample
}

baselines() {
  local labels="$DATA/teacher/train.$TEACHER_NAME.jsonl" extra=()
  if [[ -f "$labels" ]]; then extra=(--teacher "$labels"); else echo "no teacher labels: TF-IDF without aspects"; fi
  python -m revlens_ml.baselines --data "$DATA" --out runs/tfidf "${extra[@]}"
}

train() {
  for backbone in $BACKBONES; do
    for seed in $SEEDS; do
      local out="runs/${backbone##*/}-s$seed$RUN_SUFFIX"
      if [[ -f "$out/history.json" ]]; then echo "skip $out (trained)"; continue; fi
      python -m revlens_ml.train --backbone "$backbone" --data "$DATA" --seed "$seed" \
        --teacher "$DATA/teacher/train.$TEACHER_NAME.jsonl" --val-teacher "$DATA/teacher/val.$TEACHER_NAME.jsonl" \
        --epochs "$EPOCHS" --batch-size "$BATCH_SIZE" --out "$out"
    done
  done
}

eval_() {
  local E="$DATA/teacher/test-eval"
  local models=(--model heuristic --model tfidf=tfidf:runs/tfidf --model "teacher-$TEACHER_NAME=jsonl:$E.$TEACHER_NAME.jsonl")
  local gemini_file
  gemini_file=$(ls "$E".gemini-*.jsonl 2>/dev/null | head -1 || true)
  if [[ -n "$gemini_file" ]]; then models+=(--model "gemini=jsonl:$gemini_file"); fi
  local local_models=(--model heuristic --model tfidf=tfidf:runs/tfidf)
  for run in runs/deberta-*/; do
    [[ -f "$run/heads.pt" ]] || continue
    local name; name=$(basename "$run")
    models+=(--model "$name=torch:$run"); local_models+=(--model "$name=torch:$run")
  done
  python -m revlens_ml.evaluate --data "$DATA" --subset eval_sample "${models[@]}" \
    --reference-teacher "$E.$TEACHER_NAME.jsonl" --out runs/eval-sample
  python -m revlens_ml.evaluate --data "$DATA" --subset test "${local_models[@]}" --out runs/eval-test
}

export_() {
  # Export every trained size: pick by accuracy (eval reports) AND RAM (README step 7).
  # A model whose int8 version fails the parity gate is skipped, not fatal: the others still export.
  local exported=() failed=()
  for run in runs/deberta-*/; do
    [[ -f "$run/heads.pt" ]] || continue
    local name; name=$(basename "$run")
    if [[ -f "artifacts/$name.zip" ]]; then echo "skip $name (artifacts/$name.zip exists)"; exported+=("$name"); continue; fi
    if ! python -m revlens_ml.export --run "$run" --out "artifacts/$name" --parity-data "$DATA/val.parquet"; then
      echo "export FAILED for $name (int8 parity gate, see artifacts/$name/parity.json): continuing with the others"
      failed+=("$name"); continue
    fi
    exported+=("$name")
    python -m revlens_ml.evaluate --data "$DATA" --subset eval_sample --model "$name-int8=onnx:artifacts/$name" \
      --out "runs/eval-int8-$name"
    python -c "
import zipfile, sys
d = 'artifacts/$name'
with zipfile.ZipFile(d + '.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in ('labels.json', 'tokenizer.json', 'model.int8.onnx'):
        z.write(f'{d}/{f}', f)"
    echo "model zip: artifacts/$name.zip"
  done
  echo "exported: ${exported[*]:-none} | failed parity: ${failed[*]:-none}"
  (( ${#exported[@]} > 0 )) || { echo "no model passed the int8 parity gate"; return 1; }
}

# ── run ──────────────────────────────────────────────────────────────────
stage setup setup
# shellcheck disable=SC1091
source .venv/bin/activate
stage test test_
stage data data
stage teacher teacher
stage baselines baselines
stage train train
stage eval eval_
stage export export_

log "finished. Results:"
cat runs/eval-sample/report.md 2>/dev/null | head -12 || true
echo
# Results only exist on this machine until they're copied off it: back them up straight away.
if [[ -n "${SKIP_PUBLISH:-}" ]]; then
  echo "SKIP_PUBLISH is set: the caller backs up the results itself."
elif [[ -n "${HF_TOKEN:-}" && -f artifacts/${WINNER:-deberta-v3-xsmall-s13}.zip ]]; then
  log "backing up model + results to your private Hugging Face repo"
  bash publish_model.sh || echo "Backup FAILED: run 'bash publish_model.sh' again before touching this folder."
else
  printf '\n\033[1;33m%s\033[0m\n' "NOT BACKED UP: runs/ and artifacts/ exist only on this machine. Back them up now:"
  echo "  export HF_TOKEN=<write token> && bash publish_model.sh"
fi
echo "Next: fill in runs/eval-sample/errors_<winner>.md, then deploy artifacts/<winner>.zip (README step 8)."
echo "Optional Gemini baseline (needs GEMINI_API_KEY, ~3 h, any machine):"
echo "  python -m revlens_ml.teacher --backend gemini --split test --eval-sample --workers 1 --pace 5 && rm runs/.done_eval && STAGES=eval bash run_b200.sh"
