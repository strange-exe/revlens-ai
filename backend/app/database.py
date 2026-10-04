from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENV", "production").lower()
SQLITE_DEV_URL = "sqlite:///./revlens.db"


def resolve_database_url() -> str:
    """Return the configured DATABASE_URL. Local SQLite is only allowed when ENV=dev."""
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    if ENV == "dev":
        return SQLITE_DEV_URL
    raise RuntimeError("DATABASE_URL is not set. Set it, or set ENV=dev to use local SQLite.")


def create_checked_engine(url: str):
    """Create an engine and fail fast if the database is unreachable (no silent fallback)."""
    engine = create_engine(
        url,
        # connect_timeout: without it, psycopg can hang ~2 min on an unreachable host instead of failing
        connect_args={"check_same_thread": False} if url.startswith("sqlite") else {"connect_timeout": 10},
    )
    with engine.connect():
        pass
    return engine


DATABASE_URL = resolve_database_url()
engine = create_checked_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
