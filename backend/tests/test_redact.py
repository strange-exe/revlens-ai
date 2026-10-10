"""Names and contact details in review text never reach Gemini, and come back in what the host sees."""
import json
from types import SimpleNamespace

import pytest

from app import ai
from app.redact import Redactor

REVIEW = ("Olivia was lovely and Mr Rose helped with the luggage. Breakfast was cold. "
          "Call me on +91 98765 43210 or asha.rao@example.com. Spam check: http://example.com/Offer")
PRIVATE = ["Olivia", "Rose", "98765", "asha.rao@example.com", "Asha", "Rao"]


def sent_text(call) -> str:
    return json.dumps(call["json"])


def test_scrub_hides_names_and_contacts_and_restore_is_exact():
    r = Redactor(["Asha Rao"])
    scrubbed = r.scrub(REVIEW + " Asha Rao says hi.")
    for value in PRIVATE:
        assert value not in scrubbed
    assert "Breakfast was cold" in scrubbed            # everyday words stay
    assert "Mr [[NAME" in scrubbed                     # a title stays, the name after it goes
    assert "http://example.com/Offer" in scrubbed      # links stay: spam detection needs them
    assert r.restore(scrubbed) == REVIEW + " Asha Rao says hi."


def test_same_name_gets_the_same_placeholder_across_texts():
    r = Redactor()
    a, b = r.scrub("Ravi was helpful."), r.scrub("Thanks Ravi!")
    assert a.split()[0] == b.split()[1].rstrip("!") and "Ravi" not in a + b


def test_single_classification_sends_no_names(gemini):
    gemini.reply = json.dumps({"sentiment": "negative", "is_spam": False,
                               "aspects": {n: "not_mentioned" for n in ai.ASPECT_GUIDE} | {"food": "negative"}})
    result = ai.analyze_review_sentiment_and_spam(REVIEW + " Signed, Asha Rao", "Asha Rao")
    assert result.source == "llm" and result.aspects == {"food": "negative"}
    for value in PRIVATE:
        assert value not in sent_text(gemini[0])
    assert "placeholders" in sent_text(gemini[0])


def test_batch_import_sends_no_names(gemini):
    gemini.reply = json.dumps([{"index": i, "sentiment": "neutral", "is_spam": False,
                                "aspects": {n: "not_mentioned" for n in ai.ASPECT_GUIDE}} for i in range(2)])
    ai.classify_reviews([(REVIEW, "Asha Rao"), ("Rakesh bhaiya cooked great parathas.", "Meera")])
    sent = sent_text(gemini[0])
    for value in PRIVATE + ["Rakesh", "Meera"]:
        assert value not in sent
    assert "parathas" in sent


def test_reply_draft_names_are_hidden_from_gemini_and_restored_for_the_host(gemini):
    # The fake model mentions every placeholder it saw (Olivia, Rose, Sharma) plus one it made up ([[NAME9]]):
    # real ones come back as names, the made-up one is dropped
    gemini.reply = "Dear [[GUEST]], thanks! [[NAME1]] [[NAME2]] [[NAME3]] [[NAME9]]."
    draft = ai.generate_management_response("Asha Rao", "Sharma Homestay", 3, "Olivia was lovely. " + REVIEW)
    sent = sent_text(gemini[0])
    for value in PRIVATE + ["Sharma"]:
        assert value not in sent
    assert draft.source == "llm" and draft.text.startswith("Dear Asha Rao, thanks! ")
    assert "[[" not in draft.text and draft.text.endswith(".") and not draft.text.endswith(" .")
    assert {"Olivia", "Rose", "Sharma"} <= set(draft.text.rstrip(".").split())


def test_assistant_hides_names_in_reviews_and_question_and_restores_them(gemini):
    reviews = [SimpleNamespace(id=1, property_name="Sharma Homestay", guest_name="Asha Rao", rating=5,
                               sentiment="positive", date="2026-10-01", text="Olivia made the best chai."),
               SimpleNamespace(id=2, property_name="Sharma Homestay", guest_name="Karan", rating=2,
                               sentiment="negative", date="2026-10-02", text="Olivia was rude to Karan.")]
    same_order = Redactor([r.guest_name for r in reviews])   # facts (property names) are scrubbed first
    same_order.scrub("Sharma Homestay")
    olivia = same_order.scrub("Olivia")
    gemini.reply = json.dumps({"answer": f"Guests mention {olivia} in both reviews.", "answerable": True,
                               "citations": [1, 2]})
    result = ai.answer_question("What do guests say about Olivia?", reviews)
    sent = sent_text(gemini[0])
    for value in ["Olivia", "Sharma", "Asha", "Karan"]:
        assert value not in sent
    assert result.answer == "Guests mention Olivia in both reviews." and result.citations == [1, 2]


@pytest.mark.parametrize("text", ["Spotless room. Lovely host. Great location.", "The WiFi kept dropping."])
def test_ordinary_reviews_go_through_unchanged(text):
    assert Redactor().scrub(text) == text
