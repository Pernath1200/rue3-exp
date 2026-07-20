# Oxford A2 → RUE3 exp fill (post redesign)

**Status:** canopy bulk remains · **grammar trunk removed** 2026-07-20  
**Source:** Oxford 3000 A2 band via `vocab_profiler`  
**Law:** `docs/A2-VOCAB-NOT-GRAMMAR.md`

---

## Product intent

| Layer | Role |
|-------|------|
| **Trunk (≤3)** | Recycle A1 words/phrases · A2 high-freq **lexis** frames · **chunks** |
| **Leaves** | Topic domains — main home for Oxford A2 **domain** words |
| **Not here** | Past/perfect/future/compare as teaching units → **RUE2** |

Coverage goal is still “every A2 lemma has a home,” but:

- Domain → theme leaf  
- Core verb/adj → lexis frames or temporary mega leaves (reshape later)  
- Pure grammar function → RUE2 / A1 recycle, **not** new A2 grammar floors  

---

## Live A2 trunk (correct)

1. `a2_core_frames_recycle.json` — Core · recycle  
2. `a2_core_frames_lexis.json` — Core · A2 lexis  
3. `a2_core_frames_chunks.json` — Everyday chunks  

Parked (grammar mistake): `data/blocks/_parked_grammar/`

---

## Scripts

- `oxford_a2_export.py` / `oxford_a2_gap_map.py` — still useful for leaf/lexis gaps  
- Do **not** reintroduce parked grammar packs to chase coverage %  

---

## Later

- Re-home mega Describing / Verbs / Adverbs into themes  
- Live sampler for recycle (pull random A1 frames)  
- Proto-branch SVG for canopy  
