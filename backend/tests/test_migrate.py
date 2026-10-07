"""Startup migrations: a fresh DB reaches head, a current DB is untouched, an unstamped DB is never clobbered.

Each case runs in a subprocess because app.database binds its engine to DATABASE_URL at import time."""
import json
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

SCRIPT = r"""
import json, logging, sys
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
from sqlalchemy import inspect, text
from app import ai, migrate  # ai's logger exists before migrating, as in the real startup
from app.database import engine
mode = sys.argv[1]
if mode == "unstamped":
    with engine.begin() as c:
        c.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
migrate.upgrade_to_head()
first = migrate.current_revision()
migrate.upgrade_to_head()  # second start: must be a no-op
print(json.dumps({
    "revision": first,
    "again": migrate.current_revision(),
    "tables": sorted(inspect(engine).get_table_names()),
    "app_logger_enabled": not logging.getLogger("app.ai").disabled,
}))
"""


def run(tmp_path, mode):
    env = {**os.environ, "ENV": "dev", "DATABASE_URL": f"sqlite:///{(tmp_path / 'm.db').as_posix()}"}
    out = subprocess.run([sys.executable, "-c", SCRIPT, mode], cwd=BACKEND, env=env, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout.strip().splitlines()[-1]), out.stderr


def head():
    from alembic.script import ScriptDirectory
    from app.migrate import _config
    return ScriptDirectory.from_config(_config()).get_current_head()


def test_fresh_database_is_migrated_to_head_once(tmp_path):
    result, log = run(tmp_path, "fresh")
    assert result["revision"] == result["again"] == head()
    assert {"users", "properties", "reviews", "alembic_version"} <= set(result["tables"])
    assert "Database schema is current" in log  # the second call did nothing
    assert result["app_logger_enabled"], "running migrations in-process must not disable the app's loggers"


def test_unstamped_database_with_tables_is_left_alone(tmp_path):
    result, log = run(tmp_path, "unstamped")
    assert result["revision"] is None
    assert result["tables"] == ["users"]
    assert "no Alembic revision: not migrating" in log
