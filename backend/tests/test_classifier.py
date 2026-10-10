"""Phase 3: the fine-tuned model answers first, and failures fall back visibly."""
import json
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
    result = ai.analyze_review_sentiment_and_spam("The wifi never worked during our stay.", "Asha")
    assert (result.sentiment, result.source, result.aspects) == ("negative", "model", {"wifi": "negative"})
    assert gemini == []  # no LLM call when the model answered


def test_model_failure_falls_back_to_gemini(model, gemini, caplog):
    model(fail=True)
    result = ai.analyze_review_sentiment_and_spam("Lovely stay with a kind host", "Asha")
    assert result.source == "llm" and len(gemini) == 1
    assert "Fine-tuned classifier failed" in caplog.text


class RecordingModel(FakeModel):
    def __init__(self):
        super().__init__()
        self.seen = []

    def predict(self, texts):
        self.seen += list(texts)
        return super().predict(texts)


def test_short_and_hinglish_reviews_skip_the_model(monkeypatch, gemini):
    """The model flagged "Good", "Worst" and every Hinglish review as spam; those go to Gemini instead."""
    import json
    from pathlib import Path
    model = RecordingModel()
    monkeypatch.setattr(ai, "_classifier", model)
    for text in ("Good", "Bad experience", "Thank you Rakesh ji", "Bahut ganda room tha", "Paise vasool, khana bahut accha tha"):
        assert ai.analyze_review_sentiment_and_spam(text, "Asha").source == "llm"
    assert model.seen == [] and len(gemini) == 5
    long = "The room was clean and the host was very helpful throughout our stay."
    assert ai.analyze_review_sentiment_and_spam(long, "Asha").source == "model" and model.seen == [long]

    # Every hand-written review of 1-4 words, and every Hinglish one, is routed away from the model
    items = json.loads((Path(__file__).parent / "data" / "short_reviews.json").read_text(encoding="utf-8"))
    hinglish = {"Paise vasool, khana bahut accha tha", "Bahut ganda room tha", "Mast jagah hai", "Theek thaak tha",
                "Bekaar service"}
    for text, _ in items:
        if len(text.split()) <= 4 or text in hinglish:
            assert not ai.model_suits(text), text


def test_import_sends_only_suitable_reviews_to_the_model(monkeypatch, gemini):
    model = RecordingModel()
    monkeypatch.setattr(ai, "_classifier", model)
    gemini.reply = json.dumps([{"index": 0, "sentiment": "negative", "is_spam": False,
                                "aspects": {n: "not_mentioned" for n in ai.ASPECT_GUIDE}}])
    long = "The room was clean and the host was very helpful throughout our stay."
    labels = ai.classify_reviews([(long, "A"), ("Worst", "B"), (long + " Again.", "C")])
    assert [l.source for l in labels] == ["model", "llm", "model"]   # order kept, one Gemini request
    assert model.seen == [long, long + " Again."] and len(gemini) == 1


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


@pytest.mark.skipif(not os.getenv("TEST_MODEL_DIR"), reason="set TEST_MODEL_DIR to an exported model to run")
def test_model_that_answers_differently_on_this_cpu_is_refused(monkeypatch, tmp_path, caplog):
    """An int8 model verified on one CPU gave wrong labels on another; the reference answers catch that."""
    import json
    import logging
    import shutil
    from app.classifier import OnnxClassifier
    caplog.set_level(logging.INFO)
    src = os.environ["TEST_MODEL_DIR"]
    shutil.copytree(src, tmp_path / "m")
    labels_path = tmp_path / "m" / "labels.json"
    labels = json.loads(labels_path.read_text())
    reference = OnnxClassifier(src).predict(["Breakfast was cold and the WiFi kept dropping."])[0]
    good = {"text": "Breakfast was cold and the WiFi kept dropping.", "sentiment_probs": reference["sentiment_probs"],
            "aspects_all": reference["aspects_all"]}
    monkeypatch.setenv("MODEL_DIR", str(tmp_path / "m"))

    labels_path.write_text(json.dumps({**labels, "canary": [good]}))
    monkeypatch.setattr(ai, "_classifier", None)
    assert ai.load_classifier() is not None and "1 reference reviews match" in caplog.text

    wrong = {**good, "aspects_all": {**good["aspects_all"], "cleanliness": "positive"}}  # what the server said
    labels_path.write_text(json.dumps({**labels, "canary": [wrong]}))
    monkeypatch.setattr(ai, "_classifier", None)
    assert ai.load_classifier() is None
    assert "gives different answers on this CPU" in caplog.text and "VNNI" in caplog.text


def test_cpu_summary_reports_vnni_from_linux_cpuinfo(monkeypatch):
    from pathlib import Path
    from app import classifier
    fake = {"vnni": "model name\t: Intel Xeon\nflags\t\t: fpu avx2 avx512f avx512_vnni\n",
            "plain": "model name\t: AMD EPYC 7763\nflags\t\t: fpu avx2\n"}
    for kind, expected in (("vnni", "Intel Xeon, ") , ("plain", "AMD EPYC 7763, ")):
        monkeypatch.setattr(Path, "read_text", lambda self, *a, k=kind, **kw: fake[k])
        summary = classifier.cpu_summary()
        assert summary.startswith(expected) and summary.endswith("VNNI: yes" if kind == "vnni" else "VNNI: no")
    monkeypatch.setattr(Path, "read_text", lambda self, *a, **kw: (_ for _ in ()).throw(OSError("no /proc")))
    assert classifier.cpu_summary().endswith("VNNI: unknown")


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
