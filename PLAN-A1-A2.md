# RUE3 Grok v0.1 — Audit & Plan · A1 → A2

**Status:** planning draft 2026-07-17 · careful mode · **same path, no redesign**  
**Frozen:** D3 A2 locked until A1 check · D9 slip cut = A0+adj+food+thin gate · no content order swaps  
**Done:** Stage **A0** progress + rail locks + author unlock + tree honesty (2026-07-17)  
**Done:** Stage **A1-T1** adjectives seed · 12 frames · `trunk_adjectives_a1` (2026-07-17)  
**Done:** A1 content map filled — all planned trunk + leaves live (2026-07-17).  
**Dropped:** spiral “Today’s mix” — not needed; variety later via SRS.  
**Done:** A1 thin gate → unlock A2 (P8 · 2026-07-17). Grammar residue + low-freq content parked for A2.  
**Scope of this doc:** thorough A1 completion + A2 scaffold-to-full + unlock gates.  
**Out of band here:** full B1/B2 content maps (only unlock + word-craft *hooks*).  
**Folder law:** greenfield `rue3-grok-v0.1` only. Legacy RUE3 = archive.

---

## 0. Non-negotiables (do not deviate)

These are already working and **locked** by practice + charter. New work extends them; it does not invent a second product.

| Pillar | Rule |
|--------|------|
| **Tree model** | Trunk = frames / glue / production support. Leaf = domain lexis you can **produce** with. Fruit = Sentence mode (leaves free production; trunk = reproduce model EN from CZ). |
| **Practice ladder** | Match → Quiz → Word → Sentence. Enter advances; Sentence Shift+Enter = newline. |
| **Content shapes** | Leaves: `{en, cz}` (+ optional accepts later). Frames: `{en, cz, gap, gap_answer, accepts?, gap_accepts?, diagram?}`. Pack: `practice: "frames" \| omit`. |
| **Grading** | Preferred model in `en` / `gap_answer`. `accepts[]` = full variants. `gap_accepts[]` = Word-only synonyms. Never put bare preps in `accepts` alone. |
| **Bootstrap** | Seed kit lives **inside** Be/Have (and similar frames), not a dump leaf of function words. |
| **Visual** | RUE2 layout density; accent `#4db6c7`; dark underground; Segoe UI. Diagrams = rare trunk aid (prepositions), not decoration everywhere. |
| **Honesty** | Progress is touched / completed / gate-passed — **no fake glow**. |
| **Local only** | No student host until amber. `localStorage` OK for progress/gates. |
| **Careful mode** | One vertical slice at a time; approve content lists when unsure; pause for smoke feel. |
| **Not A1** | Full 12-leaf house system, Cars (Martin-personal), Padlet, full SRS algorithm, RUE2 merge, word-craft (that is **B1+**). |

### Charter tensions to resolve (small freezes, not redesigns)

| Current charter | New intent | Proposed freeze |
|-----------------|------------|-----------------|
| A2 selectable on rail; only C1 locked | Level test unlocks A2 (then B1 after A2) | `levels_locked` becomes **dynamic**: default lock A2/B1/B2/C1 until gates pass (teacher override later). |
| “Exam modes” out of scope until amber | A1→A2 **gate test** is product-critical | Gate test is **not** exam theatre — it is a **thin mixed practice** using the same ladder pieces. Name it **Level check**, not “exam”. |
| Vertical slice: honest touched before more nodes | We need more A1 content *and* progress | Ship **minimal progress** early (touched per block) **before** flooding A2 content. |
| README still says “no practice engine” | Stale | Update when A1 gate ships. |

---

## 1. Audit — what exists now

### 1.1 Live inventory (2026-07-17)

| Node | Kind | Pack | Blocks × items | Engine mode |
|------|------|------|----------------|-------------|
| Core frames (Be/Have) | trunk | `a1_core_frames_be_have.json` | 1 × 12 | frames |
| Prepositions (place seed) | trunk | `a1_core_frames_prepositions.json` | 1 × 10 + diagrams | frames |
| Home & Family | leaf | `a1_home_family.json` | 4 × 12 = **48** | words |
| Places | leaf | `a1_places.json` | 4 × 12 = **48** | words |
| Work | leaf | — | stub | — |
| Word-craft | craft | — | parked B1+ | — |

**Totals live A1:** ~22 trunk frames + **96** leaf words · **4** live nodes · practice engine complete for both modes.

### 1.2 Engine strengths (keep)

- Match `doneIds` (pairs stay marked).
- Quiz 1–4 keys + auto-advance.
- Word retry-wrong (N).
- Frame Sentence = full EN from CZ + retry-wrong.
- Leaf Sentence = free production to block size (usually 12).
- `accepts` / `gap_accepts` split (forGap) — prepositions-safe.
- Multi-word gaps (`next to`, `in front of`) work via `norm`.
- Diagram hook for trunk preps only.

### 1.3 Gaps (product, not “polish”)

| Gap | Why it blocks “complete A1” |
|-----|-----------------------------|
| **No progress store** | Tree cannot be honest; no “touched / fruit” signal. |
| **No spiral mix** | Textbook gap = reps; student redoes same block only. |
| **No level gate** | A2 is free; gate story is fiction. |
| **Thin trunk** | Missing adjectives, can/like/want, there is/are expansion, time frames. |
| **Thin leaves** | No Food, Time/numbers, Free time/feelings, Work, Daily routine. |
| **Overlap debt** | Places · directions re-lists preps that live on trunk (near, next to…) — OK as leaf lexis but confuses “where do I learn X?” |
| **Tree layout** | 2+ trunk kids stack upward; 5+ leaves will crowd SVG (480×340). |
| **Stale docs** | README/charter lag live product. |
| **No content QA script** | Duplicate lemmas, missing gaps on frames, empty cz — easy to ship broken JSON. |

### 1.4 Known friction / bug risks (engine)

| Risk | Symptom | Mitigation |
|------|---------|------------|
| **norm strips leading a/an/the** | Leaf answer `the` never grades; rare. Frame “The ball…” still OK because article is mid-sentence after strip of whole string… actually whole-string strip only leading article once — full sentences OK. | Document: never use bare article as sole lemma. |
| **Full-sentence `accepts` also count in Word** | Student pastes whole sentence into gap → marked correct. | Acceptable leniency; or later grade gap-only when `forGap`. |
| **Quiz distractors** | With 10 frames, only 9 wrong options; OK. Blocks of 12 OK. Block of &lt;4 items breaks 4-opt quiz. | Enforce **min 8 items** per block (prefer 10–12). |
| **Match only 6 of N** | Fine for learning; gate must not rely on Match alone. | Level check uses Quiz + Word + short Sentence sample. |
| **Leaf Sentence ungraded** | Free production — correct by design; “fruit” = wrote N sentences, not grammar-checked. | Gate must **not** depend on free Sentence quality; use **frame Sentence** for scored production. |
| **Duplicate EN across blocks** | Quiz/match within block only — OK. Spiral mix can show same lemma twice. | Spiral dedupe by `en`+pack id. |
| **Diagram only for known keys** | Unknown `diagram` key → empty. | Content review checklist. |
| **localStorage wipe** | Progress/gates vanish on clear data. | Teacher: export later; for now document reset. |
| **CORS / file://** | Must use `http.server`. | README already says so. |
| **Keyboard conflicts** | Enter + textarea rules mostly solid. | Re-smoke after any chrome change. |
| **Tree `levels` filter** | Node with `["A1","A2"]` shows on both — intentional for shared leaves later; careful with A1-only vs A2-only packs. | Prefer **separate content files** per level even if label reuses “Work”. |
| **Auto-select first live node** | Always Core frames on boot — fine. | After progress, prefer last node. |

### 1.5 Content quality notes (live packs)

**Home & Family** — solid A1 core; Martin-aligned; no Cars. Gaps: food is missing entirely (was merged in Martin “Home & Food”).  
**Places** — good high-freq cut. Directions block mixes **prep lemmas** with motion verbs — trunk already owns prep *frames*; leaf can keep short forms for production but avoid teaching preps *only* here.  
**Be/Have** — good seed; `accepts` strong on have got.  
**Prepositions** — worksheet-faithful; opposite/near weaker diagrams (dashed); OK for seed.

### 1.6 External sources (map, don’t dump)

| Source | Role |
|--------|------|
| Martin `a1-practice.html` | Topic banks + ladder inspiration. **Cars = personal — not general A1.** |
| `basic-prepositions.html` | Diagram + prep set (done). |
| Speakout Elementary | Lesson-tagged mini-blocks later; map to tree nodes. |
| Oxford 3000 A1 CSV | Coverage check / gap finder — **not** a dump list into the app. |
| RUE2 live | Visual + UX density only. |

---

## 2. What “complete” means

### 2.1 Complete A1 (end of day target — ambitious; define honesty)

**A1 is complete when:**

1. **Trunk seed kit is enough to produce** simple present identity, possession, place, quality, ability/want, and existence:
   - Be & Have ✓  
   - Prepositions of place ✓  
   - Basic adjectives (frames or frame+leaf hybrid)  
   - Can / like / want (or like+want frames)  
   - There is / are (expand beyond one Be/Have line)  
2. **Leaves cover productive daily domains** (not every Oxford word):
   - Home & Family ✓  
   - Places ✓  
   - Food & drink (new)  
   - Time & numbers (new; thin blocks, not full calendar dump)  
   - Free time & feelings (new; thin)  
   - Work (small A1 slice — jobs + “I work…”)  
3. **Honest progress** — each live block can show touched / ladder peak (at least Word tried; fruit = Sentence finished for leaves; frame Sentence finished for trunk).  
4. **Spiral review** — one “Today’s mix” entry that samples known items (no due dates).  
5. **A1 Level check** — mixed scored run; pass unlocks A2 on the rail.  
6. **Smoke feel** — James can walk Martin through A1 without empty stubs on the map (stubs allowed only if greyed “next”).

**Not required for A1 complete:** full SRS, hosting, Padlet, every Martin lemma, adjectives as free leaf *and* trunk (pick one primary), perfect tree layout art.

### 2.2 Complete A2 (weekend target)

**A2 is complete when:**

1. A2 tree has its own **trunk frames** (past glue, comparatives/basic quantity, more function chunks) + **leaves** that extend A1 domains and add Travel/holidays, Health, Shopping/money, Routines past, Weather.  
2. A2 Level check unlocks B1.  
3. Same ladder + progress model; no new practice genre.  
4. Spiral can mix A1+A2 when on A2 (optional flag).

### 2.3 B1 / B2 (hooks only — next week / week after)

| When | Unlock | Content note |
|------|--------|--------------|
| After A2 gate | B1 rail open | **Word-craft** node unparks; morphology / word families / collocations as craft, not leaf dumps. |
| After B1 gate (later) | B2 | Full B2 section 1–2 weeks after B1 solid — not planned in detail here. |

---

## 3. Target tree maps

### 3.1 A1 tree (target end-state)

```
TRUNK
  ├─ Core frames · Be & Have          [live]
  ├─ Prepositions · place             [live]
  ├─ Adjectives · basic               [NEW · frames seed ~12]
  ├─ Can · like · want                [NEW · frames seed ~10–12]
  └─ There is / time hooks            [NEW · frames seed ~8–12]  OR fold time into Time leaf + short frames

LEAVES
  ├─ Home & Family                    [live · 4×12]
  ├─ Places                           [live · 4×12]
  ├─ Food & drink                     [NEW · 3–4×12]
  ├─ Time & numbers                   [NEW · 3–4×12 · thin]
  ├─ Free time & feelings             [NEW · 3×12]
  └─ Work                             [NEW · 2×12 A1 slice]

META (not tree fruit)
  ├─ Today’s mix (spiral)             [NEW · synthetic pack]
  └─ A1 Level check                   [NEW · gate]
```

**Sizing guardrails**

| Unit | Size | Rationale |
|------|------|-----------|
| Frame seed block | 8–12 items | Match 6-subset; Quiz needs ≥4 distractor pool |
| Leaf block | **12** items standard | Sentence target = block length |
| Leaf node | 2–4 blocks | Productive domain without 12-house sprawl |
| A1 leaf lemmas (rough) | ~200–280 | Productive core, not Oxford dump |
| A1 trunk frames | ~50–60 lines | Glue only |

### 3.2 A2 tree (target end-state) — **vocab redesign 2026-07-20**

> **Grammar (tense, aspect, comparison-as-structure) = RUE2 roots, not RUE3.**  
> See `docs/A2-VOCAB-NOT-GRAMMAR.md`.

```
TRUNK (A2) — few bands, thickening only
  ├─ Core · recycle (A1 frames, denser slots)     [lexis frames]
  ├─ Core · high-freq A2 lexis                     [gap on lemma]
  └─ Everyday chunks (phrases)                     [V_PHR · not tenses]

CANOPY (A2) — main mass · themed leaves
  ├─ Travel · Health · Home · Work · Family · Food · Shopping
  ├─ Routine · Free time · Nature · Tech · School · …
  └─ (optional later: split mega describing/verbs into themes)

NOT ON RUE3 A2
  ✗ Past / Perfect / Future / Compare / Quantity-grammar / Time-prep units

META
  ├─ Today / SRS (thickens A1 automation in background)
  └─ A2 Level check → unlock B1 (later)
```

A2 leaves use files `a2_*.json`. Prefer domain lexis over grammar frames.

---

## 4. Progress & unlock model (minimal architecture)

Do **not** build a second app. Add one small module, e.g. `js/progress.js`, used by `app.js` + gate.

### 4.1 Storage schema (localStorage)

```json
{
  "v": 1,
  "unlocked": ["A1"],
  "blocks": {
    "be_have_seed": {
      "touchedAt": "...",
      "modes": { "match": true, "quiz": true, "type": true, "sentence": true },
      "bestQuiz": 10,
      "typeScore": [10, 12],
      "sentenceDone": true
    }
  },
  "gates": {
    "A1": { "passed": false, "score": null, "at": null, "attempts": 0 }
  }
}
```

**Touched (honest):** any mode started on that block.  
**Fruit (leaf):** `sentenceDone` after N free sentences.  
**Fruit (trunk):** frame Sentence pass finished (score recorded, not free write).  
**Node status UI:** derive from child blocks — all untouched / partial / fruit. Still no fake “mastered 100%” glow.

### 4.2 Level rail rules

| Level | Default | Unlock condition |
|-------|---------|------------------|
| A1 | open | always |
| A2 | locked (grey like C1, tag “locked”) | A1 Level check **pass** |
| B1 | locked | A2 Level check **pass** |
| B2 | locked | B1 gate later |
| C1 | locked forever (for now) | charter |

**Teacher escape hatch (local):** `?unlock=all` or util-bar “Unlock for authoring” — only in local shell, not student story. Prevents James getting stuck while writing A2 content.

### 4.3 A1 Level check design

**Not an exam mode.** Reuse practice primitives in a **fixed sequence**.

| Phase | What | Items | Score? |
|-------|------|-------|--------|
| 1 Quiz mix | MC from leaves + frame EN prompts | 12 | yes |
| 2 Word mix | type-in: half leaf lemmas, half frame gaps | 12 | yes |
| 3 Frame sentences | full EN from CZ (trunk models only) | 6 | yes |

**Pass bar (proposed):** ≥ **80%** of scored items (24/30). Retry unlimited; record attempts.  
**Pool rules:** sample only from blocks with `touched` if ≥ N blocks touched; else sample from **all live A1** so gate is still finishable (document this — avoids soft-lock).  
**No free leaf Sentence in gate** (ungraded).  
**Pictures:** include prep items so diagrams appear where keyed.

**Bugs to anticipate**

| Bug | Fix |
|-----|-----|
| Empty pool | Fallback all live A1 |
| Frames vs words mixed wrongly | Tag every item with `kind: "frame"|"word"` in sampler |
| Pass unlocks but rail doesn’t redraw | Call `renderRail()` after gate write |
| Double-count attempts on refresh mid-test | Persist gate session id or only count on submit |
| Student clears storage → A2 locks again | Accept for v0.1; show “progress local to this browser” |

---

## 5. Spiral review (“Today’s mix”)

**Purpose:** textbook gap = reps before full SRS.  
**Not:** due dates, SM-2, queues.

**Behaviour**

1. Entry from map: synthetic node or util action **Today’s mix**.  
2. Build pool = items from blocks with any touch (or last 7 days if timestamps exist).  
3. Cap 12–16 items; prefer spread across ≥3 nodes.  
4. Run **Quiz → Word only** (optional short Match). No free Sentence required.  
5. Does not invent new grading.

**Bugs:** empty if nothing touched → message “Practice any block first”; all from one block → force re-sample with max-per-block.

---

## 6. A1 build stages (execution order)

Each stage = **one vertical slice**. Smoke before next. Content lists approved when domain is large.

### Stage A0 — Foundation (do first, ~half day)

| Deliverable | Detail |
|-------------|--------|
| `js/progress.js` | load/save, mark mode complete, unlock helpers |
| Tree honesty | live node tint / badge: untouched · partial · fruit |
| Rail locks | A2/B1/B2 grey until unlock; C1 stays not-yet |
| Author unlock | local escape hatch |
| Content QA | tiny node script or checklist: every frame has gap+gap_answer; blocks ≥8; unique ids |

**Exit:** refresh browser → progress persists; A2 locked; Core frames still playable.

**Anticipated bugs:** JSON parse fail on corrupt storage → reset to default; race on rapid mode switch → write on mode complete only.

---

### Stage A1-T1 — Trunk: Adjectives seed

| | |
|--|--|
| File | `data/blocks/a1_core_frames_adjectives.json` |
| Size | ~12 frames |
| Pattern | `I am tired.` / `She is very kind.` / `It is cold.` gap on adjective |
| accepts | contractions (`I'm tired.`) |
| Tree | `trunk_adjectives_a1` live |

**Content domains (approve list):** size (big/small), age (old/new/young), quality (good/bad/nice), state (hot/cold/hungry/tired), people (friendly/kind).  
**Avoid:** long personality lists (those → Free time leaf lemmas if needed).

**Bugs:** Czech gender/adj agreement not graded (EN only) — show preferred EN only; student may write `She is hungry` from `Má hlad` style CZ — provide natural CZ that maps to be+adj.

---

### Stage A1-T2 — Trunk: Can / like / want

| | |
|--|--|
| File | `a1_core_frames_can_like_want.json` |
| Size | ~12 frames |
| Models | `I can swim.` `Do you like coffee?` `I want a ticket.` `I'd like a coffee.` |
| accepts | like/love where natural; would like ≈ want carefully |

**Bugs:** `I'd like` vs `I want` — put one preferred, other in accepts; gap on lexical head (`swim`, `coffee`) or on modal — **prefer gap on content word** like Be/Have, *or* gap on `can` for ability set only. Pick one policy per pack and stick to it.

---

### Stage A1-T3 — Trunk: There is / are + simple time hooks

| | |
|--|--|
| File | `a1_core_frames_there_time.json` |
| Size | ~10–12 |
| Models | There is a… / There are… / It's Monday. / It's three o'clock. (select carefully) |

**Bugs:** *there is/are* agreement; accepts for `There's`. Time expressions messy — keep **clock phrases minimal**; push days/months to Time leaf.

---

### Stage A1-L1 — Leaf: Food & drink

| | |
|--|--|
| File | `a1_food.json` · node `leaf_food_a1` |
| Blocks | meals · food · drink · café (3–4 × 12) |
| Source | Martin Home & Food (cut, no dump) |

**Bugs:** countable/uncountable not taught here (RUE2 grammar); lemmas only.

---

### Stage A1-L2 — Leaf: Time & numbers

| | |
|--|--|
| File | `a1_time_numbers.json` |
| Blocks | numbers 1–20+tens · days · day-parts · months (optional thin) |
| Note | Ordinals minimal; clock language mostly in frames |

**Bugs:** `second` noun vs ordinal — disambiguate in en string like Martin `(ordinal)`.

---

### Stage A1-L3 — Leaf: Free time & feelings

| | |
|--|--|
| File | `a1_freetime.json` |
| Blocks | sports/hobbies · verbs (play/watch/listen) · feelings (happy/tired…) |

**Bugs:** `play` vs `go` sports — lemma notes in `en` if needed; don’t over-split.

---

### Stage A1-L4 — Leaf: Work (A1 slice)

| | |
|--|--|
| File | `a1_work.json` · upgrade stub |
| Blocks | jobs (12) · work phrases as **words** not frames (office, meeting…) 12 |

Deep “I work for…” frames can live in can/like pack or tiny work frames later.

---

### Stage A1-S — Spiral “Today’s mix”

Wire synthetic entry + sampler. No new content files.

---

### Stage A1-G — A1 Level check + unlock A2

Gate pack can be **generated at runtime** from live A1 data (preferred — never drifts) **or** a frozen `a1_level_check.json` snapshot for stability.

**Recommendation:** runtime sample + fixed seed for reproducibility in smoke tests (`?seed=…` optional later).

**Exit criteria for “A1 complete” day:**

- [ ] All A1 nodes live (no accidental stubs on critical path)  
- [ ] Progress honest on tree  
- [ ] Today’s mix works with ≥1 touched block  
- [ ] Level check pass → A2 selectable  
- [ ] Hard-refresh keeps unlock  
- [ ] James smoke path ~20–30 min feels coherent  

---

## 7. A2 build stages (weekend)

Assume A1 complete + A2 unlocked for authoring.

### Stage A2-0 — Scaffold

- A2 nodes in `tree.json` (stubs → live as packs land).  
- Empty state message if A2 unlocked but no live nodes (shouldn’t happen if first pack ships with unlock).  
- Progress keys namespaced by level or block id globally unique (`a2_…` ids).

### Stage A2-T — Trunk packs (order)

1. **Past glue** — was/were, regular past of high-freq verbs *in frames* (not conjugation tables).  
2. **Quantity / some-any** — shopping-ready frames.  
3. **Time prepositions** in/on/at (with place contrast notes in CZ).  

### Stage A2-L — Leaves (order)

1. Travel & holidays  
2. Health & body  
3. Shopping & money  
4. Work & study (extend)  
5. Weather & nature  
6. Optional: Home extend  

Same 12-item blocks, 2–4 per leaf.

### Stage A2-S / A2-G

- Today’s mix includes A2 (+ optional A1).  
- A2 Level check → unlock B1 (rail only; word-craft still parked until B1 content slice).

---

## 8. Timeline (realistic vs aspirational)

| Window | Aspirational | Safe careful-mode |
|--------|--------------|-------------------|
| **End of day** | “Fairly complete A1” + gate | A0 progress/locks + A1-T1 adjectives + A1-L1 food + spiral stub **or** gate if content already enough for thin gate |
| **Tomorrow** | Finish remaining A1 leaves + full gate | A1-T2/T3 + L2–L4 + Level check |
| **Weekend** | Full A2 | A2 scaffold + 2 trunk + 3 leaves + A2 gate if time |
| **Next week** | Solid A1+A2+B1 | B1 unlock + word-craft **first slice** + polish A1/A2 gaps from Martin lessons |
| **Week +1–2** | Full B2 section | Separate plan after B1 shape known |

**Truth check:** A “fairly complete A1” in **one** day is only realistic if content lists are batch-approved and slices stay JSON-first (engine changes only A0 + spiral + gate). Engine features after that = risk of thrash.

**Recommended day plan (execute order):**

```
Morning   A0 progress + rail locks + QA checklist
Midday    A1-T1 adjectives + A1-T2 can/like/want (content)
Afternoon A1-L1 food + A1-L2 time (content)
Evening   A1-S spiral + A1-G level check
Buffer    Smoke + fix friction only
```

L3/L4 free time + work can slip to next morning without killing “fairly complete” if gate pools from what is live.

---

## 9. Content authoring protocol (keep quality high)

1. **Draft list** in chat or CSV → James approves.  
2. Write JSON only in `data/blocks/`.  
3. Wire `tree.json` node (`status: live`, `content`, `levels: ["A1"]`).  
4. Hard-refresh → open block → ladder once.  
5. Commit mental note: preferred model = textbook-ish British default; US variants in accepts only when common (e.g. flat/apartment later).  
6. **No Cars** in general A1.  
7. **Map Speakout lessons** to existing nodes; create `lesson_*` mini-block only if it doesn’t fit — prefer tagging `note` field.

### ID discipline

- Pack id: `a1_<domain>`  
- Block id: `<domain>_<facet>` unique globally  
- Tree node id: `trunk_*_a1` / `leaf_*_a1`  
- Never reuse block ids across packs (progress keys).

### Czech quality

- Natural learner CZ, not word-for-word.  
- Slash alternatives OK in `cz` for display; grading is EN-side.  
- Gender variants: put in cz string, not separate items unless lemma differs.

---

## 10. Engineering risk register (cross-cutting)

| ID | Risk | Likelihood | Impact | Guard |
|----|------|------------|--------|-------|
| E1 | Feature sprawl (SRS, hosting, merge RUE2) | med | high | Charter + this plan |
| E2 | Tree SVG overcrowding | high at 10+ nodes | med | Compact layout pass: smaller labels, scroll, or collapsible trunk group |
| E3 | Gate too hard / soft | med | high | 80% bar + unlimited retry; tune after Martin trial |
| E4 | Progress schema churn | med | med | `v: 1` + migrate or wipe once |
| E5 | Content dumps from Oxford/Martin | high | high | Always thin to 12s; approve lists |
| E6 | Prep taught twice (trunk vs Places) | already true | low | Document roles: trunk = frames; leaf = lemma for production |
| E7 | Keyboard / focus regressions | med | med | Smoke matrix after chrome edits |
| E8 | `practice: frames` forgotten on pack | med | high | QA script assert frames have gaps |
| E9 | Unlock A2 before A2 content exists | med | low | Author unlock; ship first A2 pack same day as gate if possible |
| E10 | Sentence free mode as “pass fruit” gamed | low | low | Fruit = finished N writes; gate ignores free text |

---

## 11. Smoke matrices

### 11.1 Per new pack

1. Tree node appears only on A1.  
2. Block list count correct.  
3. Match complete → Quiz complete → Word (retry wrong) → Sentence complete.  
4. For frames: multi-word gap; one accepts variant; diagram if any.  
5. Back to tree → progress shows partial/fruit.  
6. Ctrl+F5 → progress still there.

### 11.2 Gate

1. Fresh profile: A2 locked.  
2. Fail check: A2 still locked; attempt count +1.  
3. Pass check: A2 open; select A2 tree (may be empty/stub).  
4. Clear site data: A2 locked again.  
5. Author unlock: A2 open without pass.

### 11.3 Spiral

1. No touches → clear empty state.  
2. Touch one block → mix only from it.  
3. Touch three nodes → mix spreads.

---

## 12. Explicit non-goals (through A2 weekend)

- Student hosting / Pages  
- Padlet  
- Full SRS / due today algorithm (spiral only)  
- RUE2 codebase merge  
- Word-craft implementation (B1)  
- C1 content  
- Cars leaf  
- Placement test separate from A1 check  
- Accounts / cloud sync  
- Audio / speech recognition  
- Gamification (streaks, XP, leaderboards)  
- Full 12-house leaf system  

---

## 13. Decision log (freeze when James confirms)

| # | Decision | Proposed default | Needs James? |
|---|----------|------------------|--------------|
| D1 | Pass bar | 80% of scored gate items | soft |
| D2 | Gate composition | 12 quiz + 12 word + 6 frame sentences | soft |
| D3 | A2 locked until gate | yes | **yes** |
| D4 | Author unlock | yes local | soft |
| D5 | Adjectives as trunk frames (not leaf-only) | yes | soft |
| D6 | Food as own leaf (not under Home) | yes | soft |
| D7 | Spiral before or with gate | with / just before gate | soft |
| D8 | Runtime gate sample vs frozen JSON | runtime | soft |
| D9 | End-of-day must-have if time slips | A0 + adjectives + food + gate thin | **yes** |

---

## 14. Immediate next action (when leaving plan mode)

1. James confirms **D3/D9** (and any content order swaps).  
2. Execute **Stage A0** (progress + locks) — pure engineering, unblocks everything.  
3. Content lists for **Adjectives** + **Food** approved in one message each.  
4. Build packs → wire tree → smoke.  
5. Only then spiral + level check.

---

## 15. One-page summary

```
NOW     Be/Have · Preps · Home · Places · solid ladder · no progress · no gate
A1 DONE Trunk×5 · Leaves×6 · progress · spiral · A1 check → unlock A2
A2 DONE Trunk×3 · Leaves×5–6 · spiral+ · A2 check → unlock B1
B1+     Word-craft + richer lexis (separate plan)
PATH    Same frames/words JSON · same ladder · same dark UI · careful slices
```

*End of A1/A2 plan draft. Update this file only when a stage completes or a decision freezes.*
