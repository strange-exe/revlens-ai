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

## Planned: hosts' own imported reviews (licence plan, option 2). Checked 2026-10-10, not legal advice

Before any review a host imports is used to test or train a model, these are the findings from the platforms' and
India's own documents (fetched 2026-10-10). Points marked *uncertain* need a lawyer.

**Who owns a review.** Every platform leaves the review with the guest who wrote it and takes a licence for itself;
none licenses the host.
- Airbnb Terms of Service ([2908](https://www.airbnb.com/help/article/2908), updated 5 Feb 2026): §9, a member is
  "solely responsible for all Content that you provide" and grants Airbnb "a non-exclusive, worldwide,
  royalty-free, sub-licensable and transferable license". §11.1: "Do not use, copy, display, mirror or frame the
  Airbnb Platform, any Content, any Airbnb branding," (the sentence ends: without Airbnb's consent), and "You may
  only use another Member's personal information as necessary to facilitate a transaction". *Uncertain* whether
  that covers a host copying their own listing's reviews by hand.
- Booking.com customer terms ([terms](https://www.booking.com/content/terms.en-gb.html), updated 15 Sep 2025):
  the reviewer confirms they own the review's IP and licenses Booking.com; automated copying/scraping is barred
  without written permission. The accommodation-partner terms (General Delivery Terms) are behind the extranet
  login and were *not checked*: a host must read their own.
- Google Terms of Service ([terms](https://policies.google.com/terms)): "Your content remains yours"; Google Maps
  Additional Terms ([terms_maps](https://www.google.com/help/terms_maps/), 27 Jan 2026) §2.3 bars bulk downloads.

**APIs are worse than copy-paste for training.** Google Business Profile API policies
([policies](https://developers.google.com/my-business/content/policies), 28 Aug 2026): "You cannot pre-fetch,
cache, index, or store any content", except temporarily for up to 30 days. Google Maps Platform Terms
([terms](https://cloud.google.com/maps-platform/terms), 26 Aug 2026) §3.2.3(c)(vii) bar using Maps content to
"train, test, validate or fine-tune" models. So the part B Google sync could never feed a training set.

**Gemini free tier** ([Gemini API terms](https://ai.google.dev/gemini-api/terms), effective 23 Mar 2026, verified):
"Do not submit sensitive, confidential, or personal information to the Unpaid Services", and "human reviewers may
read, annotate, and process" inputs and outputs. Guest names are already kept out of prompts, but review text can
contain names. Users must be 18+. "You may not use the Services to develop models that compete with the Services":
*uncertain* whether a small review classifier counts; there is no general ban on training with outputs.

**India: DPDP Act 2023 and DPDP Rules 2025** (Rules notified 13 Nov 2025, G.S.R. 846(E)). The Rules give an
"eighteen-month period for phased compliance" ([PIB note](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf), verified).
Per the commencement notification G.S.R. 843(E) (could not be fetched here; read by a research pass), the Data
Fiduciary duties (§§3–17) apply from about 13 May 2027; IT Act §43A and the 2011 SPDI Rules arguably apply until
then (*not checked*).
- **Role.** For training its own model, RevLens decides the purpose, so it is a Data Fiduciary (§2(i)); guests are
  the Data Principals, and a host's consent is not the guest's.
- **Public data.** §3(c)(ii) excludes personal data "made or caused to be made publicly available" by the Data
  Principal. It plausibly covers a review the guest posted publicly; *uncertain* for new uses such as training,
  and for reviews the guest later deletes. It never covers private feedback or contact details.
- **Exemptions.** The startup exemption (§17(3)) needs a government notification and a registered company/LLP,
  not an individual. Research (§17(2)(b)) requires no decisions about individuals plus the Second Schedule
  standards; *uncertain* whether improving a product model counts.
- **Duties to plan for** (for hosts' own data, from 2027): itemised notice and withdrawal as easy as consent
  (§§5–6, Rule 3, already the shape of the Settings opt-in), security safeguards and logs kept a year (Rule 6),
  breach notice to users "without delay" and to the Board within 72 hours (Rule 7), erasure on withdrawal,
  a published contact, and grievance replies within 90 days (Rule 14).

**Rules for option 2 that follow from this**
1. Never build a training or test set from an API (Google Business Profile, Places): their terms forbid it.
2. Import stays manual and host-driven: no scrapers or browser extensions on Airbnb, Booking.com or Google.
3. Only reviews the guest posted publicly; drop a review from every dataset when the host deletes it or
   withdraws consent, and record which reviews each model version used.
4. Train on scrubbed text: guest names, contacts and booking ids removed from the text itself, not only the name field.
5. Keep personal data out of Gemini's free tier. Done 2026-10-10: `backend/app/redact.py` replaces names, emails
   and phone numbers in review text with placeholders before every Gemini call and puts them back in replies.
   Its everyday-word list (`backend/app/data/common_words.txt`) is built from the TripAdvisor training split by
   `backend/scripts/build_common_words.py`: single words that reviewers write in lower case, no review text.
6. Airbnb reviews carry the most contractual risk (§11.1): leave them out of training until that is cleared.
7. A lawyer should confirm: the Airbnb and Booking.com copying clauses, the guest's copyright, §3(c)(ii) for
   training, RevLens's role, and the IT Act §43A duties that apply today.

## Rejected
- **HotelRec**: academic-only licence, ~50M reviews; too restrictive for a deployed model.
- **515K Booking.com (Kaggle)**: "CC0" is the uploader's claim over Booking.com-owned scraped content.
- **SemEval ABSA hotels**: Arabic only.
- **Inside Airbnb**: CC BY 4.0 and homestay-relevant, but has no per-review ratings. A good future unlabelled pool.
