"""Phase 1: every AI result says where it came from, and fallbacks are visible."""
import json
import logging

import pytest
from fastapi.testclient import TestClient

from app import ai
from app.main import app

client = TestClient(app)


def llm_reply(sentiment="positive", is_spam=False, **aspects):
    labels = {name: "not_mentioned" for name in ai.ASPECT_GUIDE} | aspects
    return json.dumps({"sentiment": sentiment, "is_spam": is_spam, "aspects": labels})


@pytest.fixture(scope="module")
def auth_header():
    res = client.post("/api/auth/register", json={
        "email": "provenance@example.com", "password": "a-long-test-password", "full_name": "Test Owner"})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


_own_property: dict[str, int] = {}  # one property per test user: reviews may only go to properties you own


def new_review(auth_header, **fields):
    token = auth_header["Authorization"]
    if token not in _own_property:
        res = client.post("/api/properties", json={"name": "Hill House", "location": "Shimla"}, headers=auth_header)
        assert res.status_code == 201, res.text
        _own_property[token] = res.json()["id"]
    body = {"property_id": _own_property[token], "property_name": "Hill House", "guest_name": "Asha",
            "rating": 4, "text": "Spotless room, but the wifi kept dropping.", "date": "2026-10-04"} | fields
    res = client.post("/api/reviews", json=body, headers=auth_header)
    assert res.status_code == 201, res.text
    return res.json()


# ── ai module ────────────────────────────────────────────────────────────

def test_llm_result_is_tagged_and_keeps_only_mentioned_aspects(gemini):
    gemini.reply = llm_reply("neutral", cleanliness="positive", wifi="negative")
    result = ai.analyze_review_sentiment_and_spam("Spotless room, but the wifi kept dropping.", "Asha")
    assert result.source == "llm"
    assert result.aspects == {"cleanliness": "positive", "wifi": "negative"}


def test_food_is_its_own_aspect_with_a_definition_the_llm_sees(gemini):
    assert "food" in ai.ASPECT_GUIDE
    assert "  - food:" in ai.build_classification_prompt("Breakfast was cold.")
    assert "breakfast" not in ai.ASPECT_GUIDE["amenities"].lower()  # meals moved out of amenities
    gemini.reply = llm_reply("negative", food="negative", value="negative")
    result = ai.analyze_review_sentiment_and_spam("Not worth the price. Breakfast options were very limited.", "Karan")
    assert result.source == "llm"
    assert result.aspects == {"value": "negative", "food": "negative"}


@pytest.mark.parametrize("bad_aspects", [
    None,                                   # missing
    {"cleanliness": "positive"},            # incomplete
    {name: "great" for name in ai.ASPECT_GUIDE},  # off-schema value
])
def test_invalid_aspects_fall_back_to_heuristic(gemini, bad_aspects, caplog):
    gemini.reply = json.dumps({"sentiment": "positive", "is_spam": False, "aspects": bad_aspects})
    with caplog.at_level(logging.WARNING):
        result = ai.analyze_review_sentiment_and_spam("Lovely stay", "Asha")
    assert result.source == "heuristic" and result.aspects is None
    assert "fell back" in caplog.text


def test_unconfigured_key_uses_heuristic_and_template():
    assert not ai._gemini_configured()  # conftest sets GEMINI_API_KEY=""
    assert ai.analyze_review_sentiment_and_spam("Lovely stay", "Asha").source == "heuristic"
    assert ai.generate_management_response("Asha", "Hill House", 5, "Lovely").source == "template"


def test_model_probe_reports_missing_model(monkeypatch, caplog):
    monkeypatch.setattr(ai, "GEMINI_API_KEY", "AIza-test")
    monkeypatch.setattr(ai.requests, "get", lambda *a, **k: type("R", (), {"ok": False, "status_code": 404})())
    assert ai.check_gemini_model() is False
    assert "unavailable (HTTP 404)" in caplog.text


# ── API ──────────────────────────────────────────────────────────────────

def test_review_without_sentiment_is_classified_and_tagged(auth_header, gemini):
    gemini.reply = llm_reply("neutral", cleanliness="positive", wifi="negative")
    review = new_review(auth_header)
    assert (review["sentiment"], review["label_source"]) == ("neutral", "llm")
    assert review["aspects"] == {"cleanliness": "positive", "wifi": "negative"}


def test_client_supplied_neutral_is_kept_as_human_label(auth_header, gemini):
    review = new_review(auth_header, sentiment="neutral")
    assert (review["sentiment"], review["label_source"]) == ("neutral", "human")
    assert gemini == []  # no LLM call for a human-labelled review


def test_editing_sentiment_or_unflagging_marks_label_human(auth_header, gemini):
    review = new_review(auth_header)
    edited = client.put(f"/api/reviews/{review['id']}", json={"sentiment": "negative"}, headers=auth_header).json()
    assert edited["label_source"] == "human"

    review = new_review(auth_header)
    flagged = client.patch(f"/api/reviews/{review['id']}/flag?is_unflagged=true", headers=auth_header).json()
    assert flagged["label_source"] == "human"


def test_reply_endpoint_reports_template_fallback(auth_header):
    review = new_review(auth_header, sentiment="positive")
    res = client.post(f"/api/reviews/{review['id']}/generate-reply", headers=auth_header).json()
    assert res["source"] == "template" and res["reply"]


def test_analyze_endpoint_no_longer_claims_a_model_it_did_not_use(auth_header):
    res = client.post("/api/ai/analyze-review", json={"text": "Lovely stay"}, headers=auth_header).json()
    assert res["label_source"] == "heuristic" and res["reply_source"] == "template"
    assert res["model_used"] is None


# ── AI status (fallback-mode notice) ─────────────────────────────────────

def test_status_reports_fallback_when_gemini_is_not_configured(auth_header):
    status = client.get("/api/ai/status", headers=auth_header).json()
    assert status == {"classifier": "heuristic", "classifier_name": "keyword rules", "replies": "template"}


def test_status_flips_to_fallback_when_gemini_starts_failing(auth_header, gemini, monkeypatch):
    ai.analyze_review_sentiment_and_spam("Lovely stay", "Asha")  # a successful call marks Gemini healthy
    assert client.get("/api/ai/status", headers=auth_header).json()["classifier"] == "llm"

    def rate_limited(*args, **kwargs):
        raise ai.requests.HTTPError("429 Too Many Requests")
    monkeypatch.setattr(ai.requests, "post", rate_limited)
    ai.analyze_review_sentiment_and_spam("Lovely stay", "Asha")
    assert client.get("/api/ai/status", headers=auth_header).json()["classifier"] == "heuristic"


def test_status_requires_login():
    assert client.get("/api/ai/status").status_code in (401, 403)


def test_reply_prompt_forbids_claiming_unconfirmed_actions(gemini):
    gemini.reply = "Dear Neha, thank you for staying with us."
    draft = ai.generate_management_response("Neha", "Cedar Homestay", 2, "The geyser never heated up.")
    assert draft.source == "llm"
    prompt = gemini[-1]["json"]["contents"][0]["parts"][0]["text"]
    assert "Never claim that anything has already been fixed" in prompt
    assert "using only details from the review" in prompt


def test_guest_names_never_reach_gemini(gemini):
    name = "Priyanka Venkataraman"
    ai.analyze_review_sentiment_and_spam("The geyser never heated up.", name)
    ai.classify_reviews([("Lovely stay.", name), ("Cold room.", name)])
    gemini.reply = "Dear [[GUEST]], thank you for staying with us."
    draft = ai.generate_management_response(name, "Cedar Homestay", 2, "The geyser never heated up.")
    prompts = [json.dumps(call["json"]) for call in gemini]
    assert len(prompts) == 3 and not any(name in p or "Priyanka" in p for p in prompts)
    assert draft.text == f"Dear {name}, thank you for staying with us."  # the name is put back locally
