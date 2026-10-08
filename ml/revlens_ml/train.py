"""Fine-tune the multi-task classifier.

    python -m revlens_ml.train --backbone microsoft/deberta-v3-base --teacher data/processed/teacher/train.Qwen3-32B.jsonl \
        --val-teacher data/processed/teacher/val.Qwen3-32B.jsonl --out runs/deberta-v3-base

Targets:
  sentiment  <- gold (the guest's own star rating)
  spam       <- gold (synthetic spam = True, real reviews assumed False)
  aspects    <- teacher LLM labels (ratings can't tell whether an aspect is mentioned); masked when missing
The best epoch (val sentiment macro-F1) is kept; the spam threshold is tuned on val.
"""
import argparse
import json
import math
import platform
import random
import subprocess
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import transformers
from sklearn.metrics import f1_score
from torch import nn
from torch.utils.data import DataLoader
from transformers import AutoModel, AutoTokenizer, get_linear_schedule_with_warmup

from .labels import ASPECT_VALUES, ASPECTS, SENTIMENTS, aspect_label
from .model import MultiTaskModel

IGNORE = -100


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def load_teacher(path: str | None) -> dict[str, dict]:
    if not path:
        return {}
    from .teacher import read_labels
    return read_labels(Path(path))


def targets(df: pd.DataFrame, teacher: dict[str, dict]) -> dict[str, np.ndarray]:
    sentiment = df["gold_sentiment"].map(lambda s: SENTIMENTS.index(s) if isinstance(s, str) else IGNORE)
    spam = df["gold_spam"].astype(float)
    aspects = np.full((len(df), len(ASPECTS)), IGNORE, dtype=np.int64)
    not_mentioned = ASPECT_VALUES.index("not_mentioned")
    for i, (review_id, origin) in enumerate(zip(df["review_id"], df["origin"])):
        label = teacher.get(review_id)
        if label:
            for j, a in enumerate(ASPECTS):
                verdict = aspect_label(label, a)
                if verdict is not None:  # an aspect the label never judged stays IGNORE
                    aspects[i, j] = ASPECT_VALUES.index(verdict)
        elif origin == "synthetic_spam":
            aspects[i] = not_mentioned  # spam says nothing about the stay
    return {"sentiment": sentiment.to_numpy(np.int64), "spam": spam.to_numpy(np.float32), "aspects": aspects,
            "real": (df["origin"] == "tripadvisor").to_numpy()}


class Batches:
    """Tokenised dataset with dynamic padding."""

    def __init__(self, df: pd.DataFrame, y: dict, tokenizer, max_len: int):
        enc = tokenizer(df["text"].tolist(), truncation=True, max_length=max_len)
        self.items = [
            {"input_ids": ids, "sentiment": y["sentiment"][i], "spam": y["spam"][i], "aspects": y["aspects"][i]}
            for i, ids in enumerate(enc["input_ids"])
        ]
        self.pad_id = tokenizer.pad_token_id

    def collate(self, batch: list[dict]) -> dict:
        width = max(len(b["input_ids"]) for b in batch)
        ids = torch.full((len(batch), width), self.pad_id, dtype=torch.long)
        mask = torch.zeros((len(batch), width), dtype=torch.long)
        for i, b in enumerate(batch):
            ids[i, :len(b["input_ids"])] = torch.tensor(b["input_ids"])
            mask[i, :len(b["input_ids"])] = 1
        return {
            "input_ids": ids, "attention_mask": mask,
            "sentiment": torch.tensor(np.array([b["sentiment"] for b in batch])),
            "spam": torch.tensor(np.array([b["spam"] for b in batch])),
            "aspects": torch.tensor(np.stack([b["aspects"] for b in batch])),
        }

    def loader(self, batch_size: int, shuffle: bool) -> DataLoader:
        return DataLoader(self.items, batch_size=batch_size, shuffle=shuffle, collate_fn=self.collate)


def predict(model: MultiTaskModel, loader: DataLoader, device: str, amp: bool) -> dict[str, np.ndarray]:
    model.eval()
    out = {"sentiment": [], "spam": [], "aspects": []}
    with torch.no_grad(), torch.autocast(device_type=device.split(":")[0], dtype=torch.bfloat16, enabled=amp):
        for batch in loader:
            s, p, a = model(batch["input_ids"].to(device), batch["attention_mask"].to(device))
            out["sentiment"].append(s.float().softmax(-1).cpu().numpy())
            out["spam"].append(p.float().sigmoid().cpu().numpy())
            out["aspects"].append(a.float().softmax(-1).cpu().numpy())
    return {k: np.concatenate(v) for k, v in out.items()}


def best_threshold(probs: np.ndarray, gold: np.ndarray) -> tuple[float, float]:
    """Spam threshold with the best val F1. Ties are common (val spam is easy), so take the middle of the
    best-F1 range rather than its upper edge, which would cost recall on unseen spam."""
    thresholds = np.arange(0.05, 0.96, 0.05)
    scores = np.array([f1_score(gold, probs >= t, zero_division=0) for t in thresholds])
    best = thresholds[np.isclose(scores, scores.max())]
    return float(np.median(best)), float(scores.max())


def val_metrics(pred: dict, y: dict, spam_threshold: float) -> dict:
    s_mask = y["sentiment"] != IGNORE
    # Real reviews with teacher labels only: synthetic spam is trivially "not_mentioned" and would inflate the score
    a_mask = (y["aspects"] != IGNORE) & y["real"][:, None]
    metrics = {
        "sentiment_macro_f1": f1_score(y["sentiment"][s_mask], pred["sentiment"].argmax(-1)[s_mask], average="macro"),
        "spam_f1": f1_score(y["spam"] > 0.5, pred["spam"] >= spam_threshold, zero_division=0),
    }
    if a_mask.any():
        metrics["aspects_macro_f1_vs_teacher"] = f1_score(
            y["aspects"][a_mask], pred["aspects"].argmax(-1)[a_mask], average="macro")
    metrics = {k: float(v) for k, v in metrics.items()}
    metrics["aspects_val_reviews"] = int(a_mask.any(1).sum())
    return metrics


def git_commit() -> str | None:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return None


def main() -> None:
    p = argparse.ArgumentParser(description="Fine-tune the RevLens multi-task classifier")
    p.add_argument("--backbone", default="microsoft/deberta-v3-base")
    p.add_argument("--data", default="data/processed")
    p.add_argument("--teacher", help="teacher JSONL for the train split (aspect targets)")
    p.add_argument("--val-teacher", help="teacher JSONL for the val split (aspect validation)")
    p.add_argument("--out", required=True)
    p.add_argument("--epochs", type=int, default=3)
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--lr", type=float, default=2e-5)
    p.add_argument("--max-len", type=int, default=256)
    p.add_argument("--limit", type=int, help="subsample train/val (smoke tests)")
    p.add_argument("--aspect-weight", type=float, default=1.0)
    p.add_argument("--spam-weight", type=float, default=1.0)
    p.add_argument("--seed", type=int, default=13)
    args = p.parse_args()

    set_seed(args.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    amp = device == "cuda" and torch.cuda.is_bf16_supported()
    data = Path(args.data)
    train_df, val_df = pd.read_parquet(data / "train.parquet"), pd.read_parquet(data / "val.parquet")
    if args.limit:
        train_df = train_df.sample(min(args.limit, len(train_df)), random_state=args.seed)
        val_df = val_df.sample(min(max(args.limit // 4, 50), len(val_df)), random_state=args.seed)
    teacher = load_teacher(args.teacher) | load_teacher(args.val_teacher)
    if not teacher:
        print("WARNING: no teacher labels: the aspect head will not be trained.")
    y_train, y_val = targets(train_df, teacher), targets(val_df, teacher)

    tokenizer = AutoTokenizer.from_pretrained(args.backbone)
    # fp32 master weights (some checkpoints are stored in fp16); bf16 only via autocast
    model = MultiTaskModel(AutoModel.from_pretrained(args.backbone, dtype=torch.float32)).to(device)
    train_loader = Batches(train_df, y_train, tokenizer, args.max_len).loader(args.batch_size, shuffle=True)
    val_loader = Batches(val_df, y_val, tokenizer, args.max_len).loader(args.batch_size * 2, shuffle=False)

    # Inverse-frequency class weights so the minority "neutral" class isn't ignored
    counts = np.bincount(y_train["sentiment"][y_train["sentiment"] != IGNORE], minlength=len(SENTIMENTS))
    weights = torch.tensor(counts.sum() / (len(SENTIMENTS) * np.maximum(counts, 1)), dtype=torch.float, device=device)
    sentiment_loss = nn.CrossEntropyLoss(weight=weights, ignore_index=IGNORE)
    aspect_loss = nn.CrossEntropyLoss(ignore_index=IGNORE)
    spam_loss = nn.BCEWithLogitsLoss()

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, math.ceil(0.06 * steps), steps)

    out = Path(args.out)
    history, best = [], -1.0
    config = {
        "backbone": args.backbone, "args": vars(args), "sentiments": list(SENTIMENTS), "aspects": list(ASPECTS),
        "aspect_values": list(ASPECT_VALUES), "max_len": args.max_len, "class_weights": weights.tolist(),
        "train_rows": len(train_df), "val_rows": len(val_df), "teacher_labels": len(teacher),
        "device": torch.cuda.get_device_name() if device == "cuda" else platform.processor(), "bf16": amp,
        "versions": {"torch": torch.__version__, "transformers": transformers.__version__}, "git": git_commit(),
    }
    for epoch in range(1, args.epochs + 1):
        model.train()
        start, total = time.time(), 0.0
        for step, batch in enumerate(train_loader, 1):
            batch = {k: v.to(device) for k, v in batch.items()}
            with torch.autocast(device_type=device, dtype=torch.bfloat16, enabled=amp):
                s, sp, a = model(batch["input_ids"], batch["attention_mask"])
            loss = args.spam_weight * spam_loss(sp.float(), batch["spam"])
            # Masked losses are NaN (0/0) when a batch has no target for them, so add them only when present
            if (batch["sentiment"] != IGNORE).any():
                loss = loss + sentiment_loss(s.float(), batch["sentiment"])
            if (batch["aspects"] != IGNORE).any():
                loss = loss + args.aspect_weight * aspect_loss(a.float().flatten(0, 1), batch["aspects"].flatten())
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            optimizer.zero_grad()
            total += loss.item()
            if step % 200 == 0:
                print(f"epoch {epoch} step {step}/{len(train_loader)} loss {total / step:.4f}")

        pred = predict(model, val_loader, device, amp)
        threshold, _ = best_threshold(pred["spam"], y_val["spam"] > 0.5)
        metrics = {"epoch": epoch, "train_loss": total / len(train_loader), "seconds": round(time.time() - start),
                   "spam_threshold": threshold, **val_metrics(pred, y_val, threshold)}
        history.append(metrics)
        print(json.dumps(metrics))
        if metrics["sentiment_macro_f1"] > best:
            best = metrics["sentiment_macro_f1"]
            model.save(out, tokenizer, {**config, "spam_threshold": threshold, "best_epoch": epoch})
            print(f"  saved best -> {out}")
    (out / "history.json").write_text(json.dumps(history, indent=2))


if __name__ == "__main__":
    main()
