"""Re-label reviews the fine-tuned model labelled, with the model in MODEL_DIR.

Until 2026-10-10 the deployed int8 models computed wrong labels on the server's CPU (no VNNI; see
ml/revlens_ml/u8u8.py), so labels with label_source "model" from that period can't be trusted. Only those reviews
are touched: human labels (and a host's spam unflag) and Gemini/keyword labels are left alone.

Usage (from backend/):  python -m scripts.relabel_model_reviews [--dry-run]
DATABASE_URL decides which database is written: the script prints its host and asks before writing.
"""
import argparse
import os
from urllib.parse import urlsplit

from app import ai, models
from app.database import SessionLocal


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="show what would change, write nothing")
    parser.add_argument("--yes", action="store_true", help="don't ask before writing (for tests)")
    args = parser.parse_args()

    if ai.load_classifier() is None:
        raise SystemExit("No model loaded (set MODEL_DIR to a model that passes its start-up check); nothing changed.")
    host = urlsplit(os.getenv("DATABASE_URL", "")).hostname or os.getenv("DATABASE_URL", "?")
    db = SessionLocal()
    try:
        reviews = db.query(models.Review).filter(models.Review.label_source == "model").order_by(models.Review.id).all()
        results = ai.classify_reviews([(r.text, r.guest_name) for r in reviews])
        changes = []
        for review, result in zip(reviews, results):
            new = (result.sentiment, result.is_spam, result.aspects)
            if result.source == "model" and new != (review.sentiment, review.is_spam, review.aspects):
                changes.append((review, new))
        print(f"Database host: {host}. Model: {ai._classifier.name}. "
              f"{len(reviews)} model-labelled reviews, {len(changes)} would change.")
        for review, (sentiment, is_spam, aspects) in changes:
            print(f"  #{review.id}: {review.sentiment}/{'spam' if review.is_spam else 'ok'} {review.aspects}"
                  f"  ->  {sentiment}/{'spam' if is_spam else 'ok'} {aspects}")
        if args.dry_run or not changes:
            return
        if not args.yes and input(f"Write {len(changes)} changes to {host}? Type 'yes': ").strip() != "yes":
            print("Nothing written.")
            return
        for review, (sentiment, is_spam, aspects) in changes:
            review.sentiment, review.is_spam, review.aspects = sentiment, is_spam, aspects
        db.commit()
        print(f"Updated {len(changes)} reviews.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
