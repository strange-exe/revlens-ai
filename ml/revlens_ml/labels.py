"""Label spaces and the labelling guide, imported from the backend so app and models never disagree."""
import os
import sys
from pathlib import Path

# The backend folder: next to ml/ by default (ml/ and backend/ side by side), or set REVLENS_BACKEND.
BACKEND_DIR = Path(os.getenv("REVLENS_BACKEND") or Path(__file__).resolve().parents[2] / "backend").resolve()
if not (BACKEND_DIR / "app" / "ai.py").is_file():
    raise SystemExit(f"backend not found at {BACKEND_DIR}: put the backend folder next to ml/ or set REVLENS_BACKEND")
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ai import (  # noqa: E402
    ASPECT_GUIDE,
    ASPECT_VALUES,
    CLASSIFICATION_SCHEMA,
    SENTIMENTS,
    build_classification_prompt,
    classify_sentiment_locally,
    detect_spam_locally,
    parse_classification,
)

ASPECTS = tuple(ASPECT_GUIDE)  # cleanliness, location, wifi, host, value, amenities, food

# Aspects that every teacher label written before "food" existed had been judged on.
LEGACY_ASPECTS = ("cleanliness", "location", "wifi", "host", "value", "amenities")

# Dataset sub-rating -> our aspect. wifi and host have no rating in the dataset: teacher-only.
RATED_ASPECTS = {"cleanliness": "cleanliness", "location": "location", "value": "value", "amenities": "rooms"}


def aspect_label(label: dict, aspect: str) -> str | None:
    """A teacher label's verdict on one aspect: 'positive', 'negative' or 'not_mentioned', or None when the
    label never judged it. Labels store mentioned aspects only, so a missing key means 'not mentioned' only
    if the aspect was judged: new labels list those in "judged", older ones judged LEGACY_ASPECTS. Reading a
    missing key as 'not_mentioned' would teach a new aspect that nobody ever talks about it."""
    if aspect not in label.get("judged", LEGACY_ASPECTS):
        return None
    return label["aspects"].get(aspect, "not_mentioned")


def rating_to_sentiment(stars: float) -> str:
    """Gold overall sentiment from the guest's own star rating (1-2 negative, 3 neutral, 4-5 positive)."""
    return "negative" if stars <= 2 else "neutral" if stars == 3 else "positive"


def rating_to_polarity(stars: float) -> str | None:
    """Aspect polarity proxy from a sub-rating. 3 is ambiguous and missing is unknown: both return None."""
    if stars != stars:  # NaN
        return None
    return "negative" if stars <= 2 else "positive" if stars >= 4 else None


__all__ = [
    "ASPECTS", "ASPECT_GUIDE", "ASPECT_VALUES", "CLASSIFICATION_SCHEMA", "LEGACY_ASPECTS", "RATED_ASPECTS",
    "SENTIMENTS", "aspect_label", "build_classification_prompt", "classify_sentiment_locally", "detect_spam_locally", "parse_classification",
    "rating_to_polarity", "rating_to_sentiment",
]
