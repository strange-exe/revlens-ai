"""Compare models on the frozen test split.

    python -m revlens_ml.evaluate --subset eval_sample \
        --model heuristic \
        --model tfidf=tfidf:runs/tfidf \
        --model gemini=jsonl:data/processed/teacher/test-eval.gemini-3.5-flash-lite.jsonl \
        --model qwen-teacher=jsonl:data/processed/teacher/test-eval.Qwen3-32B.jsonl \
        --model deberta=torch:runs/deberta-v3-base \
        --model deberta-int8=onnx:artifacts/revlens-classifier \
        --reference-teacher data/processed/teacher/test-eval.Qwen3-32B.jsonl --cost gemini=<usd per 1k> --out runs/eval

What each number means (also written into the report):
  sentiment  vs gold = the guest's own star rating (independent of every model)
  spam       vs gold = synthetic spam from templates never seen in training, real reviews assumed clean
  aspects    vs ratings = polarity proxy from sub-ratings (cleanliness/location/value/rooms); can't judge "mentioned"
  aspects    vs teacher = agreement with the teacher LLM, NOT accuracy (the only signal for wifi/host)
"""
import argparse
import hashlib
import json
import re
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, f1_score, precision_recall_fscore_support

from .labels import ASPECTS, BACKEND_DIR, RATED_ASPECTS, SENTIMENTS

LATENCY_SAMPLE = 200


# ── predictors: each returns a frame aligned to `texts` ─────────────────────

def _jsonl_predictions(path: str, df: pd.DataFrame) -> pd.DataFrame:
    from .teacher import read_labels
    rows = read_labels(Path(path))
    out = []
    for review_id in df["review_id"]:
        r = rows.get(review_id)
        out.append({"sentiment": r["sentiment"] if r else None, "spam": r["is_spam"] if r else None,
                    **{f"aspect_{a}": (r["aspects"].get(a, "not_mentioned") if r else None) for a in ASPECTS}})
    return pd.DataFrame(out)


def load_predictor(kind: str, path: str | None):
    """-> (predict(texts) -> DataFrame, measures_latency: bool)"""
    if kind == "heuristic":
        from .baselines import heuristic_predict
        return heuristic_predict, True
    if kind == "tfidf":
        import joblib
        model = joblib.load(Path(path) / "model.joblib")
        return model.predict, True
    if kind == "torch":
        import torch
        from .model import MultiTaskModel
        model, tokenizer, config = MultiTaskModel.load(Path(path))

        def predict(texts):
            enc = tokenizer(list(texts), truncation=True, max_length=config["max_len"], padding=True, return_tensors="pt")
            with torch.no_grad():
                s, p, a = model(enc["input_ids"], enc["attention_mask"])
            probs = s.softmax(-1).numpy()
            idx = a.argmax(-1).numpy()
            return pd.DataFrame({
                "sentiment": [SENTIMENTS[i] for i in probs.argmax(-1)],
                "sentiment_confidence": probs.max(-1),
                "spam": (p.sigmoid().numpy() >= config["spam_threshold"]),
                **{f"aspect_{name}": [config["aspect_values"][k] for k in idx[:, j]] for j, name in enumerate(ASPECTS)},
            })
        return predict, True
    if kind == "onnx":
        import sys
        sys.path.insert(0, str(BACKEND_DIR))
        from app.classifier import OnnxClassifier
        model = OnnxClassifier(path)

        def predict(texts):
            results = model.predict(list(texts))
            return pd.DataFrame([{
                "sentiment": r["sentiment"], "sentiment_confidence": max(r["sentiment_probs"]), "spam": r["is_spam"],
                **{f"aspect_{a}": r["aspects_all"][a] for a in ASPECTS},
            } for r in results])
        return predict, True
    raise ValueError(f"unknown model kind: {kind}")


def run_predictions(kind: str, path: str | None, df: pd.DataFrame, batch: int = 64) -> tuple[pd.DataFrame, dict]:
    if kind == "jsonl":
        return _jsonl_predictions(path, df), {}
    predict, measure = load_predictor(kind, path)
    texts = df["text"].tolist()
    preds = pd.concat([predict(texts[i:i + batch]) for i in range(0, len(texts), batch)], ignore_index=True)
    latency = {}
    if measure:
        timings = []
        for t in texts[:LATENCY_SAMPLE]:  # one review at a time, as the API classifies them
            start = time.perf_counter()
            predict([t])
            timings.append((time.perf_counter() - start) * 1000)
        latency = {"latency_ms_p50": float(np.percentile(timings, 50)), "latency_ms_p95": float(np.percentile(timings, 95))}
    return preds, latency


# ── metrics ──────────────────────────────────────────────────────────────

def sentiment_metrics(gold: pd.Series, pred: pd.Series) -> dict:
    m = gold.notna() & pred.notna()
    g, p = gold[m], pred[m]
    prec, rec, f1, support = precision_recall_fscore_support(g, p, labels=list(SENTIMENTS), zero_division=0)
    return {
        "n": int(m.sum()), "coverage": float(m.sum() / max(gold.notna().sum(), 1)),
        "macro_f1": float(f1_score(g, p, labels=list(SENTIMENTS), average="macro", zero_division=0)),
        "accuracy": float((g == p).mean()),
        "per_class": {s: {"precision": float(prec[i]), "recall": float(rec[i]), "f1": float(f1[i]),
                          "support": int(support[i])} for i, s in enumerate(SENTIMENTS)},
        "confusion": {"labels": list(SENTIMENTS), "matrix": confusion_matrix(g, p, labels=list(SENTIMENTS)).tolist()},
    }


def spam_metrics(df: pd.DataFrame, pred: pd.Series) -> dict:
    m = pred.notna()
    gold, p = df.loc[m, "gold_spam"].astype(bool), pred[m].astype(bool)
    prec, rec, f1, _ = precision_recall_fscore_support(gold, p, average="binary", zero_division=0)
    real = (df.loc[m, "origin"] == "tripadvisor").to_numpy()
    families = df.loc[m & (df["origin"] == "synthetic_spam")]
    return {
        "n": int(m.sum()), "precision": float(prec), "recall": float(rec), "f1": float(f1),
        "false_positive_rate_real": float(p[real].mean()) if real.any() else None,
        "recall_by_family": {f: float(pred[g.index].astype(bool).mean()) for f, g in families.groupby("spam_family")},
    }


def aspect_metrics(df: pd.DataFrame, preds: pd.DataFrame, reference: pd.DataFrame | None) -> dict:
    out = {"vs_ratings": {}, "vs_teacher": {}}
    if all(preds[f"aspect_{a}"].isna().all() for a in ASPECTS):
        return {"supported": False}
    for a in RATED_ASPECTS:
        gold, p = df[f"gold_{a}"], preds[f"aspect_{a}"]
        if p.isna().all():
            continue  # this model has no classifier for this aspect
        m = gold.notna() & p.notna()
        mentioned = m & p.isin(["positive", "negative"])
        out["vs_ratings"][a] = {
            "n": int(m.sum()),
            "mention_rate": float(mentioned.sum() / max(m.sum(), 1)),
            "polarity_accuracy_when_mentioned": float((p[mentioned] == gold[mentioned]).mean()) if mentioned.any() else None,
        }
    if reference is not None:
        for a in ASPECTS:
            ref, p = reference[f"aspect_{a}"], preds[f"aspect_{a}"]
            m = ref.notna() & p.notna()
            out["vs_teacher"][a] = float(f1_score(ref[m], p[m], average="macro", zero_division=0)) if m.any() else None
        scores = [v for v in out["vs_teacher"].values() if v is not None]
        out["vs_teacher_mean_macro_f1"] = float(np.mean(scores)) if scores else None
    return out


NEGATION = re.compile(r"\b(not|no|never|n't|nothing|hardly)\b", re.I)
CONTRAST = re.compile(r"\b(but|however|although|though|except)\b", re.I)


def worst_errors(df: pd.DataFrame, preds: pd.DataFrame, k: int = 20) -> pd.DataFrame:
    """Most confident wrong sentiment predictions (or, without confidences, the furthest from the star rating)."""
    m = df["gold_sentiment"].notna() & preds["sentiment"].notna() & (df["gold_sentiment"] != preds["sentiment"])
    err = df.loc[m, ["review_id", "rating", "gold_sentiment", "text"]].copy()
    err["pred"] = preds.loc[m, "sentiment"]
    pole = err["pred"].map({"positive": 5, "neutral": 3, "negative": 1})
    err["severity"] = preds.loc[m, "sentiment_confidence"] if "sentiment_confidence" in preds else (err["rating"] - pole).abs()
    err["tags"] = err["text"].map(lambda t: ", ".join(
        tag for tag, hit in [("negation", NEGATION.search(t)), ("contrast", CONTRAST.search(t)),
                             ("long", len(t) > 1500), ("short", len(t) < 120)] if hit))
    err.loc[err["rating"] == 3, "tags"] += "; 3-star boundary"
    return err.sort_values("severity", ascending=False).head(k)


# ── report ───────────────────────────────────────────────────────────────

def check_frozen(data: Path) -> None:
    manifest = json.loads((data / "manifest.json").read_text())
    ids = "\n".join(sorted(pd.read_parquet(data / "test.parquet", columns=["review_id"])["review_id"]))
    if hashlib.sha256(ids.encode()).hexdigest() != manifest["test_sha256"]:
        raise SystemExit("test.parquet does not match manifest.json: the frozen test split has changed.")


def fmt(x, pct=False):
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return "n/a"
    return f"{x:.1%}" if pct else f"{x:.3f}" if isinstance(x, float) else str(x)


def main() -> None:
    p = argparse.ArgumentParser(description="Evaluate models on the frozen test split")
    p.add_argument("--data", default="data/processed")
    p.add_argument("--subset", choices=["eval_sample", "test"], default="eval_sample")
    p.add_argument("--model", action="append", required=True, help="heuristic | name=kind:path (kind: tfidf, torch, onnx, jsonl)")
    p.add_argument("--reference-teacher", help="teacher JSONL on the same rows, for aspect agreement")
    p.add_argument("--cost", action="append", default=[], help="name=USD per 1k reviews (only if you know it)")
    p.add_argument("--out", default="runs/eval")
    args = p.parse_args()

    data = Path(args.data)
    check_frozen(data)
    df = pd.read_parquet(data / "test.parquet")
    if args.subset == "eval_sample":
        df = df[df.in_eval_sample]
    df = df.reset_index(drop=True)
    reference = _jsonl_predictions(args.reference_teacher, df) if args.reference_teacher else None
    costs = dict(c.split("=", 1) for c in args.cost)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    results = {}
    for spec in args.model:
        name, _, rest = spec.partition("=")
        kind, _, path = (rest or name).partition(":")
        print(f"evaluating {name} ({kind}) on {len(df)} rows ...")
        preds, latency = run_predictions(kind, path or None, df)
        results[name] = {
            "kind": kind, "path": path or None,
            "sentiment": sentiment_metrics(df["gold_sentiment"], preds["sentiment"]),
            "spam": spam_metrics(df, preds["spam"]),
            "aspects": aspect_metrics(df, preds, reference),
            **latency, "cost_usd_per_1k": float(costs[name]) if name in costs else None,
        }
        errors = worst_errors(df, preds)
        lines = [f"# {name}: 20 worst sentiment errors", "",
                 "Explain each one below (label noise? sarcasm? mixed review? rating vs text mismatch?).", ""]
        for e in errors.itertuples():
            lines += [f"## {e.review_id}: {int(e.rating)}★ gold={e.gold_sentiment} pred={e.pred} "
                      f"(severity {e.severity:.2f}) [{e.tags}]", "", f"> {e.text[:600]}", "", "Explanation: _todo_", ""]
        (out / f"errors_{name}.md").write_text("\n".join(lines), encoding="utf-8")

    (out / "metrics.json").write_text(json.dumps({"subset": args.subset, "rows": len(df), "models": results}, indent=2))
    header = ("| model | sentiment macro-F1 | accuracy | neutral F1 | spam F1 | spam FPR (real) | aspect mention rate "
              "| aspect polarity acc | aspect F1 vs teacher | p50 ms | p95 ms | USD/1k |")
    rows = [header, "|" + "---|" * 12]
    for name, r in results.items():
        vs_r = r["aspects"].get("vs_ratings", {})
        mention = np.mean([v["mention_rate"] for v in vs_r.values()]) if vs_r else None
        pol = [v["polarity_accuracy_when_mentioned"] for v in vs_r.values() if v["polarity_accuracy_when_mentioned"] is not None]
        rows.append(" | ".join([
            f"| {name}", fmt(r["sentiment"]["macro_f1"]), fmt(r["sentiment"]["accuracy"]),
            fmt(r["sentiment"]["per_class"]["neutral"]["f1"]), fmt(r["spam"]["f1"]),
            fmt(r["spam"]["false_positive_rate_real"], pct=True), fmt(mention, pct=True) if mention is not None else "n/a",
            fmt(float(np.mean(pol))) if pol else "n/a", fmt(r["aspects"].get("vs_teacher_mean_macro_f1")),
            fmt(r.get("latency_ms_p50")), fmt(r.get("latency_ms_p95")), fmt(r["cost_usd_per_1k"]),
        ]) + " |")
    legend = "What each" + __doc__.split("What each", 1)[1]
    report = [f"# RevLens model comparison ({args.subset}, {len(df)} rows)", "", *rows, "", legend]
    (out / "report.md").write_text("\n".join(report), encoding="utf-8")
    print("\n".join(rows))
    print(f"\nreport -> {out / 'report.md'}")


if __name__ == "__main__":
    main()
