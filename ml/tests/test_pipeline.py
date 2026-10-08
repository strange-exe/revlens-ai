"""Guarantees the evaluation depends on. If one of these breaks, the reported numbers are invalid."""
import numpy as np
import pandas as pd
import pytest

from revlens_ml import data, spam
from revlens_ml.evaluate import sentiment_metrics, worst_errors
from revlens_ml.labels import CLASSIFICATION_SCHEMA, rating_to_polarity, rating_to_sentiment
from revlens_ml.teacher import to_json_schema


@pytest.fixture
def raw(tmp_path):
    rng = np.random.default_rng(0)
    n = 600
    texts = [f"Review number {i}: the room was fine and the staff were helpful enough." for i in range(n)]
    texts[1] = texts[0].upper()  # case-insensitive duplicate of row 0
    df = pd.DataFrame({
        "hotel_id": range(n), "user_id": [f"u{i // 3}" for i in range(n)],  # 3 reviews per author
        "review": texts, "overall": rng.integers(1, 6, n).astype(float),
        **{c: rng.integers(1, 6, n).astype(float) for c in ["cleanliness", "value", "location", "rooms"]},
    })
    path = tmp_path / "raw.parquet"
    df.to_parquet(path)
    return path


def test_rating_mappings():
    assert [rating_to_sentiment(s) for s in (1, 2, 3, 4, 5)] == ["negative"] * 2 + ["neutral"] + ["positive"] * 2
    assert [rating_to_polarity(s) for s in (1, 3, 5)] == ["negative", None, "positive"]
    assert rating_to_polarity(float("nan")) is None


def test_no_author_in_two_splits_and_dedupe_before_split(raw):
    df = data.build(source=str(raw))
    real = df[df.origin == "tripadvisor"]
    splits = real.groupby("group_id")["split"].nunique()
    assert (splits == 1).all()
    assert real["text"].str.lower().duplicated().sum() == 0
    assert set(df.split) == {"train", "val", "test"}


def test_build_is_deterministic(raw):
    a, b = data.build(source=str(raw)), data.build(source=str(raw))
    assert data.manifest(a, None)["test_sha256"] == data.manifest(b, None)["test_sha256"]


def test_spam_test_templates_never_appear_in_training():
    for family, parts in spam.FAMILIES.items():
        assert not set(parts["train"]) & set(parts["test"]), family
    train_texts = {r["text"] for r in spam.generate("train", 500, 1)}
    test_texts = {r["text"] for r in spam.generate("test", 200, 1)}
    assert not train_texts & test_texts


def test_eval_sample_is_inside_test(raw):
    df = data.build(source=str(raw))
    assert set(df.loc[df.in_eval_sample, "split"]) == {"test"}


def test_json_schema_conversion_for_openai_servers():
    schema = to_json_schema(CLASSIFICATION_SCHEMA)
    assert schema["type"] == "object" and schema["additionalProperties"] is False
    aspects = schema["properties"]["aspects"]
    assert aspects["type"] == "object" and set(aspects["required"]) == set(aspects["properties"])
    assert schema["properties"]["sentiment"]["enum"] == ["positive", "neutral", "negative"]


def test_metrics_and_worst_errors():
    gold = pd.Series(["positive", "negative", "neutral", "positive"])
    pred = pd.Series(["positive", "positive", "neutral", None])
    m = sentiment_metrics(gold, pred)
    assert m["n"] == 3 and m["coverage"] == 0.75 and m["accuracy"] == pytest.approx(2 / 3)

    df = pd.DataFrame({"review_id": ["a", "b"], "rating": [1.0, 3.0], "gold_sentiment": ["negative", "neutral"],
                       "text": ["Not good at all", "ok but meh"]})
    preds = pd.DataFrame({"sentiment": ["positive", "positive"], "sentiment_confidence": [0.6, 0.9]})
    errors = worst_errors(df, preds)
    assert list(errors.review_id) == ["b", "a"]  # most confident mistake first
    assert "negation" in errors.set_index("review_id").loc["a", "tags"]


# ── regressions from code review ─────────────────────────────────────────

def test_teacher_resume_survives_a_torn_last_line(tmp_path):
    from revlens_ml.labels import ASPECTS
    from revlens_ml.teacher import read_labels, run

    class Echo:
        def label(self, text):
            return {"sentiment": "positive", "is_spam": False,
                    "aspects": {a: "not_mentioned" for a in ASPECTS}}

    out = tmp_path / "labels.jsonl"
    out.write_text('{"review_id": "a", "sentiment": "positive", "is_spam": false, "aspects": {}}\n{"review_id": "b", "sent',
                   encoding="utf-8")
    rows = pd.DataFrame({"review_id": ["a", "b", "c"], "text": ["x", "y", "z"]})
    ok, failed = run(Echo(), rows, out, workers=1, pace=0)
    assert (ok, failed) == (2, 0)  # "a" kept, torn "b" redone, "c" new
    assert set(read_labels(out)) == {"a", "b", "c"}


def test_labels_written_before_food_existed_say_nothing_about_food():
    from revlens_ml.labels import aspect_label
    legacy = {"review_id": "a", "aspects": {"value": "negative"}}  # mentioned-only, no "judged" list
    assert aspect_label(legacy, "value") == "negative"
    assert aspect_label(legacy, "wifi") == "not_mentioned"  # judged, just not mentioned
    assert aspect_label(legacy, "food") is None             # never judged: must not be trained as "not mentioned"
    current = {"review_id": "b", "aspects": {}, "judged": ["cleanliness", "food"]}
    assert aspect_label(current, "food") == "not_mentioned"
    assert aspect_label(current, "wifi") is None


def test_spam_threshold_ties_pick_the_middle_not_the_top():
    from revlens_ml.train import best_threshold
    probs = np.array([0.02, 0.03, 0.97, 0.98])  # perfectly separable: every threshold 0.05..0.95 ties
    threshold, f1 = best_threshold(probs, np.array([False, False, True, True]))
    assert f1 == 1.0 and threshold == pytest.approx(0.5)


def test_review_ids_are_stable_across_rebuild_sizes(raw):
    full = data.build(source=str(raw))
    small = data.build(source=str(raw), limit=200)
    shared = small.merge(full, on="review_id", suffixes=("_s", "_f"))
    assert len(shared) > 0 and (shared.text_s == shared.text_f).all()


def test_synthetic_spam_is_distinct_and_balanced():
    rows = spam.generate("test", 300, 13)
    assert len({r["text"] for r in rows}) == len(rows)
    counts = pd.Series([r["spam_family"] for r in rows]).value_counts()
    assert counts.max() <= -(-300 // len(spam.FAMILIES))


def test_hf_teacher_extracts_json_and_fills_missing_aspects():
    from revlens_ml.labels import parse_classification
    from revlens_ml.teacher import HFTeacher
    reply = 'Sure! {"sentiment": "negative", "is_spam": false, "aspects": {"wifi": "negative"}} Hope this helps.'
    parsed = parse_classification(HFTeacher._extract(reply))
    assert parsed == ("negative", False, {"wifi": "negative"})
    assert HFTeacher._extract("no json here") is None
    assert parse_classification(HFTeacher._extract('{"sentiment": "great"}')) is None  # still strict on values
