#!/usr/bin/env bash
# One command on the B200: check the folder layout, repair the Python environments, then run the pipeline.
#
#   bash fix_and_run.sh                      # from anywhere; safe to re-run (finished stages are skipped)
#   REVLENS_BACKEND=/path/to/backend bash fix_and_run.sh   # if backend/ is not next to ml/
#
# Expected layout (any parent folder name works):
#   <somewhere>/ml/        this folder
#   <somewhere>/backend/   the backend (labels and prompts are imported from backend/app/ai.py)
set -euo pipefail
cd "$(dirname "$0")"

# 1. Layout
BACKEND="${REVLENS_BACKEND:-../backend}"
if [[ ! -f "$BACKEND/app/ai.py" ]]; then
  echo "Can't find the backend at $(cd .. && pwd)/backend (looked for app/ai.py)."
  echo "Put the backend folder next to ml/, or run: REVLENS_BACKEND=/path/to/backend bash fix_and_run.sh"
  exit 1
fi
export REVLENS_BACKEND="$(cd "$BACKEND" && pwd)"
echo "ml:      $(pwd)"
echo "backend: $REVLENS_BACKEND"

# 2. Don't run inside an activated virtualenv: the pipeline manages .venv and .venv-teacher itself
if [[ -n "${VIRTUAL_ENV:-}" ]]; then
  echo "Note: a virtualenv is active ($VIRTUAL_ENV). Ignoring it; run 'deactivate' in your shell afterwards."
  PATH="${PATH//$VIRTUAL_ENV\/bin:/}"; unset VIRTUAL_ENV
fi

# 3. Re-run setup: it rebuilds .venv if torch can't use this GPU, and pins torch so it can't be replaced again
mkdir -p runs
rm -f runs/.done_setup

# 4. Everything else (test, data, teacher, baselines, train, eval, export); completed stages are skipped
exec bash run_b200.sh
