"""Gemini calls retry once on a stalled connection or a transient 5xx, and never on quota or client errors."""
import pytest
import requests

from app import ai


class Resp:
    def __init__(self, status=200):
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} error")

    def json(self):
        return {"ok": True}


@pytest.fixture
def scripted(monkeypatch):
    """Make requests.post play back `outcomes` in order (a Resp, or an exception to raise); record the deadlines."""
    monkeypatch.setattr(ai, "GEMINI_API_KEY", "AIza-test")
    monkeypatch.setattr(ai.time, "sleep", lambda s: None)
    deadlines, outcomes = [], []

    def post(url, json=None, headers=None, timeout=None):
        deadlines.append(timeout)
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(ai.requests, "post", post)
    return deadlines, outcomes


@pytest.mark.parametrize("first", [requests.ReadTimeout("stalled"), requests.ConnectionError("reset"), Resp(503)])
def test_transient_failure_is_retried_once_with_the_full_deadline(scripted, first):
    deadlines, outcomes = scripted
    outcomes += [first, Resp(200)]
    assert ai._post_to_gemini({}, timeout=10) == {"ok": True}
    assert deadlines == [6, 10]
    assert ai.gemini_healthy is True


@pytest.mark.parametrize("status", [429, 400, 403])
def test_quota_and_client_errors_are_not_retried(scripted, status):
    deadlines, outcomes = scripted
    outcomes += [Resp(status)]
    with pytest.raises(requests.HTTPError):
        ai._post_to_gemini({}, timeout=10)
    assert len(deadlines) == 1
    assert ai.gemini_healthy is False


@pytest.mark.parametrize("second", [requests.ReadTimeout("stalled again"), Resp(503)])
def test_two_failures_give_up_and_mark_gemini_unhealthy(scripted, second):
    deadlines, outcomes = scripted
    outcomes += [requests.ReadTimeout("stalled"), second]
    with pytest.raises(requests.RequestException):
        ai._post_to_gemini({}, timeout=10)
    assert len(deadlines) == 2
    assert ai.gemini_healthy is False
