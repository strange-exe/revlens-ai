"""Training-data consent (opt-in, default off) and account deletion."""
import secrets

from fastapi.testclient import TestClient

from app import models
from app.database import SessionLocal
from app.main import TRAINING_CONSENT_VERSION, app

client = TestClient(app)


def register():
    email = f"acct-{secrets.token_hex(4)}@example.com"
    res = client.post("/api/auth/register", json={"email": email, "password": "a-long-test-password", "full_name": "Host"})
    assert res.status_code == 201, res.text
    return email, {"Authorization": f"Bearer {res.json()['access_token']}"}


def add_property_with_review(headers, text="Lovely stay."):
    pid = client.post("/api/properties", json={"name": "Hill House", "location": "Shimla"}, headers=headers).json()["id"]
    res = client.post("/api/reviews", headers=headers, json={"property_id": pid, "property_name": "Hill House",
        "guest_name": "Asha", "rating": 5, "text": text, "date": "2026-10-07", "sentiment": "positive"})
    assert res.status_code == 201, res.text
    return pid, res.json()["id"]


def test_training_consent_is_off_by_default_and_can_be_given_and_withdrawn():
    _, headers = register()
    me = client.get("/api/auth/me", headers=headers).json()
    assert me["training_consent_at"] is None and me["training_consent_version"] is None

    given = client.put("/api/auth/me/training-consent", json={"consent": True}, headers=headers).json()
    assert given["training_consent_at"] and given["training_consent_version"] == TRAINING_CONSENT_VERSION
    assert client.get("/api/auth/me", headers=headers).json()["training_consent_at"] == given["training_consent_at"]

    withdrawn = client.put("/api/auth/me/training-consent", json={"consent": False}, headers=headers).json()
    assert withdrawn["training_consent_at"] is None and withdrawn["training_consent_version"] is None


def test_consent_requires_login():
    assert client.put("/api/auth/me/training-consent", json={"consent": True}).status_code == 401


def test_delete_requires_the_account_email():
    email, headers = register()
    pid, _ = add_property_with_review(headers)
    res = client.request("DELETE", "/api/auth/me", json={"confirm_email": "someone-else@example.com"}, headers=headers)
    assert res.status_code == 400
    assert client.get("/api/auth/me", headers=headers).status_code == 200  # nothing deleted


def test_delete_removes_only_this_account_and_its_data():
    email, headers = register()
    pid, rid = add_property_with_review(headers)
    _, other_headers = register()
    other_pid, other_rid = add_property_with_review(other_headers, "Other host's review.")
    with SessionLocal() as db:
        demo_reviews = db.query(models.Review).join(models.Property, models.Review.property_id == models.Property.id) \
            .filter(models.Property.user_id.is_(None)).count()

    res = client.request("DELETE", "/api/auth/me", json={"confirm_email": f"  {email.upper()} "}, headers=headers)
    assert res.status_code == 200 and res.json() == {"deleted": True, "properties": 1, "reviews": 1}
    assert client.get("/api/auth/me", headers=headers).status_code == 401  # old token no longer works

    with SessionLocal() as db:
        assert db.get(models.Property, pid) is None and db.get(models.Review, rid) is None
        assert db.get(models.Property, other_pid) and db.get(models.Review, other_rid)
        assert db.query(models.Review).join(models.Property, models.Review.property_id == models.Property.id) \
            .filter(models.Property.user_id.is_(None)).count() == demo_reviews
