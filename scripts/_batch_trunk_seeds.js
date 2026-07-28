/**
 * Trunk seed_vocab (A1 core frames) etymology + gap verbs.
 * Also merges any high-freq gap_answer verbs not in seed lists.
 */
const fs = require("fs");
const path = require("path");

const etyFile = path.join("data/insights/etymology.json");
const data = JSON.parse(fs.readFileSync(etyFile, "utf8"));

function norm(en) {
  return String(en || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split("/")[0]
    .replace(/[.,!?;:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** @type {Record<string, object>} */
const batch = {
  // ─── Core high-value verbs ─────────────────────────────────────
  give: {
    immediate: { path: "germanic", note: "Old English giefan" },
    pie: { root: "*do-", meaning: "give" },
    czech_cognate: { word: "dát", note: "Same root family — true cousin" },
  },
  see: {
    immediate: { path: "germanic", note: "Old English seon" },
    pie: { root: "*weid-", meaning: "see, know" },
    czech_cognate: {
      word: "vidět",
      note: "Same root family — true cousin",
    },
  },
  know: {
    immediate: { path: "germanic", note: "Old English cnawan" },
    pie: { root: "*gno-", meaning: "know" },
    czech_cognate: {
      word: "znát",
      note: "Same root family (soft; also vedet line for know/see)",
    },
  },
  hear: {
    immediate: { path: "germanic", note: "Old English hieran" },
    pie: { root: "*keu-", meaning: "notice, hear" },
    notes: "Related to the ear family; Czech slyset is a different root.",
  },
  sleep: {
    immediate: { path: "germanic", note: "Old English slæpan" },
    pie: { root: "*swep-", meaning: "sleep" },
    czech_cognate: { word: "spát", note: "Same root family — true cousin" },
  },
  live: {
    immediate: { path: "germanic", note: "Old English lifian / libban" },
    pie: { root: "*gwei-", meaning: "live" },
    czech_cognate: {
      word: "žít",
      note: "Same root family (soft)",
    },
  },
  do: {
    immediate: { path: "germanic", note: "Old English don" },
    pie: { root: "*dhe-", meaning: "put, do" },
  },
  does: {
    immediate: { path: "germanic", note: "3rd person of do (Germanic)" },
  },
  make: {
    immediate: { path: "germanic", note: "Old English macian" },
  },
  get: {
    immediate: { path: "germanic", note: "Old Norse geta into English" },
  },
  "get up": {
    immediate: {
      path: "germanic",
      note: "Phrasal: get (Norse) + up (Germanic)",
    },
  },
  put: {
    immediate: { path: "other", note: "Late Old English; origin uncertain" },
  },
  find: {
    immediate: { path: "germanic", note: "Old English findan" },
  },
  look: {
    immediate: { path: "germanic", note: "Old English locian" },
  },
  help: {
    immediate: { path: "germanic", note: "Old English helpan" },
  },
  need: {
    immediate: { path: "germanic", note: "Old English neodian (from neod need)" },
  },
  want: {
    immediate: { path: "germanic", note: "Old Norse vanta into English" },
  },
  like: {
    immediate: {
      path: "germanic",
      note: "Old English lician 'please'; modern like sense later",
    },
  },
  love: {
    immediate: { path: "germanic", note: "Old English lufu / lufian" },
    pie: { root: "*leubh-", meaning: "care, love" },
  },
  ask: {
    immediate: { path: "germanic", note: "Old English ascian" },
  },
  say: {
    immediate: { path: "germanic", note: "Old English secgan" },
  },
  tell: {
    immediate: { path: "germanic", note: "Old English tellan 'count, tell'" },
  },
  speak: {
    immediate: { path: "germanic", note: "Old English specan / sprecan" },
  },
  talk: {
    immediate: { path: "germanic", note: "Middle English; related to tale/tell" },
  },
  call: {
    immediate: {
      path: "germanic",
      note: "Old Norse kalla into English",
    },
  },
  think: {
    immediate: { path: "germanic", note: "Old English thencan" },
  },
  remember: {
    immediate: {
      path: "latin",
      note: "Latin rememorari via French",
    },
  },
  forget: {
    immediate: { path: "germanic", note: "Old English forgietan" },
  },
  understand: {
    immediate: {
      path: "germanic",
      note: "Compound: under + stand (stand among / grasp)",
    },
  },
  meet: {
    immediate: { path: "germanic", note: "Old English metan" },
  },
  wait: {
    immediate: {
      path: "germanic",
      note: "Old French waitier from Frankish/Germanic",
    },
  },
  try: {
    immediate: { path: "latin", note: "Old French trier 'sift, pick' " },
  },
  use: {
    immediate: { path: "latin", note: "Latin usare / usus via French" },
  },
  swim: {
    immediate: { path: "germanic", note: "Old English swimman" },
  },
  begin: {
    immediate: { path: "germanic", note: "Old English beginnan" },
  },
  become: {
    immediate: {
      path: "germanic",
      note: "be- + come (Germanic)",
    },
  },
  bring: {
    immediate: { path: "germanic", note: "Old English bringan" },
  },
  buy: {
    immediate: { path: "germanic", note: "Old English bycgan" },
  },
  sit: {
    immediate: { path: "germanic", note: "Old English sittan" },
    pie: { root: "*sed-", meaning: "sit" },
    czech_cognate: { word: "sedět", note: "Same root family — true cousin" },
  },
  stand: {
    immediate: { path: "germanic", note: "Old English standan" },
    pie: { root: "*sta-", meaning: "stand" },
    czech_cognate: { word: "stát", note: "Same root family — true cousin" },
  },
  run: {
    immediate: { path: "germanic", note: "Old English rinnan" },
  },
  fly: {
    immediate: { path: "germanic", note: "Old English fleogan" },
  },
  fall: {
    immediate: { path: "germanic", note: "Old English feallan" },
  },
  hold: {
    immediate: { path: "germanic", note: "Old English healdan" },
  },
  keep: {
    immediate: { path: "germanic", note: "Old English cepan" },
  },
  let: {
    immediate: { path: "germanic", note: "Old English lætan" },
  },
  send: {
    immediate: { path: "germanic", note: "Old English sendan" },
  },
  show: {
    immediate: { path: "germanic", note: "Old English sceawian" },
  },
  feel: {
    immediate: { path: "germanic", note: "Old English felan" },
  },
  seem: {
    immediate: { path: "germanic", note: "Old Norse sœma into English" },
  },
  stay: {
    immediate: { path: "latin", note: "Old French estai from Latin stare 'stand'" },
  },
  leave: {
    immediate: { path: "germanic", note: "Old English læfan" },
  },
  return: {
    immediate: { path: "latin", note: "Latin returnare via French" },
  },
  change: {
    immediate: { path: "latin", note: "Latin cambiare via French" },
  },
  move: {
    immediate: { path: "latin", note: "Latin movere via French" },
  },
  open: {
    immediate: { path: "germanic", note: "Old English open" },
  },
  close: {
    immediate: { path: "latin", note: "Latin clausus via French" },
  },
  clean: {
    immediate: { path: "germanic", note: "Old English clæne" },
  },
  dirty: {
    immediate: { path: "other", note: "From dirt (origin uncertain) + -y" },
  },

  // ─── Modals / auxiliaries ──────────────────────────────────────
  can: {
    immediate: { path: "germanic", note: "Old English cunnan 'know how'" },
  },
  cannot: {
    immediate: { path: "germanic", note: "can + not (Germanic)" },
  },
  "don t": {
    immediate: { path: "germanic", note: "do + not (Germanic contraction)" },
  },
  must: {
    immediate: { path: "germanic", note: "Old English moste (from motan)" },
  },
  should: {
    immediate: { path: "germanic", note: "Past of shall (Old English sculan)" },
  },
  will: {
    immediate: {
      path: "germanic",
      note: "Old English willan 'want'; future auxiliary later",
    },
  },
  would: {
    immediate: { path: "germanic", note: "Past of will (Germanic)" },
  },
  am: {
    immediate: { path: "germanic", note: "Old English eom (be paradigm)" },
    pie: { root: "*es-", meaning: "be" },
  },
  is: {
    immediate: { path: "germanic", note: "Old English is (be paradigm)" },
    pie: { root: "*es-", meaning: "be" },
    czech_cognate: {
      word: "je",
      note: "Same be root family (soft)",
    },
  },
  are: {
    immediate: { path: "germanic", note: "Old English earun (be paradigm)" },
  },
  be: {
    immediate: { path: "germanic", note: "Old English beon" },
    pie: { root: "*bheu-", meaning: "be, become" },
  },
  have: {
    immediate: { path: "germanic", note: "Old English habban" },
  },
  has: {
    immediate: { path: "germanic", note: "3rd person of have" },
  },

  // ─── Adjectives / quality ──────────────────────────────────────
  new: {
    immediate: { path: "germanic", note: "Old English niwe" },
    pie: { root: "*newo-", meaning: "new" },
    czech_cognate: { word: "nový", note: "Same root family — true cousin" },
  },
  old: {
    immediate: { path: "germanic", note: "Old English eald" },
    pie: { root: "*al-", meaning: "grow, nourish" },
  },
  young: {
    immediate: { path: "germanic", note: "Old English geong" },
    pie: { root: "*yeu-", meaning: "vital force, young" },
  },
  big: {
    immediate: { path: "other", note: "Middle English; origin uncertain" },
  },
  small: {
    immediate: { path: "germanic", note: "Old English smæl" },
  },
  long: {
    immediate: { path: "germanic", note: "Old English lang" },
    pie: { root: "*del-", meaning: "long" },
    czech_cognate: {
      word: "dlouhý",
      note: "Same root family (soft)",
    },
  },
  good: {
    immediate: { path: "germanic", note: "Old English god" },
  },
  bad: {
    immediate: { path: "other", note: "Middle English; origin uncertain" },
  },
  nice: {
    immediate: {
      path: "latin",
      note: "Latin nescius 'ignorant' via French; sense shifted to pleasant",
    },
  },
  easy: {
    immediate: { path: "latin", note: "Old French aisie from Latin adiacens line" },
  },
  difficult: {
    immediate: { path: "latin", note: "Latin difficilis via French" },
  },
  important: {
    immediate: { path: "latin", note: "Latin importantem via French" },
  },
  famous: {
    immediate: { path: "latin", note: "Latin famosus via French" },
  },
  full: {
    immediate: { path: "germanic", note: "Old English full" },
    pie: { root: "*pel-", meaning: "fill" },
    czech_cognate: {
      word: "plný",
      note: "Same root family — true cousin",
    },
  },
  tired: {
    immediate: {
      path: "germanic",
      note: "From tire (Old English teorian 'fail, tire')",
    },
  },
  friendly: {
    immediate: { path: "germanic", note: "friend + -ly (Germanic)" },
  },
  handsome: {
    immediate: {
      path: "germanic",
      note: "hand + -some 'easy to handle' → good-looking",
    },
  },
  kind: {
    immediate: {
      path: "germanic",
      note: "Old English gecynde 'natural'; generous sense later",
    },
  },
  wrong: {
    immediate: { path: "germanic", note: "Old Norse rangr into English" },
  },
  right: {
    immediate: {
      path: "germanic",
      note: "Old English riht (already in leaves; kept for trunk)",
    },
  },

  // ─── Pronouns / determiners / glue ─────────────────────────────
  i: {
    immediate: { path: "germanic", note: "Old English ic" },
    pie: { root: "*eg-", meaning: "I" },
    czech_cognate: { word: "já", note: "Same root family (soft)" },
  },
  you: {
    immediate: { path: "germanic", note: "Old English eow (plural/object form)" },
    pie: { root: "*yu-", meaning: "you (plural)" },
  },
  he: {
    immediate: { path: "germanic", note: "Old English he" },
  },
  she: {
    immediate: { path: "germanic", note: "Old English heo / sie line" },
  },
  it: {
    immediate: { path: "germanic", note: "Old English hit" },
  },
  we: {
    immediate: { path: "germanic", note: "Old English we" },
    pie: { root: "*wei-", meaning: "we" },
  },
  they: {
    immediate: { path: "germanic", note: "Old Norse their into English" },
  },
  my: {
    immediate: { path: "germanic", note: "Old English min" },
  },
  mine: {
    immediate: { path: "germanic", note: "Old English min (possessive)" },
  },
  your: {
    immediate: { path: "germanic", note: "Old English eower" },
  },
  his: {
    immediate: { path: "germanic", note: "Old English his" },
  },
  her: {
    immediate: { path: "germanic", note: "Old English hire" },
  },
  our: {
    immediate: { path: "germanic", note: "Old English ure" },
  },
  their: {
    immediate: { path: "germanic", note: "Old Norse theirra into English" },
  },
  me: {
    immediate: { path: "germanic", note: "Old English me" },
  },
  him: {
    immediate: { path: "germanic", note: "Old English him" },
  },
  us: {
    immediate: { path: "germanic", note: "Old English us" },
  },
  them: {
    immediate: { path: "germanic", note: "Old Norse theim into English" },
  },
  this: {
    immediate: { path: "germanic", note: "Old English this" },
  },
  that: {
    immediate: { path: "germanic", note: "Old English thæt" },
  },
  these: {
    immediate: { path: "germanic", note: "Plural of this" },
  },
  those: {
    immediate: { path: "germanic", note: "Plural of that" },
  },
  the: {
    immediate: { path: "germanic", note: "Old English the / se demonstrative line" },
  },
  a: {
    immediate: {
      path: "germanic",
      note: "Weak form of an 'one' (Old English an)",
    },
  },
  an: {
    immediate: { path: "germanic", note: "Old English an 'one'" },
  },
  some: {
    immediate: { path: "germanic", note: "Old English sum" },
  },
  someone: {
    immediate: { path: "germanic", note: "some + one" },
  },
  something: {
    immediate: { path: "germanic", note: "some + thing" },
  },
  any: {
    immediate: { path: "germanic", note: "Old English ænig (from an 'one')" },
  },
  another: {
    immediate: { path: "germanic", note: "an + other" },
  },
  other: {
    immediate: { path: "germanic", note: "Old English other" },
  },
  both: {
    immediate: { path: "germanic", note: "Old Norse bathir into English" },
  },
  all: {
    immediate: { path: "germanic", note: "Old English eall" },
  },
  every: {
    immediate: { path: "germanic", note: "Old English æfre ælc 'ever each'" },
  },
  everybody: {
    immediate: { path: "germanic", note: "every + body" },
  },
  everything: {
    immediate: { path: "germanic", note: "every + thing" },
  },
  many: {
    immediate: { path: "germanic", note: "Old English manig" },
  },
  much: {
    immediate: { path: "germanic", note: "Old English mycel / muchel line" },
  },
  more: {
    immediate: { path: "germanic", note: "Old English mara" },
  },
  most: {
    immediate: { path: "germanic", note: "Old English mæst" },
  },
  no: {
    immediate: { path: "germanic", note: "Old English na / no" },
  },
  not: {
    immediate: { path: "germanic", note: "Old English nawiht 'nothing' shortened" },
  },
  yes: {
    immediate: { path: "germanic", note: "Old English gese / yes" },
  },
  please: {
    immediate: {
      path: "latin",
      note: "French plaisir / Latin placere 'please'",
    },
  },
  thanks: {
    immediate: { path: "germanic", note: "From thank (Old English thancian)" },
  },
  thank: {
    immediate: { path: "germanic", note: "Old English thancian" },
  },
  hello: {
    immediate: {
      path: "germanic",
      note: "Related to hallo / whole; greeting form later",
    },
  },
  hi: {
    immediate: { path: "other", note: "Modern informal greeting" },
  },
  bye: {
    immediate: {
      path: "other",
      note: "Short for goodbye (God be with ye)",
    },
  },
  goodbye: {
    immediate: {
      path: "other",
      note: "Contraction of 'God be with ye'",
    },
  },
  welcome: {
    immediate: {
      path: "germanic",
      note: "Old English wilcuma 'desired guest'",
    },
  },
  excuse: {
    immediate: { path: "latin", note: "Latin excusare via French" },
  },
  sorry: {
    immediate: { path: "germanic", note: "Old English sarig (already in leaves)" },
  },

  // ─── Question words ────────────────────────────────────────────
  what: {
    immediate: { path: "germanic", note: "Old English hwæt" },
    pie: { root: "*kwod-", meaning: "what" },
    czech_cognate: { word: "co", note: "Same question root family (soft form)" },
  },
  who: {
    immediate: { path: "germanic", note: "Old English hwa" },
    pie: { root: "*kwo-", meaning: "who" },
    czech_cognate: { word: "kdo", note: "Same root family — true cousin" },
  },
  where: {
    immediate: { path: "germanic", note: "Old English hwær" },
    pie: { root: "*kwo-", meaning: "who/where question stem" },
  },
  when: {
    immediate: { path: "germanic", note: "Old English hwanne" },
  },
  why: {
    immediate: { path: "germanic", note: "Old English hwi" },
  },
  which: {
    immediate: { path: "germanic", note: "Old English hwilc" },
  },
  how: {
    immediate: { path: "germanic", note: "Old English hu" },
  },

  // ─── Prepositions / linkers ────────────────────────────────────
  in: {
    immediate: { path: "germanic", note: "Old English in" },
    pie: { root: "*en", meaning: "in" },
  },
  on: {
    immediate: { path: "germanic", note: "Old English on" },
  },
  at: {
    immediate: { path: "germanic", note: "Old English æt" },
  },
  to: {
    immediate: { path: "germanic", note: "Old English to" },
  },
  for: {
    immediate: { path: "germanic", note: "Old English for" },
  },
  of: {
    immediate: { path: "germanic", note: "Old English of" },
  },
  with: {
    immediate: { path: "germanic", note: "Old English with 'against, with'" },
  },
  from: {
    immediate: { path: "germanic", note: "Old English from" },
  },
  by: {
    immediate: { path: "germanic", note: "Old English bi" },
  },
  about: {
    immediate: { path: "germanic", note: "Old English onbutan 'on the outside'" },
  },
  above: {
    immediate: { path: "germanic", note: "Old English abufan" },
  },
  under: {
    immediate: { path: "germanic", note: "Old English under" },
    pie: { root: "*ndher-", meaning: "under" },
  },
  over: {
    immediate: { path: "germanic", note: "Old English ofer" },
  },
  into: {
    immediate: { path: "germanic", note: "in + to" },
  },
  after: {
    immediate: { path: "germanic", note: "Old English æfter" },
  },
  before: {
    immediate: { path: "germanic", note: "Old English beforan" },
  },
  because: {
    immediate: {
      path: "latin",
      note: "by + cause (Latin causa via French)",
    },
  },
  and: {
    immediate: { path: "germanic", note: "Old English and" },
  },
  or: {
    immediate: { path: "germanic", note: "Old English oththe / or line" },
  },
  but: {
    immediate: { path: "germanic", note: "Old English butan 'outside, except'" },
  },
  so: {
    immediate: { path: "germanic", note: "Old English swa" },
  },
  if: {
    immediate: { path: "germanic", note: "Old English gif" },
  },
  than: {
    immediate: { path: "germanic", note: "Old English thanne" },
  },
  as: {
    immediate: { path: "germanic", note: "Old English ealswa / as" },
  },

  // ─── Other seed nouns / bits ───────────────────────────────────
  ball: {
    immediate: { path: "germanic", note: "Old Norse böllr / Old English beall line" },
  },
  box: {
    immediate: { path: "latin", note: "Latin buxis via Greek (boxwood container)" },
  },
  boxes: {
    immediate: { path: "latin", note: "Plural of box" },
  },
  chairs: {
    immediate: { path: "latin", note: "Plural of chair (Latin cathedra via French)" },
  },
  shops: {
    immediate: { path: "germanic", note: "Plural of shop" },
  },
  ticket: {
    immediate: { path: "latin", note: "Old French etiquet 'label, note'" },
  },
  english: {
    immediate: {
      path: "germanic",
      note: "From the Angles (Germanic tribe) + -ish",
    },
  },
  "o clock": {
    immediate: {
      path: "latin",
      note: "of the clock (clock from Medieval Latin clocca)",
    },
  },
  anna: {
    immediate: {
      path: "other",
      note: "Personal name used in practice frames (not general vocab)",
    },
  },
};

let added = 0;
let skipped = 0;
for (const [lemma, entry] of Object.entries(batch)) {
  if (data.entries[lemma]) {
    // Upgrade empty-ish? keep existing; only fill if missing cognate upgrade for key verbs
    skipped++;
    continue;
  }
  data.entries[lemma] = entry;
  added++;
}

// Ensure key verbs exist even if somehow skipped
const force = ["give", "see", "know", "new", "sleep", "sit", "stand", "live", "hear"];
for (const k of force) {
  if (!data.entries[k] && batch[k]) data.entries[k] = batch[k];
}

data.note =
  "A1 Word roots: all leaf packs + trunk seed_vocab / core frame gaps. Learner-friendly PIE (no h1/h2/h3). Path-only OK; dual-layer when solid; soft Czech related-family OK.";

fs.writeFileSync(etyFile, JSON.stringify(data, null, 2) + "\n");
console.log("added", added, "skipped", skipped, "total", Object.keys(data.entries).length);

// Coverage of seed_vocab
const dir = "data/blocks";
const seeds = new Set();
const gaps = new Set();
for (const f of fs.readdirSync(dir)) {
  if (!f.startsWith("a1_core_frames") || !f.endsWith(".json")) continue;
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (Array.isArray(p.seed_vocab)) {
    for (const s of p.seed_vocab) {
      const L = norm(s);
      if (L) seeds.add(L);
    }
  }
  for (const b of p.blocks || []) {
    for (const it of b.items || []) {
      if (it.gap_answer) gaps.add(norm(it.gap_answer));
      if (Array.isArray(it.gap_accepts)) {
        for (const g of it.gap_accepts) gaps.add(norm(g));
      }
    }
  }
}
const seedMiss = [...seeds].filter((l) => l && !data.entries[l]).sort();
const gapMiss = [...gaps].filter((l) => l && !data.entries[l]).sort();
console.log("seed covered", seeds.size - seedMiss.length, "/", seeds.size);
console.log("seed missing:", seedMiss.join(", ") || "—");
console.log("gap verbs missing sample:", gapMiss.slice(0, 40).join(", ") || "—");
console.log("gap verbs missing count:", gapMiss.length);
