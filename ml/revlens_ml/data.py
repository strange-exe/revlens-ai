"""Phase 2: build the evaluation set.

    python -m revlens_ml.data [--limit N] [--out data/processed]

Steps: download -> clean -> dedupe (before splitting) -> gold labels from the guests' own ratings
-> 60/20/20 split grouped by author (user_id) and stratified by sentiment -> fixed eval sample -> synthetic spam
-> parquet files + manifest.json (with a hash that freezes the test split).
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

from . import spam
from .labels import RATED_ASPECTS, rating_to_polarity, rating_to_sentiment

DATASET = "jniimi/tripadvisor-review-rating"
SEED = 13
EVAL_SAMPLE_SIZE = 2000      # fixed subset of test for expensive models (LLMs); same rows for every model
SPAM_PER_SPLIT = {"train": 2000, "val": 300, "test": 300}
SPAM_IN_EVAL_SAMPLE = 100
MIN_CHARS = 30


def load_raw(limit: int | None, source: str | None) -> pd.DataFrame:
    if source:
        df = pd.read_parquet(source)
    else:
        from datasets import load_dataset
        df = load_dataset(DATASET, split="train").to_pandas()
    if limit:
        # Sample whole authors so the grouped split stays meaningful on small runs
        authors = df["user_id"].drop_duplicates().sample(frac=1, random_state=SEED)
        sizes = df.groupby("user_id").size()
        keep = authors[sizes[authors].cumsum().to_numpy() <= limit]
        df = df[df["user_id"].isin(keep)]
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    text = df["review"].fillna("").astype(str).map(lambda s: re.sub(r"\s+", " ", s).strip())
    out = pd.DataFrame({
        # NB: in this dataset `hotel_id` is unique per review (verified), so it is NOT a hotel identifier.
        # Used as a stable review id: unlike a row number it survives rebuilds, so teacher labels never shift.
        "review_id": "ta-" + df["hotel_id"].astype(str),
        "property_id": df["hotel_id"].astype(str),
        "group_id": df["user_id"].astype(str),
        "text": text,
        "rating": df["overall"],
        **{f"rating_{a}": df[col] for a, col in RATED_ASPECTS.items()},
    })
    out = out[(out["text"].str.len() >= MIN_CHARS) & out["rating"].between(1, 5)]
    before = len(out)
    # Dedupe BEFORE splitting, otherwise a copy in train can "leak" its twin's label into test
    out = out.loc[~out["text"].str.lower().duplicated()].reset_index(drop=True)
    print(f"cleaned: {len(out)} reviews ({before - len(out)} duplicates removed)")
    return out


def add_gold(df: pd.DataFrame) -> pd.DataFrame:
    df["gold_sentiment"] = df["rating"].map(rating_to_sentiment)
    for aspect in RATED_ASPECTS:
        df[f"gold_{aspect}"] = df[f"rating_{aspect}"].map(rating_to_polarity)
    # Assumption (documented): moderated TripAdvisor reviews are treated as not spam
    df["gold_spam"] = False
    df["origin"] = "tripadvisor"
    return df


def split(df: pd.DataFrame) -> pd.DataFrame:
    """60/20/20, grouped by author (no author in two splits), stratified by gold sentiment.
    The dataset has no real hotel id, so hotel-level leakage can't be ruled out (documented limitation)."""
    folds = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
    df["split"] = "train"
    fold_of = np.empty(len(df), dtype=int)
    for i, (_, idx) in enumerate(folds.split(df, df["gold_sentiment"], groups=df["group_id"])):
        fold_of[idx] = i
    df.loc[fold_of == 0, "split"] = "test"
    df.loc[fold_of == 1, "split"] = "val"
    assert not set(df[df.split == "test"].group_id) & set(df[df.split != "test"].group_id)
    return df


def add_eval_sample(df: pd.DataFrame) -> pd.DataFrame:
    test = df[df.split == "test"]
    n = min(EVAL_SAMPLE_SIZE, len(test))
    sample = test.groupby("gold_sentiment", group_keys=False).apply(
        lambda g: g.sample(max(1, round(n * len(g) / len(test))), random_state=SEED))
    df["in_eval_sample"] = df.index.isin(sample.index)
    return df


def add_synthetic_spam(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for split_name, n in SPAM_PER_SPLIT.items():
        part = "test" if split_name == "test" else "train"
        for i, r in enumerate(spam.generate(part, n, SEED + len(split_name))):
            rows.append({**r, "review_id": f"spam-{split_name}-{i:05d}", "split": split_name, "property_id": f"synthetic-{split_name}",
                         "group_id": f"synthetic-{split_name}", "rating": np.nan,
                         "gold_sentiment": None, "gold_spam": True, "origin": "synthetic_spam",
                         "in_eval_sample": split_name == "test" and i < SPAM_IN_EVAL_SAMPLE})
    return pd.concat([df, pd.DataFrame(rows)], ignore_index=True)


def build(limit: int | None = None, source: str | None = None) -> pd.DataFrame:
    df = add_gold(clean(load_raw(limit, source)))
    df = add_eval_sample(split(df))
    df = add_synthetic_spam(df)
    assert df["review_id"].is_unique
    return df


def manifest(df: pd.DataFrame, limit: int | None) -> dict:
    test_ids = "\n".join(sorted(df.loc[df.split == "test", "review_id"]))
    return {
        "dataset": DATASET, "seed": SEED, "limit": limit,
        "rows": df.groupby("split").size().to_dict(),
        "eval_sample_rows": int(df["in_eval_sample"].sum()),
        "sentiment_by_split": {s: g["gold_sentiment"].value_counts().to_dict() for s, g in df.groupby("split")},
        "authors_by_split": df[df.origin == "tripadvisor"].groupby("split")["group_id"].nunique().to_dict(),
        "test_sha256": hashlib.sha256(test_ids.encode()).hexdigest(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the RevLens evaluation set")
    parser.add_argument("--limit", type=int, help="approximate number of reviews (for smoke tests)")
    parser.add_argument("--source", help="local parquet instead of downloading from Hugging Face")
    parser.add_argument("--out", default="data/processed")
    args = parser.parse_args()

    df = build(args.limit, args.source)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for name, part in df.groupby("split"):
        part.to_parquet(out / f"{name}.parquet", index=False)
    info = manifest(df, args.limit)
    (out / "manifest.json").write_text(json.dumps(info, indent=2))
    print(json.dumps(info, indent=2))


if __name__ == "__main__":
    main()
