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
- **Deployed:** `deberta-v3-xsmall-s13-food` (seven aspects), int8 ONNX. xsmall is the only size that fits
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

## Retrain with a food aspect (deployed: `deberta-v3-xsmall-s13-food`)

The aspect list grew to seven with `food` (meals, breakfast). The teacher re-labelled the training reviews with
the new guide and xsmall was retrained (seed 13). The rebuilt test split is byte-identical to the frozen one
(same sha256), so the numbers compare directly. Both models are scored the way production runs them: int8 ONNX,
head+tail, one review at a time (which is why the old model shows 0.804 here, not the 0.801 above).

| Full test split (40,529) | Sentiment macro-F1 | Accuracy | Neutral F1 | Spam F1 | Spam FPR | Aspect mention rate | Aspect polarity acc |
|---|---|---|---|---|---|---|---|
| Six-aspect model (previous) | 0.804 | 0.880 | 0.652 | 0.974 | 0.0% | 62.6% | 0.960 |
| **Seven-aspect model** | **0.804** | 0.881 | 0.647 | 0.976 | 0.0% | 59.8% | 0.957 |

Aspect agreement with the teacher (macro-F1) on the 2,100-review sample:

| Model | Cleanliness | Location | WiFi | Host | Value | Amenities | Food | Mean |
|---|---|---|---|---|---|---|---|---|
| Six-aspect model | 0.842 | 0.638 | 0.315 | 0.816 | 0.771 | 0.761 | n/a | 0.690 |
| **Seven-aspect model** | 0.830 | 0.665 | 0.315 | 0.837 | 0.788 | 0.789 | **0.698** | 0.703 |

- Sentiment and spam are unchanged on the full split. On the sample, sentiment reads 0.807 vs 0.796; with
  2,100 reviews that gap is within noise, and the full split (19x larger) shows none.
- Food is learned about as well as the other aspects (0.698 vs a 0.703 mean). No existing aspect fell by more
  than 0.012 (cleanliness).
- The aspect comparison slightly favours the new model: the reference labels come from the new teacher run,
  which only the new model was trained on.
- Fewer reviews get any aspect (59.8% vs 62.6%) although a category was added. No single aspect lost agreement,
  so this most likely reflects the re-labelled teacher data being stricter about what counts as a mention.
- WiFi is weak in both models (0.315): it is rarely mentioned, so there are few training examples. Not caused by
  this retrain; it is the first aspect to improve.
- Latency (p50 24 ms vs 38 ms on the GPU machine's CPU) is not a model difference: same architecture and size.
  Render's own latency is the number that matters.

## Limits to keep next to these numbers

1. **Domain shift.** Trained and tested on large US/EU hotels; RevLens serves Indian homestays. Expect lower
   accuracy on real RevLens reviews. The honest next measurement is a few hundred real homestay reviews labelled
   by hosts.
2. **One seed.** Differences between xsmall, small and base (0.801 to 0.818) are within what another seed could
   move. Retrain with `SEEDS="14 15"` for mean and spread before ranking them.
3. **Aspects.** Polarity is checked against sub-ratings only where the guest gave one; WiFi and host have no
   independent labels and are reported only as agreement with the teacher LLM.
4. **Licence.** The training data is academic-use only (DATASETS.md). The deployed model inherits that limit.
