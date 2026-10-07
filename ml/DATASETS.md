# Datasets, labels and their limits

Verified on 2026-10-04. Re-check licences before any use outside coursework.

## Primary: `jniimi/tripadvisor-review-rating` (Hugging Face)

- 201,295 English TripAdvisor hotel reviews (title + text), each with the guest's **overall** rating and
  sub-ratings for **cleanliness, value, location, rooms, sleep quality** (1–5, no missing values).
- Source: https://huggingface.co/datasets/jniimi/tripadvisor-review-rating, derived from the Li et al. (2013)
  TripAdvisor crawl (https://www.cs.cmu.edu/~jiweil/html/hotel-review.html).

### Licence: academic use only, do not redistribute
The Hugging Face page is tagged `apache-2.0`, but the text is scraped TripAdvisor content. The upstream crawl
states **no licence**, and the dataset README tells users to respect the original source's usage policy. So:

- OK: coursework/research training and evaluation.
- Never commit or publish the raw or processed data (`ml/.gitignore` excludes `data/`).
- Don't ship a model trained on it in a commercial product, and don't describe the data as Apache-licensed.
- Store the trained model privately (see README: `MODEL_URL` should point to private storage).
- **How RevLens complies:** RevLens is free and non-commercial, and the trained model stays in a private repo.
  Charging for RevLens would need a model retrained only on data licensed for that use (planned: reviews and
  corrections from hosts who opt in).

### Verified quirks
- **`hotel_id` is unique per review** (201,295 ids for 201,295 rows), so despite its name it is a review id.
  There is no real hotel identifier, so the split is **grouped by author (`user_id`, 167,027 authors)**.
  Hotel-level leakage (two reviews of the same hotel in train and test) can't be ruled out.
- 18 case-insensitive duplicate texts are removed **before** splitting.
- Rating distribution: 1★ 8,045 · 2★ 10,786 · 3★ 28,216 · 4★ 67,732 · 5★ 86,516 (heavily positive, so we use
  macro-F1 and class weights).

## How each label is derived

| Target | Train labels | Test ("gold") labels | Independent of the LLMs? |
|---|---|---|---|
| Overall sentiment | star rating: 1–2 neg, 3 neutral, 4–5 pos | same | **Yes** |
| Aspect polarity: cleanliness, location, value, amenities (= `rooms`) | teacher LLM | sub-rating: 1–2 neg, 4–5 pos, 3 = excluded | **Yes**, but only polarity, not whether it is mentioned |
| Aspect: wifi, host | teacher LLM | teacher LLM | **No.** Reported only as "agreement with teacher" |
| Spam | synthetic templates (train set) + real reviews assumed clean | synthetic templates **not used in training** + real reviews | Partly: synthetic data, unseen phrasings |

### Known validity limits (state these alongside any number)
1. **Star rating ≠ text sentiment.** A 3★ review can read positive. The worst-errors files show how often this happens.
2. **Aspect sub-ratings exist even when the text never mentions the aspect.** So "mention rate" against ratings
   is a lower bound, and only "polarity accuracy when mentioned" compares like with like.
3. **Spam scores measure synthetic spam.** Real reviews are *assumed* non-spam (TripAdvisor moderates). This says
   nothing about real-world deceptive reviews (see the Ott corpus below).
4. **Domain shift:** large hotels in US/EU cities vs Indian homestays. Expect lower accuracy on RevLens data.

## Optional: Ott et al. Deceptive Opinion Spam corpus
1,600 reviews of 20 Chicago hotels (truthful vs deceptive, written via Mechanical Turk). Licence on Kaggle:
CC BY-NC-SA 4.0. Needs a Kaggle login, so it isn't downloaded automatically. Deceptive reviews are fluent fake
opinions, a different problem from RevLens's promotional/gibberish spam. Use it only as an extra stress test.

## Rejected
- **HotelRec**: academic-only licence, ~50M reviews; too restrictive for a deployed model.
- **515K Booking.com (Kaggle)**: "CC0" is the uploader's claim over Booking.com-owned scraped content.
- **SemEval ABSA hotels**: Arabic only.
- **Inside Airbnb**: CC BY 4.0 and homestay-relevant, but has no per-review ratings. A good future unlabelled pool.
