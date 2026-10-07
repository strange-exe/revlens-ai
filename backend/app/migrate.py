"""Apply pending Alembic migrations when the app starts.

Render's start command also runs `alembic upgrade head`, but that lives in a dashboard and is easy to drop.
Running it here too means a deploy can never serve new code against an old schema. On a database that is
already current this is a no-op (Alembic compares the stored revision and does nothing).
"""
import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect

from app.database import engine

logger = logging.getLogger(__name__)
MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"


def _config() -> Config:
    # Built without alembic.ini on purpose: env.py only calls logging.fileConfig() when an ini file is set,
    # and fileConfig() would disable the app's existing loggers (classifier, Gemini, request logs).
    cfg = Config()
    cfg.set_main_option("script_location", str(MIGRATIONS))
    return cfg


def current_revision() -> str | None:
    with engine.connect() as conn:
        return MigrationContext.configure(conn).get_current_revision()


def upgrade_to_head() -> None:
    cfg = _config()
    head = ScriptDirectory.from_config(cfg).get_current_head()
    before = current_revision()
    if before == head:
        logger.info(f"Database schema is current (revision {head}).")
        return
    if before is None and inspect(engine).has_table("users"):
        # Tables exist but Alembic never recorded a revision (e.g. an old local DB made with create_all).
        # Upgrading would try to create them again, so leave it alone and say how to adopt it.
        logger.error("Database has tables but no Alembic revision: not migrating. If the schema matches the "
                     "baseline, run `alembic stamp 927add20e906` then `alembic upgrade head`.")
        return
    logger.info(f"Migrating database schema from {before or 'empty'} to {head}.")
    command.upgrade(cfg, "head")
    logger.info(f"Database schema migrated to {current_revision()}.")
