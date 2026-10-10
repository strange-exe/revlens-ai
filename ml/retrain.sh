#!/usr/bin/env bash
# Retrain the classifier from scratch on a fresh GPU machine (e.g. a B200 MIG slice), after the aspect list changed.
#
#   mkdir -p /workspace/v2 && cd /workspace/v2 && python3 -m zipfile -e /path/to/revlens-retrain.zip .
#   export HF_TOKEN=<write token>          # recommended: faster downloads, the old-vs-new comparison, and the backup
#   bash /workspace/v2/ml/retrain.sh
#
# No tmux needed: the checks run in front of you, then the long run moves to the background (it survives closing the
# terminal) and the log is shown live. Ctrl+C only stops watching. Watch again later: bash retrain.sh (same command).
#
#   0. preflight: GPU, disk, Python; installs missing system packages (curl, python venv) when run as root
#   1. setup (run_b200.sh): .venv with PyTorch for this driver and .venv-teacher with vLLM 0.11 (else transformers).
#      The image's own Python stack (e.g. a system PyTorch 2.7 pinned by /etc/pip/constraint.txt) is ignored and
#      checked: torch must load from inside each venv.
#   2. tests, data (downloads the public dataset, rebuilds the frozen split), teacher (re-labels ~27,000 reviews
#      with the current aspect guide), baselines, train (xsmall: fits Render's 512 MB), eval, export
#   3. checks the rebuilt test split is the same 40,529 reviews the deployed model was measured on
#   4. downloads the deployed model from your private repo and scores old and new side by side
#   5. backs up as deberta-v3-xsmall-s13-food3.zip + revlens-results-food3.tgz: the deployed file is never replaced
#
# On a machine that already ran it, the same command retrains only: data, teacher labels and baselines are reused.
set -euo pipefail
cd "$(dirname "$0")"
source ./python_env.sh

# -food2: per-aspect loss weights and xsmall's own learning rate (the -food run's WiFi head was dead).
# -food3: relabelled with the guide that keeps WiFi and meals out of amenities.
# A new suffix is a new model: data and teacher labels are reused, training/eval/export run again.
export RUN_SUFFIX="${RUN_SUFFIX:--food3}"
export BACKBONES="${BACKBONES:-microsoft/deberta-v3-xsmall}"
export SEEDS="${SEEDS:-13}"
export EPOCHS="${EPOCHS:-4}"   # the best epoch on val is kept, so a 4th can only help
first_backbone=${BACKBONES%% *}; first_seed=${SEEDS%% *}
export WINNER="${WINNER:-${first_backbone##*/}-s$first_seed$RUN_SUFFIX}"
OLD_WINNER="${OLD_WINNER:-${first_backbone##*/}-s$first_seed}"   # the deployed model, for the comparison
FROZEN_TEST_SHA256="caf0904c7d67b6da2350a12912f33c6e03e9b44b1158773639d86981bf2b138a"  # ml/data manifest, 2026-10-04
DATA=data/processed
LOG=runs/retrain.log
PIDFILE=runs/retrain.pid
say() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mSTOPPED: %s\033[0m\n' "$*"; rm -f "$PIDFILE"; exit 1; }

follow_log() {
  echo "Live log below. Ctrl+C stops WATCHING only; the run continues. Watch again: bash $(pwd)/retrain.sh"
  exec tail -n 200 -f "$LOG"
}

if [[ -z "${RETRAIN_INSIDE:-}" ]]; then
  mkdir -p runs
  # Already running? Just show it again instead of starting a second copy.
  if [[ -f $PIDFILE ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "retrain.sh is already running (pid $(cat "$PIDFILE"))."; follow_log
  fi

  # 0. Preflight, in front of you, before hours of work start
  say "preflight"
  [[ -f ../backend/app/ai.py ]] || die "backend/ must sit next to this ml/ folder: extract the whole zip into one empty folder"
  grep -q '"food"' ../backend/app/ai.py || die "../backend/app/ai.py has no food aspect: wrong backend copy"
  command -v nvidia-smi >/dev/null || die "nvidia-smi not found: this machine has no NVIDIA driver visible"
  nvidia-smi -L || die "nvidia-smi can't list a GPU"
  command -v python3 >/dev/null || die "python3 is missing"
  python3 -c 'import sys; sys.exit(sys.version_info < (3, 10))' || die "Python 3.10+ needed, found $(python3 -V)"
  missing=()
  command -v curl >/dev/null || missing+=(curl)
  python3 -c 'import venv, ensurepip' 2>/dev/null \
    || missing+=("python$(python3 -c 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")')-venv")
  if (( ${#missing[@]} )); then
    if [[ $(id -u) == 0 ]] && command -v apt-get >/dev/null; then
      echo "installing missing system packages: ${missing[*]}"
      DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${missing[@]}"
    else
      die "missing system packages: ${missing[*]}. Install them (sudo apt-get install -y ${missing[*]}) and re-run"
    fi
  fi
  command -v curl >/dev/null && python3 -c 'import venv, ensurepip' || die "system packages still missing after install"
  free_gb=$(( $(df -Pk . | awk 'NR==2 {print $4}') / 1024 / 1024 ))
  (( free_gb >= 50 )) || die "only ${free_gb} GB free here; the teacher model (~16 GB), two environments and data need ~45 GB"
  [[ -n "${HF_TOKEN:-}" ]] || warn "HF_TOKEN not set: downloads are slower, and the comparison and backup steps will be skipped."
  echo "preflight OK: $(nvidia-smi -L | head -1 | cut -c1-60) | ${free_gb} GB free | $(python3 -V)"

  # Hand over to a background copy of this script that survives the terminal closing
  : > "$LOG"
  if command -v setsid >/dev/null; then
    RETRAIN_INSIDE=1 setsid nohup bash "$(pwd)/retrain.sh" >>"$LOG" 2>&1 </dev/null &
  else
    RETRAIN_INSIDE=1 nohup bash "$(pwd)/retrain.sh" >>"$LOG" 2>&1 </dev/null &
  fi
  echo $! > "$PIDFILE"
  say "started in the background (pid $!): several hours"
  [[ -n "${RETRAIN_NO_FOLLOW:-}" ]] || follow_log
  exit 0
fi

# ── Below runs in the background copy; everything goes to runs/retrain.log ──
echo $$ > "$PIDFILE"   # this process's own pid (setsid may have forked)
trap 'rc=$?; rm -f "$PIDFILE"; if (( rc )); then printf "\nSTOPPED with exit %s: see the lines above. Re-run the same command to continue.\n" "$rc"; fi' EXIT
isolate_python_env
export REVLENS_BACKEND="$(cd ../backend && pwd)"
# Keep model downloads (Qwen3-8B is ~16 GB) on this volume, so a container restart doesn't lose them
export HF_HOME="${HF_HOME:-$(cd .. && pwd)/hf-cache}"
mkdir -p "$HF_HOME"
say "run started $(date -u '+%F %T UTC') | ml: $(pwd) | HF cache: $HF_HOME | model: $WINNER"

# Teacher labels are only valid for the labelling guide they were made with (backend/app/ai.py). When the guide
# changed, keep the old labels (moved aside, never deleted) and label again; everything after the teacher re-runs.
GUIDE_SHA=$(python3 - ../backend/app/ai.py <<'PY'
import ast, hashlib, json, sys
tree = ast.parse(open(sys.argv[1], encoding="utf-8").read())
found = {t.id: ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
         for t in n.targets if isinstance(t, ast.Name) and t.id in ("ASPECT_GUIDE", "SENTIMENT_GUIDE")}
print(hashlib.sha256(json.dumps(found, sort_keys=True).encode()).hexdigest()[:16])
PY
)
if [[ -d "$DATA/teacher" ]] && ls "$DATA"/teacher/*.jsonl >/dev/null 2>&1 \
   && [[ "$(cat "$DATA/teacher/GUIDE_SHA" 2>/dev/null || echo none)" != "$GUIDE_SHA" ]]; then
  old="$DATA/teacher-before-$(date -u +%Y%m%d-%H%M%S)"
  say "the labelling guide changed since these teacher labels were made: keeping them in $old and labelling again"
  mv "$DATA/teacher" "$old"
  rm -f runs/.done_teacher runs/.done_baselines runs/.done_train runs/.done_eval runs/.done_export
fi
mkdir -p "$DATA/teacher" && echo "$GUIDE_SHA" > "$DATA/teacher/GUIDE_SHA"

# A machine that already ran an earlier retrain has train/eval/export marked done: this model isn't trained yet,
# so run those three again (data, teacher labels and baselines are kept: they don't depend on the model)
if [[ ! -f "runs/$WINNER/history.json" && -f runs/.done_train ]]; then
  say "earlier run found: reusing its data and teacher labels, training $WINNER"
  rm -f runs/.done_train runs/.done_eval runs/.done_export
fi

# 1-2. The pipeline. It publishes nothing itself: the backup waits for the comparison (step 5).
say "pipeline: setup, tests, data, teacher, baselines, train, eval, export"
SKIP_PUBLISH=1 bash fix_and_run.sh

# 3. Same frozen test set as the deployed model?
SAME_SPLIT=0
if .venv/bin/python - "$DATA" "$FROZEN_TEST_SHA256" <<'PY'
import hashlib, sys
import pandas as pd
ids = pd.read_parquet(f"{sys.argv[1]}/test.parquet")["review_id"]
got = hashlib.sha256("\n".join(sorted(ids)).encode()).hexdigest()
print(f"rebuilt test split: {len(ids)} reviews, sha256 {got[:12]}... (frozen: {sys.argv[2][:12]}...)")
sys.exit(got != sys.argv[2])
PY
then SAME_SPLIT=1; echo "same frozen test set as the deployed model: numbers are directly comparable"
else warn "the rebuilt test split differs from the frozen one (dataset changed upstream?). The comparison below is
still fair (both models scored on the same new split), but don't compare these numbers with ml/RESULTS.md."
fi

# 4. Old (deployed) vs new, scored the way production scores them: int8 ONNX, one review at a time
OLD_MODEL=runs/old-model
if [[ ! -f "$OLD_MODEL/labels.json" && -n "${HF_TOKEN:-}" ]]; then
  say "downloading the deployed model ($OLD_WINNER.zip) from your private repo for the comparison"
  .venv/bin/python - "$OLD_WINNER" "$OLD_MODEL" <<'PY' || warn "couldn't download the deployed model: comparison skipped"
import os, sys, zipfile
from huggingface_hub import HfApi, hf_hub_download
api = HfApi()
repo = os.getenv("HF_REPO") or f"{api.whoami()['name']}/revlens-classifier"
path = hf_hub_download(repo, f"{sys.argv[1]}.zip", repo_type="model")
zipfile.ZipFile(path).extractall(sys.argv[2])
print(f"deployed model from {repo} -> {sys.argv[2]}")
PY
fi
if [[ -f "$OLD_MODEL/labels.json" ]]; then
  export MODEL_THREADS="${MODEL_THREADS:-8}"
  TEACHER_EVAL=$(ls "$DATA"/teacher/test-eval.*.jsonl 2>/dev/null | head -1 || true)
  models=(--model "old-$OLD_WINNER-int8=onnx:$OLD_MODEL")
  # Earlier retrains on this machine (e.g. -food) join the comparison, so the table shows what this run changed
  for prev in artifacts/"$OLD_WINNER"-*/; do
    prev=${prev%/}
    [[ -f "$prev/labels.json" && $(basename "$prev") != "$WINNER" ]] && models+=(--model "prev-$(basename "$prev")-int8=onnx:$prev")
  done
  models+=(--model "new-$WINNER-int8=onnx:artifacts/$WINNER")
  CMP="runs/eval-compare$RUN_SUFFIX"   # per run: never reuse (or overwrite) an earlier retrain's comparison
  if [[ ! -f "$CMP-sample/report.md" ]]; then
    say "old vs new on the 2,100-review sample (aspects vs the new teacher labels, incl. food)"
    .venv/bin/python -m revlens_ml.evaluate --data "$DATA" --subset eval_sample "${models[@]}" \
      ${TEACHER_EVAL:+--reference-teacher "$TEACHER_EVAL"} --out "$CMP-sample"
  fi
  if [[ ! -f "$CMP-test/report.md" ]]; then
    say "old vs new on the full test split (sentiment vs the guests' star ratings)"
    .venv/bin/python -m revlens_ml.evaluate --data "$DATA" --subset test "${models[@]}" --out "$CMP-test"
  fi
  say "RESULT: old vs new, full test split"; head -8 "$CMP-test/report.md"
  say "RESULT: old vs new, sample (aspect agreement with the teacher)"; head -8 "$CMP-sample/report.md"
  say "RESULT: per aspect (macro-F1 vs teacher) and how many of the teacher's negative labels each model finds"
  .venv/bin/python - "$CMP-sample/metrics.json" <<'PY'
import json, sys
m = json.load(open(sys.argv[1]))["models"]
for name, r in m.items():
    a = r.get("aspects") or {}
    scores = " ".join(f"{k}={v:.3f}" for k, v in a.get("vs_teacher", {}).items() if v is not None)
    neg = " ".join(f"{k}={c['negative']['recall']:.2f}" for k, c in a.get("vs_teacher_by_class", {}).items()
                   if "negative" in c)
    print(f"  {name}\n    macro-F1: {scores}\n    negative recall: {neg}")
PY
else
  warn "no deployed model to compare against (set HF_TOKEN, or put it in $OLD_MODEL): comparison skipped"
fi

# 5. Back up off this machine, under new names (never replaces the deployed zip or the first results bundle)
if [[ -n "${HF_TOKEN:-}" ]]; then
  say "backing up $WINNER.zip and revlens-results$RUN_SUFFIX.tgz to your private Hugging Face repo"
  RESULTS_TAG="$RUN_SUFFIX" bash publish_model.sh
else
  warn "NOT BACKED UP. Run this now (type your write token yourself):"
  echo "  export HF_TOKEN=<write token> && cd $(pwd) && WINNER=$WINNER RESULTS_TAG=$RUN_SUFFIX bash publish_model.sh"
fi
say "RETRAIN FINISHED $(date -u '+%F %T UTC') (same frozen split: $([[ $SAME_SPLIT == 1 ]] && echo yes || echo NO)). Paste the RESULT tables to Claude. Ctrl+C to stop watching."
