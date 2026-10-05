"""Fine-tuned review classifier (Phase 3), served from an ONNX export on CPU.

Loaded only when MODEL_DIR is set; needs onnxruntime + tokenizers (no torch).
MODEL_DIR holds what ml/revlens_ml/export.py writes: labels.json, tokenizer.json and the .onnx file.
"""
import json
import os
from pathlib import Path

import numpy as np


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)


class OnnxClassifier:
    def __init__(self, model_dir: str | Path):
        import onnxruntime as ort
        from tokenizers import Tokenizer

        model_dir = Path(model_dir)
        self.config = json.loads((model_dir / "labels.json").read_text(encoding="utf-8"))
        self.name = self.config.get("name", model_dir.name)
        self.tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
        self.tokenizer.enable_truncation(self.config["max_len"])
        self.tokenizer.enable_padding(pad_id=self.config["pad_id"], pad_token=self.config["pad_token"])
        options = ort.SessionOptions()
        # Small instances (e.g. Render free tier) have little CPU and RAM: keep the thread pool small
        options.intra_op_num_threads = int(os.getenv("MODEL_THREADS", "1"))
        self.session = ort.InferenceSession(
            str(model_dir / self.config["onnx_file"]), options, providers=["CPUExecutionProvider"])

    def predict(self, texts: list[str]) -> list[dict]:
        encodings = self.tokenizer.encode_batch(texts)
        feeds = {
            "input_ids": np.array([e.ids for e in encodings], dtype=np.int64),
            "attention_mask": np.array([e.attention_mask for e in encodings], dtype=np.int64),
        }
        sentiment_logits, spam_logits, aspect_logits = self.session.run(None, feeds)
        sentiment_probs = _softmax(sentiment_logits)
        spam_probs = 1 / (1 + np.exp(-spam_logits))
        aspect_values = self.config["aspect_values"]
        aspect_idx = _softmax(aspect_logits).argmax(-1)

        results = []
        for i in range(len(texts)):
            aspects = {name: aspect_values[aspect_idx[i, j]] for j, name in enumerate(self.config["aspects"])}
            results.append({
                "sentiment": self.config["sentiments"][int(sentiment_probs[i].argmax())],
                "sentiment_probs": sentiment_probs[i].tolist(),
                "is_spam": bool(spam_probs[i] >= self.config["spam_threshold"]),
                "spam_prob": float(spam_probs[i]),
                "aspects": {k: v for k, v in aspects.items() if v != "not_mentioned"},
                "aspects_all": aspects,
            })
        return results
