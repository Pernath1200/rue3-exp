# Leaf Sentence · Carrier frames (not free invent)

**Status:** Layer 0 live · Layer 1 pilot on Travel · 2026-07-24  
**Freeze:** Option B — carriers, not free-generated “I like the booking” sentences.

## Problem we stopped

Leaf Sentence used to invent CZ→EN lines from bare `{en,cz}` pairs:

- *I like journey.* / *I need sightseeing.* / *I like the booking.*

That does not scale to ~1,900 lemmas. Trunk frames stay authored; leaves need **fixed carriers**.

## Product rules

| Surface | Sentence | Fruit (learned) |
|--------|----------|-----------------|
| **Trunk** (`practice: "frames"`) | Authored models | Perfect Sentence |
| **Leaf** | Carrier fill only | Perfect **Word** (mode 3) |

Leaf Sentence is **optional production practice**. It is not required for fruit.

## Layer 0 — bleed stop

1. **No free templates.** `js/carriers.js` only.
2. **Allowlist, not denylist.** Untagged lemmas get default carriers  
   (`this_is_a` · `i_have_a` · `where_is_the` · `i_need_a`) **only** if the English lemma is in `CONCRETE_OBJECT_ALLOWLIST` (ticket, bag, hotel…).
3. **Everything else** → no Sentence until tagged with `use: [...]`.
4. **Audit:** `node scripts/audit_leaf_sentence.mjs`

Empty state in the app: *“No carrier sentences yet · fruit from Word.”*

## Layer 1 — carriers

### Tag shape

```json
{ "en": "booking", "cz": "rezervace", "use": ["i_have_a", "i_need_a"] }
```

```json
{ "en": "sightseeing", "cz": "prohlídka památek", "use": ["i_like_bare", "i_enjoy", "is_fun"] }
```

```json
{ "en": "abroad", "cz": "v zahraničí", "use": [] }
```

`use: []` = explicitly **no** Sentence (do not fall back to allowlist).

### Carrier catalogue (`js/carriers.js`)

| id | Example |
|----|---------|
| `this_is_a` | This is a ticket. |
| `i_have_a` | I have a booking. |
| `where_is_the` | Where is the hotel? |
| `i_need_a` | I need a passport. |
| `i_like_pl` | I like beaches. |
| `i_like_bare` | I like sightseeing. |
| `i_enjoy` | I enjoy camping. |
| `is_fun` | Camping is fun. |
| `i_am_a` | I am a tourist. |
| `he_is_a` | He is a pilot. |
| `the_is_long` | The journey is long. |
| `have_a_good` | Have a good trip! |
| `i_need_bare` | I need luggage. |
| `i_have_bare` | I have luggage. |
| `i_want_to` | I want to travel. |
| `we_need_to` | We need to pack. |

One carrier is chosen per item (by index) for variety; all listed `use` ids are valid.

### Pilot pack

`data/blocks/a2_travel.json` — most items tagged. Smoke this unit first.

## Authoring checklist

1. Prefer **real collocations** for the lemma (booking → have/need, not like).
2. Prefer carriers that keep **Czech nominative** when we cannot decline (`Líbí se mi…`, `Kde je…`, `Tohle je…`).
3. Verbs → `i_want_to` / `we_need_to` with infinitive CZ when possible.
4. Adjectives → leave `use: []` until adj carriers exist.
5. Multi-word EN (`return ticket`) → **must** set `use` (no silent allowlist).

## Audit

```bash
node scripts/audit_leaf_sentence.mjs
node scripts/audit_leaf_sentence.mjs --pack a2_travel
node scripts/audit_leaf_sentence.mjs --duds-only
```

Expect high **skip** rates on untagged packs — that is intentional Layer 0 honesty.

## Layer 2 — core-frame recycle (**DISABLED** 2026-07-25)

Tried auto-expanding A1/A2 banks + 3 models/lemma. Smoke (A2 Shopping) produced teachable duds:

- *I buy an advertise* · *I'd like a cash* · *I saw a quality* · *advertisings* · past *I went…* forced
- UI **36 of 36** on a 12-word unit

**Freeze:**

| Setting | Value |
|---------|--------|
| `expand` | **off** unless `blockMeta.expand === true` |
| Models per lemma | **1** |
| Auto past | **off** (`allowPast` only if expand explicitly allows) |
| Emit gate | `isCarrierSafeForLemma` + `isCarrierModelSafe` — skip > dud |

Catalogue may still hold *I'd like / There is / past* builders for **hand-authored** `use[]`.

**Automaticity later (Phase C):** curated recycle units or interleave authored trunk frames — not blind expand.

## Emit gate

Fail closed for known verbs in noun slots, mass + `a/an`, abstracts + buy/see/go, broken plurals (`advertisings`).

```bash
node scripts/audit_leaf_sentence.mjs --pack a2_shopping --strict
```

## Next verticals

1. Retag remaining bulk packs that still have verb/mass as count (FIX map).
2. Grow allowlist only for true concrete objects.
3. Optional Czech morphology pass on high-traffic carriers.
4. Phase C recycle (authored), not auto-expand.

## Non-goals

- Restoring free `leafWordToSentenceItem` invention.
- Requiring Sentence for leaf fruit.
- Perfect Czech morphology in every carrier (soft `cz_case` debt is OK vs English duds).
- Re-enabling Layer 2 expand without emit-gate + curated tags.
- Dumping parked A2 grammar floors (perfect/future) into leaf carriers before B1 stable.
