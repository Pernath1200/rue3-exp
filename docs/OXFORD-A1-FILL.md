# Oxford A1 → RUE3 sapling fill plan

**Status:** draft map 2026-07-17 · careful mode · no content written yet  
**Goal:** cover **all or most** Oxford A1 forms before A2 unlock, without breaking the tree model.  
**Source:** `oxford_3000_A1_sorted.csv` (~898 unique forms).  
**Now live:** ~300 lemmas · ~28–30% automatic hit rate · **~640 missing**.

---

## 1. How coverage is defined (important)

| Kind of Oxford form | How RUE3 covers it | What “covered” means |
|---------------------|--------------------|----------------------|
| **Domain lexis** (dog, red, jacket…) | **Leaf** Match/Quiz/Word + Sentence fruit | Explicit `{en,cz}` card |
| **High-freq verbs** (go, make, need…) | **Trunk frames** (primary) + optional verb leaf | Preferred sentence + gap, *or* leaf lemma |
| **Adjectives / describing** | Trunk **be + adj** frames + Free time feelings leaf | Frame and/or leaf |
| **Function / grammar words** (and, of, will, some…) | **Trunk glue frames only** — never a 100-item dump leaf | Appears in live frames as usable English |
| **Social formulae** (hello, thanks…) | Small **chunk / social frames** pack | Whole line practice |

**Gate rule (proposed):** A2 unlock requires Oxford A1 **content** coverage ≥ **~90%** of non-grammar forms, **and** a thin scored check. Pure function words need **productive frame exposure**, not 1:1 cards.

Rough split of the **~640 missing**:

| Bucket type | ~N | Scheme role |
|-------------|---:|-------------|
| Clear domain leaves (extend or new) | ~180 | Leaf cards in 12s |
| Core verbs | ~90 | Frames first, leaf second |
| Describing words | ~90 | Adj frames + feelings leaf |
| Grammar / function | ~110 | Glue frames (clusters) |
| Social | ~10 | Chunk frames |
| General core + topic misc (to sort) | ~170 | Re-home into leaves/frames |

---

## 2. Sapling shape after fill (A1 still a sapling, denser canopy)

```
TRUNK (frames / glue)                    CANOPY (leaves / fruit)
─────────────────────                    ───────────────────────
Be / Have              ✓                 Home & Family        ✓ → extend
Prepositions           ✓                 Places               ✓ → extend
Adjectives             ✓ → grow          Food & drink         ✓ → extend
Can · like · want      ✓ → grow          Time & numbers       ✓ → extend
There · time           ✓ → grow          Free time            ✓ → extend
Core verbs (new)                         Work                 ✓ → light extend
Social chunks (new)                      Colours              NEW
Function glue packs (new, few)           Clothes              NEW
                                         Body                 NEW
                                         Animals              NEW
                                         School & study       NEW
                                         Tech & media         NEW
                                         Nature & weather     NEW
                                         Shopping & money     NEW
```

Still **not** a 12-house dump: new leaves are **thin** (1–3 blocks of 12), Oxford-mapped.

---

## 3. Bucket → placement (detail)

### A. Extend existing leaves

#### Home & Family (+ ~11–20)
**Add:** aunt, uncle, cousin, mum, dad, grandparent, grandfather, grandmother, boyfriend, girlfriend, parent…  
**Maybe from misc:** adult, person, birthday  
**Blocks:** new `family_wider+` or expand `family_wider` / `family_people` (keep ≤12 per block → split).

#### Places (+ ~15–25)
**Add travel slice:** village, road, boat, flight, journey, trip, tourist, traffic, passport, vacation…  
**From misc:** country, farm, library, museum, cinema, theatre, police, pool, building…  
**New block:** `places_travel` or `places_culture`.

#### Food & drink (+ ~8–20)
**Add:** sandwich, pepper, dish, delicious, cooking, diet, café (spelling), plus misc if any food left.  
**Optional block:** `food_extra` only if ≥8 items.

#### Time & numbers (+ ~40)
**Numbers:** eleven–nineteen, thirty–ninety, thousand, million, ordinals first–fifth…  
**Time words:** month, year, often, never, sometimes, soon, ago, tonight, midnight, half, quarter, once, twice, century, date, past, future…  
**Blocks:** `time_numbers_2`, `time_adverbs`, finish months if needed (already have months).

#### Free time (+ ~25–40)
**Hobbies/media:** game, guitar, band, cinema, concert, festival, movie, piano, dancing, exercise, team, match…  
**Feelings/adj not on trunk:** boring, exciting, interesting, favourite, funny, great…  
**Verbs of leisure** if not in core-verb frames: draw, paint (also arts).

#### Work (+ ~10–15)
career, business, customer, manager already partly there; add worker, interview, meeting already…  
Keep small — heavy “study” goes to **School**.

---

### B. New leaves (each seed-sized)

| New leaf | ~Oxford items | Blocks (target) | Notes |
|----------|---------------:|-----------------|-------|
| **Colours** | ~10–12 | 1×12 | red… + light/dark if needed |
| **Clothes** | ~14 + wear | 2×12 | + shoe/boot variants |
| **Body** | ~14 | 1–2×12 | body parts only |
| **Animals** | ~12 | 1×12 | basic set |
| **School & study** | ~20–35 | 2–3×12 | class, exam, homework, pen… + study nouns from misc |
| **Tech & media** | ~14–25 | 2×12 | phone/computer may overlap Work/Home — dedupe preferred one home |
| **Nature & weather** | ~15–25 | 2×12 | weather + landscape; seasons from misc |
| **Shopping & money** | ~12–20 | 2×12 | buy/sell/price + pound/euro |

**New leaf word count target:** ~**120–160** cards.

---

### C. Trunk — verbs & adjectives (production glue)

#### Core verbs (~90 missing)
Do **not** dump 90 Match cards alone.

1. **Trunk pack(s)** `a1_core_frames_verbs_*`  
   - Clusters of 10–12 **model sentences** each (present simple daily life).  
   - Gap on verb *or* object (pick one policy per pack).  
   - Priority verbs for frames: *need, want (have), like, go, come, live, work, make, do, get, have, see, look, know, think, say, tell, ask, give, take, find, use, try, start, stop, help, play, watch, listen, read, write, eat, drink, buy, call, meet, open, close, put, keep, leave, wait, walk, run, drive, sleep, wake, wash, clean, cook, sit, stand, bring, send, speak, understand, remember, forget, feel, become, begin…*

2. **Leaf** `leaf_verbs_a1` (optional second pass)  
   - Only verbs **not** yet secure from frames.  
   - 2–3×12 of bare lemmas for recognition speed.

#### Describing words (~90)
1. **Extend** Adjectives trunk: second block (size/age already; add easy/hard, new/old already partly, beautiful, important, famous…).  
2. **Free time · feelings** already has some; add opposite pairs carefully.  
3. **Directions as adj:** north/south/east/west → Places or Nature, not personality.

#### Social chunks (~10)
One tiny frame pack: *Hello. / Hi. / Goodbye. / Bye. / Thanks. / Thank you. / Please. / Yes. / Yeah. (careful) / Oh.*  
Or leaf **Social** 1×12 if you prefer Match for these.

#### Function / grammar (~110)
**Frames only**, grouped by pattern (not alphabetical dump):

| Glue pack | Teaches via sentences |
|-----------|------------------------|
| Articles & this/that | a/an/the, this/that/these/those |
| Pronouns | me/him/her/us/them, my/your… (some in Be/Have) |
| And/but/or/because | clause glue |
| Some/any/no/every… | quantity (shopping-ready) |
| Prepositions (time/move) | at/on/in time, to/from/into/out of (place pack already has place) |
| Aux & modals | do/does/did light, can already, must/should/will/would in tiny set |
| Wh- questions | what/where/when/who/why/how frames |
| Frequency | always/often/sometimes/never (overlap Time leaf) |

**Target:** 3–5 glue packs × 10–12 frames ≈ **40–60 frames**, covering the *use* of most function words without 110 leaf cards.

---

### D. “Topic misc” + “general core” (~170) — re-home rules

Sort each item with this priority:

1. Fits an **existing or planned leaf** → put there.  
2. Is a **high-freq verb/adj** → trunk.  
3. Is **abstract noun** (idea, problem, reason, example…) → small **General / classroom** leaf **or** school leaf.  
4. Still orphan → **A1 overflow block** `a1_core_misc` (last resort, max 2×12), rest accept as A2 if rare.

**Classroom / abstract mini-leaf** (recommended):  
idea, problem, example, question, answer, word, sentence, story, page, list, information, interest, opinion, reason, result, plan, project… (~1–2×12 under School or new **Ideas & text**).

**Arts mini-block** (under Free time or School):  
art, artist, paint, painting, draw, picture, photo, photograph, film/movie, music already…

**People roles:** actor, actress, farmer, police, scientist, singer… → Work jobs block 2 or Free time.

**Seasons:** spring, summer, autumn (+ winter if missing) → Nature & weather.

---

## 4. Volume after fill (honest estimate)

| Layer | Now | After fill (approx) |
|-------|----:|--------------------:|
| Leaf cards | 252 | **~450–550** |
| Trunk frames | 58 | **~120–160** |
| Unique content lemmas | ~290 | **~750–850** toward 898 |
| Function words as leaf cards | few | **still few** (by design) |
| Function words in frames | partial | **most common patterns** |

**“Most Oxford A1”** ≈ content leaves + verb/adj exposure + glue frames.  
**“Every row as its own Match card”** ≈ wrong product for the tree.

---

## 5. Build phases (draft order)

Work in **vertical slices**: list approve → JSON → tree wire → smoke. Prefer **extend existing** before **new leaf**.

| Phase | What | ~new cards/frames | Why first |
|-------|------|------------------:|-----------|
| **P1** ✓ | Numbers + time adverbs + family extras + food extras + travel/out | **96** leaf (8×12) | Done 2026-07-17 · extend existing only |
| **P2** ✓ | Colours · Clothes · Body · Animals | **60** leaf (5×12) | Done 2026-07-17 · 4 new leaves |
| **P3** ✓ | School · Tech · Nature · Shopping | **120** leaf (10×12) | Done 2026-07-17 · 4 new leaves |
| **P4** ✓ | Core verb frames (daily · say · action) | **36** frames | Done 2026-07-17 · gap on verb |
| **P5** ✓ | Adj frame block 2 + Free time feelings/hobbies | **+12 frames · +24 leaf** | Done 2026-07-17 |
| **P6** ✓ | Social + Wh-Q + some/any + linkers + modals | **60** frames | Done 2026-07-17 · glue not dump |
| **P7** ✓ | Verbs more×2 · adj×12 · Work/School/Free extend · Ideas leaf · pronouns | **+36 frames · +84 leaf** | Done 2026-07-17 |
| **P8** ✓ | Thin A1 gate (12+12+6 · 80%) → unlock A2 | — | Done 2026-07-17 · residue → A2 |

After each phase: `py scripts/oxford_a1_coverage.py` and update %.

---

## 6. Content rules (keep quality)

1. **12 items per block** (8–12 for frames).  
2. **British default** (colour, grey, trousers, flat already…); US in `accepts` only when common.  
3. **Dedupe:** one home per lemma (e.g. *phone* not in three leaves).  
4. **No Cars leaf.**  
5. **Martin personal sets** stay out of general A1.  
6. **CZ glosses** natural learner Czech.  
7. Multiword Oxford (*have to*, *no one*) → frames or fixed chunks, not broken tokens.  
8. Progress keys: new block ids always unique.

---

## 7. Tree UI note

More leaves → canopy denser. Layout already sapling-based; if labels collide, second layout pass (smaller type / two canopy rings). Not a reason to avoid coverage.

---

## 8. Decisions for James

| # | Question | Proposal |
|---|----------|----------|
| O1 | Cover grammar words as leaf cards? | **No** — frames only |
| O2 | Bare verb leaf in addition to frames? | **Yes, light**, after frames |
| O3 | New leaves list OK? | Colours, Clothes, Body, Animals, School, Tech, Nature, Shopping |
| O4 | Gate threshold | **~90% of non-grammar Oxford A1** + thin check |
| O5 | Start phase | **P1** (extend existing) |

---

## 9. Next action

1. Freeze O1–O5 (or edit).  
2. Generate **P1 exact word lists** (12s) for approval.  
3. Implement P1 only, re-run coverage, then P2…

*Generator helpers:* `scripts/oxford_a1_coverage.py`, `scripts/oxford_a1_gap_map.py`
