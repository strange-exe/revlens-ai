"""Classic baselines: the app's keyword heuristic (the floor) and TF-IDF + logistic regression.

    python -m revlens_ml.baselines --out runs/tfidf [--teacher data/processed/teacher/train.<name>.jsonl]
"""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from .labels import ASPECTS, aspect_label, classify_sentiment_locally, detect_spam_locally
from .train import load_teacher


def heuristic_predict(texts: list[str]) -> pd.DataFrame:
    """The backend's keyword fallback. It has no aspect output (None = not supported)."""
    return pd.DataFrame({
        "sentiment": [classify_sentiment_locally(t) for t in texts],
        "spam": [detect_spam_locally(t, "Guest") for t in texts],
        **{f"aspect_{a}": [None] * len(texts) for a in ASPECTS},
    })


class TfidfBaseline:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=200_000, sublinear_tf=True)
        self.sentiment = LogisticRegression(max_iter=2000, class_weight="balanced")
        self.spam = LogisticRegression(max_iter=2000, class_weight="balanced")
        self.aspects: dict[str, LogisticRegression] = {}

    def fit(self, df: pd.DataFrame, teacher: dict[str, dict]) -> "TfidfBaseline":
        X = self.vectorizer.fit_transform(df["text"])
        has_sentiment = df["gold_sentiment"].notna().to_numpy()
        self.sentiment.fit(X[has_sentiment], df.loc[has_sentiment, "gold_sentiment"])
        self.spam.fit(X, df["gold_spam"].astype(bool))
        labelled = df["review_id"].isin(teacher).to_numpy()
        if labelled.any():
            for a in ASPECTS:
                verdicts = [aspect_label(teacher[r], a) for r in df.loc[labelled, "review_id"]]
                judged = np.array([v is not None for v in verdicts])
                y = [v for v in verdicts if v is not None]
                if len(set(y)) > 1:
                    self.aspects[a] = LogisticRegression(max_iter=2000, class_weight="balanced").fit(X[labelled][judged], y)
        return self

    def predict(self, texts: list[str]) -> pd.DataFrame:
        X = self.vectorizer.transform(texts)
        out = pd.DataFrame({"sentiment": self.sentiment.predict(X), "spam": self.spam.predict(X)})
        out["sentiment_confidence"] = self.sentiment.predict_proba(X).max(1)
        for a in ASPECTS:
            out[f"aspect_{a}"] = self.aspects[a].predict(X) if a in self.aspects else None
        return out


def main() -> None:
    p = argparse.ArgumentParser(description="Train the TF-IDF + logistic regression baseline")
    p.add_argument("--data", default="data/processed")
    p.add_argument("--teacher", help="teacher JSONL for the train split (enables aspect classifiers)")
    p.add_argument("--out", default="runs/tfidf")
    args = p.parse_args()

    train = pd.read_parquet(Path(args.data) / "train.parquet")
    # Build via the importable module, not __main__, so the pickled model loads from evaluate.py
    from revlens_ml.baselines import TfidfBaseline as Importable
    model = Importable().fit(train, load_teacher(args.teacher))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out / "model.joblib")
    (out / "config.json").write_text(json.dumps({"train_rows": len(train), "aspects": sorted(model.aspects),
                                                 "vocab": len(model.vectorizer.vocabulary_)}, indent=2))
    print(f"saved -> {out} (aspect classifiers: {sorted(model.aspects) or 'none'})")


if __name__ == "__main__":
    main()
