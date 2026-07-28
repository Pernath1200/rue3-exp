/**
 * Batch 4: remaining A1 leaf lemmas (a1_ideas + any stragglers)
 */
const fs = require("fs");
const path = require("path");

const file = path.join("data/insights/etymology.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

/** @type {Record<string, object>} */
const batch = {
  action: {
    immediate: { path: "latin", note: "Latin actio from agere 'do' via French" },
  },
  advice: {
    immediate: { path: "latin", note: "Latin advisum via French avis" },
  },
  area: {
    immediate: { path: "latin", note: "Latin area 'open space'" },
  },
  beginning: {
    immediate: {
      path: "germanic",
      note: "From begin (Old English beginnan) + -ing",
    },
  },
  capital: {
    immediate: {
      path: "latin",
      note: "Latin capitalis 'of the head' (chief city / money)",
    },
  },
  century: {
    immediate: { path: "latin", note: "Latin centuria from centum 'hundred'" },
  },
  culture: {
    immediate: { path: "latin", note: "Latin cultura 'tilling, cultivation' via French" },
  },
  date: {
    immediate: {
      path: "latin",
      note: "Latin data (as in data Romae) via French",
    },
  },
  end: {
    immediate: { path: "germanic", note: "Old English ende" },
    pie: { root: "*ant-", meaning: "front, end" },
  },
  event: {
    immediate: { path: "latin", note: "Latin eventus from evenire 'come out'" },
  },
  fact: {
    immediate: { path: "latin", note: "Latin factum 'thing done'" },
  },
  form: {
    immediate: { path: "latin", note: "Latin forma via French" },
  },
  future: {
    immediate: { path: "latin", note: "Latin futurus 'about to be' via French" },
  },
  group: {
    immediate: { path: "latin", note: "Italian gruppo via French (Germanic into Romance)" },
  },
  interest: {
    immediate: {
      path: "latin",
      note: "Latin interest 'it matters'; also money interest",
    },
  },
  life: {
    immediate: { path: "germanic", note: "Old English lif" },
    pie: { root: "*leip-", meaning: "remain, live" },
  },
  line: {
    immediate: { path: "latin", note: "Latin linea 'linen thread, line' via French" },
  },
  machine: {
    immediate: { path: "latin", note: "Greek/Latin machina via French" },
  },
  member: {
    immediate: { path: "latin", note: "Latin membrum 'limb, part' via French" },
  },
  midnight: {
    immediate: {
      path: "germanic",
      note: "Compound: mid + night (both Germanic)",
    },
  },
  moment: {
    immediate: { path: "latin", note: "Latin momentum via French" },
  },
  object: {
    immediate: {
      path: "latin",
      note: "Latin objectum 'thing thrown before' via French",
    },
  },
  pair: {
    immediate: { path: "latin", note: "Latin paria via French" },
  },
  part: {
    immediate: { path: "latin", note: "Latin partem via French" },
  },
  past: {
    immediate: { path: "latin", note: "From pass (Latin passare); past tense/time sense" },
  },
  period: {
    immediate: { path: "latin", note: "Greek/Latin periodus via French" },
  },
  person: {
    immediate: { path: "latin", note: "Latin persona via French" },
  },
  piece: {
    immediate: { path: "latin", note: "Latin pettia / Gaulish via French piece" },
  },
  place: {
    immediate: { path: "latin", note: "Latin platea via French" },
  },
  plan: {
    immediate: { path: "latin", note: "Latin planus 'flat' via French (drawing / scheme)" },
  },
  point: {
    immediate: { path: "latin", note: "Latin punctum via French" },
  },
  product: {
    immediate: { path: "latin", note: "Latin productum from producere 'bring forth'" },
  },
  programme: {
    immediate: {
      path: "latin",
      note: "Greek programma via Latin/French (British spelling)",
    },
  },
  project: {
    immediate: { path: "latin", note: "Latin projectum 'thrown forward'" },
  },
  reason: {
    immediate: { path: "latin", note: "Latin ratio via French raison" },
  },
  result: {
    immediate: { path: "latin", note: "Latin resultare via French" },
  },
  routine: {
    immediate: { path: "latin", note: "French routine from route 'road, way'" },
  },
  rule: {
    immediate: { path: "latin", note: "Latin regula via French" },
  },
  section: {
    immediate: { path: "latin", note: "Latin sectio from secare 'cut'" },
  },
  situation: {
    immediate: { path: "latin", note: "Latin situatio from situs 'site'" },
  },
  skill: {
    immediate: { path: "germanic", note: "Old Norse skil 'distinction, knowledge'" },
  },
  sound: {
    immediate: {
      path: "latin",
      note: "Latin sonus via French; also Germanic 'healthy' is a different sound",
    },
  },
  style: {
    immediate: { path: "latin", note: "Latin stilus 'writing tool' via French" },
  },
  success: {
    immediate: { path: "latin", note: "Latin successus via French" },
  },
  thing: {
    immediate: {
      path: "germanic",
      note: "Old English thing 'assembly, matter, object'",
    },
  },
  topic: {
    immediate: { path: "latin", note: "Greek topos 'place' via Latin topica" },
  },
  visitor: {
    immediate: { path: "latin", note: "From visit (Latin visitare) + -or" },
  },
};

let added = 0;
let skipped = 0;
for (const [lemma, entry] of Object.entries(batch)) {
  if (data.entries[lemma]) {
    skipped++;
    continue;
  }
  data.entries[lemma] = entry;
  added++;
}

data.note =
  "A1 Word roots (leaves). Learner-friendly PIE (no h1/h2/h3). Path-only OK; dual-layer when solid; soft Czech related-family OK. Batches 1-4 complete: all A1 leaf packs covered as far as applicable. Trunk frames not in this pass.";

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(
  "added",
  added,
  "skipped",
  skipped,
  "total entries",
  Object.keys(data.entries).length,
);

function norm(en) {
  return String(en || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split("/")[0]
    .replace(/[.,!?;:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Full A1 leaf audit
const dir = "data/blocks";
const packs = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith("a1_") && f.endsWith(".json"));
const all = new Set();
const miss = new Set();
for (const f of packs) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (p.practice === "frames") continue;
  for (const b of p.blocks || []) {
    for (const it of b.items || []) {
      const L = norm(it.en);
      if (!L) continue;
      all.add(L);
      if (!data.entries[L]) miss.add(L);
    }
  }
}
console.log("A1 leaf unique lemmas", all.size);
console.log("missing", miss.size, [...miss].sort().join(", ") || "—");

const id = "a1_ideas";
const p = JSON.parse(fs.readFileSync(`data/blocks/${id}.json`, "utf8"));
const lemmas = new Set();
for (const b of p.blocks || []) {
  for (const it of b.items || []) {
    const L = norm(it.en);
    if (L) lemmas.add(L);
  }
}
const m = [...lemmas].filter((l) => !data.entries[l]);
console.log(id, "covered", lemmas.size - m.length, "/", lemmas.size, "missing:", m.join(", ") || "—");
