"""Fill `reviews.aspects` for reviews the LLM hasn't analysed yet.

Only aspects are written: existing sentiment/is_spam labels may be human labels and are left alone.

Usage (from backend/):  python -m scripts.backfill_aspects [--dry-run] [--limit N]
"""
import argparse
import time

PACE_SECONDS = 5      # ~12 requests/min, under the Gemini free-tier per-minute limit
RETRY_WAITS = (30, 60)  # back off when rate-limited, then give up on that review

from app import ai, models
from app.database import SessionLocal


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="classify and print, but don't save")
    parser.add_argument("--limit", type=int, default=None, help="max reviews to process")
    args = parser.parse_args()

    if not ai.check_gemini_model():
        raise SystemExit("Gemini is unavailable; nothing to backfill (the heuristic has no aspects).")

    db = SessionLocal()
    try:
        query = db.query(models.Review).filter(models.Review.aspects.is_(None)).order_by(models.Review.id)
        reviews = query.limit(args.limit).all() if args.limit else query.all()
        done = failed = 0
        for review in reviews:
            result = ai.analyze_review_sentiment_and_spam(review.text, review.guest_name)
            for wait in RETRY_WAITS:
                if result.source == "llm":
                    break
                print(f"#{review.id}: Gemini unavailable, retrying in {wait}s")
                time.sleep(wait)
                result = ai.analyze_review_sentiment_and_spam(review.text, review.guest_name)
            if result.source != "llm":
                failed += 1
                continue
            print(f"#{review.id}: {result.aspects}")
            if not args.dry_run:
                review.aspects = result.aspects
                db.commit()
            done += 1
            time.sleep(PACE_SECONDS)
        print(f"{'Would update' if args.dry_run else 'Updated'} {done} reviews; {failed} failed (left as NULL).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
