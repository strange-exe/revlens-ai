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
    model = OnnxClassifier(os.environ["TEST_MODEL_DIR"])
    result = model.predict(["Spotless room but the wifi kept dropping."])[0]
    assert result["sentiment"] in ai.SENTIMENTS and isinstance(result["is_spam"], bool)
    # A model reports the aspects it was trained on; one exported before an aspect was added (e.g. food) has fewer
    assert set(result["aspects_all"]) == set(model.config["aspects"]) <= set(ai.ASPECT_GUIDE)


def test_fit_ids_keeps_short_reviews_whole_and_long_ones_head_and_tail():
    from app.classifier import fit_ids
    short = [101, 5, 6, 102]
    assert fit_ids(short, 8) is short
    long = [101] + list(range(1, 20)) + [102]          # [CLS] 1..19 [SEP], 21 tokens
    fitted = fit_ids(long, 8)
    assert len(fitted) == 8
    assert fitted == [101, 1, 2, 3, 17, 18, 19, 102]  # first half and last half; [CLS]/[SEP] kept at the ends


@pytest.mark.skipif(not os.getenv("TEST_MODEL_DIR"), reason="set TEST_MODEL_DIR to an exported model to run")
def test_real_model_sees_the_end_of_a_long_review():
    from app.classifier import OnnxClassifier
    model = OnnxClassifier(os.environ["TEST_MODEL_DIR"])
    praise = "The staff were lovely and the breakfast was great. " * 40   # far past 256 tokens
    verdict = "But the room was filthy, the shower was broken and we left early. Terrible, never again."
    # A model that only read the start would score both texts the same. Whether one bad ending outweighs 40
    # sentences of praise is the model's judgement (it differs between models), so assert the shift, not the label.
    negative = model.config["sentiments"].index("negative")
    without, with_end = (model.predict([t])[0]["sentiment_probs"][negative] for t in (praise, praise + verdict))
    assert with_end - without > 0.2


@pytest.mark.skipif(not os.getenv("TEST_MODEL_DIR"), reason="set TEST_MODEL_DIR to an exported model to run")
def test_real_model_labels_do_not_depend_on_batch_mates():
    from app.classifier import OnnxClassifier
    model = OnnxClassifier(os.environ["TEST_MODEL_DIR"])
    texts = ["Lovely host and spotless room.", "The WiFi kept dropping and breakfast was cold. " * 30,
             "Average stay, nothing special.", "Terrible. Dirty sheets and rude staff."]
    together = model.predict(texts)
    alone = [model.predict([t])[0] for t in texts]
    assert [r["sentiment_probs"] for r in together] == [r["sentiment_probs"] for r in alone]
