"""QA for all live content packs + tree links (all levels).

Checks:
  - content file exists, JSON parses
  - required fields per item (en/cz always; gap/gap_answer for frames)
  - gap contains ____ and gap.replace(____, gap_answer) == en (frames)
  - cz == en (untranslated bulk-fill leftovers; known cognates whitelisted)
  - duplicate en within a level (WARNING — cross-theme overlap can be deliberate)
  - any block under 4 items (breaks the 4-option quiz)
  - word blocks under 8 items (existing rule)
  - diagram keys actually defined in js/practice.js
  - block id uniqueness across all packs

Errors exit 1; warnings report but exit 0.
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]

# Czech words genuinely identical to English — cz==en is correct for these.
COGNATES_OK = {
    "park", "supermarket", "hotel", "hostel", "taxi", "metro", "sport",
    "film", "student", "partner", "zoo", "test", "text", "video", "dvd",
    "cd", "internet", "blog", "euro", "cent", "pilot", "virus", "drama",
    "jazz", "festival", "baseball", "golf", "tablet", "data", "program",
    "software", "web", "experiment", "detail", "symbol", "role", "super",
    "model",
}

# --- valid diagram keys, parsed from practice.js ---
practice_src = (root / "js/practice.js").read_text(encoding="utf-8")
m = re.search(r"const scenes = \{(.*?)\n  \};", practice_src, re.S)
diagram_keys = set()
if m:
    for key in re.finditer(r'(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*:\s*\(\)', m.group(1)):
        diagram_keys.add(key.group(1) or key.group(2))
if not diagram_keys:
    print("WARN could not parse diagram keys from practice.js")

tree = json.loads((root / "data/tree.json").read_text(encoding="utf-8"))
live = [n for n in tree["nodes"] if n.get("status") == "live"]
print("LIVE NODES", len(live))

errors = []
warnings = []
totals = {}  # level -> [items, frames, words]
en_seen = {}  # (level, en_lower) -> "pack/block"

for n in live:
    path = root / "data" / n["content"]
    if not path.exists():
        errors.append("missing " + n["content"])
        continue
    try:
        pack = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"bad JSON {n['content']}: {e}")
        continue
    level = pack.get("level") or n.get("level") or "?"
    kind = "frames" if pack.get("practice") == "frames" else "words"
    n_items = sum(len(b["items"]) for b in pack["blocks"])
    t = totals.setdefault(level, [0, 0, 0])
    t[0] += n_items
    t[1 if kind == "frames" else 2] += n_items

    for b in pack["blocks"]:
        loc = f"{pack['id']}/{b['id']}"
        if len(b["items"]) < 4:
            errors.append(f"block<4 {loc} n={len(b['items'])} (breaks 4-option quiz)")
        elif kind == "words" and len(b["items"]) < 8:
            errors.append(f"small word block {loc} n={len(b['items'])}")
        for it in b["items"]:
            en, cz = it.get("en"), it.get("cz")
            label = (en or "?")[:40]
            if not (en and cz):
                errors.append(f"incomplete item {loc} {label}")
                continue
            if (
                en.strip().lower() == cz.strip().lower()
                and en.strip().lower() not in COGNATES_OK
            ):
                errors.append(f"cz==en {loc} {label}")
            key = (level, en.strip().lower())
            if key in en_seen:
                warnings.append(f"dup en in {level}: {label} ({en_seen[key]} + {loc})")
            else:
                en_seen[key] = loc
            if kind == "frames":
                gap, ans = it.get("gap"), it.get("gap_answer")
                if not (gap and ans):
                    errors.append(f"frame incomplete {loc} {label}")
                    continue
                if "____" not in gap:
                    errors.append(f"no ____ in gap {loc} {label}")
                elif gap.replace("____", ans) != en:
                    errors.append(f"gap+answer != en {loc} {label}")
            dg = it.get("diagram")
            if dg and dg not in diagram_keys:
                errors.append(f"unknown diagram '{dg}' {loc} {label}")
    print(f"  {level} {n['label']:24} {kind:6} blocks={len(pack['blocks'])} items={n_items}")

for level in sorted(totals):
    t = totals[level]
    print(f"TOTAL {level}: items={t[0]} frames={t[1]} words={t[2]}")
print("GRAND TOTAL", sum(t[0] for t in totals.values()))

# block id uniqueness (progress keys — must never collide)
seen = {}
for n in live:
    path = root / "data" / n["content"]
    if not path.exists():
        continue
    pack = json.loads(path.read_text(encoding="utf-8"))
    for b in pack["blocks"]:
        if b["id"] in seen:
            errors.append(f"duplicate block id {b['id']} ({seen[b['id']]} + {n['id']})")
        seen[b["id"]] = n["id"]

if warnings:
    print(f"WARNINGS ({len(warnings)}):")
    for w in warnings:
        print(" ", w)
if errors:
    print(f"ERRORS ({len(errors)}):")
    for e in errors:
        print(" ", e)
    sys.exit(1)
print("OK all packs" + (f" ({len(warnings)} warnings)" if warnings else ""))
