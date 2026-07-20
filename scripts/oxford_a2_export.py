"""Export unique Oxford 3000 A2 lemmas from vocab_profiler dump."""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OX = Path(r"C:\Users\ADMIN\documents\projects\vocab_profiler\data\oxford_5000.json")
OUT = ROOT / "docs" / "oxford_a2_lemmas.csv"


def main() -> None:
    data = json.loads(OX.read_text(encoding="utf-8"))
    rows: dict[str, str] = {}
    for x in data:
        v = x.get("value") or x
        if (v.get("level") or "").upper() != "A2":
            continue
        word = (v.get("word") or "").strip()
        if not word:
            continue
        pos = (v.get("type") or "").strip()
        key = word.lower()
        # keep first POS; note multi-POS in second column if needed
        if key not in rows:
            rows[key] = pos
        elif pos and pos not in rows[key]:
            rows[key] = f"{rows[key]}|{pos}"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["lemma", "pos"])
        for lemma in sorted(rows):
            w.writerow([lemma, rows[lemma]])
    print(f"Wrote {len(rows)} unique A2 lemmas → {OUT}")


if __name__ == "__main__":
    main()
