/** Remaining A1 frame gap_answer lemmas for Word roots */
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

const batch = {
  "across from": {
    immediate: {
      path: "latin",
      note: "across (Latin via French) + from (Germanic)",
    },
  },
  agree: {
    immediate: { path: "latin", note: "Latin ad + gratus via French agreer" },
  },
  believe: {
    immediate: { path: "germanic", note: "Old English belyfan / belief line" },
  },
  beside: {
    immediate: { path: "germanic", note: "be- + side (Germanic)" },
  },
  best: {
    immediate: { path: "germanic", note: "Old English betst (superlative of good)" },
  },
  better: {
    immediate: { path: "germanic", note: "Old English betera (comparative of good)" },
  },
  build: {
    immediate: { path: "germanic", note: "Old English byldan" },
  },
  "can t": {
    immediate: { path: "germanic", note: "Contraction of cannot (Germanic)" },
  },
  choose: {
    immediate: { path: "germanic", note: "Old English ceosan" },
  },
  "close to": {
    immediate: {
      path: "latin",
      note: "close (Latin clausus via French) + to",
    },
  },
  decide: {
    immediate: { path: "latin", note: "Latin decidere via French" },
  },
  different: {
    immediate: { path: "latin", note: "Latin differentem via French" },
  },
  drive: {
    immediate: { path: "germanic", note: "Old English drifan" },
  },
  enjoy: {
    immediate: { path: "latin", note: "Old French enjoir from Latin gaudere line" },
  },
  everyone: {
    immediate: { path: "germanic", note: "every + one" },
  },
  exciting: {
    immediate: { path: "latin", note: "From excite (Latin excitare)" },
  },
  explain: {
    immediate: { path: "latin", note: "Latin explanare via French" },
  },
  fast: {
    immediate: {
      path: "germanic",
      note: "Old English fæst 'firm'; quick sense later",
    },
  },
  follow: {
    immediate: { path: "germanic", note: "Old English folgian" },
  },
  happens: {
    immediate: {
      path: "other",
      note: "From happen (hap 'chance' + -en); 3rd person form",
    },
  },
  happen: {
    immediate: {
      path: "other",
      note: "hap 'chance' (Old Norse) + -en",
    },
  },
  hard: {
    immediate: { path: "germanic", note: "Old English heard" },
  },
  hope: {
    immediate: { path: "germanic", note: "Old English hopian" },
  },
  join: {
    immediate: { path: "latin", note: "Latin iungere via French joindre" },
  },
  large: {
    immediate: { path: "latin", note: "Latin largus via French" },
  },
  little: {
    immediate: { path: "germanic", note: "Old English lytel" },
  },
  lose: {
    immediate: { path: "germanic", note: "Old English losian" },
  },
  lot: {
    immediate: {
      path: "germanic",
      note: "Old English hlot 'share, lot'; a lot of later",
    },
  },
  mean: {
    immediate: {
      path: "germanic",
      note: "Old English mænan 'intend, mean'",
    },
  },
  miss: {
    immediate: {
      path: "germanic",
      note: "Old English missan 'fail to hit / go wrong'",
    },
  },
  oclock: {
    immediate: {
      path: "latin",
      note: "Variant key for o'clock (of the clock)",
    },
  },
  prefer: {
    immediate: { path: "latin", note: "Latin praeferre via French" },
  },
  prepare: {
    immediate: { path: "latin", note: "Latin praeparare via French" },
  },
  ready: {
    immediate: { path: "germanic", note: "Old English ræde" },
  },
  real: {
    immediate: { path: "latin", note: "Latin realis via French" },
  },
  share: {
    immediate: {
      path: "germanic",
      note: "Old English scearu 'division, share'",
    },
  },
  somebody: {
    immediate: { path: "germanic", note: "some + body" },
  },
  spend: {
    immediate: {
      path: "latin",
      note: "Latin expendere via French (money / time)",
    },
  },
  strong: {
    immediate: { path: "germanic", note: "Old English strang" },
  },
  teach: {
    immediate: { path: "germanic", note: "Old English tæcan" },
  },
  "thank you": {
    immediate: {
      path: "germanic",
      note: "thank (Germanic) + you (Germanic)",
    },
  },
  // common extras often in frames
  become: {
    immediate: { path: "germanic", note: "be- + come" },
  },
  begin: {
    immediate: { path: "germanic", note: "Old English beginnan" },
  },
  bring: {
    immediate: { path: "germanic", note: "Old English bringan" },
  },
};

let added = 0;
for (const [k, v] of Object.entries(batch)) {
  if (!data.entries[k]) {
    data.entries[k] = v;
    added++;
  }
}
fs.writeFileSync(etyFile, JSON.stringify(data, null, 2) + "\n");
console.log("added", added, "total", Object.keys(data.entries).length);

const dir = "data/blocks";
const seeds = new Set();
const gaps = new Set();
for (const f of fs.readdirSync(dir)) {
  if (!f.startsWith("a1_core_frames") || !f.endsWith(".json")) continue;
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (Array.isArray(p.seed_vocab)) for (const s of p.seed_vocab) seeds.add(norm(s));
  for (const b of p.blocks || []) {
    for (const it of b.items || []) {
      if (it.gap_answer) gaps.add(norm(it.gap_answer));
      if (Array.isArray(it.gap_accepts))
        for (const g of it.gap_accepts) gaps.add(norm(g));
    }
  }
}
const seedMiss = [...seeds].filter((l) => l && !data.entries[l]);
const gapMiss = [...gaps].filter((l) => l && !data.entries[l]);
console.log("seeds", seeds.size - seedMiss.length, "/", seeds.size, seedMiss.join(", ") || "—");
console.log("gaps", gaps.size - gapMiss.length, "/", gaps.size, gapMiss.join(", ") || "—");
