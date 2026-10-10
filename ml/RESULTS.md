# Results: fine-tuned review classifier

What was trained, how it scores, where it fails, and what changed because of the failures.
Read [DATASETS.md](DATASETS.md) first: every number below inherits its label limits.

## Setup

- **Data:** 201,295 English TripAdvisor hotel reviews (`jniimi/tripadvisor-review-rating`), academic use only.
- **Gold sentiment:** the guest's own star rating (1-2 negative, 3 neutral, 4-5 positive). Independent of every model.
- **Split:** 60/20/20, grouped by author so no reviewer appears in two splits, stratified by sentiment.
  Test = 40,529 reviews, frozen before any model was trained. A 2,100-review stratified sample of test is used
  for slower comparisons (teacher LLM, error files).
- **Models:** DeBERTa-v3 xsmall / small / base with sentiment, spam and six aspect heads (the aspect list has since grown to seven with `food`; these runs predate it, see the
  food retrain below), one seed (13).
  Baselines: keyword heuristic (the old production fallback) and TF-IDF + logistic regression.
- **Deployed:** `deberta-v3-xsmall-s13-food2-u8` (seven aspects), int8 ONNX with uint8 weights (see the CPU bug below). xsmall is the only size that fits
  Render's free 512 MB instance (~427 MB peak RAM for the six-aspect model).

## Scores on the full test split (40,529 reviews)

| Model | Sentiment macro-F1 | Accuracy | Neutral F1 | Spam F1 | Spam false-positive rate |
|---|---|---|---|---|---|
| Keyword heuristic | 0.514 | 0.776 | 0.219 | 0.196 | 0.6% |
| TF-IDF + LR | 0.767 | 0.862 | 0.599 | 0.869 | 0.0% |
| DeBERTa-v3 base | 0.818 | 0.895 | 0.673 | 0.966 | 0.0% |
| DeBERTa-v3 small | 0.813 | 0.891 | 0.668 | 0.964 | 0.0% |
| **DeBERTa-v3 xsmall (chosen)** | **0.801** | 0.878 | 0.648 | 0.970 | 0.0% |

- The fine-tuned model beats the old keyword fallback by 0.29 macro-F1 and the strong TF-IDF baseline by 0.03.
- Base is only 0.017 better than xsmall but ~4x larger: not worth it on a 512 MB instance.
- Neutral (3 stars) is the weak class for every model; see the error analysis for why.
- Spam scores measure **synthetic** spam built from templates held out of training. They say nothing about real
  deceptive reviews.

On the 2,100-review sample, the teacher LLM (Qwen3-8B, used to label aspects for training) scores 0.698 macro-F1
on sentiment: the fine-tuned students beat their teacher on the task that has independent gold labels.

## Error analysis: the 20 worst sentiment errors (xsmall, six aspects)

The 20 most confident wrong predictions on the sample (`errors_deberta-v3-xsmall-s13.md` in the results bundle).
Each was read in full, including the part beyond the model's 256-token input.

| Cause | Count | Is the model wrong? |
|---|---|---|
| **Star rating contradicts the text.** E.g. a 1★ review reading "Give her a raise... I will come back", a 5★ review ending "will not return", 3★ reviews that are pure praise or a list of complaints. | 9 | Mostly no: the gold label is the noisy part. |
| **Decisive content after the 256-token cut-off.** E.g. "As for the downside of my stay, it was construction" arrives after 383 tokens of praise. | 4 | Yes, and fixable (next section). |
| **Lukewarm wording on 4★ reviews** ("An Okay Stay", "Decent hotel", praise followed by a list of downsides) predicted neutral. | 3 | Borderline: the text reads neutral. |
| **Mixed reviews ending on a positive note, sarcasm, rhetorical titles** ("Historic? No, dated"; "On a positive note, the location is fantastic"). | 4 | Yes: a real limit of the model. |

Takeaways:
- Almost half of the worst "errors" are label noise from using star ratings as gold, so the true accuracy on
  text sentiment is somewhat higher than the table shows, especially for neutral.
- The fixable failure was truncation, which led to the change below.

## Change made from the analysis: keep the end of long reviews

19% of reviews are longer than the model's 256-token input. Production kept only the first 256 tokens, so a
verdict at the end was never seen. It now keeps the first 128 and the last 128 tokens ("head+tail", the best
truncation strategy in Sun et al., 2019, *How to Fine-Tune BERT for Text Classification?*). Same model, no
retraining.

The choice was made on the **validation** split and only then measured once on **test**, so the test number is
not tuned on.

| Reviews over 256 tokens | Head only | Head + tail | Difference, 95% bootstrap CI | McNemar exact p |
|---|---|---|---|---|
| Validation (7,873 reviews), decision | 0.789 | **0.806** | +0.017 [+0.009, +0.025] | 4.5e-5 |
| Test (7,759 reviews), report | 0.788 | **0.798** | +0.010 [+0.002, +0.017] | 0.027 |

Reviews of 256 tokens or fewer are unaffected: predictions are identical to before (checked on 400 test reviews).
The full-split table above was measured before this change and is left as published; the gain applies only to
the long fifth of reviews, so the whole-split effect is smaller.

## A bug found on the way: labels depended on batch-mates

While checking that short reviews were unaffected, the int8 model gave a review a different label depending on
which other reviews were scored in the same padded batch (1.25% of labels changed versus scoring the review
alone; probabilities moved by up to 0.07). A host importing 25 reviews could get slightly different labels than
adding them one by one. Production now scores each review in its own unpadded run, which is deterministic and
was about 2.5x faster on one CPU thread. The test numbers in the truncation table were measured this way.

## Retrain with a food aspect, and a dead WiFi head found on the way

The aspect list grew to seven with `food` (meals, breakfast). The teacher re-labelled the training reviews with the
new guide and xsmall was retrained twice (seed 13). The rebuilt test split is byte-identical to the frozen one (same
sha256), so the numbers compare directly. All models are scored the way production runs them: int8 ONNX, head+tail,
one review at a time (which is why the six-aspect model shows 0.804 here, not the 0.801 above).

**First retrain (`-food`), not deployed.** Its pooled scores matched the six-aspect model, but a per-class check
showed the WiFi head predicted "not mentioned" for every review (macro-F1 0.315 is exactly that), in the deployed
six-aspect model too, and food and location found only 28% and 12% of the teacher's complaints. The base and small
models had learned WiFi (0.891, 0.849), so this was the xsmall training setup, not the data:
- one pooled, unweighted aspect loss let a rarely mentioned aspect collapse to "not mentioned";
- xsmall trained at 2e-5, the base model's rate; its [model card](https://huggingface.co/microsoft/deberta-v3-xsmall)
  fine-tunes at 4.5e-5;
- training logged one pooled aspect score and chose the epoch on sentiment alone, so nothing looked per aspect.

**Second retrain (`-food2`), deployed.** Each aspect has its own loss with square-root inverse-frequency class
weights, xsmall trains at 4.5e-5 for 4 epochs, the epoch is chosen on sentiment and mean per-aspect F1 together, and
training warns when a head predicts one class for every val review. Both changes went in together, so the gain
can't be split between them.

| Full test split (40,529) | Sentiment macro-F1 | Accuracy | Neutral F1 | Spam F1 | Spam FPR | Aspect polarity acc |
|---|---|---|---|---|---|---|
| Six-aspect model (previous) | 0.804 | 0.880 | 0.652 | 0.974 | 0.0% | 0.960 |
| `-food` | 0.804 | 0.881 | 0.647 | 0.976 | 0.0% | 0.957 |
| **`-food2` (deployed)** | **0.806** | **0.886** | 0.650 | 0.961 | 0.0% | 0.934 |

Aspects on the 2,100-review sample, against the teacher: macro-F1, and recall / precision of the "negative" class
(how many of the teacher's complaints the model finds, and how many of its complaints the teacher agrees with):

| Aspect | Six-aspect F1 | `-food` F1 | **`-food2` F1** | Negative recall: six / `-food` / **`-food2`** | `-food2` negative precision |
|---|---|---|---|---|---|
| Cleanliness | 0.842 | 0.830 | **0.873** | 0.66 / 0.62 / **0.76** | 0.86 |
| Location | 0.638 | 0.665 | **0.801** | 0.06 / 0.12 / **0.59** | 0.54 |
| WiFi | 0.315 | 0.315 | **0.853** | 0.00 / 0.00 / **0.91** | 0.79 |
| Host | 0.816 | 0.837 | **0.885** | 0.57 / 0.71 / **0.82** | 0.83 |
| Value | 0.771 | 0.788 | **0.855** | 0.47 / 0.52 / **0.80** | 0.73 |
| Amenities | 0.761 | 0.789 | **0.825** | 0.80 / 0.78 / **0.82** | 0.76 |
| Food | n/a | 0.698 | **0.840** | n/a / 0.28 / **0.77** | 0.68 |
| **Mean** | 0.690 | 0.703 | **0.847** | | |

- Sentiment is unchanged to slightly better; spam false positives on real reviews stay at 0.0%. Spam F1 fell 0.013
  (a little less of the synthetic spam is caught).
- Finding complaints did not flood false ones: negative precision held or rose for every aspect (food 0.55 to 0.68).
  Location complaints remain the weakest (precision 0.54).
- Polarity against the guests' sub-ratings fell (0.960 to 0.934), mostly location (0.984 to 0.938) and value (0.975
  to 0.917). The earlier models scored high by almost never calling these negative, while most sub-ratings are 4-5.
  `-food2` is now close to the teacher's own agreement with sub-ratings (location 0.956, value 0.938): a guest can
  rate location 5 and still mention street noise.
- The aspect comparison favours the retrained models: the reference labels come from the teacher run they were
  trained on. TF-IDF trained on the same labels scores 0.764, so `-food2`'s 0.847 is not just label matching.
- Hand-written check (14 short reviews about food, WiFi, location): all 14 aspect labels correct; `-food` got 4 of
  the 12 it was tried on.
  Short single-aspect complaints often get overall sentiment "neutral": the sentiment head learned from star ratings
  of long reviews, where one complaint rarely means 1-2 stars.
- Long reviews (the 7,759 real test reviews over 256 tokens, head+tail): sentiment macro-F1 0.806 vs 0.798 for the
  six-aspect model (95% bootstrap CI of the difference [+0.000, +0.015]). On one constructed review (40 sentences
  of praise, then "filthy... never again") `-food2` leans positive where the six-aspect model said negative; both
  clearly read the ending (negative probability rises by ~0.35), they weigh it differently.
- Peak server memory with `-food2`: 439 MB of Render's 512 MB.

## Error analysis: the 20 worst sentiment errors (deployed `-food2`)

The 20 most confident wrong predictions on the 2,100-review sample (`errors_deberta-v3-xsmall-s13-food2.md` in
the `-food2` results bundle), each read in full from the test split, not only the excerpt in that file. The
deployed uint8 model gives the same wrong label on all 20.

| Cause | Count | Is the model wrong? |
|---|---|---|
| **Star rating contradicts the text.** 3★ reviews that are lists of complaints, several ending "I would never stay here again" (7), or pure praise such as "I would definitely stay there again" (4); a 1★ review that asks to "give Olivia a raise"; a 5★ review titled "Sleepless in Texas" that ends "very dissatisfied"; a 4★ review that ends "paid over $300 to be insulted". | 14 | No: the gold label is the noisy part. |
| **Lukewarm wording next to the star boundary.** 4★ reviews titled "An Okay Stay", "Could be better" and one listing many downsides, predicted neutral; 2★ reviews titled "Adequate for the price" and "Losing Ground" that mix complaints with "it is a great location though", predicted neutral. | 5 | Borderline: neutral is a fair reading. |
| **Mixed, even-handed review called negative.** An overbooking story told calmly, ending "The receptionist and bell hops were nice and helpful" (3★). | 1 | Yes. |
| Decisive content past the input cut-off | 0 | (was 4 of 20 before head+tail) |

Takeaways:
- 14 of the 20 worst errors are rating/text mismatches, against 9 of 20 for the six-aspect model before head+tail.
  The most confident mistakes are now mostly the dataset's, which is what a model that has learned the text, not
  the stars, should look like. It also means the test score understates text-sentiment accuracy, most for neutral.
- No error came from the 256-token limit: six of the 20 are longer than 256 tokens (up to 616), and head+tail kept
  the parts that decide them.
- The real remaining weakness is the neutral boundary: lukewarm or even-handed text, where even people would
  disagree. 3-star gold labels are the noisiest part of the data; an in-domain test set labelled by hosts
  (licence plan, phase B) would measure this properly.

## A deployment bug: int8 results depended on the server's CPU

After `-food2` went live, the server labelled "Breakfast was cold and the WiFi kept dropping." as Cleanliness
positive; the same model file and code gave WiFi, amenities and food negative on the laptop and the B200 host.
Newer library versions were ruled out locally. The weights were int8 (U8S8), which ONNX Runtime computes with an
instruction whose 16-bit sums can saturate on x86 CPUs that have AVX2/AVX512 but no VNNI; U8U8 has no such issue
([ONNX Runtime quantization docs](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html)).
Every machine the model was evaluated on had VNNI; Render's server (AMD EPYC 7R13) does not.

- Fix: the int8 weights and zero points are stored as uint8 (shifted by 128, the same values), `ml/revlens_ml/u8u8.py`.
  On the laptop the converted model gives identical outputs on 600 reviews.
- Guard: exports store reference answers for 8 reviews in `labels.json`; the backend re-runs them at start-up,
  logs the CPU and whether it has VNNI, and refuses a model that answers differently (Gemini then serves).
  On Render: "8 reference reviews match; CPU: AMD EPYC 7R13 Processor, 8 cores, VNNI: no".
- Every score in this file was measured on VNNI CPUs, so it describes the U8U8 model on Render too, but not what
  the U8S8 models served there before. `backend/scripts/relabel_model_reviews.py` re-labels reviews the model
  labelled in that period.

## Limits to keep next to these numbers

1. **Domain shift.** Trained and tested on large US/EU hotels; RevLens serves Indian homestays. Expect lower
   accuracy on real RevLens reviews. The honest next measurement is a few hundred real homestay reviews labelled
   by hosts.
2. **One seed.** Differences between xsmall, small and base (0.801 to 0.818) are within what another seed could
   move. Retrain with `SEEDS="14 15"` for mean and spread before ranking them.
3. **Aspects.** Polarity is checked against sub-ratings only where the guest gave one; WiFi and host have no
   independent labels and are reported only as agreement with the teacher LLM.
4. **Licence.** The training data is academic-use only (DATASETS.md). The deployed model inherits that limit.
