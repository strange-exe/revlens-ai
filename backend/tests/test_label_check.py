""""Is this label right?": which labels ask for a check, and how a host's confirmation or correction is stored."""
import uuid

import pytest
from fastapi.testclient import TestClient

from app import ai, models
from app.database import SessionLocal
from app.main import app

client = TestClient(app)


class ConfidentModel:
    """Fake fine-tuned model: the confidence comes from the review text, so one test can make both kinds."""
    name = "fake"

    def predict(self, texts):
        return [{"sentiment": "negative", "is_spam": False, "aspects": {"wifi": "negative"},
                 "confidence": 0.55 if "unsure" in t else 0.97} for t in texts]


@pytest.fixture
def host(monkeypatch):
    monkeypatch.setattr(ai, "_classifier", ConfidentModel())
    res = client.post("/api/auth/register", json={
        "email": f"check-{uuid.uuid4().hex[:8]}@example.com", "password": "a-long-test-password", "full_name": "Host"})
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    pid = client.post("/api/properties", json={"name": "Pine Stay", "location": "Manali"}, headers=headers).json()["id"]
    return headers, pid


def add(headers, pid, text):
    res = client.post("/api/reviews", headers=headers, json={
        "property_id": pid, "property_name": "x", "guest_name": "Asha", "rating": 3, "text": text, "date": "2026-10-01"})
    assert res.status_code == 201, res.text
    return res.json()


def test_only_unsure_model_labels_and_keyword_guesses_ask_for_a_check(host, monkeypatch):
    headers, pid = host
    sure, unsure = add(headers, pid, "WiFi dropped."), add(headers, pid, "unsure WiFi dropped.")
    assert (sure["label_confidence"], sure["needs_check"]) == (0.97, False)
    assert (unsure["label_confidence"], unsure["needs_check"]) == (0.55, True)
    monkeypatch.setattr(ai, "_classifier", None)   # no model, no Gemini key in tests: keyword rules answer
    guess = add(headers, pid, "Terrible and dirty.")
    assert guess["label_source"] == "heuristic" and guess["needs_check"] is True
    listed = {r["id"]: r["needs_check"] for r in client.get(f"/api/reviews?property_id={pid}", headers=headers).json()}
    assert listed == {sure["id"]: False, unsure["id"]: True, guess["id"]: True}


def test_correction_is_stored_as_a_human_label_and_keeps_what_the_model_said(host):
    headers, pid = host
    review = add(headers, pid, "unsure WiFi dropped but breakfast was lovely.")
    res = client.put(f"/api/reviews/{review['id']}/labels", headers=headers,
                     json={"sentiment": "neutral", "aspects": {"wifi": "negative", "food": "positive"}})
    assert res.status_code == 200, res.text
    body = res.json()
    assert (body["sentiment"], body["aspects"], body["label_source"]) == (
        "neutral", {"wifi": "negative", "food": "positive"}, "human")
    assert body["label_checked_at"] and body["needs_check"] is False

    # A second correction keeps the ORIGINAL machine label, not the host's first answer
    client.put(f"/api/reviews/{review['id']}/labels", headers=headers, json={"sentiment": "positive", "aspects": {}})
    with SessionLocal() as db:
        stored = db.get(models.Review, review["id"])
        assert stored.machine_label == {"sentiment": "negative", "is_spam": False, "aspects": {"wifi": "negative"},
                                        "source": "model", "confidence": 0.55}
        assert (stored.sentiment, stored.aspects) == ("positive", {})


def test_confirming_keeps_the_labels_and_stops_asking(host):
    headers, pid = host
    review = add(headers, pid, "unsure WiFi dropped.")
    res = client.put(f"/api/reviews/{review['id']}/labels", headers=headers,
                     json={"sentiment": review["sentiment"], "aspects": review["aspects"]})
    assert res.json()["needs_check"] is False and res.json()["aspects"] == {"wifi": "negative"}


@pytest.mark.parametrize("payload", [
    {"sentiment": "great", "aspects": {}},
    {"sentiment": "neutral", "aspects": {"wifi": "maybe"}},
    {"sentiment": "neutral", "aspects": {"parking": "negative"}},
])
def test_invalid_labels_are_rejected(host, payload):
    headers, pid = host
    review = add(headers, pid, "unsure WiFi dropped.")
    assert client.put(f"/api/reviews/{review['id']}/labels", headers=headers, json=payload).status_code == 422


def test_another_hosts_review_cannot_be_checked(host):
    headers, pid = host
    review = add(headers, pid, "unsure WiFi dropped.")
    other = client.post("/api/auth/register", json={
        "email": f"other-{uuid.uuid4().hex[:8]}@example.com", "password": "a-long-test-password"}).json()
    res = client.put(f"/api/reviews/{review['id']}/labels", headers={"Authorization": f"Bearer {other['access_token']}"},
                     json={"sentiment": "positive", "aspects": {}})
    assert res.status_code == 403


def test_shared_sample_reviews_are_read_only(host):
    """Regression: sample properties have no owner, and the old check let ANY user edit, flag or delete
    the sample reviews that every user sees."""
    headers, _ = host
    with SessionLocal() as db:
        prop = models.Property(name="Sample Villa", location="Goa", user_id=None)
        db.add(prop)
        db.commit()
        sample = models.Review(property_id=prop.id, property_name=prop.name, guest_name="Demo", rating=5,
                               text="Sample review", date="2026-01-01", sentiment="positive", label_source="human")
        db.add(sample)
        db.commit()
        rid = sample.id
    assert client.put(f"/api/reviews/{rid}", headers=headers, json={"text": "vandalised"}).status_code == 403
    assert client.patch(f"/api/reviews/{rid}/flag?is_spam=true", headers=headers).status_code == 403
    assert client.put(f"/api/reviews/{rid}/labels", headers=headers,
                      json={"sentiment": "negative", "aspects": {}}).status_code == 403
    assert client.delete(f"/api/reviews/{rid}", headers=headers).status_code == 403
    with SessionLocal() as db:
        assert db.get(models.Review, rid).text == "Sample review"


def test_single_review_takes_the_property_name_from_the_database(host):
    """Imports already did; a single add used to store whatever property name the browser sent."""
    headers, pid = host
    assert add(headers, pid, "WiFi dropped.")["property_name"] == "Pine Stay"   # add() sends "x"
