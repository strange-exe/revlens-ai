# Deploy the fine-tuned classifier

You run two scripts, one on each machine. Expect about 15 minutes of hands-on time.

| Where | Script | What it does |
|---|---|---|
| B200 | `ml/publish_model.sh` | Packages the winning model and the results, then uploads both to a **private** Hugging Face repo |
| Laptop | `backend/scripts/verify_model.py` | Downloads the model the same way Render will, runs the backend with it, checks the labels and the memory, and prints the Render settings |

The deployed model is `deberta-v3-xsmall-s13-food2-u8` (seven aspects, from `ml/retrain.sh`, weights stored as uint8):
- Sentiment macro-F1 is 0.806 on the 40k test set (int8, as production runs it); see [RESULTS.md](RESULTS.md).
- The int8 file is 87 MB, and the backend's peak RAM is about 439 MB.
- xsmall is the only size that fits Render's free 512 MB.

Override it with `WINNER=...` if you move to a bigger instance. A retrain publishes under its own name
(`<winner>.zip` and `revlens-results<suffix>.tgz`), so the deployed files are never replaced.

## 0. Create two Hugging Face tokens (once)
On huggingface.co go to **Settings → Access Tokens**:
- a **write** token, for uploading from the B200;
- a **fine-grained read-only** token scoped to the `revlens-classifier` repo, for your laptop and Render.

You can create the read-only token after step 1, once the repo exists.

Type tokens only into your own terminal and into Render's dashboard. Never paste them into chat, a file in the repo, or a commit.

## 1. On the B200: publish
`retrain.sh` does this step itself when `HF_TOKEN` is set. To publish by hand, from any folder:
```bash
export HF_TOKEN=<your write token>
bash /workspace/ml/publish_model.sh
```
It prints two URLs. Copy `MODEL_URL`; the results bundle URL is derived from it automatically.
Then remove the write token from that shell:
```bash
unset HF_TOKEN
```
The script refuses to upload to a repo that is public. It also keeps raw data and virtualenvs out of the bundle.

## 2. On your laptop: verify
In PowerShell, from the repo:
```powershell
cd backend
$env:MODEL_URL = "<MODEL_URL printed in step 1>"
$env:RESULTS_URL = "<RESULTS_URL printed in step 1>"   # needed for a retrain; else it fetches revlens-results.tgz
$env:MODEL_URL_TOKEN = "<your read-only token>"
venv\Scripts\python -m scripts.verify_model
```
It checks five things and stops at the first failure:
1. **Results:** the bundle is extracted to `ml/runs/b200/` (`ml/runs/b200-food2/` for a retrain), which is gitignored, so the reports and `errors_*.md` are on your laptop.
2. **Download:** `scripts.fetch_model`, the code Render's build runs, downloads and unpacks the model.
3. **Backend:** it starts on a throwaway SQLite database with Gemini switched off. Your `.env` database is never touched.
4. **Labels:** `/api/ai/status` must say `"classifier": "model"`, every test review must come back with `label_source = "model"`, and the obviously positive and negative reviews must be classified correctly.
5. **Memory:** peak memory must be under 512 MB. It warns if headroom is under 10%.

When everything passes, it prints the exact Render settings.

## 3. On Render: set it and deploy
In the Dashboard, open your backend service, then **Environment**:
- `MODEL_URL`: from step 1
- `MODEL_URL_TOKEN`: your read-only token (type it here yourself)
- `MODEL_DIR`: `model`

Under **Settings**:
- Build command: `pip install -r requirements.txt && python -m scripts.fetch_model`
- Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Then choose **Manual Deploy → Deploy latest commit**. Two signs it worked:
- The build log shows `Model 'deberta-v3-xsmall-s13-food2-u8-int8' ready in model (87 MB).`
- The runtime log shows `Loaded fine-tuned classifier ... (8 reference reviews match; CPU: ...)`, and the app's AI
  status notice disappears. If it says `gives different answers on this CPU`, the model was refused and Gemini
  serves instead: the int8 file computes differently on that CPU (see RESULTS.md); don't deploy it.

The verify step on your laptop can't catch a CPU difference (laptops and GPU hosts usually have VNNI, Render's
free CPUs don't). The start-up check on Render is what catches it.

To roll back, delete `MODEL_URL` and redeploy. The app goes back to Gemini, then keyword rules.

## 4. Finish the write-up
- Open `ml/runs/b200-food2/runs/eval-sample/errors_deberta-v3-xsmall-s13-food2.md` and explain the worst errors. It's part of the result.
- Read the per-aspect table at the end of the `retrain.sh` log, not only the pooled scores: a head that always
  answers "not mentioned" can still look fine on average.
- Optional: retrain with `SEEDS="14 15"` for mean ± std, and run the Gemini baseline (see the end of the `run_b200.sh` output).

## If something fails
| Message | Cause | Fix |
|---|---|---|
| `401/403/404 for ...` | Wrong URL, or the token can't read the repo | Check the URL from step 1, and that the read token is scoped to that repo |
| `classifier=llm` or `heuristic` | The model didn't load | Read `server.log` (its path is printed) for the error from `app/classifier.py` |
| `labelled by 'llm'` | Gemini answered instead of the model | Shouldn't happen, since the test switches Gemini off; check `server.log` |
| `DOES NOT FIT` | Peak memory is over 512 MB | Use an xsmall winner (e.g. `deberta-v3-xsmall-s13-food2`), or a paid Render instance |
