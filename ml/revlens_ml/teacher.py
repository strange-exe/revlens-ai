"""Teacher LLM labels ("silver" labels) for training aspects/spam, and LLM baselines on the eval sample.

    # B200: serve an open model with vLLM, then label the train split
    vllm serve Qwen/Qwen3-32B --max-model-len 4096 &
    python -m revlens_ml.teacher --backend openai --base-url http://localhost:8000/v1 \
        --model Qwen/Qwen3-32B --no-thinking --split train --workers 64

    # Gemini (rate-limited free tier) on the eval sample, as the "current production" baseline
    python -m revlens_ml.teacher --backend gemini --split test --eval-sample --workers 1 --pace 5

Uses the backend's exact prompt and validator, so silver labels follow the same guide the app uses.
Output: <data>/teacher/<split>.<name>.jsonl, appended as it goes (re-running resumes; failures are retried).
"""
import argparse
import json
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
import requests

from .labels import ASPECTS, BACKEND_DIR, CLASSIFICATION_SCHEMA, build_classification_prompt, parse_classification


def to_json_schema(node: dict) -> dict:
    """Gemini's OpenAPI-style schema (type: "OBJECT") -> standard JSON Schema for OpenAI-compatible servers."""
    out = {k: v for k, v in node.items() if k not in ("type", "properties")}
    out["type"] = node["type"].lower()
    if "properties" in node:
        out["properties"] = {k: to_json_schema(v) for k, v in node["properties"].items()}
        out["additionalProperties"] = False
    return out


class OpenAICompatibleTeacher:
    """vLLM / any OpenAI-compatible chat endpoint with JSON-schema constrained output."""

    def __init__(self, base_url: str, model: str, api_key: str | None, no_thinking: bool):
        self.url = base_url.rstrip("/") + "/chat/completions"
        self.model = model
        self.headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        self.schema = to_json_schema(CLASSIFICATION_SCHEMA)
        self.no_thinking = no_thinking

    def label(self, text: str) -> dict | None:
        body = {
            "model": self.model,
            "temperature": 0,
            "messages": [{"role": "user", "content": build_classification_prompt(text, "Guest")}],
            "response_format": {"type": "json_schema", "json_schema": {"name": "classification", "schema": self.schema}},
        }
        if self.no_thinking:
            # vLLM-only field: reasoning models (e.g. Qwen3) skip their thinking trace. Other servers reject it.
            body["chat_template_kwargs"] = {"enable_thinking": False}
        res = requests.post(self.url, json=body, headers=self.headers, timeout=120)
        if not res.ok:
            raise RuntimeError(f"HTTP {res.status_code}: {res.text[:300]}")
        return json.loads(res.json()["choices"][0]["message"]["content"])


class GeminiTeacher:
    """The backend's Gemini call. Heuristic fallbacks are rejected: a teacher label must come from the LLM."""

    def __init__(self, model: str | None):
        if model:
            os.environ["GEMINI_MODEL"] = model
        from dotenv import load_dotenv
        load_dotenv(BACKEND_DIR / ".env")
        from app import ai
        ai.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        if model:
            ai.GEMINI_MODEL, ai.GEMINI_URL = model, f"{ai.GEMINI_MODELS_URL}/{model}:generateContent"
        self.ai = ai
        self.model = ai.GEMINI_MODEL

    def label(self, text: str) -> dict | None:
        result = self.ai.analyze_review_sentiment_and_spam(text, "Guest")
        if result.source != "llm":
            return None
        return {"sentiment": result.sentiment, "is_spam": result.is_spam,
                "aspects": {a: result.aspects.get(a, "not_mentioned") for a in self.ai.ASPECT_GUIDE}}


def read_labels(path: Path) -> dict[str, dict]:
    """Read a teacher JSONL, skipping a line torn by an interrupted write (it is simply re-labelled)."""
    labels = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
            labels[row["review_id"]] = row
        except (json.JSONDecodeError, KeyError):
            continue
    return labels


class HFTeacher:
    """Fallback without vLLM: the same open model via transformers, batched greedy generation on the GPU.
    No constrained decoding, so the JSON is extracted from the reply and validated as strictly as ever
    (only aspects the model leaves out are taken as not_mentioned)."""

    def __init__(self, model: str, batch_size: int, max_new_tokens: int = 200):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        self.torch, self.batch_size, self.max_new_tokens = torch, batch_size, max_new_tokens
        self.model = model  # model id, also names the output file
        self.tokenizer = AutoTokenizer.from_pretrained(model, padding_side="left")
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.lm = AutoModelForCausalLM.from_pretrained(model, dtype=torch.bfloat16, device_map=self.device).eval()
        self.schema_hint = json.dumps(to_json_schema(CLASSIFICATION_SCHEMA))

    def _prompt(self, text: str) -> str:
        content = (build_classification_prompt(text, "Guest")
                   + f"\n\nReply with ONLY a JSON object matching this JSON Schema:\n{self.schema_hint}")
        # enable_thinking=False is read by reasoning-model templates (e.g. Qwen3) and ignored by others
        return self.tokenizer.apply_chat_template([{"role": "user", "content": content}], tokenize=False,
                                                  add_generation_prompt=True, enable_thinking=False)

    @staticmethod
    def _extract(reply: str) -> dict | None:
        start, end = reply.find("{"), reply.rfind("}")
        if start < 0 or end <= start:
            return None
        try:
            result = json.loads(reply[start:end + 1])
        except json.JSONDecodeError:
            return None
        if isinstance(result, dict) and isinstance(result.get("aspects"), dict):
            for name in CLASSIFICATION_SCHEMA["properties"]["aspects"]["properties"]:
                result["aspects"].setdefault(name, "not_mentioned")
        return result

    def label_batch(self, texts: list[str]) -> list[dict | None]:
        enc = self.tokenizer([self._prompt(t) for t in texts], return_tensors="pt", padding=True).to(self.device)
        with self.torch.no_grad():
            out = self.lm.generate(**enc, max_new_tokens=self.max_new_tokens, do_sample=False,
                                   pad_token_id=self.tokenizer.pad_token_id)
        replies = self.tokenizer.batch_decode(out[:, enc["input_ids"].shape[1]:], skip_special_tokens=True)
        return [self._extract(r) for r in replies]


def run(teacher, rows: pd.DataFrame, out_path: Path, workers: int, pace: float) -> tuple[int, int]:
    done = set(read_labels(out_path)) if out_path.exists() else set()
    if out_path.exists() and out_path.stat().st_size and not out_path.read_bytes().endswith(b"\n"):
        with out_path.open("a", encoding="utf-8") as f:
            f.write("\n")  # terminate a torn last line so the next record starts cleanly
    todo = rows[~rows.review_id.isin(done)]
    print(f"{len(done)} already labelled, {len(todo)} to go -> {out_path}")
    lock, ok, failed = threading.Lock(), 0, 0

    def work(review_id: str, text: str):
        for attempt in range(3):
            try:
                parsed = parse_classification(teacher.label(text))
                if parsed:
                    return review_id, parsed
            except Exception as e:  # network / rate limit / bad JSON: back off and retry
                if attempt == 2:
                    print(f"{review_id}: {e}")
            time.sleep(pace + 5 * attempt)
        return review_id, None

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("a", encoding="utf-8") as f:
        def record(i: int, review_id: str, parsed) -> None:
            # Written (and flushed) per result, so a crash loses at most the in-flight requests
            nonlocal ok, failed
            with lock:
                if parsed:
                    sentiment, is_spam, aspects = parsed
                    # "judged": aspects is mentioned-only, so say which aspects this label actually ruled on
                    f.write(json.dumps({"review_id": review_id, "sentiment": sentiment, "is_spam": is_spam,
                                        "aspects": aspects, "judged": list(ASPECTS)}) + "\n")
                    f.flush()
                    ok += 1
                else:
                    failed += 1
                if i % 200 == 0:
                    print(f"  {i}/{len(todo)} ({failed} failed)")

        if hasattr(teacher, "label_batch"):  # local GPU model: batched generation
            items = list(todo.itertuples())
            for start in range(0, len(items), teacher.batch_size):
                chunk = items[start:start + teacher.batch_size]
                for j, (r, raw) in enumerate(zip(chunk, teacher.label_batch([r.text for r in chunk]))):
                    record(start + j + 1, r.review_id, parse_classification(raw))
        elif workers == 1:  # rate-limited APIs: one request at a time, paced
            for i, r in enumerate(todo.itertuples(), 1):
                record(i, *work(r.review_id, r.text))
                time.sleep(pace)
        else:
            with ThreadPoolExecutor(workers) as pool:
                futures = [pool.submit(work, r.review_id, r.text) for r in todo.itertuples()]
                for i, fut in enumerate(as_completed(futures), 1):
                    record(i, *fut.result())
    return ok, failed


def main() -> None:
    p = argparse.ArgumentParser(description="Label reviews with a teacher LLM")
    p.add_argument("--backend", choices=["openai", "gemini", "hf"], required=True,
                   help="openai: vLLM or any OpenAI-compatible server; hf: local transformers (no vLLM); gemini")
    p.add_argument("--batch-size", type=int, default=48, help="hf backend: reviews per generation batch")
    p.add_argument("--model", help="model id (default: GEMINI_MODEL for gemini; required for openai)")
    p.add_argument("--base-url", default="http://localhost:8000/v1")
    p.add_argument("--api-key", default=os.getenv("TEACHER_API_KEY"))
    p.add_argument("--no-thinking", action="store_true", help="vLLM: disable reasoning traces (e.g. Qwen3)")
    p.add_argument("--name", help="output name (default: derived from the model id)")
    p.add_argument("--data", default="data/processed")
    p.add_argument("--split", default="train", choices=["train", "val", "test"])
    p.add_argument("--eval-sample", action="store_true", help="only the fixed eval-sample rows")
    p.add_argument("--limit", type=int)
    p.add_argument("--workers", type=int, default=32)
    p.add_argument("--pace", type=float, default=0.0, help="seconds between requests (rate-limited APIs)")
    args = p.parse_args()

    if args.backend == "openai":
        if not args.model:
            p.error("--model is required with --backend openai")
        teacher = OpenAICompatibleTeacher(args.base_url, args.model, args.api_key, args.no_thinking)
    elif args.backend == "hf":
        if not args.model:
            p.error("--model is required with --backend hf")
        teacher = HFTeacher(args.model, args.batch_size)
    else:
        teacher = GeminiTeacher(args.model)

    rows = pd.read_parquet(Path(args.data) / f"{args.split}.parquet")
    if args.eval_sample:
        rows = rows[rows.in_eval_sample]
    if args.limit:
        rows = rows.sample(min(args.limit, len(rows)), random_state=13)
    name = args.name or teacher.model.split("/")[-1]
    out = Path(args.data) / "teacher" / f"{args.split}{'-eval' if args.eval_sample else ''}.{name}.jsonl"
    ok, failed = run(teacher, rows, out, args.workers, args.pace)
    print(f"done: {ok} labelled, {failed} failed")


if __name__ == "__main__":
    main()
