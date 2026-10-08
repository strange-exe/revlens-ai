#!/usr/bin/env bash
# On the B200, after run_b200.sh: upload the chosen model and the results to a PRIVATE Hugging Face repo.
#
#   export HF_TOKEN=...            # a WRITE token from huggingface.co/settings/tokens (type it yourself)
#   bash /workspace/ml/publish_model.sh
#
# Options: WINNER=deberta-v3-small-s13 (default: deberta-v3-xsmall-s13), HF_REPO=<user>/<name>,
# RESULTS_TAG=-food (uploads revlens-results-food.tgz, so a retrain never replaces an earlier results bundle)
# (default: <your user>/revlens-classifier). Re-running replaces the files. The repo is always private:
# the model is trained on data that must not be redistributed (ml/DATASETS.md).
set -euo pipefail
cd "$(dirname "$0")"

WINNER="${WINNER:-deberta-v3-xsmall-s13}"
RESULTS="revlens-results${RESULTS_TAG:-}.tgz"
if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "Set HF_TOKEN first: export HF_TOKEN=<write token from huggingface.co/settings/tokens>"; exit 1
fi
if [[ ! -f "artifacts/$WINNER.zip" ]]; then
  echo "artifacts/$WINNER.zip not found. Available:"; ls artifacts/*.zip 2>/dev/null || echo "  (none: run run_b200.sh first)"; exit 1
fi

# 1. Results bundle: reports, error analyses, parity checks, logs and the frozen-test manifest.
#    No raw data, no virtualenvs, no model weights besides the winner zip uploaded separately.
shopt -s nullglob
parts=(runs/eval-sample runs/eval-test runs/eval-int8-* runs/eval-compare-* runs/logs artifacts/*/parity.json
       data/processed/manifest.json runs/pip-freeze.txt runs/torch-pin.txt)
existing=(); for p in "${parts[@]}"; do [[ -e $p ]] && existing+=("$p"); done
tar czf "runs/$RESULTS" "${existing[@]}"
echo "results bundle: runs/$RESULTS ($(du -h "runs/$RESULTS" | cut -f1), ${#existing[@]} items)"

# 2. Upload both to a private repo (huggingface_hub ships with transformers in .venv)
.venv/bin/python - "$WINNER" "$RESULTS" <<'PY'
import os, sys
from huggingface_hub import HfApi

winner, results = sys.argv[1], sys.argv[2]
api = HfApi(token=os.environ["HF_TOKEN"])
user = api.whoami()["name"]
repo = os.getenv("HF_REPO") or f"{user}/revlens-classifier"
api.create_repo(repo, repo_type="model", private=True, exist_ok=True)
if not api.repo_info(repo, repo_type="model").private:
    sys.exit(f"{repo} exists and is PUBLIC. Make it private on huggingface.co (Settings) or set HF_REPO to another name.")
for local, remote in [(f"artifacts/{winner}.zip", f"{winner}.zip"), (f"runs/{results}", results)]:
    print(f"uploading {local} ...", flush=True)
    api.upload_file(path_or_fileobj=local, path_in_repo=remote, repo_id=repo, repo_type="model",
                    commit_message=f"RevLens: {remote}")
base = f"https://huggingface.co/{repo}/resolve/main"
print("\nDone. Private repo:", f"https://huggingface.co/{repo}")
print("Next, on your laptop (see ml/DEPLOY_MODEL.md):")
print(f"  MODEL_URL={base}/{winner}.zip")
print(f"  RESULTS_URL={base}/{results}")
PY
