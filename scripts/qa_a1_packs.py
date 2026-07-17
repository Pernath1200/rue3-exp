"""Quick QA for A1 content packs + tree links."""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tree = json.loads((root / "data/tree.json").read_text(encoding="utf-8"))
live = [n for n in tree["nodes"] if n.get("status") == "live"]
print("LIVE NODES", len(live))
total_items = frames = words = 0
errors = []

for n in live:
    path = root / "data" / n["content"]
    if not path.exists():
        errors.append("missing " + n["content"])
        continue
    pack = json.loads(path.read_text(encoding="utf-8"))
    n_items = sum(len(b["items"]) for b in pack["blocks"])
    total_items += n_items
    kind = "frames" if pack.get("practice") == "frames" else "words"
    if kind == "frames":
        frames += n_items
        for b in pack["blocks"]:
            for it in b["items"]:
                if not (it.get("gap") and it.get("gap_answer") and it.get("en") and it.get("cz")):
                    errors.append(f"frame incomplete {b['id']} {it.get('en')}")
    else:
        words += n_items
        for b in pack["blocks"]:
            if len(b["items"]) < 8:
                errors.append(f"small block {b['id']} n={len(b['items'])}")
            for it in b["items"]:
                if not (it.get("en") and it.get("cz")):
                    errors.append(f"word incomplete {b['id']}")
    print(f"  {n['label']:22} {kind:6} blocks={len(pack['blocks'])} items={n_items}")

print("TOTAL items", total_items, "frames", frames, "words", words)

# block id uniqueness
seen = {}
for n in live:
    pack = json.loads((root / "data" / n["content"]).read_text(encoding="utf-8"))
    for b in pack["blocks"]:
        if b["id"] in seen:
            errors.append(f"duplicate block id {b['id']}")
        seen[b["id"]] = n["id"]

if errors:
    print("ERRORS:")
    for e in errors:
        print(" ", e)
    sys.exit(1)
print("OK all packs")
