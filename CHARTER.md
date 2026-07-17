# RUE3 Grok v0.1 — Charter

**Status:** locked 2026-07-16 · careful mode · shell only (no student deploy yet)  
**Sibling:** [RUE2 Grok (live)](https://pernath1200.github.io/rue2-grok/) — visual/layout source of truth  
**This folder:** greenfield rebuild. Legacy `projects/rue3`, `rue3-grok`, forks = archive/reference only.

---

## Purpose

Vocabulary half of the Tree Model for Czech learners of English.

| App | Domain | Tree metaphor |
|-----|--------|----------------|
| **RUE2** | Grammar | Roots |
| **RUE3** | Lexis | Trunk + leaves (+ word-craft later) |

Integration = same product language (dark UI, tree, CEFR, honest progress), then deep links / shared progress later — **not** a codebase merge in v0.1.

---

## Locked decisions

1. **Greenfield** — new app in `rue3-grok-v0.1`. Do not polish legacy RUE3 into the product.
2. **Visual** — match RUE2 *layout, fonts, density, dark underground tokens*; accent is **one shade off** RUE2 cyan so the apps feel related but distinct.
   - RUE2 accent (theme-cursor): `#569cd6`
   - RUE3 accent: `#4db6c7` (teal-cyan sibling)
   - Shared base: bg `#0d0d0d`, surface `#141414`, text `#ffffff`, muted `#a0a0a0`, font Segoe UI / system-ui
3. **Entry** — **level rail first**, then tree within that level.
4. **A1 content** — **mostly trunk** (frames / chunks / high-freq); **a few tiny branches/leaves only** — not the full 12-house system.
5. **C1** — on the rail, **greyed “not yet”** — no content obligation.
6. **Student access** — **none for a few weeks**. Local only. No Pages/Netlify until amber.
7. **Padlet vocab** — **fully postponed** until this app is **amber (Near)** on Coherence.

---

## Level rail

A strip of CEFR bands the student selects before (or as frame for) the tree:

`A1 · A2 · B1 · B2 · C1 (greyed)`

Selecting a level filters what the tree shows. C1 is visible but not enterable.

---

## Tree (vocab)

| Region | Role at A1 |
|--------|------------|
| **Trunk** | Support for growth — frames, chunks, high-freq “glue” (including function words later) |
| **Leaves** | Domain lexis you can **produce** with — the productive side of the test |
| **Word-craft** | Later / side door — not A1 front door |

### Trunk vs leaf (locked 2026-07-16)

- **Leaf / fruit = production.** If you know the words in isolation but cannot make sentences with them, you do not yet have leaves/fruit.
- **Speaking / writing real sentences** with the domain words = fruit on that leaf.
- In the app: Match → Quiz → Word builds recognition; **Sentence mode is where the leaf becomes fruit.**
- **Trunk** feeds that production (frames, patterns, glue) — it is not a second dumping ground for word lists.

### Seed kit + Be/Have (locked)

- **Bootstrap:** ultra-basic fillers live *inside* Trunk frames (not a full leaf).
- **First trunk pack:** Be & Have · 12 lines · whole sentence (Match/Quiz) + gap (Word) + full EN from CZ (Sentence).
- **Trunk live (A1):** Be/Have · prepositions · adjectives · can/like/want · there/time.
- **Leaves live (A1):** Home & Family · Places · Food & drink · Time & numbers · Free time · Work (small).
- Seed stays tiny inside frames; leaves stay domain-rich but not full 12-house.

Progress on the tree must be **truthful** (touched / not). No fake glow.

---

## Content unit (when practice lands)

Prefer frames over isolated word dumps:

- lemma or chunk  
- `level` + `tree_node` + `codex_unit`  
- sentence with **one** forced gap  
- short hint ladder (English → stronger → optional L1 later)

Codex remains unit law for ids; UI does not invent competing taxonomies.

---

## Vertical slice (build order)

1. **Shell (this session)** — level rail + tree board + charter (done when you can open localhost and see the map).  
2. **One A1 practice loop** — trunk node, good frames only.  
3. **Honest “touched” state** on the tree.  
4. **Only then** — more nodes / A2 / student host / Padlet export.

---

## Explicitly out of scope until amber

- Student hosting  
- Padlet vocab work  
- C1 content  
- Full 12-leaf system at A1  
- Merging with RUE2 codebase  
- Polishing legacy RUE3  
- Placement, personal sets, exam modes, gamification  

---

## Careful mode

- One charter · freeze it  
- One vertical slice at a time  
- RUE2 patterns by default  
- No “while we’re here” features  
- Pause after each slice for human smoke feel  

---

## Pipeline (later)

```
Codex → RUE3 (source of practice) → Padlet (optional export)
```

Padlet is not a second authoring front until RUE3 is Near.
