# RevLens ML: evaluation set, baselines and the fine-tuned classifier

Phase 2 (evaluation set) and Phase 3 (models) of the RevLens AI plan. The goal: replace "send every review to an
LLM" with a small model that is **trained and measured**, served on CPU in the backend.

Read [DATASETS.md](DATASETS.md) first. It explains where every label comes from and what the numbers can't tell you.

## Quick start (B200)
```bash
cd ml
bash run_b200.sh            # setup → tests → data → teacher → baselines → train → eval → export
```
Run it inside `tmux`/`screen`. Each stage logs to `runs/logs/<stage>.log` and leaves `runs/.done_<stage>`;
**re-running resumes** where it stopped. Settings are environment variables at the top of the script
(e.g. `TEACHER_MODEL`, `LIMIT_TRAIN`, `BACKBONES`, `SEEDS="13 14 15"`). Outputs: `runs/eval-sample/report.md`
(comparison table), `runs/eval-sample/errors_*.md` (worst errors), `artifacts/<model>.zip` (deployable models).
The manual steps below are what the script does.

**GPU driver compatibility.** `setup` reads the driver's CUDA version from `nvidia-smi` and installs the matching
PyTorch build (CUDA 12.8 → `cu128`, 13.x → `cu130`; force one with `TORCH_CUDA=cu128`). Training and vLLM use
**separate environments** (`.venv`, `.venv-teacher`), so vLLM's pinned PyTorch can't break training. If vLLM
can't run on the driver, the teacher stage automatically uses `--backend hf` (the same model via transformers,
batched; slower, no constrained decoding but the same strict validation). Force it with `TEACHER_BACKEND=hf`.
If a previous run left a broken `.venv`, delete it first: `rm -rf .venv .venv-teacher runs/.done_setup`.

```
revlens_ml/
  labels.py     label spaces + labelling guide, imported from backend/app/ai.py (one source of truth)
  data.py       Phase 2: download -> clean -> dedupe -> gold labels -> grouped split -> frozen test
  spam.py       synthetic spam; test templates are never used in training
  teacher.py    teacher LLM labels (vLLM/OpenAI-compatible or Gemini), resumable
  baselines.py  keyword heuristic (floor) + TF-IDF/logistic regression
  model.py      one encoder, three heads: sentiment (3), spam (1), aspects (6 x 3)
  train.py      fine-tuning (bf16, seeded, logs config + metrics + versions)
  evaluate.py   comparison on the frozen test split + worst-error reports
  export.py     ONNX fp32 + int8, with a parity check against PyTorch
```

## Runbook on the B200

Clone the **whole repo**: `labels.py` imports the prompt and label definitions from `backend/app/ai.py`.

### 0. Environment
```bash
cd revlens-ai/ml
python -m venv .venv && source .venv/bin/activate
# Blackwell (B200) needs a CUDA 12.8+ build of PyTorch
pip install torch --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements.txt
pip install vllm                       # teacher model server
mkdir -p runs && pip freeze > runs/pip-freeze.txt
python -c "import torch; print(torch.cuda.get_device_name(), torch.cuda.is_bf16_supported())"
pytest tests -q                         # the evaluation-set guarantees
```

### 1. Evaluation set (Phase 2): about a minute
```bash
python -m revlens_ml.data --out data/processed
```
Check `data/processed/manifest.json`: per-split sizes, class balance, authors per split, and `test_sha256`.
**From here on the test split is frozen**: `evaluate.py` refuses to run if it changes.
Write the hash in your report.

### 2. Teacher labels (silver labels for aspects)
```bash
vllm serve Qwen/Qwen3-32B --max-model-len 4096 --port 8001 &   # wait for "Application startup complete"
T="--backend openai --base-url http://localhost:8001/v1 --model Qwen/Qwen3-32B --no-thinking --workers 64"

python -m revlens_ml.teacher $T --split train --limit 500    # measure throughput first, check a few lines
python -m revlens_ml.teacher $T --split train --limit 60000  # resumes; raise the limit if time allows
python -m revlens_ml.teacher $T --split val --limit 5000
python -m revlens_ml.teacher $T --split test --eval-sample   # LLM baseline + reference for wifi/host
```
Any instruction-tuned open model works if vLLM can serve it with JSON-schema output; record which one you used.
Spot-check about 20 labels by hand against `backend/app/ai.py: ASPECT_GUIDE` before training on them.

### 3. Current-production baseline: Gemini on the eval sample
Free tier is about 12 requests/min, so the ~2,100 rows take about 3 hours (run on any machine with `backend/.env`):
```bash
python -m revlens_ml.teacher --backend gemini --split test --eval-sample --workers 1 --pace 5
```

### 4. Classic baselines
```bash
python -m revlens_ml.baselines --out runs/tfidf --teacher data/processed/teacher/train.Qwen3-32B.jsonl
```

### 5. Fine-tune
```bash
TL="--teacher data/processed/teacher/train.Qwen3-32B.jsonl --val-teacher data/processed/teacher/val.Qwen3-32B.jsonl"
python -m revlens_ml.train --backbone microsoft/deberta-v3-base  $TL --out runs/deberta-v3-base  --batch-size 64
python -m revlens_ml.train --backbone microsoft/deberta-v3-small $TL --out runs/deberta-v3-small --batch-size 64
python -m revlens_ml.train --backbone microsoft/deberta-v3-xsmall $TL --out runs/deberta-v3-xsmall --batch-size 64  # fits Render free tier
# variance: repeat the winner with --seed 14 and --seed 15 and report mean ± std
```
Each run writes `config.json` (arguments, versions, git commit, GPU, class weights) and `history.json`.

### 6. Compare on the frozen test split
```bash
E="data/processed/teacher/test-eval"
python -m revlens_ml.evaluate --subset eval_sample \
  --model heuristic --model tfidf=tfidf:runs/tfidf \
  --model gemini=jsonl:$E.gemini-3.5-flash-lite.jsonl --model qwen3-32b=jsonl:$E.Qwen3-32B.jsonl \
  --model deberta-base=torch:runs/deberta-v3-base --model deberta-small=torch:runs/deberta-v3-small \
  --reference-teacher $E.Qwen3-32B.jsonl --out runs/eval-sample
# local models also on the full test split (more rows, tighter estimates)
python -m revlens_ml.evaluate --subset test --model heuristic --model tfidf=tfidf:runs/tfidf \
  --model deberta-base=torch:runs/deberta-v3-base --model deberta-small=torch:runs/deberta-v3-small --out runs/eval-test
```
`report.md` has the table. Fill in the explanations in `errors_<model>.md` for the winner: they are part of the result.
Pass `--cost gemini=<USD per 1k>` only with a price you've checked yourself.

### 7. Export the winner and size it for Render
```bash
python -m revlens_ml.export --run runs/deberta-v3-small --out artifacts/revlens-classifier
python -m revlens_ml.evaluate --subset eval_sample --model int8=onnx:artifacts/revlens-classifier --out runs/eval-int8
cd artifacts/revlens-classifier && zip ../revlens-classifier.zip labels.json tokenizer.json model.int8.onnx
```
`export.py` fails if fp32 ONNX diverges from PyTorch. For int8 it tries recipes smallest-first (all int8, then
the FFN down-projection kept in fp32, then the whole FFN in fp32) and ships the first that agrees with PyTorch
on >= 95% of sentiments over 500 val reviews; `parity.json` records every attempt. If none passes, that model
is skipped and the other sizes still export.
Render's free instance has 512 MB RAM. Measured locally (backend process, Windows):

| | int8 file | RAM in use | peak RAM |
|---|---|---|---|
| backend, no model | n/a | 85 MB | 85 MB |
| + `deberta-v3-xsmall` int8 | 87 MB | 319 MB | 419 MB |

So model RAM ≈ 2.7× the int8 file size at load. `xsmall` fits with little margin; `small` (~140 MB file)
and `base` (~190 MB) will likely exceed 512 MB. Pick the size by accuracy **and** memory: measure the exported
candidate the same way before deploying, or use a larger Render instance.

### 8. Deploy (backend)
Upload the zip to **private** storage, then set these on Render:
- `MODEL_URL` (and `MODEL_URL_TOKEN` if the URL needs a bearer token), `MODEL_DIR=model`
- Build command: `pip install -r requirements.txt && python -m scripts.fetch_model`
- Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

The startup log should say `Loaded fine-tuned classifier ...`; new reviews then show `label_source = "model"`.
Gemini stays in use for reply drafts and as the fallback.

## Smoke test on a laptop (CPU)
```bash
python -m revlens_ml.data --limit 3000 --out data/smoke
python -m revlens_ml.baselines --data data/smoke --out runs/smoke-tfidf
python -m revlens_ml.train --backbone microsoft/deberta-v3-xsmall --data data/smoke --out runs/smoke --epochs 1 --limit 400 --max-len 128
```
