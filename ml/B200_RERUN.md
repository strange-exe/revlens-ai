# B200: repair and run

> **Fresh machine or a retrain?** Use `retrain.sh` instead: extract the zip into an empty folder and run
> `bash ml/retrain.sh`. It installs what's missing, ignores the image's own PyTorch, runs in the background
> (no tmux needed) and never touches an earlier run. The notes below describe the first run's repair.

## What went wrong
- vLLM was installed into the training env `.venv`. It brought a CUDA 13 build of torch,
  and your driver only supports up to 12.8 ("NVIDIA driver on your system is too old").
  vLLM belongs only in `.venv-teacher`, which the script manages itself.
- Your GPU is a MIG slice (`B200 MIG 1g.23gb`, 23 GB), so Qwen3-32B can't fit.
  The script now picks Qwen3-8B on GPUs with less than 40 GB of memory.

## Layout
Any parent folder works. `ml/` and `backend/` just need to sit side by side:
```
/workspace/ml/
/workspace/backend/
```
If `backend/` is somewhere else: `export REVLENS_BACKEND=/path/to/backend`.

## Steps
1. Copy over the new `ml/` files from `revlens-b200.zip`, overwriting the old ones.
   Keep `ml/data/` and `ml/runs/`: the finished `data` stage is reused.
2. Open a fresh shell. If `(.venv)` shows in your prompt, run `deactivate` first.
3. Run inside `tmux` so the run survives a disconnect:
   ```bash
   tmux new -s revlens
   bash /workspace/ml/fix_and_run.sh
   ```
   Detach with `Ctrl+B` then `D`; reattach later with `tmux attach -t revlens`.

`fix_and_run.sh` checks the layout, then re-runs setup:
- It rebuilds `.venv` if torch can't use the GPU, and pins torch so no later install can replace it.
- It tries vLLM 0.11.0, the last CUDA 12.8 build, in `.venv-teacher`. If that doesn't work, it falls back to transformers.
- It then runs every stage that isn't finished yet.

A failing stage now stops the run and is **not** marked done. Re-running continues from that stage.
The first setup line should read `GPU memory 23 GB -> teacher Qwen/Qwen3-8B ...`.

Optional: free disk space with `rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen3-32B`.
