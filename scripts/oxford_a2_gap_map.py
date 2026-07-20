"""
Map missing Oxford A2 lemmas onto RUE3 A2 tree buckets (Codex-aligned).
Planning / coverage aid — does not write packs.
"""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OX = Path(r"C:\Users\ADMIN\documents\projects\vocab_profiler\data\oxford_5000.json")

# Closed-class / glue → frames only
FUNCTION_POS = {
    "preposition",
    "determiner",
    "conjunction",
    "pronoun",
    "modal verb",
    "auxiliary verb",
    "linking verb",
    "exclamation",
    "number",
}

# Keyword → theme bucket (override before POS default)
THEME_KEYWORDS: list[tuple[str, list[str]]] = [
    (
        "travel",
        "abroad airline airport backpack beach booking border bus cabin camp "
        "camping capital coach countryside delay destination ferry flight "
        "foreign guide hostel hotel journey luggage map passenger passport "
        "platform resort sightseeing souvenir station suitcase ticket tourist "
        "tour traffic trip vacation voyage".split(),
    ),
    (
        "health",
        "accident allergic allergy ambulance ankle bandage blood bone brain "
        "breathe cancer chemist cough disease doctor emergency fever fit "
        "flu headache healthy heart hospital hurt ill illness injure injury "
        "medicine nurse pain patient pharmacy pill prescription recover rest "
        "sick sore stomach stress temperature throat toothache treatment "
        "unhealthy virus".split(),
    ),
    (
        "home",
        "apartment balcony basement bathroom bedroom carpet ceiling cellar "
        "central heating chimney cupboard curtain dishwasher downstairs "
        "flat furniture garage garden gate heating housework kitchen "
        "landlord lift living room neighbour neighbor oven pillow rent "
        "roof shelf sink sofa stairs upstairs washing machine".split(),
    ),
    (
        "work",
        "apply application boss business career colleague company contract "
        "customer department employee employer experience interview job "
        "manager meeting office profession salary skill staff team training "
        "unemployed unemployment wage work workplace".split(),
    ),
    (
        "food",
        "bake boil bowl breakfast cook cooking cream delicious dessert diet "
        "dinner dish drink food fork fridge fry grill hungry ingredient "
        "juice kitchen knife lunch meal meat menu milk oil oven pepper "
        "plate recipe restaurant salad salt sandwich sauce snack soup "
        "spicy spoon sugar sweet tea thirsty vegetable vegetarian".split(),
    ),
    (
        "shopping",
        "advertise advertisement advertising bargain brand cash cheap cost "
        "credit card customer discount expensive offer pay price product "
        "purchase receipt refund sale sell shop shopping store wallet".split(),
    ),
    (
        "family",
        "adult aunt boyfriend brother child cousin dad daughter family "
        "father girlfriend grandparent husband married mum mother neighbour "
        "parent relative single sister son uncle wife".split(),
    ),
    (
        "routine",
        "alarm habit lifestyle routine schedule timetable usually daily "
        "everyday regularly often sometimes never always already still "
        "yet commute".split(),
    ),
    (
        "freetime",
        "adventure artist band cinema club concert dance entertainment "
        "festival film game guitar hobby leisure movie music paint painting "
        "party piano play series song sport team theatre theater".split(),
    ),
    (
        "nature",
        "climate cloud environment flood forest hill island lake mountain "
        "nature ocean planet pollution rain river sea snow storm sun "
        "temperature valley weather wind wood".split(),
    ),
    (
        "tech",
        "app blog camera computer digital download email internet keyboard "
        "laptop mouse online password phone screen software technology "
        "text upload video website wifi".split(),
    ),
    (
        "school",
        "college course degree dictionary education exam homework language "
        "learn lesson library mark primary project revise school secondary "
        "student subject teacher test university".split(),
    ),
    (
        "clothes",
        "boot casual clothes coat dress fashion glove hat jacket jeans "
        "jumper shirt shoe skirt smart sock sweater trousers wear".split(),
    ),
    (
        "feelings",
        "afraid angry bored calm confident embarrassed excited funny happy "
        "jealous nervous proud relaxed sad surprised worried feeling emotion "
        "personality character".split(),
    ),
    (
        "ideas",
        "ability advantage adventure advice argument attention attitude "
        "decision detail difference experience idea information interest "
        "knowledge opinion opportunity problem reason result situation "
        "solution success".split(),
    ),
]


def norm_lemma(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"\([^)]*\)", "", s)
    s = s.split("/")[0].strip()
    s = re.sub(r"[.,!?;:\"']", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def load_ours() -> set[str]:
    tree = json.loads((ROOT / "data" / "tree.json").read_text(encoding="utf-8"))
    ours: set[str] = set()
    for n in tree["nodes"]:
        if n.get("status") != "live" or not n.get("content"):
            continue
        pack = json.loads((ROOT / "data" / n["content"]).read_text(encoding="utf-8"))
        for b in pack.get("blocks", []):
            for it in b.get("items", []):
                if pack.get("practice") == "frames":
                    ours.add(norm_lemma(it.get("gap_answer") or ""))
                    # also surface content words lightly from en
                    for tok in re.findall(r"[a-zA-Z']+", it.get("en") or ""):
                        ours.add(tok.lower())
                else:
                    ours.add(norm_lemma(it.get("en") or ""))
        for sv in pack.get("seed_vocab") or []:
            ours.add(norm_lemma(sv))
    return ours


def load_oxford_a2() -> list[tuple[str, str]]:
    data = json.loads(OX.read_text(encoding="utf-8"))
    seen: dict[str, str] = {}
    for x in data:
        v = x.get("value") or x
        if (v.get("level") or "").upper() != "A2":
            continue
        w = (v.get("word") or "").strip().lower()
        if not w:
            continue
        pos = (v.get("type") or "other").lower()
        if w not in seen:
            seen[w] = pos
    return sorted(seen.items())


def bucket_for(lemma: str, pos: str) -> str:
    if " " in lemma or pos in FUNCTION_POS:
        if pos in FUNCTION_POS or " " in lemma:
            # multiword often PHR
            if " " in lemma:
                return "chunks_phr"
            return "function_glue"
    if pos == "verb":
        return "core_verbs"
    for name, words in THEME_KEYWORDS:
        if lemma in words:
            return name
        # substring for multi
        for w in words:
            if w == lemma or (len(w) > 4 and (w in lemma or lemma in w)):
                return name
    if pos == "adjective":
        return "describing"
    if pos == "adverb":
        return "adverbs"
    if pos == "noun":
        return "topic_misc"
    return "general_core"


def main() -> None:
    ours = load_ours()
    a2 = load_oxford_a2()
    missing = [(w, p) for w, p in a2 if w not in ours and norm_lemma(w) not in ours]
    present = len(a2) - len(missing)

    buckets: dict[str, list[str]] = defaultdict(list)
    for w, p in missing:
        buckets[bucket_for(w, p)].append(w)

    print(f"Oxford A2 unique: {len(a2)}")
    print(f"Already covered (any pack): {present}")
    print(f"Missing: {len(missing)}")
    print()
    print(f"{'BUCKET':22} {'N':>4}  sample")
    print("-" * 72)
    for name in sorted(buckets, key=lambda k: -len(buckets[k])):
        words = sorted(buckets[name])
        sample = ", ".join(words[:10])
        print(f"{name:22} {len(words):4}  {sample}")

    out = ROOT / "docs" / "oxford_a2_gap_buckets.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["bucket", "lemma", "pos"])
        pos_map = dict(a2)
        for name, words in sorted(buckets.items()):
            for lemma in sorted(words):
                w.writerow([name, lemma, pos_map.get(lemma, "")])
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
