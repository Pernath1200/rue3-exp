# STATUS · rue3-exp

**Last audit:** 2026-07-29 (Grok team)

## Current state
- Live: https://pernath1200.github.io/rue3-exp/
- Version: v0.1 A0 (shell + practice + progress)
- Charter: careful mode · no student deploy until **amber**
- Insights/etymology: restored to `data/insights/etymology.json` (working subset). Full 131k version still under name-clash path if needed.

## Known clutter (safe local tidy)
Name-clash folders from 2026-07-28 still present:
1. `data/insights (# Name clash 2026-07-28 rphlewC #)/` — full etymology lives here
2. `docs/poster-slides (# Name clash 2026-07-28 2gwjncC #)/` — PNG assets (not runtime-critical)
3. `projects (# Name clash 2026-07-28 uzo2axC #)/` — contains the 24 Jul handoff (now also restored to `docs/handoffs/`)

**Recommended local rename (PowerShell from repo root):**
```powershell
# After confirming data/insights/etymology.json is acceptable or replaced with full
Remove-Item -Recurse -Force "data\insights (# Name clash 2026-07-28 rphlewC #)" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "docs\poster-slides (# Name clash 2026-07-28 2gwjncC #)" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "projects (# Name clash 2026-07-28 uzo2axC #)" -ErrorAction SilentlyContinue
```
Or simply rename the clash folders to clean names if you prefer to keep the full etymology / images.

## This week focus (2026-07-29 → 08-01)
1. **Rupl-exp** — A1 smoke + ship Saturday (hard deadline)
2. **RUE2** — promote `rue2-grok-v1.0` to stable label (low effort)
3. **Rue3-exp** — incremental toward amber (fruit/gates honesty, dud control on hot packs, remove clutter)
4. Rucz — parked

## Smoke quick start
```
py -m http.server 8091
# then ?smoke=all or author unlock + Force due
```

See `docs/handoffs/SESSION-2026-07-24.md` for last detailed session notes.
