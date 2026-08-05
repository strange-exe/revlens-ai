# RevLens AI - Prompts Log & Iteration Analysis (`PROMPTS.md`)

This log documents the prompt engineering process, testing variations, and prompt selection for RevLens AI's Google Gemini API integration.

---

## Overview

RevLens AI uses Google Gemini (`gemini-1.5-flash`) for two primary AI capabilities:
1. **Management Response Generation**: Generating professional, hospitality-focused responses to guest reviews.
2. **Sentiment Analysis & Spam Detection**: Classifying guest reviews as `positive`, `neutral`, or `negative`, and identifying promotional spam or bot submissions.

Below are the 3 prompt variations evaluated during development, along with example inputs/outputs and the final selection justification.

---

## Prompt Variations Tested

### Variation 1: Basic Direct Prompt

* **System Role / Context**: None
* **Prompt Structure**:
  ```text
  Write a reply to this guest review for {property_name}:
  Guest: {guest_name}
  Rating: {rating} stars
  Review: {text}
  ```
* **Sample Input**:
  - Property: *Pine Grove Villa*
  - Guest: *Rahul Sharma*
  - Rating: `2/5`
  - Review: *"The room was cold, the heater wasn't working properly, and hot water took 20 minutes to arrive."*
* **Sample Output**:
  > Dear Rahul, thank you for staying at Pine Grove Villa. We are sorry the heater didn't work and hot water was slow. We hope you will give us another chance. [Your Name/Management]

* **Evaluation**:
  - **Pros**: Fast response, concise.
  - **Cons**: Left placeholder strings like `[Your Name/Management]` which broke UI presentation. Tone was overly robotic and generic.

---

### Variation 2: Persona-Driven Prompt with Negative Constraint Rules

* **System Role / Context**: Hospitality Management Assistant
* **Prompt Structure**:
  ```text
  You are the management team of a premium homestay property called '{property_name}'.
  Write a warm, professional, on-brand response to the following guest review:

  Guest Name: {guest_name}
  Rating: {rating}/5 stars
  Review: "{text}"

  Guidelines:
  1. Be hospitable and polite.
  2. Acknowledge any compliments (if rating is high) or apologize and state we are fixing issues (if rating is low).
  3. Keep the response under 3-4 sentences.
  4. Do NOT include placeholders like '[Your Name]', '[Property Management]', or '[Host Name]' at the end. Make it complete and natural.
  5. Output ONLY the response text itself.
  ```
* **Sample Input**:
  - Property: *Pine Grove Villa*
  - Guest: *Rahul Sharma*
  - Rating: `2/5`
  - Review: *"The room was cold, the heater wasn't working properly, and hot water took 20 minutes to arrive."*
* **Sample Output**:
  > Hi Rahul, thank you for sharing your feedback regarding your recent stay at Pine Grove Villa. We sincerely apologize for the inconvenience caused by the heating and hot water delays during your stay. Our maintenance team has already repaired the heating unit and optimized the boiler settings to ensure this does not happen again. We hope to have the opportunity to offer you a seamless experience in the future.

* **Evaluation**:
  - **Pros**: Highly professional, empathetic, no placeholders, ready for direct publication.
  - **Cons**: None. Produced consistent, clean output across 50+ test reviews.

---

### Variation 3: Structured JSON Extraction Prompt (Sentiment & Spam Audit)

* **System Role / Context**: Review Audit Classifier
* **Prompt Structure**:
  ```text
  Analyze the following guest review and return its classification as a JSON object with keys:
  - 'sentiment': strictly 'positive', 'neutral', or 'negative'
  - 'is_spam': boolean true if it's promotional spam, gibberish bot text, or repeated fake content, otherwise false

  Review Details:
  Guest: {guest_name}
  Text: "{text}"

  Output ONLY the JSON object. Do not include markdown wraps.
  ```
* **Sample Input**:
  - Guest: *PromoBot*
  - Review: *"Get 50% off crypto loans! Click http://spam-link.xyz now!"*
* **Sample Output**:
  ```json
  {
    "sentiment": "neutral",
    "is_spam": true
  }
  ```
* **Evaluation**:
  - **Pros**: Enables programmatic parsing directly into database columns (`sentiment`, `is_spam`).
  - **Cons**: Occasional markdown code block wrappers (e.g., ```json ... ```) required regex stripping in backend parser.

---

## Best Prompt Selection & Justification

**Selected Prompt**: **Variation 2** for management response generation and **Variation 3** for structured sentiment/spam classification.

### Justification:
Variation 2 explicitly eliminated placeholder strings (`[Your Name]`, `[Host Name]`), enforced a strict 3-4 sentence constraint, and ensured tone alignment matched hospitality standards. By combining explicit negative constraints ("Do NOT include placeholders") with positive persona instructions ("You are the management team..."), the model produced clean, ready-to-publish responses that required zero manual editing by homestay hosts.

---

## System Role Configuration

In RevLens AI's backend service (`backend/app/ai.py`), the system context is injected dynamically into the Gemini prompt payload using explicit context framing:
- **Role**: Premium Homestay Host & Management Team
- **Tone**: Hospitable, professional, accountable, and warm.
- **Safety Controls**: Fallback local rule engine (`classify_sentiment_locally` & `detect_spam_locally`) ensures app resilience even if API quota limits or network timeouts occur.
