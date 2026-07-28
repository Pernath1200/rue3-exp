/**
 * Cognate usability pass:
 * - Surface-similar Czech cousins stay as pure wins
 * - Opaque historical cousins get English bridge words (donate, vision…)
 * - Soft/opaque with no good bridge → demote (remove czech_cognate; keep path/PIE)
 */
const fs = require("fs");
const path = require("path");
const file = path.join("data/insights/etymology.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

/**
 * @typedef {{ word: string, bridge?: string, note?: string }} Cz
 * bridge = comma-separated English relatives that make the root visible
 */

/** Surface aha! — keep; optional light note */
const surface = {
  mother: { word: "matka", note: "Looks related — true cousin" },
  brother: { word: "bratr", note: "Looks related — true cousin" },
  sister: { word: "sestra", note: "Looks related — true cousin" },
  son: { word: "syn", note: "Looks related — true cousin" },
  three: { word: "tři", note: "Looks related — true cousin" },
  two: { word: "dva", note: "Looks related — true cousin" },
  nose: { word: "nos", note: "Looks related — true cousin" },
  night: { word: "noc", note: "Looks related — true cousin" },
  water: { word: "voda", note: "Looks related — true cousin" },
  milk: { word: "mléko", note: "Looks related — true cousin" },
  salt: { word: "sůl", note: "Looks related — true cousin" },
  mouse: { word: "myš", note: "Looks related — true cousin" },
  new: { word: "nový", note: "Looks related — true cousin" },
  sit: { word: "sedět", note: "Looks related — true cousin" },
  stand: { word: "stát", note: "Looks related — true cousin" },
  sleep: { word: "spát", note: "Looks related — true cousin" },
  who: { word: "kdo", note: "Looks related — true cousin" },
  six: { word: "šest", note: "Looks related — true cousin" },
  seven: { word: "sedm", note: "Looks related — true cousin" },
  sun: { word: "slunce", note: "Related — true cousin" },
  snow: { word: "sníh", note: "Related — true cousin" },
  day: { word: "den", note: "Related — true cousin" },
  eye: { word: "oko", note: "Related — true cousin" },
  ear: { word: "ucho", note: "Related — true cousin" },
  door: { word: "dveře", note: "Related — true cousin" },
  apple: { word: "jablko", note: "Related — true cousin" },
  full: { word: "plný", note: "Related — true cousin" },
  one: { word: "jeden", note: "Related — true cousin" },
  ten: { word: "deset", note: "Related — true cousin" },
  eight: { word: "osm", note: "Related — true cousin" },
  third: { word: "třetí", note: "Built on three / tři" },
};

/**
 * Needs bridge: English relatives make the Czech link usable.
 * Display: English relatives first, then Czech cousin.
 */
const bridged = {
  give: {
    word: "dát",
    bridge: "donate, donation, data",
    note: "Same root as donate — Czech dát is the cousin (give itself changed shape)",
  },
  see: {
    word: "vidět",
    bridge: "vision, video, view",
    note: "Same root as vision/video — Czech vidět is the cousin",
  },
  know: {
    word: "znát",
    bridge: "ignore, recognise, cognition",
    note: "Same know-root family (gno-); ignore = not-know",
  },
  eat: {
    word: "jíst",
    bridge: "edible, eatable",
    note: "Same root as edible — Czech jíst is the cousin",
  },
  tooth: {
    word: "zub",
    bridge: "dental, dentist",
    note: "Same root as dental — Czech zub is the cousin",
  },
  heart: {
    word: "srdce",
    bridge: "cardiac, cordial",
    note: "Same root as cardiac — Czech srdce is the cousin",
  },
  name: {
    word: "jméno",
    bridge: "nominate, noun, renown",
    note: "Same root as nominate/noun — Czech jméno is the cousin",
  },
  daughter: {
    word: "dcera",
    bridge: "daughter (English kept more of the shape)",
    note: "True cousin; Czech lost the middle of the old form",
  },
  four: {
    word: "čtyři",
    bridge: "quarter, quad, quadruple",
    note: "Same root as quarter/quad — Czech čtyři is the cousin",
  },
  five: {
    word: "pět",
    bridge: "pentagon, quintet",
    note: "Same root family as pent-/quint- — Czech pět is the cousin",
  },
  nine: {
    word: "devět",
    bridge: "November (ninth month in the old calendar)",
    note: "Same root family; Slavic form reshaped",
  },
  hundred: {
    word: "sto",
    bridge: "century, cent, percent",
    note: "Same root as century/cent — Czech sto is the cousin",
  },
  month: {
    word: "měsíc",
    bridge: "moon, month",
    note: "Month is from moon; Czech měsíc is the moon/month cousin",
  },
  knee: {
    word: "koleno",
    bridge: "genuflect, genuflection (knee-bend)",
    note: "Same root as genuflect — Czech koleno is the cousin",
  },
  long: {
    word: "dlouhý",
    bridge: "longitude, elongate",
    note: "Same root as longitude — Czech dlouhý is the cousin",
  },
  live: {
    word: "žít",
    bridge: "quick (old sense alive), vivid, vital",
    note: "Same live-root family; English live changed shape",
  },
  what: {
    word: "co",
    bridge: "what / who (same old question stem)",
    note: "Same question stem as who; forms diverged a lot",
  },
  is: {
    word: "je",
    bridge: "is, am, are (be)",
    note: "Same ancient be-root; short forms look different",
  },
  i: {
    word: "já",
    bridge: "I, me, ego",
    note: "Same I-root; ego is the Latin shape",
  },
  wind: {
    word: "vítr",
    bridge: "vent, ventilate, window (wind-eye)",
    note: "Same root as vent — Czech vítr is the cousin",
  },
  egg: {
    word: "vejce",
    bridge: "oval, ovary (Latin egg line)",
    note: "Same ancient egg root; English egg is the Norse form",
  },
  red: {
    word: "rudý",
    bridge: "ruby, robust (red/ruddy line)",
    note: "Same root as ruddy/ruby — everyday Czech červený is different",
  },
};

/** Remove czech_cognate — more confusing than helpful without a great bridge */
const demote = [
  "man", // muž not surface; no great bridge for learners
  "now", // nyní weak
  "tree", // dřevo vs strom muddle
  "yellow", // soft colour family stretch
  "father", // already no cognate
];

let bridgedN = 0;
let surfaceN = 0;
let demotedN = 0;

for (const [lemma, cz] of Object.entries(surface)) {
  if (!data.entries[lemma]) continue;
  data.entries[lemma].czech_cognate = cz;
  surfaceN++;
}

for (const [lemma, cz] of Object.entries(bridged)) {
  if (!data.entries[lemma]) continue;
  data.entries[lemma].czech_cognate = cz;
  bridgedN++;
}

for (const lemma of demote) {
  if (data.entries[lemma] && data.entries[lemma].czech_cognate) {
    delete data.entries[lemma].czech_cognate;
    demotedN++;
    if (lemma === "tree" && data.entries.tree) {
      data.entries.tree.notes =
        "Same wood root as dřevo historically; everyday strom is different — skipped as cousin highlight.";
    }
    if (lemma === "man" && data.entries.man) {
      data.entries.man.notes =
        "Related historically to muž, but the link is not obvious — path/PIE only.";
    }
  }
}

// Any remaining czech_cognate not in surface or bridged → demote if soft
const keep = new Set([...Object.keys(surface), ...Object.keys(bridged)]);
let extraDemote = 0;
for (const [lemma, entry] of Object.entries(data.entries)) {
  if (entry.czech_cognate && !keep.has(lemma)) {
    delete entry.czech_cognate;
    extraDemote++;
  }
}

data.note =
  "A1 Word roots. Learner-friendly PIE. Czech cousins only when useful: surface lookalikes OR English bridge relatives (donate→dát, vision→vidět). Opaque historical links without a bridge are path/PIE only.";

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");

const withCz = Object.keys(data.entries).filter((k) => data.entries[k].czech_cognate);
const withBridge = withCz.filter((k) => data.entries[k].czech_cognate.bridge);
console.log("surface-style", surfaceN);
console.log("bridged", bridgedN);
console.log("demoted listed", demotedN, "extra", extraDemote);
console.log("total czech_cognate now", withCz.length, "(with bridge", withBridge.length + ")");
console.log(withCz.sort().join(", "));
