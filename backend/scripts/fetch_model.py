"""Download the fine-tuned classifier at build time (e.g. Render build command).

    MODEL_URL=<zip of ml/artifacts/revlens-classifier> MODEL_DIR=model python -m scripts.fetch_model

Does nothing when MODEL_URL is unset (the app then uses Gemini / heuristics). The zip must contain
labels.json, tokenizer.json and the .onnx file named in labels.json, at its top level.
Keep the zip in private storage: the model is trained on data that must not be redistributed (ml/DATASETS.md).
"""
import io
import json
import os
import zipfile
from pathlib import Path

import requests


def main() -> None:
    url, model_dir = os.getenv("MODEL_URL"), Path(os.getenv("MODEL_DIR", "model"))
    if not url:
        print("MODEL_URL not set: skipping model download.")
        return
    headers = {"Authorization": f"Bearer {os.environ['MODEL_URL_TOKEN']}"} if os.getenv("MODEL_URL_TOKEN") else {}
    res = requests.get(url, headers=headers, timeout=300)
    res.raise_for_status()
    model_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(res.content)) as archive:
        archive.extractall(model_dir)
    labels = json.loads((model_dir / "labels.json").read_text(encoding="utf-8"))
    onnx_file = model_dir / labels["onnx_file"]
    if not onnx_file.exists() or not (model_dir / "tokenizer.json").exists():
        raise SystemExit(f"Model zip is incomplete: expected {onnx_file.name} and tokenizer.json in {model_dir}")
    print(f"Model '{labels.get('name')}' ready in {model_dir} ({onnx_file.stat().st_size / 1e6:.0f} MB).")


if __name__ == "__main__":
    main()
