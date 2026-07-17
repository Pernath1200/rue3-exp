"""
Map missing Oxford A1 forms onto RUE3 tree scheme (trunk frames vs leaves).
Does not write content — planning aid only.
"""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OX_PATH = Path(
    r"C:\Users\ADMIN\Desktop\Teaching Material\reference\oxford_3000_A1_sorted.csv"
)

# Manual theme buckets for content (override/add to CSV region when useful)
THEME_RULES: list[tuple[str, list[str]]] = [
    (
        "colours",
        "black blue brown green grey gray red white yellow pink purple orange".split(),
    ),
    (
        "clothes",
        "boot coat dress hat jacket jeans shirt shoe skirt sweater t-shirt trousers clothes wear".split(),
    ),
    (
        "body",
        "arm back body ear eye face foot hand hair head leg mouth nose tooth teeth".split(),
    ),
    (
        "animals",
        "animal bird cat cow dog elephant horse lion mouse pig sheep snake".split(),
    ),
    (
        "family_extra",
        "aunt uncle cousin dad mum mom parent parents grandparent grandfather grandmother boyfriend girlfriend".split(),
    ),
    (
        "school",
        "class classroom college course dictionary exam homework language learn lesson student teacher subject university pen pencil paper book".split(),
    ),
    (
        "tech_media",
        "blog camera cd computer dvd email internet online phone photograph photo video website tv television telephone radio".split(),
    ),
    (
        "nature_weather",
        "air beach flower island mountain rain river sea snow sun tree weather warm cold hot".split(),
    ),
    (
        "travel_extra",
        "boat flight journey passport ticket tourist traffic trip vacation village map road".split(),
    ),
    (
        "money_shop",
        "buy sell cost price cheap expensive pound dollar euro cent money shop shopping market".split(),
    ),
    (
        "food_extra",
        "cafe sandwich pepper dish diet delicious cooking".split(),
    ),
    (
        "time_extra",
        "ago always never often sometimes soon already then tonight month year century date past future midnight quarter half once twice".split(),
    ),
    (
        "numbers_extra",
        "eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen thirty forty fifty sixty seventy eighty ninety thousand million first second third fourth fifth".split(),
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
    tree = json.loads((ROOT / "data/tree.json").read_text(encoding="utf-8"))
    live = [
        n
        for n in tree["nodes"]
        if n.get("status") == "live" and "A1" in n.get("levels", [])
    ]
    ours: set[str] = set()
    for n in live:
        pack = json.loads((ROOT / "data" / n["content"]).read_text(encoding="utf-8"))
        for b in pack["blocks"]:
            for it in b["items"]:
                if pack.get("practice") == "frames":
                    ours.add(norm_lemma(it.get("gap_answer") or ""))
                else:
                    ours.add(norm_lemma(it["en"]))
        for sv in pack.get("seed_vocab") or []:
            ours.add(norm_lemma(sv))
    ours.discard("")
    tokens = set(ours)
    for lem in list(ours):
        for t in lem.split():
            if len(t) > 1:
                tokens.add(t)
    return tokens


def assign_theme(word: str, region: str, pos: str) -> str:
    for theme, words in THEME_RULES:
        if word in words or word.replace("-", "") in {w.replace("-", "") for w in words}:
            return theme
    # region from CSV
    if region == "Grammar words":
        return "grammar_function"
    if region == "Core verbs":
        return "core_verbs"
    if region == "Describing words":
        return "describing"
    if region == "Numbers":
        return "numbers_extra"
    if region == "Social":
        return "social_phrases"
    if region == "General core":
        return "general_core"
    if region == "Topic vocab":
        return "topic_misc"
    return region or "other"


# Scheme placement recommendation
PLACEMENT = {
    "colours": ("leaf", "leaf_colours_a1", "Colours", "new leaf · 1×12"),
    "clothes": ("leaf", "leaf_clothes_a1", "Clothes", "new leaf · 2×12"),
    "body": ("leaf", "leaf_body_a1", "Body", "new leaf · 1–2×12"),
    "animals": ("leaf", "leaf_animals_a1", "Animals", "new leaf · 1×12"),
    "family_extra": ("leaf", "leaf_home_family", "Home & Family", "extend existing blocks"),
    "school": ("leaf", "leaf_school_a1", "School & study", "new leaf · 2×12 (or fold into Work)"),
    "tech_media": ("leaf", "leaf_tech_a1", "Tech & media", "new leaf · 1–2×12"),
    "nature_weather": ("leaf", "leaf_nature_a1", "Nature & weather", "new leaf · 2×12"),
    "travel_extra": ("leaf", "leaf_places", "Places", "extend Places + light travel block"),
    "money_shop": ("leaf", "leaf_shopping_a1", "Shopping & money", "new leaf · 1–2×12"),
    "food_extra": ("leaf", "leaf_food_a1", "Food & drink", "extend Food blocks"),
    "time_extra": ("leaf", "leaf_time_a1", "Time & numbers", "extend Time + trunk time frames"),
    "numbers_extra": ("leaf", "leaf_time_a1", "Time & numbers", "extend numbers block(s)"),
    "core_verbs": ("trunk+leaf", "trunk_verbs_a1", "Core verbs", "trunk frames for high-freq + leaf verb list"),
    "describing": ("trunk+leaf", "trunk_adjectives_a1", "Adjectives", "extend adj frames + Free time feelings"),
    "grammar_function": ("trunk", "trunk_glue_a1", "Function glue", "frames only — not word dumps"),
    "social_phrases": ("trunk", "trunk_social_a1", "Social chunks", "phrase frames / mini chunk pack"),
    "general_core": ("mixed", "various", "General core", "split across Home/Places/verbs/frames"),
    "topic_misc": ("mixed", "various", "Topic misc", "sort into nearest leaf or new tiny block"),
}


def main() -> None:
    ours = load_ours()
    with OX_PATH.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    field = "word" if "word" in rows[0] else list(rows[0].keys())[0]

    # unique word -> meta
    meta: dict[str, dict] = {}
    for r in rows:
        w = (r.get(field) or "").strip().lower()
        if not w:
            continue
        if w not in meta:
            meta[w] = {
                "pos": r.get("pos") or "?",
                "region": r.get("region") or "?",
                "themes": r.get("themes") or "",
            }

    missing = sorted(w for w in meta if w not in ours)
    buckets: dict[str, list[str]] = defaultdict(list)
    for w in missing:
        m = meta[w]
        theme = assign_theme(w, m["region"], m["pos"])
        buckets[theme].append(w)

    print("Missing unique Oxford A1 forms:", len(missing))
    print("Covered tokens:", len(ours))
    print()
    print(f"{'BUCKET':22} {'N':>4}  PLACEMENT")
    print("-" * 72)
    for theme in sorted(buckets.keys(), key=lambda t: -len(buckets[t])):
        words = buckets[theme]
        place = PLACEMENT.get(theme, ("?", "?", "?", "?"))
        kind, node, label, note = place
        print(f"{theme:22} {len(words):4}  [{kind}] {label}")
        print(f"{'':22}      → {note}")
        # show words in lines of 10
        for i in range(0, len(words), 12):
            chunk = ", ".join(words[i : i + 12])
            print(f"{'':22}      {chunk}")
        print()

    # summary sizes for plan
    leaf_new = 0
    leaf_ext = 0
    trunkish = 0
    for theme, words in buckets.items():
        kind = PLACEMENT.get(theme, ("?",))[0]
        if kind == "leaf" and "new" in PLACEMENT[theme][3]:
            leaf_new += len(words)
        elif kind == "leaf":
            leaf_ext += len(words)
        elif "trunk" in kind or kind == "trunk":
            trunkish += len(words)
        else:
            leaf_ext += len(words)  # mixed count as need sorting

    print("=== ROUGH VOLUME ===")
    print(f"Words leaning new leaves:     check list above")
    print(f"Total missing:                {len(missing)}")


if __name__ == "__main__":
    main()
