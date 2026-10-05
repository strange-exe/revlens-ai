"""Phase 3: the fine-tuned model answers first, and failures fall back visibly."""
import os

import pytest

from app import ai


class FakeModel:
    name = "fake"

    def __init__(self, fail=False):
        self.fail = fail

    def predict(self, texts):
        if self.fail:
            raise RuntimeError("onnx session crashed")
        return [{"sentiment": "negative", "is_spam": False, "aspects": {"wifi": "negative"}} for _ in texts]


@pytest.fixture
def model(monkeypatch):
    def install(**kwargs):
        monkeypatch.setattr(ai, "_classifier", FakeModel(**kwargs))
    return install


def test_model_answers_first_and_is_tagged(model, gemini):
    model()
    result = ai.analyze_review_sentiment_and_spam("The wifi never worked.", "Asha")
    assert (result.sentiment, result.source, result.aspects) == ("negative", "model", {"wifi": "negative"})
    assert gemini == []  # no LLM call when the model answered


def test_model_failure_falls_back_to_gemini(model, gemini, caplog):
    model(fail=True)
    result = ai.analyze_review_sentiment_and_spam("Lovely stay", "Asha")
    assert result.source == "llm" and len(gemini) == 1
    assert "Fine-tuned classifier failed" in caplog.text


def test_missing_model_dir_is_a_no_op(monkeypatch):
    monkeypatch.delenv("MODEL_DIR", raising=False)
    monkeypatch.setattr(ai, "_classifier", None)
    assert ai.load_classifier() is None


def test_bad_model_dir_logs_error_and_keeps_serving(monkeypatch, tmp_path, caplog):
    monkeypatch.setenv("MODEL_DIR", str(tmp_path / "missing"))
    monkeypatch.setattr(ai, "_classifier", None)
    assert ai.load_classifier() is None
    assert "Could not load classifier" in caplog.text
    assert ai.analyze_review_sentiment_and_spam("Lovely stay", "Asha").source == "heuristic"


@pytest.mark.skipif(not os.getenv("TEST_MODEL_DIR"), reason="set TEST_MODEL_DIR to an exported model to run")
def test_real_exported_model_loads_and_predicts():
    from app.classifier import OnnxClassifier
    result = OnnxClassifier(os.environ["TEST_MODEL_DIR"]).predict(["Spotless room but the wifi kept dropping."])[0]
    assert result["sentiment"] in ai.SENTIMENTS and isinstance(result["is_spam"], bool)
    assert set(result["aspects_all"]) == set(ai.ASPECT_GUIDE)
