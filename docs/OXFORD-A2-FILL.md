# Oxford A2 → RUE3 exp fill

**Status:** bulk fill shipped 2026-07-20 · experiment quality · refine later  
**Source:** `vocab_profiler/data/oxford_5000.json` · `level == A2`  
**Repo:** `rue3-grok-exp` only · branch `exp/autonomous`  
**Coverage target:** every unique A2 lemma has productive exposure (leaf card and/or frame)

---

## Coverage (post-fill)

| Metric | Value |
|--------|------:|
| Unique Oxford A2 lemmas | **867** |
| Covered in any live pack | **867** |
| Missing | **0** |
| Live A2 tree nodes | ~30+ |
| Total app items (all levels) | ~2200+ |

Scripts:

- `scripts/oxford_a2_export.py` → `docs/oxford_a2_lemmas.csv`
- `scripts/oxford_a2_gap_map.py` → bucket report + `docs/oxford_a2_gap_buckets.csv`
- `scripts/generate_a2_oxford_fill.py` → bulk packs + tree wiring
- `scripts/qa_a1_packs.py` → structure QA

---

## Placement rules (Codex)

| Kind | Home | Codex |
|------|------|-------|
| Domain themes | A2 leaves | `V_THM-A1B1-01`…`09` |
| Abstract / general / tech / society | leaves | `V_COR-A1B1-01` |
| Past / perfect / future / compare / quantity | trunk frames | `V_COR-A1B1-01` |
| Chunks + function glue | trunk frames | `V_PHR-A1B1-01` |
| Adjectives / adverbs / verb lists | leaves | `V_COR-A1B1-01` |

Function words are **not** only Match dumps — many also appear in glue frames. Verb **lemmas** live on `leaf_verbs_a2`; key patterns live in frame packs.

---

## A2 tree inventory

### Trunk (frames)

- Past · was/were (seed)
- Past · irregulars
- Present perfect
- Future · going to / will
- Comparatives
- Quantity
- Time preps
- Chunks & formulae
- Function glue

### Leaves (words)

Travel · Health · Home · Work · Family · Food · Shopping · Routine · Free time · Sport · Nature · Tech · School · Clothes · Feelings · Ideas · Society · Media · Describing · Adverbs · Verbs · General core

---

## Honesty notes

- **CZ is draft** — polish in later passes.
- **Overlap** with A1 packs is intentional for some high-freq items; coverage counts either.
- **Describing** leaf is large (~300 adj) — experiment dump; later may split or convert hard adj to frames.
- **Not** student-facing polish; `author_open` keeps A2 clickable on exp.
- Gate / A2 level check **not** part of this fill.

---

## Later improvements

1. CZ proofread  
2. Split mega Describing / Verbs into themed sub-blocks with better titles  
3. More verb **frames** (not only lemma list)  
4. A2 level check → unlock B1  
5. Codex mapping status → `app-integrated` when ready  
