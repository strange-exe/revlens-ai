"""Build app/data/common_words.txt: everyday English words, which the name scrubber (app/redact.py) keeps.

    python -m scripts.build_common_words ../ml/data/processed/train.parquet

A word counts as everyday when reviewers write it in lower case often enough: at least MIN_LOWER times, and at
least as often as a quarter of its capitalised uses in mid-sentence. Names and most place names fail that test
("olivia" is almost never written in lower case), so the scrubber hides them. The list holds single words with
their counts dropped: no review text is stored.
"""
import re
import sys
from collections import Counter
from pathlib import Path

import pandas as pd

MIN_LOWER = 10
OUT = Path(__file__).resolve().parents[1] / "app" / "data" / "common_words.txt"
WORD = re.compile(r"[A-Za-z][a-z]+(?:'[a-z]+)?")
SENTENCE_START = re.compile(r"(?:^|[.!?]\s+|\n\s*)$")


def main() -> None:
    texts = pd.read_parquet(sys.argv[1], columns=["text"])["text"]
    lower, mid_capital = Counter(), Counter()
    for text in texts:
        for m in WORD.finditer(text):
            word = m.group(0)
            if word[0].islower():
                lower[word] += 1
            elif not SENTENCE_START.search(text[max(0, m.start() - 3):m.start()]):
                mid_capital[word.lower()] += 1
    common = sorted(w for w, n in lower.items() if n >= MIN_LOWER and n * 4 >= mid_capital[w])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(("\n".join(common) + "\n").encode())
    print(f"{len(common)} everyday words from {len(texts)} reviews -> {OUT}")


if __name__ == "__main__":
    main()
