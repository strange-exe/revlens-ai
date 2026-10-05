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


import pytest


@pytest.fixture(scope="session", autouse=True)
def _schema():
    # Tests build the schema straight from the models; migrations are exercised separately
    from app import models
    from app.database import Base, engine
    Base.metadata.create_all(bind=engine)


# ── Fake Gemini (shared) ──────────────────────────────────────────────────
import json

FAKE_KEY = "AIza-test-key-0000"


def _aspect_names():
    from app import ai
    return ai.ASPECT_GUIDE


class FakeResponse:
    def __init__(self, text):
        self._body = {"candidates": [{"content": {"parts": [{"text": text}]}}]}

    def raise_for_status(self):
        pass

    def json(self):
        return self._body


class Calls(list):
    """Recorded requests, plus `reply`: the text the fake model returns."""
    reply = json.dumps({"sentiment": "negative", "is_spam": False,
                        "aspects": {name: "not_mentioned" for name in _aspect_names()}})


@pytest.fixture
def gemini(monkeypatch):
    from app import ai as ai_module
    monkeypatch.setattr(ai_module, "GEMINI_API_KEY", FAKE_KEY)
    calls = Calls()

    def fake_post(url, json=None, headers=None, timeout=None):
        calls.append({"url": url, "json": json, "headers": headers or {}})
        return FakeResponse(calls.reply)

    monkeypatch.setattr(ai_module.requests, "post", fake_post)
    return calls


@pytest.fixture(autouse=True)
def _reset_auth_rate_limit():
    """Each test starts with an empty auth rate limiter, so results don't depend on test order."""
    from app import main
    main.LOGIN_ATTEMPTS.clear()
