"""Before deploying: fetch the model exactly as Render will, run the backend with it, and check it really works.

    cd backend
    set MODEL_URL=https://huggingface.co/<you>/revlens-classifier/resolve/main/deberta-v3-xsmall-s13.zip
    set MODEL_URL_TOKEN=<read-only token>      (PowerShell: $env:MODEL_URL_TOKEN = "...")
    venv\\Scripts\\python -m scripts.verify_model

Steps (any failure stops with a clear message, nothing is deployed or changed):
  1. download the results bundle next to the model (RESULTS_URL, default: same repo) into ml/runs/b200/
  2. download + unpack the model with scripts.fetch_model, the code Render runs at build time
  3. start the backend on a throwaway SQLite DB (migrations applied), with Gemini switched off
  4. check /api/ai/status reports the model, and that new reviews get label_source "model"
  5. report peak memory of the server process against Render's free 512 MB
Your .env is never used for the DB or Gemini: the test sets its own values, so it can't touch real data.
"""
import json
import os
import secrets
import socket
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import requests

BACKEND = Path(__file__).resolve().parents[1]
ML_RUNS = BACKEND.parent / "ml" / "runs" / "b200"   # gitignored (ml/.gitignore: runs/)
RENDER_LIMIT_MB = 512
REVIEWS = [  # (text, rating, sentiment a working model must give)
    ("Spotless rooms, a warm and helpful host, and a beautiful view. We would happily stay again.", 5, "positive"),
    ("Dirty bathroom, rude staff and far too expensive for what we got. Never coming back.", 1, "negative"),
    ("The location was good but the WiFi kept dropping and breakfast was average.", 3, None),
]


def step(msg: str) -> None:
    print(f"\n== {msg}", flush=True)


def fail(msg: str) -> None:
    sys.exit(f"\nFAILED: {msg}")


def peak_rss_mb(pid: int) -> float:
    """Peak resident memory of a process, without extra packages."""
    if sys.platform == "win32":
        import ctypes
        from ctypes import wintypes

        class Counters(ctypes.Structure):
            _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD),
                        ("PeakWorkingSetSize", ctypes.c_size_t), ("WorkingSetSize", ctypes.c_size_t),
                        ("QuotaPeakPagedPoolUsage", ctypes.c_size_t), ("QuotaPagedPoolUsage", ctypes.c_size_t),
                        ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t), ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                        ("PagefileUsage", ctypes.c_size_t), ("PeakPagefileUsage", ctypes.c_size_t)]
        handle = ctypes.windll.kernel32.OpenProcess(0x0400 | 0x0010, False, pid)  # QUERY_INFORMATION | VM_READ
        counters = Counters(cb=ctypes.sizeof(Counters))
        ctypes.windll.psapi.GetProcessMemoryInfo(handle, ctypes.byref(counters), counters.cb)
        ctypes.windll.kernel32.CloseHandle(handle)
        return counters.PeakWorkingSetSize / 2**20
    for line in Path(f"/proc/{pid}/status").read_text().splitlines():
        if line.startswith("VmHWM:"):
            return int(line.split()[1]) / 1024
    raise RuntimeError("can't read peak memory on this platform")


def server_peak_mb(pid: int) -> float:
    """Peak memory of the server. On Windows a venv's python.exe is a launcher that runs the real
    interpreter as a child process, so measure the children too and take the largest."""
    pids = [pid]
    if sys.platform == "win32":
        out = subprocess.run(["powershell", "-NoProfile", "-Command",
                              f"(Get-CimInstance Win32_Process -Filter 'ParentProcessId={pid}').ProcessId"],
                             capture_output=True, text=True).stdout
        pids += [int(x) for x in out.split() if x.isdigit()]
    return max(peak_rss_mb(p) for p in pids)


def download(url: str, token: str | None, dest: Path) -> None:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    with requests.get(url, headers=headers, stream=True, timeout=300) as res:
        if res.status_code in (401, 403, 404):
            fail(f"{res.status_code} for {url}: check the URL and that MODEL_URL_TOKEN can read this private repo")
        res.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in res.iter_content(1 << 20):
                f.write(chunk)


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> None:
    url, token = os.getenv("MODEL_URL"), os.getenv("MODEL_URL_TOKEN")
    if not url:
        fail("set MODEL_URL (printed by ml/publish_model.sh) and MODEL_URL_TOKEN (a read-only token)")
    work = Path(tempfile.mkdtemp(prefix="revlens-verify-"))
    model_dir, db = work / "model", work / "verify.db"

    results_url = os.getenv("RESULTS_URL") or url.rsplit("/", 1)[0] + "/revlens-results.tgz"
    if results_url.lower() != "skip":
        step(f"1/5 results bundle -> {ML_RUNS}")
        archive = work / "results.tgz"
        download(results_url, token, archive)
        ML_RUNS.mkdir(parents=True, exist_ok=True)
        with tarfile.open(archive) as t:
            t.extractall(ML_RUNS, filter="data")  # "data" filter: no absolute paths, links or ../ escapes
        errors = sorted(ML_RUNS.glob("runs/eval-sample/errors_*.md"))
        print(f"   extracted; error analyses: {', '.join(p.name for p in errors) or 'none found'}")

    step("2/5 fetch the model with scripts.fetch_model (what Render's build runs)")
    env = {**os.environ, "MODEL_DIR": str(model_dir)}
    if subprocess.run([sys.executable, "-m", "scripts.fetch_model"], cwd=BACKEND, env=env).returncode:
        fail("scripts.fetch_model could not download or unpack the model")
    labels = json.loads((model_dir / "labels.json").read_text(encoding="utf-8"))

    step("3/5 start the backend on a throwaway database, Gemini off")
    server_env = {**os.environ, "ENV": "dev", "DATABASE_URL": f"sqlite:///{db.as_posix()}", "MODEL_DIR": str(model_dir),
                  "GEMINI_API_KEY": "", "JWT_SECRET": secrets.token_hex(32), "MODEL_THREADS": "1"}
    if subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=BACKEND, env=server_env,
                      capture_output=True).returncode:
        fail("alembic upgrade head failed on a fresh SQLite database")
    port = free_port()
    log = open(work / "server.log", "w", encoding="utf-8")
    server = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(port)],
                              cwd=BACKEND, env=server_env, stdout=log, stderr=subprocess.STDOUT)
    base = f"http://127.0.0.1:{port}"
    try:
        for _ in range(120):
            if server.poll() is not None:
                fail(f"server exited during startup; see {work / 'server.log'}")
            try:
                if requests.get(f"{base}/health", timeout=2).ok:
                    break
            except requests.ConnectionError:
                time.sleep(0.5)
        else:
            fail("server did not become healthy within 60 s")

        step("4/5 classify reviews through the API")
        reg = requests.post(f"{base}/api/auth/register", timeout=10, json={
            "email": f"verify-{secrets.token_hex(4)}@example.com", "password": secrets.token_urlsafe(16), "full_name": "Verify"})
        if reg.status_code != 201:
            fail(f"register failed: {reg.status_code} {reg.text}")
        auth = {"Authorization": f"Bearer {reg.json()['access_token']}"}
        status = requests.get(f"{base}/api/ai/status", headers=auth, timeout=10).json()
        print(f"   /api/ai/status: {status}")
        if status.get("classifier") != "model":
            fail(f"backend is not using the model (classifier={status.get('classifier')}); see {work / 'server.log'}")
        prop = requests.post(f"{base}/api/properties", json={"name": "Verify Stay", "location": "Goa"}, headers=auth, timeout=10).json()
        for text, rating, want in REVIEWS:
            started = time.perf_counter()
            res = requests.post(f"{base}/api/reviews", headers=auth, timeout=60, json={
                "property_id": prop["id"], "property_name": prop["name"], "guest_name": "Test guest",
                "rating": rating, "text": text, "date": "2026-10-05"})  # no sentiment: the backend classifies it
            ms = (time.perf_counter() - started) * 1000
            if res.status_code != 201:
                fail(f"creating a review failed: {res.status_code} {res.text}")
            r = res.json()
            aspects = {k: v for k, v in (r.get("aspects") or {}).items() if v != "not_mentioned"}
            print(f"   [{r.get('label_source')}] {r['sentiment']:8s} {ms:5.0f} ms  aspects={aspects}  \"{text[:48]}...\"")
            if r.get("label_source") != "model":
                fail(f"review was labelled by '{r.get('label_source')}', not the model")
            if want and r["sentiment"] != want:
                fail(f"an obviously {want} review came back {r['sentiment']}")

        step("5/5 memory")
        peak = server_peak_mb(server.pid)
        verdict = "fits" if peak < RENDER_LIMIT_MB * 0.9 else "TIGHT (under 10% headroom)" if peak < RENDER_LIMIT_MB else "DOES NOT FIT"
        print(f"   peak server memory: {peak:.0f} MB of {RENDER_LIMIT_MB} MB on Render free -> {verdict}")
        if peak >= RENDER_LIMIT_MB:
            fail("the server would run out of memory on Render's free instance: use a smaller model or a bigger instance")
    finally:
        server.terminate()
        server.wait(timeout=15)
        log.close()

    print(f"""
ALL CHECKS PASSED for model '{labels.get('name')}'.

Set these on Render (Dashboard -> your backend service -> Environment). Type the token there yourself:
  MODEL_URL        = {url}
  MODEL_URL_TOKEN  = <the same read-only token>
  MODEL_DIR        = model
Build command:  pip install -r requirements.txt && python -m scripts.fetch_model
Start command:  alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
After the deploy, the Render log should show "Loaded fine-tuned classifier", and
GET https://<your-backend>/api/ai/status should return "classifier": "model".
(temporary files: {work})""")


if __name__ == "__main__":
    main()
