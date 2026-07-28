# Word roots (etymology) mode — RUE3 exp

**Status:** experimental · author-toggle only  
**Source of truth (planning):** Desktop `RUE3-PIE-ETYMOLOGY-MODE-PLAN.md`  
**Guiding principle:** Only solid, widely accepted etymologies. Dual-layer. Czech cognates when clear. Quality > coverage.

## Claim

Many high-frequency A1 English words are inherited from Proto-Indo-European via Germanic. For Czech learners the strongest payoff is **true cognates** (shared inheritance): *brother* ~ *bratr*, *water* ~ *voda*, *three* ~ *tři*. The mode shows quiet dual-layer history so the foreign word feels less foreign.

## Frozen for Stage A

- Entries: `data/insights/etymology.json` (schema version 1)
- Lemma key: lowercase English via `normLemma()` (strip `(…)`, take text before `/`)
- Paths: `germanic` | `latin` | `other`
- Optional fields: `pie`, `czech_cognate`, entry-level `notes`
- Empty / omit preferred over forced depth or false cousins

## Dual-layer model

1. **Immediate origin** (always when entry exists): Germanic / Latin / Other + short note  
2. **PIE** (when solid): reconstructed root + plain meaning  
3. **Czech cognate** (hard gate): only when inheritance is standard **and** the form is recognisable

Hard omissions: e.g. *hand* / *ruka*, *foot* / everyday *noha*, *fire* / *oheň* — path or PIE only, not a “Czech cousin” highlight.

## PIE spelling policy (learner-friendly)

**Do not** show scholarly laryngeal notation (`h₁` `h₂` `h₃`), aspiration superscripts, or specialist diacritics. Those are for handbooks, not A1 vocab.

Use **popular / Prometheus-style** roots that look like ordinary European words:

| Scholarly (not shown) | Learner form (shown) |
|----------------------|----------------------|
| `*bʰréh₂tēr` | `*bhrater` |
| `*méh₂tēr` | `*mater` |
| `*h₁nómn̥` | `*nomen` |
| `*kʷetwóres` | `*kwetwores` |

Conventions: `bh dh gh` for aspirates; `kw gw` for labiovelars; laryngeals absorbed into plain `a e o` vowels; drop rings/macrons when they only decorate. Keep a leading `*` so it still reads as a reconstruction. Truth of the connection matters; the orthography is a teaching surface.

## Visibility

- Requires **author unlock**
- Toggle **Word roots** in util bar (storage key `pie` inside `localStorage` `rue3-insights-toggles`)
- Shown under leaf/house practice blocks when entries match pack lemmas
- Does **not** affect practice scoring, fruit, or gates

## Coverage policy (A1 leaves)

**Target:** all A1 leaf **single-word** lemmas, as far as applicable (path-only minimum).

| Layer | When |
|-------|------|
| Path only | Clear Germanic / Latin / Other path; no solid PIE or Czech story |
| + PIE | Standard, transparent root (learner-friendly spelling) |
| + Czech cousin | Only when the learner can *see* the link (see below) |
| Omit | Truly opaque / contested origin (prefer silence) |

### Czech cousin usability (important)

Historical truth alone is **not** enough. If the forms look unrelated, the “cousin” line puts learners off.

| Tier | Rule | Example |
|------|------|---------|
| **Surface win** | Forms look/sound related → pure Czech cousin | *brother* ~ *bratr*, *water* ~ *voda* |
| **Bridged** | English relatives show the root first, then Czech | *give* → **donate** → *dát*; *see* → **vision** → *vidět* |
| **No cousin highlight** | True historically but no usable surface or bridge | path + PIE only (e.g. weak *man* ~ *muž*) |

Schema: `czech_cognate.bridge` = short English relatives string; UI shows **English relatives** then **Czech cousin**.

**Multiword:** only if one element is pedagogically interesting (e.g. `living room`).

**Batches (review after each):**
1. Home & family · Body · Time & numbers · Nature — **done**
2. Food · clothes · colours · animals · health — **done**
3. Places · school · work · shopping · tech · free time — **done**
4. Ideas / remaining A1 leaves — **done** (full A1 leaf coverage)

**Trunk Core frames:** `seed_vocab` + frame `gap_answer` lemmas are included (insights scan wired in `app.js`). A2 leaves still optional later.

## Evaluation

After using the mode for a few sessions:

1. Do Czech cognate highlights create genuine recognition?
2. Is dual-layer clear rather than overwhelming?
3. Does it distract from the ladder?
4. Which entries feel strongest / decorative?
5. Is the cognitive cost worth it for a motivated learner?

If mostly negative → archive; do not expand the set.

## Non-goals (this iteration)

Full etymological dictionary · Roget · games · student default · v0.1 merge · bulk growth past Stage A.

## Related (not in this app)

**Leibniz / NSM** meaning cores live in **semantic-codex** (`data/leibniz.json` + archive of the old RUE3 set under `data/intake/`). Removed from RUE3 UI 2026-07-27; not required for vocab practice.
