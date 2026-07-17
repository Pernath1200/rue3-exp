"""Count live A1 items and compare to Oxford 3000 A1 list."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OX_PATH = Path(
    r"C:\Users\ADMIN\Desktop\Teaching Material\reference\oxford_3000_A1_sorted.csv"
)


def norm_lemma(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"\([^)]*\)", "", s)
    s = s.split("/")[0].strip()
    s = re.sub(r"[.,!?;:\"']", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def main() -> None:
    tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
    live = [
        n
        for n in tree["nodes"]
        if n.get("status") == "live" and "A1" in n.get("levels", [])
    ]

    frame_items = []
    word_items = []
    lemmas: list[str] = []
    by_node = []

    for n in live:
        pack = json.loads((ROOT / "data" / n["content"]).read_text(encoding="utf-8"))
        is_f = pack.get("practice") == "frames"
        count = 0
        for b in pack["blocks"]:
            for it in b["items"]:
                count += 1
                if is_f:
                    frame_items.append(it)
                    lemmas.append(norm_lemma(it.get("gap_answer") or ""))
                    # also harvest preferred en content words lightly via seed_vocab if present
                else:
                    word_items.append(it)
                    lemmas.append(norm_lemma(it["en"]))
        by_node.append(
            (n["label"], "frames" if is_f else "words", count, len(pack["blocks"]))
        )

        # seed_vocab on frame packs adds taught fillers
        for sv in pack.get("seed_vocab") or []:
            lemmas.append(norm_lemma(sv))

    lemmas = [x for x in lemmas if x]
    ours = set(lemmas)
    ours_tokens = set(ours)
    for lem in list(ours):
        for t in lem.split():
            if t not in {"a", "an", "the", "to", "of", "at"}:
                ours_tokens.add(t)

    print("=== LIVE A1 PRACTICE ITEMS ===")
    for label, kind, c, blocks in by_node:
        print(f"  {label:22} {kind:6} {c:3}  ({blocks} blocks)")
    print()
    print(f"Frame items (full sentences): {len(frame_items)}")
    print(f"Leaf word items (en/cz pairs): {len(word_items)}")
    print(f"Total practice items:         {len(frame_items) + len(word_items)}")
    print(f"Unique taught lemmas (rough): {len(ours)}")

    with OX_PATH.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    # detect word column
    field = "word" if "word" in (rows[0] or {}) else list(rows[0].keys())[0]
    ox_words = []
    ox_by_word: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        w = (r.get(field) or "").strip().lower()
        if not w:
            continue
        ox_words.append(w)
        ox_by_word[w].append(r.get("pos") or "?")

    ox_unique = sorted(ox_by_word.keys())
    print()
    print("=== OXFORD A1 (from oxford_3000_A1_sorted.csv) ===")
    print(f"Rows (word+pos senses): {len(rows)}")
    print(f"Unique word forms:      {len(ox_unique)}")

    covered_exact = [w for w in ox_unique if w in ours]
    missing_exact = [w for w in ox_unique if w not in ours]
    covered_tok = [w for w in ox_unique if w in ours_tokens]
    missing_tok = [w for w in ox_unique if w not in ours_tokens]

    def pct(n: int, d: int) -> str:
        return f"{100.0 * n / d:.1f}%"

    print()
    print("=== COVERAGE ===")
    print(
        f"Exact lemma match:  {len(covered_exact)} / {len(ox_unique)}  ({pct(len(covered_exact), len(ox_unique))})"
    )
    print(
        f"Token / loose match:{len(covered_tok)} / {len(ox_unique)}  ({pct(len(covered_tok), len(ox_unique))})"
    )
    print(f"Still missing (loose): {len(missing_tok)}")

    # POS of missing unique words (first pos listed)
    pos_c = Counter()
    region_c = Counter()
    for w in missing_tok:
        # find first row
        for r in rows:
            if (r.get(field) or "").strip().lower() == w:
                pos_c[r.get("pos") or "?"] += 1
                region_c[r.get("region") or "?"] += 1
                break

    print()
    print("Missing unique words by POS:")
    for p, c in pos_c.most_common():
        print(f"  {p:20} {c}")

    print()
    print("Missing unique words by region:")
    for p, c in region_c.most_common():
        print(f"  {p:20} {c}")

    print()
    print("--- Missing (alphabetical, all) ---")
    # print in columns-ish
    line = []
    for i, w in enumerate(missing_tok, 1):
        line.append(w)
        if i % 10 == 0:
            print(", ".join(line))
            line = []
    if line:
        print(", ".join(line))

    # Grammar words vs content among missing
    grammarish = [
        w
        for w in missing_tok
        if any(
            (r.get(field) or "").strip().lower() == w
            and (r.get("region") or "") == "Grammar words"
            for r in rows
        )
    ]
    content_missing = [w for w in missing_tok if w not in grammarish]
    print()
    print(f"Missing tagged Grammar words: {len(grammarish)}")
    print(f"Missing other content:        {len(content_missing)}")
    print("Grammar missing sample:", ", ".join(grammarish[:40]), "...")
    print("Content missing sample:", ", ".join(content_missing[:40]), "...")


if __name__ == "__main__":
    main()
