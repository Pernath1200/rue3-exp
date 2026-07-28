/**
 * Batch 1: complete A1 home_family, body, time_numbers, nature (single-word + a few useful multiwords).
 * Policy: path-only OK; dual-layer when solid; soft related-family Czech notes OK; omit only opaque.
 */
const fs = require("fs");
const path = require("path");

const file = path.join("data/insights/etymology.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

/** @type {Record<string, object>} */
const batch = {
  // ─── Family & home ─────────────────────────────────────────────
  address: {
    immediate: { path: "latin", note: "Latin via French (ad + directus)" },
  },
  adult: {
    immediate: { path: "latin", note: "Latin adultus “grown up”" },
  },
  age: {
    immediate: { path: "latin", note: "Latin aetas via French" },
  },
  apartment: {
    immediate: { path: "latin", note: "Italian/French from Latin part “share”" },
  },
  aunt: {
    immediate: { path: "latin", note: "Latin amita via French" },
  },
  baby: {
    immediate: { path: "other", note: "Later nursery word (baby-talk)" },
  },
  bag: {
    immediate: { path: "other", note: "Old Norse / uncertain; everyday loan into English" },
  },
  bath: {
    immediate: { path: "germanic", note: "Old English bæth" },
    pie: { root: "*bhe-", meaning: "warm, heat" },
  },
  bathroom: {
    immediate: { path: "germanic", note: "Compound: bath + room" },
  },
  bed: {
    immediate: { path: "germanic", note: "Old English bedd" },
    pie: { root: "*bhedh-", meaning: "dig; a dug place to sleep" },
  },
  bedroom: {
    immediate: { path: "germanic", note: "Compound: bed + room" },
  },
  birthday: {
    immediate: { path: "germanic", note: "Compound: birth + day" },
  },
  book: {
    immediate: { path: "germanic", note: "Old English bōc (related to beech wood tablets)" },
  },
  boy: {
    immediate: { path: "other", note: "Middle English; deeper origin unclear" },
  },
  boyfriend: {
    immediate: { path: "other", note: "Modern compound: boy + friend" },
  },
  chair: {
    immediate: { path: "latin", note: "Latin cathedra via French" },
  },
  child: {
    immediate: { path: "germanic", note: "Old English cild" },
  },
  children: {
    immediate: { path: "germanic", note: "Plural of child (old plural shape)" },
  },
  clock: {
    immediate: { path: "latin", note: "Medieval Latin clocca “bell” via Dutch/French" },
  },
  cousin: {
    immediate: { path: "latin", note: "Latin consobrinus via French" },
  },
  cup: {
    immediate: { path: "latin", note: "Latin cuppa via Germanic/French lines" },
  },
  dad: {
    immediate: { path: "other", note: "Nursery word (like many languages’ “dad/tata” forms)" },
  },
  desk: {
    immediate: { path: "latin", note: "Latin desca / Italian desco via French" },
  },
  door: {
    immediate: { path: "germanic", note: "Old English duru" },
    pie: { root: "*dhwer-", meaning: "door, gateway" },
    czech_cognate: {
      word: "dveře",
      note: "Same root family — true cousin",
    },
  },
  downstairs: {
    immediate: { path: "germanic", note: "Compound: down + stairs" },
  },
  flat: {
    immediate: {
      path: "germanic",
      note: "Old Norse flatr “level”; apartment sense later British English",
    },
  },
  floor: {
    immediate: { path: "germanic", note: "Old English flōr" },
  },
  fridge: {
    immediate: {
      path: "latin",
      note: "Short for refrigerator (Latin frigus “cold”)",
    },
  },
  friend: {
    immediate: { path: "germanic", note: "Old English frēond (from “to love”)" },
    pie: { root: "*pri-", meaning: "love, free" },
  },
  garden: {
    immediate: {
      path: "germanic",
      note: "Frankish/Germanic via French jardin",
    },
  },
  girl: {
    immediate: { path: "other", note: "Middle English; deeper origin unclear" },
  },
  girlfriend: {
    immediate: { path: "other", note: "Modern compound: girl + friend" },
  },
  grandfather: {
    immediate: {
      path: "latin",
      note: "grand (French/Latin “great”) + father (Germanic)",
    },
  },
  grandmother: {
    immediate: {
      path: "latin",
      note: "grand (French/Latin) + mother (Germanic)",
    },
  },
  grandparent: {
    immediate: {
      path: "latin",
      note: "grand + parent (Latin parentes)",
    },
  },
  home: {
    immediate: { path: "germanic", note: "Old English hām" },
    pie: { root: "*koy-", meaning: "lie; settle; village" },
  },
  house: {
    immediate: { path: "germanic", note: "Old English hūs" },
  },
  husband: {
    immediate: {
      path: "germanic",
      note: "Old Norse húsbóndi “master of the house”",
    },
  },
  job: {
    immediate: { path: "other", note: "Later English; origin uncertain" },
  },
  key: {
    immediate: { path: "germanic", note: "Old English cǣg" },
  },
  kitchen: {
    immediate: { path: "latin", note: "Latin coquina via French" },
  },
  lamp: {
    immediate: { path: "latin", note: "Greek lampas via Latin" },
  },
  "living room": {
    immediate: {
      path: "germanic",
      note: "Modern compound: living + room (room is Germanic)",
    },
  },
  man: {
    immediate: { path: "germanic", note: "Old English mann “person”" },
    pie: { root: "*man-", meaning: "person, man" },
    czech_cognate: {
      word: "muž",
      note: "Related family (same ancient person/man line)",
    },
  },
  mum: {
    immediate: { path: "other", note: "Nursery word (like máma)" },
  },
  neighbour: {
    immediate: {
      path: "germanic",
      note: "Old English nēahgebūr “near-dweller”",
    },
  },
  parent: {
    immediate: { path: "latin", note: "Latin parens “begetter”" },
  },
  parents: {
    immediate: { path: "latin", note: "Plural of parent (Latin)" },
  },
  people: {
    immediate: { path: "latin", note: "Latin populus via French" },
  },
  phone: {
    immediate: {
      path: "latin",
      note: "Short for telephone (Greek tele “far” + phone “sound”)",
    },
  },
  plate: {
    immediate: { path: "latin", note: "Greek/Latin via French (flat metal)" },
  },
  room: {
    immediate: { path: "germanic", note: "Old English rūm “space”" },
  },
  shower: {
    immediate: { path: "germanic", note: "Old English scūr “rain shower”" },
  },
  sofa: {
    immediate: { path: "other", note: "Arabic via Turkish/French" },
  },
  stairs: {
    immediate: { path: "germanic", note: "Old English stǣger" },
  },
  table: {
    immediate: { path: "latin", note: "Latin tabula via French" },
  },
  teacher: {
    immediate: { path: "germanic", note: "teach (Old English tǣcan) + -er" },
  },
  toilet: {
    immediate: { path: "latin", note: "French toilette (cloth; later the room)" },
  },
  uncle: {
    immediate: { path: "latin", note: "Latin avunculus via French" },
  },
  upstairs: {
    immediate: { path: "germanic", note: "Compound: up + stairs" },
  },
  wall: {
    immediate: { path: "germanic", note: "Old English weall (early Latin wall loan into Germanic)" },
  },
  wife: {
    immediate: { path: "germanic", note: "Old English wīf “woman”" },
  },
  window: {
    immediate: {
      path: "germanic",
      note: "Old Norse vindauga “wind-eye”",
    },
  },
  woman: {
    immediate: {
      path: "germanic",
      note: "Old English wīfmann “wife-person” (not the same root as Czech žena)",
    },
  },

  // ─── Body ──────────────────────────────────────────────────────
  arm: {
    immediate: { path: "germanic", note: "Old English earm" },
    pie: { root: "*ar-", meaning: "fit, join" },
    notes: "Czech paže / ruka are different roots.",
  },
  back: {
    immediate: { path: "germanic", note: "Old English bæc" },
  },
  blonde: {
    immediate: { path: "latin", note: "French blond (Germanic into French, then English)" },
  },
  body: {
    immediate: { path: "germanic", note: "Old English bodig" },
  },
  face: {
    immediate: { path: "latin", note: "Latin facies via French" },
  },
  finger: {
    immediate: { path: "germanic", note: "Old English finger" },
    pie: { root: "*penkwe", meaning: "five (the five digits)" },
    notes: "Czech prst is a different root.",
  },
  hair: {
    immediate: { path: "germanic", note: "Old English hǣr" },
  },
  head: {
    immediate: { path: "germanic", note: "Old English hēafod" },
    pie: { root: "*kaput-", meaning: "head" },
    notes: "Latin caput is the clear cousin; Czech hlava is a different line.",
  },
  knee: {
    immediate: { path: "germanic", note: "Old English cnēo" },
    pie: { root: "*genu-", meaning: "knee" },
    czech_cognate: {
      word: "koleno",
      note: "Same root family (knee / genuflect line)",
    },
  },
  leg: {
    immediate: { path: "germanic", note: "Old Norse leggr into English" },
    notes: "Czech noha is a different root.",
  },
  mouth: {
    immediate: { path: "germanic", note: "Old English mūth" },
    notes: "Czech ústa is a different root.",
  },
  neck: {
    immediate: { path: "germanic", note: "Old English hnecca" },
  },
  short: {
    immediate: { path: "germanic", note: "Old English scort" },
  },
  shoulder: {
    immediate: { path: "germanic", note: "Old English sculdor" },
  },
  skin: {
    immediate: { path: "germanic", note: "Old Norse skinn into English" },
  },
  tall: {
    immediate: { path: "germanic", note: "Old English getæl / later “tall” sense from “swift, prompt”" },
  },

  // ─── Time & numbers ────────────────────────────────────────────
  afternoon: {
    immediate: { path: "germanic", note: "Compound: after + noon (noon from Latin nona)" },
  },
  ago: {
    immediate: { path: "germanic", note: "From older “agone” = gone by" },
  },
  always: {
    immediate: { path: "germanic", note: "all + way(s) “every way / every time”" },
  },
  april: {
    immediate: { path: "latin", note: "Latin Aprilis" },
  },
  august: {
    immediate: { path: "latin", note: "Latin Augustus (emperor name)" },
  },
  december: {
    immediate: { path: "latin", note: "Latin december “tenth month” (old calendar)" },
  },
  early: {
    immediate: { path: "germanic", note: "Old English ǣrlīce" },
  },
  eighteen: {
    immediate: { path: "germanic", note: "eight + teen (“ten more”)" },
  },
  eighty: {
    immediate: { path: "germanic", note: "eight + -ty (“tens”)" },
  },
  eleven: {
    immediate: { path: "germanic", note: "Old English endleofan “one left (after ten)”" },
  },
  evening: {
    immediate: { path: "germanic", note: "Old English ǣfnung" },
  },
  february: {
    immediate: { path: "latin", note: "Latin Februarius" },
  },
  fifteen: {
    immediate: { path: "germanic", note: "five + teen" },
  },
  fifth: {
    immediate: { path: "germanic", note: "Ordinal of five" },
  },
  fifty: {
    immediate: { path: "germanic", note: "five + -ty" },
  },
  first: {
    immediate: { path: "germanic", note: "Old English fyrst (from “fore”)" },
    pie: { root: "*per-", meaning: "forward, through, first" },
  },
  forty: {
    immediate: { path: "germanic", note: "four + -ty" },
  },
  fourteen: {
    immediate: { path: "germanic", note: "four + teen" },
  },
  fourth: {
    immediate: { path: "germanic", note: "Ordinal of four" },
  },
  friday: {
    immediate: {
      path: "germanic",
      note: "Frigg’s day (Germanic goddess; calque of Latin Veneris dies)",
    },
  },
  half: {
    immediate: { path: "germanic", note: "Old English healf" },
    pie: { root: "*skelh-", meaning: "cut; half" },
  },
  hour: {
    immediate: { path: "latin", note: "Greek/Latin hora via French" },
  },
  hundred: {
    immediate: { path: "germanic", note: "Old English hundred" },
    pie: { root: "*kmtom", meaning: "hundred" },
    czech_cognate: {
      word: "sto",
      note: "Same ancient hundred line (forms look different)",
    },
  },
  january: {
    immediate: { path: "latin", note: "Latin Januarius (god Janus)" },
  },
  july: {
    immediate: { path: "latin", note: "Latin Julius (Julius Caesar)" },
  },
  june: {
    immediate: { path: "latin", note: "Latin Junius" },
  },
  late: {
    immediate: { path: "germanic", note: "Old English læt “slow, late”" },
  },
  march: {
    immediate: { path: "latin", note: "Latin Martius (god Mars)" },
  },
  may: {
    immediate: { path: "latin", note: "Latin Maius" },
  },
  million: {
    immediate: { path: "latin", note: "Italian milione from Latin mille “thousand”" },
  },
  minute: {
    immediate: { path: "latin", note: "Latin minuta “small part” via French" },
  },
  monday: {
    immediate: { path: "germanic", note: "Moon’s day (calque of Latin dies Lunae)" },
  },
  month: {
    immediate: { path: "germanic", note: "Old English mōnath (from moon)" },
    pie: { root: "*menot-", meaning: "moon; month" },
    czech_cognate: {
      word: "měsíc",
      note: "Same moon/month family",
    },
  },
  morning: {
    immediate: { path: "germanic", note: "From morn (Old English morgen)" },
  },
  never: {
    immediate: { path: "germanic", note: "ne + ever “not ever”" },
  },
  nineteen: {
    immediate: { path: "germanic", note: "nine + teen" },
  },
  ninety: {
    immediate: { path: "germanic", note: "nine + -ty" },
  },
  november: {
    immediate: { path: "latin", note: "Latin november “ninth month” (old calendar)" },
  },
  now: {
    immediate: { path: "germanic", note: "Old English nū" },
    pie: { root: "*nu-", meaning: "now" },
    czech_cognate: {
      word: "nyní",
      note: "Related family (soft; same ancient now line)",
    },
  },
  number: {
    immediate: { path: "latin", note: "Latin numerus via French" },
  },
  october: {
    immediate: { path: "latin", note: "Latin october “eighth month” (old calendar)" },
  },
  often: {
    immediate: { path: "germanic", note: "Old English oft + -en" },
  },
  once: {
    immediate: { path: "germanic", note: "From one + adverb ending" },
  },
  quarter: {
    immediate: { path: "latin", note: "Latin quartarius “fourth part” via French" },
  },
  saturday: {
    immediate: {
      path: "latin",
      note: "Saturn’s day (Latin dies Saturni kept in English)",
    },
  },
  second: {
    immediate: { path: "latin", note: "Latin secundus “following” via French" },
  },
  september: {
    immediate: { path: "latin", note: "Latin september “seventh month” (old calendar)" },
  },
  seventeen: {
    immediate: { path: "germanic", note: "seven + teen" },
  },
  seventy: {
    immediate: { path: "germanic", note: "seven + -ty" },
  },
  sixteen: {
    immediate: { path: "germanic", note: "six + teen" },
  },
  sixty: {
    immediate: { path: "germanic", note: "six + -ty" },
  },
  sometimes: {
    immediate: { path: "germanic", note: "some + times" },
  },
  soon: {
    immediate: { path: "germanic", note: "Old English sōna “immediately”" },
  },
  sunday: {
    immediate: { path: "germanic", note: "Sun’s day (calque of Latin dies Solis)" },
  },
  third: {
    immediate: { path: "germanic", note: "Ordinal of three" },
    pie: { root: "*treyes", meaning: "three" },
    czech_cognate: {
      word: "třetí",
      note: "Built on the same three root as tři",
    },
  },
  thirteen: {
    immediate: { path: "germanic", note: "three + teen" },
  },
  thirty: {
    immediate: { path: "germanic", note: "three + -ty" },
  },
  thousand: {
    immediate: { path: "germanic", note: "Old English thūsend" },
  },
  thursday: {
    immediate: {
      path: "germanic",
      note: "Thor’s day (calque of Latin dies Iovis)",
    },
  },
  time: {
    immediate: { path: "germanic", note: "Old English tīma" },
    pie: { root: "*di-", meaning: "divide; stretch of time" },
  },
  today: {
    immediate: { path: "germanic", note: "to + day" },
  },
  tomorrow: {
    immediate: { path: "germanic", note: "to + morrow (morning)" },
  },
  tonight: {
    immediate: { path: "germanic", note: "to + night" },
  },
  tuesday: {
    immediate: {
      path: "germanic",
      note: "Tiw’s day (Germanic god; calque of Latin dies Martis)",
    },
  },
  twelve: {
    immediate: { path: "germanic", note: "Old English twelf “two left (after ten)”" },
  },
  twenty: {
    immediate: { path: "germanic", note: "two + -ty" },
  },
  twice: {
    immediate: { path: "germanic", note: "From two + adverb ending" },
  },
  wednesday: {
    immediate: {
      path: "germanic",
      note: "Woden’s day (calque of Latin dies Mercurii)",
    },
  },
  week: {
    immediate: { path: "germanic", note: "Old English wice" },
  },
  weekend: {
    immediate: { path: "germanic", note: "Modern compound: week + end" },
  },
  year: {
    immediate: { path: "germanic", note: "Old English gēar" },
    pie: { root: "*yer-", meaning: "year, season" },
  },
  yesterday: {
    immediate: { path: "germanic", note: "yester + day (yester = previous)" },
    pie: { root: "*dhghes-", meaning: "yesterday" },
  },

  // ─── Nature ────────────────────────────────────────────────────
  air: {
    immediate: { path: "latin", note: "Greek/Latin aer via French" },
  },
  autumn: {
    immediate: { path: "latin", note: "Latin autumnus" },
  },
  cloud: {
    immediate: { path: "germanic", note: "Old English clūd “rock, mass” → sky mass" },
  },
  cool: {
    immediate: { path: "germanic", note: "Old English cōl" },
  },
  dark: {
    immediate: { path: "germanic", note: "Old English deorc" },
  },
  dry: {
    immediate: { path: "germanic", note: "Old English drȳge" },
  },
  field: {
    immediate: { path: "germanic", note: "Old English feld" },
  },
  flower: {
    immediate: { path: "latin", note: "Latin flos via French fleur" },
  },
  forest: {
    immediate: { path: "latin", note: "Latin forestis via French" },
  },
  hill: {
    immediate: { path: "germanic", note: "Old English hyll" },
  },
  island: {
    immediate: {
      path: "germanic",
      note: "Old English īegland “water-land” (s later added by mix-up with isle)",
    },
  },
  lake: {
    immediate: { path: "latin", note: "Latin lacus via French (and related Germanic forms)" },
  },
  land: {
    immediate: { path: "germanic", note: "Old English land" },
    pie: { root: "*lendh-", meaning: "land, open ground" },
  },
  light: {
    immediate: { path: "germanic", note: "Old English lēoht" },
    pie: { root: "*leuk-", meaning: "light, bright" },
    notes: "Same ancient bright/light family as Latin lux; Czech světlo is a different everyday word.",
  },
  mountain: {
    immediate: { path: "latin", note: "Latin mons via French" },
  },
  nature: {
    immediate: { path: "latin", note: "Latin natura via French" },
  },
  plant: {
    immediate: { path: "latin", note: "Latin planta via French" },
  },
  rain: {
    immediate: { path: "germanic", note: "Old English regn" },
  },
  river: {
    immediate: { path: "latin", note: "Latin riparia via French rivière" },
  },
  sea: {
    immediate: { path: "germanic", note: "Old English sǣ" },
  },
  sky: {
    immediate: { path: "germanic", note: "Old Norse ský “cloud” into English" },
  },
  space: {
    immediate: { path: "latin", note: "Latin spatium via French" },
  },
  spring: {
    immediate: {
      path: "germanic",
      note: "Old English springan “to leap” → season when plants leap up",
    },
  },
  summer: {
    immediate: { path: "germanic", note: "Old English sumor" },
  },
  tree: {
    immediate: { path: "germanic", note: "Old English trēow" },
    pie: { root: "*drew-", meaning: "wood, tree" },
    czech_cognate: {
      word: "dřevo",
      note: "Same wood/tree family (soft; everyday strom is a different word)",
    },
  },
  warm: {
    immediate: { path: "germanic", note: "Old English wearm" },
    pie: { root: "*gwher-", meaning: "warm, hot" },
  },
  weather: {
    immediate: { path: "germanic", note: "Old English weder" },
  },
  wet: {
    immediate: { path: "germanic", note: "Old English wǣt" },
  },
  winter: {
    immediate: { path: "germanic", note: "Old English winter" },
  },
  world: {
    immediate: {
      path: "germanic",
      note: "Old English weorold “age of man” (wer “man” + old “age”)",
    },
  },
};

// Fix any accidental smart quotes in notes from typing
function clean(obj) {
  if (typeof obj === "string") return obj.replace(/[”“]/g, '"').replace(/[’]/g, "'");
  if (Array.isArray(obj)) return obj.map(clean);
  if (obj && typeof obj === "object") {
    const o = {};
    for (const [k, v] of Object.entries(obj)) o[k] = clean(v);
    return o;
  }
  return obj;
}

const cleaned = clean(batch);
let added = 0;
let skipped = 0;
for (const [lemma, entry] of Object.entries(cleaned)) {
  if (data.entries[lemma]) {
    skipped++;
    continue;
  }
  data.entries[lemma] = entry;
  added++;
}

data.note =
  "Stage A+: A1 Word roots. Learner-friendly PIE spellings (no h1/h2/h3). Path-only OK; dual-layer when solid; soft Czech “related family” notes allowed. Omit only opaque. Batch 1: home_family, body, time_numbers, nature.";

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log("added", added, "skipped existing", skipped, "total entries", Object.keys(data.entries).length);

// coverage for batch packs
function norm(en) {
  return String(en || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split("/")[0]
    .replace(/[.,!?;:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
for (const id of ["a1_home_family", "a1_body", "a1_time_numbers", "a1_nature"]) {
  const p = JSON.parse(fs.readFileSync(`data/blocks/${id}.json`, "utf8"));
  const lemmas = new Set();
  for (const b of p.blocks || []) {
    for (const it of b.items || []) {
      const L = norm(it.en);
      if (L) lemmas.add(L);
    }
  }
  const miss = [...lemmas].filter((l) => !data.entries[l]).sort();
  console.log(id, "covered", lemmas.size - miss.length, "/", lemmas.size, "missing:", miss.join(", ") || "—");
}
