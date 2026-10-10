"""Export a trained run to ONNX (fp32 + int8) for CPU serving in the backend.

    python -m revlens_ml.export --run runs/deberta-v3-base --out artifacts/revlens-classifier

Writes model.onnx, model.int8.onnx, tokenizer.json, labels.json, and parity.json: the exported models must
agree with the PyTorch model, otherwise the export fails.

int8 recipes are tried smallest-first; the first one whose sentiments agree with PyTorch on >= 95% of the
parity reviews ships. Measured on deberta-v3-xsmall (500 val reviews): quantizing everything 98.8% / 87 MB,
keeping the FFN down-projection in fp32 99.4% / 108 MB, keeping the whole FFN in fp32 100% / 130 MB.
The FFN is where int8 loses accuracy: its activations have the widest ranges.

The int8 weights are then stored as uint8 (U8U8, lossless; see u8u8.py), and labels.json gets reference answers
("canary") that the backend re-checks at start-up, so a CPU that computes differently is caught, not served.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import onnx
import pandas as pd
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic

from .labels import BACKEND_DIR
from .model import MultiTaskModel
from .u8u8 import convert as to_u8u8

PARITY_TEXTS = [
    "Spotless room and the host was lovely, but the wifi kept dropping.",
    "Terrible. Dirty bathroom, rude staff and far too expensive.",
    "It was fine. Nothing special.",
    "AMAZING DISCOUNTS at http://cheap-stays.biz click now!!!",
]
# Reference reviews stored in labels.json with this machine's answers; the backend re-checks them at start-up
CANARY_TEXTS = PARITY_TEXTS + [
    "Breakfast was cold and the WiFi kept dropping.",
    "Lovely host, great home-cooked food and a quiet location close to the market.",
    "Overpriced for what you get, and the room smelled damp.",
    "The street was noisy at night and it is far from everything.",
]
PARITY_SAMPLE = 500   # val reviews: enough that the agreement estimate is within ~1-2 points
MIN_AGREEMENT = 0.95


def _ffn_down(name: str) -> bool:
    return name.endswith("/output/dense/MatMul") and "/attention/" not in name


def _ffn_up(name: str) -> bool:
    return name.endswith("/intermediate/dense/MatMul")


# (name, predicate for MatMul nodes kept in fp32), smallest file first
RECIPES = [
    ("all-int8", lambda name: False),
    ("ffn-down-fp32", _ffn_down),
    ("ffn-fp32", lambda name: _ffn_down(name) or _ffn_up(name)),
]


def export(run: Path, out: Path, parity_data: Path | None, opset: int) -> dict:
    model, tokenizer, config = MultiTaskModel.load(run)
    out.mkdir(parents=True, exist_ok=True)

    dummy = tokenizer(["export example"], return_tensors="pt")
    onnx_path = out / "model.onnx"
    torch.onnx.export(
        model, (dummy["input_ids"], dummy["attention_mask"]), str(onnx_path),
        input_names=["input_ids", "attention_mask"], output_names=["sentiment", "spam", "aspects"],
        dynamic_axes={"input_ids": {0: "batch", 1: "seq"}, "attention_mask": {0: "batch", 1: "seq"},
                      "sentiment": {0: "batch"}, "spam": {0: "batch"}, "aspects": {0: "batch"}},
        opset_version=opset, dynamo=False,
    )
    int8_path = out / "model.int8.onnx"
    tokenizer.backend_tokenizer.save(str(out / "tokenizer.json"))
    labels = {
        "name": f"{run.name}-int8", "backbone": config["backbone"], "onnx_file": int8_path.name,
        "sentiments": config["sentiments"], "aspects": config["aspects"], "aspect_values": config["aspect_values"],
        "max_len": config["max_len"], "spam_threshold": config["spam_threshold"],
        "pad_id": tokenizer.pad_token_id, "pad_token": tokenizer.pad_token,
    }
    (out / "labels.json").write_text(json.dumps(labels, indent=2))

    texts = list(PARITY_TEXTS)
    if parity_data:
        texts += pd.read_parquet(parity_data)["text"].sample(PARITY_SAMPLE, random_state=0).tolist()
    enc = tokenizer(texts, truncation=True, max_length=config["max_len"], padding=True, return_tensors="pt")
    with torch.no_grad():
        ref = [t.numpy() for t in model(enc["input_ids"], enc["attention_mask"])]
    report = {"texts": len(texts), "fp32_max_abs_logit_diff": fp32_parity(onnx_path, enc, ref)}

    matmuls = [n.name for n in onnx.load(str(onnx_path)).graph.node if n.op_type == "MatMul"]
    ref_labels = [config["sentiments"][i] for i in ref[0].argmax(-1)]
    report["int8_attempts"] = []
    for recipe, keep_fp32 in RECIPES:
        # Per-channel scales keep transformer weights far closer to fp32 than one scale per tensor
        quantize_dynamic(str(onnx_path), str(int8_path), weight_type=QuantType.QInt8, per_channel=True,
                         nodes_to_exclude=[m for m in matmuls if keep_fp32(m)])
        to_u8u8(int8_path, int8_path)  # same values, but no saturation on CPUs without VNNI (see u8u8.py)
        agree = int8_agreement(out, texts, ref_labels)
        attempt = {"recipe": recipe, "sentiment_agreement": agree, "size_mb": round(int8_path.stat().st_size / 1e6, 1)}
        report["int8_attempts"].append(attempt)
        print(json.dumps(attempt))
        if agree >= MIN_AGREEMENT:
            report |= {"int8_recipe": recipe, "int8_sentiment_agreement": agree}
            break
    report["sizes_mb"] = {p.name: round(p.stat().st_size / 1e6, 1) for p in (onnx_path, int8_path)}
    (out / "parity.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    if "int8_recipe" not in report:
        best = max(a["sentiment_agreement"] for a in report["int8_attempts"])
        int8_path.unlink()  # never leave a failing int8 model where the deploy step would pick it up
        raise SystemExit(f"no int8 recipe reached {MIN_AGREEMENT:.0%} sentiment agreement (best {best:.1%})")
    add_canary(out)
    return report


def add_canary(out: Path) -> None:
    """Store this machine's answers for CANARY_TEXTS in labels.json, for the backend's start-up self-check."""
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from app.classifier import OnnxClassifier, cpu_summary
    labels_path = out / "labels.json"
    labels = json.loads(labels_path.read_text())
    labels.pop("canary", None)
    results = OnnxClassifier(out).predict(CANARY_TEXTS)
    labels["canary"] = [{"text": t, "sentiment_probs": [round(p, 4) for p in r["sentiment_probs"]],
                         "aspects_all": r["aspects_all"]} for t, r in zip(CANARY_TEXTS, results)]
    labels["canary_cpu"] = cpu_summary()
    labels_path.write_text(json.dumps(labels, indent=2))


def fp32_parity(onnx_path: Path, enc, ref) -> float:
    """ONNX fp32 must reproduce PyTorch numerically, or the export itself is broken."""
    import onnxruntime as ort
    fp32 = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"]).run(
        None, {"input_ids": enc["input_ids"].numpy(), "attention_mask": enc["attention_mask"].numpy()})
    max_diff = max(float(np.abs(a - b).max()) for a, b in zip(ref, fp32))
    if max_diff > 1e-3:
        raise SystemExit(f"fp32 ONNX export diverges from PyTorch (max diff {max_diff:.2e})")
    return max_diff


def int8_agreement(out: Path, texts: list[str], ref_labels: list[str]) -> float:
    """Sentiment agreement of the int8 model with PyTorch, through the real backend code path."""
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from app.classifier import OnnxClassifier
    int8 = OnnxClassifier(out).predict(texts)
    return float(np.mean([want == got["sentiment"] for want, got in zip(ref_labels, int8)]))


def main() -> None:
    p = argparse.ArgumentParser(description="Export a trained run to ONNX")
    p.add_argument("--run", help="trained run to export (required unless --finalize)")
    p.add_argument("--out", default="artifacts/revlens-classifier")
    p.add_argument("--parity-data", default="data/processed/val.parquet")
    p.add_argument("--opset", type=int, default=17)
    p.add_argument("--finalize", metavar="DIR",
                   help="instead: convert an already exported DIR to U8U8 in place and add its reference answers")
    args = p.parse_args()
    if args.finalize:
        out = Path(args.finalize)
        model_file = out / json.loads((out / "labels.json").read_text())["onnx_file"]
        print(f"U8U8: {to_u8u8(model_file, model_file)} tensors shifted")
        add_canary(out)
        print(f"reference answers added to {out / 'labels.json'}")
        return
    if not args.run:
        p.error("--run is required")
    parity_data = Path(args.parity_data) if args.parity_data and Path(args.parity_data).exists() else None
    export(Path(args.run), Path(args.out), parity_data, args.opset)


if __name__ == "__main__":
    main()
