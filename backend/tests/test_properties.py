"""Properties store only what the host entered: no invented default price."""
import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def register() -> dict:
    res = client.post("/api/auth/register", json={
        "email": f"host-{uuid.uuid4().hex[:8]}@example.com", "password": "a-long-test-password", "full_name": "Host"})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_property_without_price_has_no_price():
    res = client.post("/api/properties", json={"name": "No Price Stay", "location": "Goa"}, headers=register())
    assert res.status_code == 201, res.text
    assert res.json()["price"] is None


def test_property_keeps_the_price_the_host_entered():
    res = client.post("/api/properties", json={"name": "Priced Stay", "location": "Goa", "price": "₹4,200/night"},
                      headers=register())
    assert res.status_code == 201, res.text
    assert res.json()["price"] == "₹4,200/night"
