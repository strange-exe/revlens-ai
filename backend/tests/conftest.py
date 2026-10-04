import os
import sys
import tempfile
from pathlib import Path

# Must run before any `app` import: these modules read config at import time.
# load_dotenv() never overrides variables that are already set, so backend/.env can't leak in.
_tmp_db = Path(tempfile.mkdtemp()) / "test.db"
os.environ.update({
    "ENV": "dev",
    "DATABASE_URL": f"sqlite:///{_tmp_db.as_posix()}",
    "JWT_SECRET": "test-secret-that-is-definitely-longer-than-32-chars",
    "ALLOWED_ORIGINS": "https://revlens.example",
    "GEMINI_API_KEY": "",
})

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
