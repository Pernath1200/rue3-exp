# -*- coding: utf-8 -*-
"""RUE3 v0.2 smoke — run before opening a PR.

Exit 0 = ok. Exit 1 = fail.
  py scripts/smoke.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def step(name: str, fn) -> bool:
    print(f"\n== {name} ==")
    try:
        ok = fn()
        print("OK" if ok else "FAIL")
        return ok
    except Exception as e:
        print(f"FAIL: {e}")
        return False


def check_tree() -> bool:
    path = ROOT / "data" / "tree.json"
    tree = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(tree, dict):
        print("tree.json is not an object")
        return False
    n = len(tree["nodes"]) if isinstance(tree.get("nodes"), list) else 0
    print(f"tree keys={list(tree.keys())[:8]} nodes={n} bytes={path.stat().st_size}")
    return path.stat().st_size > 100


def check_progress_key() -> bool:
    text = (ROOT / "js" / "progress.js").read_text(encoding="utf-8")
    if "rue3-v0.1-progress" not in text:
        print("expected progress key rue3-v0.1-progress")
        return False
    print("progress key=rue3-v0.1-progress")
    return True


def run_qa() -> bool:
    path = ROOT / "scripts" / "qa_packs.py"
    if not path.exists():
        print("skip qa_packs.py (missing)")
        return True
    r = subprocess.run(
        [sys.executable, str(path)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = (r.stdout or "") + (r.stderr or "")
    if out:
        print(out[-2500:] if len(out) > 2500 else out)
    if r.returncode != 0:
        print(f"qa_packs exit {r.returncode}")
        return False
    return True


def main() -> int:
    print("RUE3 smoke · v0.2")
    print(f"root={ROOT}")
    ok = True
    ok = step("tree.json", check_tree) and ok
    ok = step("progress key", check_progress_key) and ok
    ok = step("qa_packs.py", run_qa) and ok
    print("\n" + ("SMOKE PASSED" if ok else "SMOKE FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
