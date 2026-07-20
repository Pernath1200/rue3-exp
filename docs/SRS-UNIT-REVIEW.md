# RUE3 · Unit-level review (SRS) — draft

**Status:** in progress 2026-07-19 · S1–S3 shipped (schedule + Today card + review queue)  
**Sibling note:** RUE2 already has **question-level** Leitner (`grammarQuizMemory`, boxes, due dates). RUE3 starts **unit-level** (tree node) so the three meters (Learned · Remembered · Mastered) can move honestly. Item-level can come later if needed.

---

## 1. Goals

| Goal | Detail |
|------|--------|
| Power meters 2–3 | Remembered = ≥1 successful review; Mastered = ≥4 |
| Close the textbook gap | Spiral return without full Anki |
| Stay honest | No calendar-age fake “memory”; only scored review events |
| Stay small | Unit grain first; reuse Quiz / Word / short Sentence — no new content format |

**Non-goals (this slice):** full SM-2, cloud sync, per-lemma strength bars, audio, student hosting.

---

## 2. Definitions (locked with three meters)

| Term | Meaning |
|------|---------|
| **Topic / unit** | Live tree node with content (e.g. `trunk_verbs_daily_a1`) |
| **Learned** | Fruit = Sentence mode completed on a block for that node *(exists)* |
| **Review** | A short scored pass on a **learned** unit when due |
| **Successful review** | Score ≥ pass bar on that review session (default **80%** of scored items) |
| **Remembered** | `successfulReps >= 1` |
| **Mastered** | `successfulReps >= MASTERY_REPS` (4) |

Failed review does **not** un-learn the unit (Learned stays). It steps the schedule back and may reduce `successfulReps` (see §5).

---

## 3. Storage (extend existing progress)

Key stays `rue3-v0.1-progress`. Schema already has optional `nodes: {}`.

```json
"nodes": {
  "trunk_verbs_daily_a1": {
    "learnedAt": "2026-07-18T12:00:00.000Z",
    "successfulReps": 2,
    "lastReviewAt": "2026-07-19T09:00:00.000Z",
    "nextDueAt": "2026-07-22T09:00:00.000Z",
    "intervalIndex": 2,
    "lastScore": [8, 10]
  }
}
```

| Field | Role |
|-------|------|
| `learnedAt` | Set once when unit first becomes fruit (or on first schedule) |
| `successfulReps` | Count of passed reviews (drives Remembered / Mastered) |
| `nextDueAt` | When unit may appear in “Due today” |
| `intervalIndex` | Index into interval ladder |
| `lastReviewAt` / `lastScore` | Debug + UI “last reviewed” |

**Bootstrap when Sentence completes:** if no node record, create one:

- `learnedAt = now`
- `successfulReps = 0`
- `intervalIndex = 0`
- `nextDueAt = now + INTERVALS[0]` (first review tomorrow by default)

Meters: Remembered still 0 until first **passed** review.

---

## 4. Interval ladder (thin, not Anki)

```js
// days until next review after a *success* at this step
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];
// index 0 = first review after learn (1 day)
// success → intervalIndex = min(i+1, last); nextDue = now + INTERVALS[newIndex]
// fail    → intervalIndex = 0; nextDue = now + 1 day; see §5 for reps
```

Cap daily queue: **`REVIEW_DAILY_CAP = 8`** units (A1-sized; raise later).

RUE2 reference (question-level): `REVIEW_INTERVAL_DAYS = [1, 1, 3, 7, 21, 60]` in `storage.js`. RUE3 stays shorter and unit-level on purpose.

---

## 5. Success / fail rules

**Session shape (per unit, one sitting):**

| Segment | Items | Source |
|---------|-------|--------|
| Quiz | 6 | Random from unit pack (MC) |
| Word | 6 | Random gaps / words |
| *(optional later)* 2 frame sentences | if frames pack | |

Total scored ≈ 12. **Pass if score ≥ 80%** (same spirit as A1 level check).

| Outcome | `successfulReps` | Schedule |
|---------|------------------|----------|
| Pass | `+= 1` | Advance interval ladder |
| Fail | `max(0, reps - 1)` *or* hold reps and only reset interval | Reset to 1-day due |

**Proposal (soft fail):** fail → `intervalIndex = 0`, `nextDueAt = +1d`, **do not** decrease `successfulReps` on first fail; decrease only if fail twice in a row (optional `failStreak`). Simpler v1: **never decrease reps; only delay**. Mastered stays sticky; honest “struggling” is in due frequency, not demoting the meter.

**v1 lock:** fail does **not** lower `successfulReps`. Only pass increases it. Fail only shortens interval.

“I was right → count it” during review: counts as correct for that item (same as practice).

---

## 6. UX surfaces

### 6.1 Home / tree (A1)

- Existing three meters (already shipped).
- Chip / button: **`Review due: N`** when `N = count nodes with nextDueAt <= now` among learned units.
- If N = 0: hide or show “No reviews due”.

### 6.2 Review session

- Entry: “Review due” → queue of up to CAP units (most overdue first).
- One unit at a time: short Quiz+Word (reuse `practice.js` pieces or thin `review.js`).
- End of unit: pass/fail feedback → update node → next unit or done.
- End of day queue: summary `Passed 3 · failed 1 · mastered +1`.

### 6.3 Unit detail panel

- Line: `Learned · reviewed 2× · next due Fri` / `Mastered`.
- No fake strength colours beyond meters.

---

## 7. Scheduling API (`progress.js`)

```text
onUnitLearned(nodeId)           // call from completeMode(..., sentence)
getDueUnits(limit) → nodeId[]   // nextDueAt <= now, fruit or has node record
recordReview(nodeId, { passed, score, total })
isRemembered(nodeId) / isMastered(nodeId)
```

`levelUnitStats` already reads `successfulReps` — no meter UI change once writers exist.

---

## 8. Implementation slices

| Slice | Work | Done when |
|-------|------|-----------|
| **S0** | Spec freeze (this doc + James OK on fail rule, CAP, session shape) | Decisions locked |
| **S1** | `onUnitLearned` + schedule on Sentence complete; inspect in localStorage | Fruit unit gets `nextDueAt` |
| **S2** | `getDueUnits` + “Review due: N” on tree | Count matches due nodes |
| **S3** | `review.js` session (Quiz+Word sample) + `recordReview` | Pass moves Remembered |
| **S4** | Detail panel next-due line; polish empty states | Smoke with 2–3 units |
| **S5** | (Later) item-level or RUE2-like Leitner inside unit | Optional |

---

## 9. Decisions to confirm

| # | Question | Proposed default |
|---|----------|------------------|
| R1 | Review grain | **Unit**, not lemma |
| R2 | First due after learn | **+1 day** |
| R3 | Pass bar | **80%** of review items |
| R4 | Fail lowers successfulReps? | **No** (v1) |
| R5 | Daily cap | **8 units** |
| R6 | Review modes | **Quiz + Word only** (no free Sentence grade) |
| R7 | Author unlock | Can force “due now” for testing? **Yes** (`?review=all` or util) |

---

## 10. Relation to RUE2

| | RUE2 | RUE3 (this draft) |
|--|------|-------------------|
| Grain | Question hash in memory bank | Tree node unit |
| Algorithm | Leitner boxes, multi-day ladder | Short unit ladder |
| “Mastered” UI | Family/topic best-score strength on roots | Meter 3 = 4 successful unit reviews |
| Today’s review | Existing “Today’s review: N items” | Add analogous unit button |

Do **not** copy RUE2’s question bank into RUE3. Share **product language** (due today, honest meters) and later deep-link progress if wanted.

---

## 11. Open risks

| Risk | Mitigation |
|------|------------|
| Too many units due after bulk fruit | Cap 8/day; stagger first due if bulk-learning |
| Review too long | Hard cap 12 scored items |
| Student only Matches, never Sentences | Never enters SRS — by design (Learned = fruit) |
| Clock skew / offline dates | ISO timestamps; due = local browser time OK |

---

## 12. Next step

1. James confirms **R1–R7** (or edits).  
2. Implement **S1 → S2 → S3** in order.  
3. Smoke: fruit unit → wait/force due → pass review → Remembered 1 → repeat to Mastered.

*Update this file when a decision freezes or a slice ships.*
