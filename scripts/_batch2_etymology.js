/**
 * Batch 2: a1_food, a1_clothes, a1_colours, a1_animals, a1_health
 */
const fs = require("fs");
const path = require("path");

const file = path.join("data/insights/etymology.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

/** @type {Record<string, object>} */
const batch = {
  // Food
  apple: {
    immediate: { path: "germanic", note: "Old English aeppel" },
    pie: { root: "*abel-", meaning: "apple" },
    czech_cognate: { word: "jablko", note: "Same root family — true cousin" },
  },
  banana: {
    immediate: { path: "other", note: "West African via Portuguese/Spanish" },
  },
  beer: {
    immediate: { path: "germanic", note: "Old English beor (and related Germanic forms)" },
  },
  bill: {
    immediate: {
      path: "latin",
      note: "Medieval Latin bulla 'seal, document' → account to pay",
    },
  },
  bottle: {
    immediate: { path: "latin", note: "Latin buttis via French bouteille" },
  },
  bowl: {
    immediate: { path: "germanic", note: "Old English bolla" },
  },
  bread: {
    immediate: { path: "germanic", note: "Old English bread 'piece, morsel'" },
  },
  breakfast: {
    immediate: {
      path: "germanic",
      note: "Compound: break + fast (break the night's fasting)",
    },
  },
  butter: {
    immediate: { path: "latin", note: "Greek/Latin butyrum via Germanic" },
  },
  cake: {
    immediate: { path: "germanic", note: "Old Norse kaka into English" },
  },
  carrot: {
    immediate: { path: "latin", note: "Greek/Latin via French carotte" },
  },
  cheese: {
    immediate: { path: "latin", note: "Latin caseus into West Germanic" },
  },
  chicken: {
    immediate: { path: "germanic", note: "Old English cicen (young bird)" },
  },
  chocolate: {
    immediate: { path: "other", note: "Nahuatl via Spanish chocolate" },
  },
  coffee: {
    immediate: { path: "other", note: "Arabic qahwa via Turkish/European languages" },
  },
  cooker: {
    immediate: { path: "latin", note: "cook (Latin coquere via French) + -er" },
  },
  cooking: {
    immediate: { path: "latin", note: "From cook (Latin coquere via French)" },
  },
  delicious: {
    immediate: { path: "latin", note: "Latin deliciosus via French" },
  },
  diet: {
    immediate: { path: "latin", note: "Greek/Latin diaeta 'way of life / food'" },
  },
  dinner: {
    immediate: {
      path: "latin",
      note: "French disner from Latin (break the fast)",
    },
  },
  dish: {
    immediate: { path: "latin", note: "Latin discus via Germanic/French lines" },
  },
  drink: {
    immediate: { path: "germanic", note: "Old English drincan" },
    pie: { root: "*dhreg-", meaning: "draw, sip" },
  },
  egg: {
    immediate: { path: "germanic", note: "Old Norse egg into English" },
    pie: { root: "*owyo-", meaning: "egg" },
    czech_cognate: { word: "vejce", note: "Same root family (soft form reshape)" },
  },
  fish: {
    immediate: { path: "germanic", note: "Old English fisc" },
    pie: { root: "*pisk-", meaning: "fish" },
    notes: "Czech ryba is a different root.",
  },
  food: {
    immediate: { path: "germanic", note: "Old English foda" },
    pie: { root: "*pa-", meaning: "feed, protect" },
  },
  fork: {
    immediate: { path: "latin", note: "Latin furca via French" },
  },
  fruit: {
    immediate: { path: "latin", note: "Latin fructus via French" },
  },
  glass: {
    immediate: {
      path: "germanic",
      note: "West Germanic; related to shine/glow words",
    },
  },
  hungry: {
    immediate: { path: "germanic", note: "Old English hungrig (from hunger)" },
  },
  "ice cream": {
    immediate: {
      path: "germanic",
      note: "Compound: ice (Germanic) + cream (Latin/French)",
    },
  },
  juice: {
    immediate: { path: "latin", note: "Latin jus 'broth, sauce' via French" },
  },
  knife: {
    immediate: { path: "germanic", note: "Old English cnif (from Old Norse)" },
  },
  lunch: {
    immediate: { path: "other", note: "Later English short meal name; origin debated" },
  },
  meal: {
    immediate: {
      path: "germanic",
      note: "Old English mael 'measure, fixed time, meal'",
    },
  },
  meat: {
    immediate: { path: "germanic", note: "Old English mete 'food' → flesh food" },
  },
  menu: {
    immediate: {
      path: "latin",
      note: "French menu 'detailed list' from Latin minutus",
    },
  },
  milk: {
    immediate: { path: "germanic", note: "Old English meolc" },
    pie: { root: "*melg-", meaning: "to milk; milk" },
    czech_cognate: { word: "mléko", note: "Same root family — true cousin" },
  },
  onion: {
    immediate: { path: "latin", note: "Latin unio via French oignon" },
  },
  orange: {
    immediate: {
      path: "other",
      note: "Sanskrit via Arabic/Spanish into French (fruit, then colour)",
    },
  },
  order: {
    immediate: {
      path: "latin",
      note: "Latin ordo via French (command / sequence / restaurant order)",
    },
  },
  oven: {
    immediate: { path: "germanic", note: "Old English ofen" },
  },
  pepper: {
    immediate: { path: "latin", note: "Sanskrit via Greek/Latin piper" },
  },
  potato: {
    immediate: { path: "other", note: "Taino batata via Spanish patata" },
  },
  rice: {
    immediate: {
      path: "other",
      note: "Greek/Latin via French; ultimate South Asian source",
    },
  },
  salad: {
    immediate: {
      path: "latin",
      note: "Latin sal 'salt' via Italian/French salade",
    },
  },
  salt: {
    immediate: { path: "germanic", note: "Old English sealt" },
    pie: { root: "*sal-", meaning: "salt" },
    czech_cognate: { word: "sůl", note: "Same root family — true cousin" },
  },
  sandwich: {
    immediate: {
      path: "other",
      note: "From the Earl of Sandwich (18th c. English name)",
    },
  },
  snack: {
    immediate: {
      path: "germanic",
      note: "Middle Dutch/Low German 'snap, bite' into English",
    },
  },
  soup: {
    immediate: {
      path: "latin",
      note: "French soupe (Germanic into French, then English)",
    },
  },
  spoon: {
    immediate: { path: "germanic", note: "Old English spon 'chip of wood'" },
  },
  sugar: {
    immediate: {
      path: "other",
      note: "Sanskrit via Arabic/Medieval Latin into French",
    },
  },
  tea: {
    immediate: {
      path: "other",
      note: "Chinese via Malay/Dutch (tea) or Portuguese (cha)",
    },
  },
  thirsty: {
    immediate: { path: "germanic", note: "Old English thyrstig (from thirst)" },
  },
  tomato: {
    immediate: { path: "other", note: "Nahuatl via Spanish tomate" },
  },
  vegetable: {
    immediate: {
      path: "latin",
      note: "Latin vegetabilis 'animating, growing' via French",
    },
  },
  wine: {
    immediate: {
      path: "latin",
      note: "Latin vinum into Germanic; Czech vino is the same Latin loan line",
    },
  },
  "wine glass": {
    immediate: {
      path: "other",
      note: "wine (Latin loan) + glass (Germanic)",
    },
  },

  // Clothes
  boot: {
    immediate: {
      path: "latin",
      note: "Old French bote; footwear sense via French",
    },
  },
  clothes: {
    immediate: { path: "germanic", note: "Old English clathas (plural of cloth)" },
  },
  coat: {
    immediate: { path: "latin", note: "Frankish/Germanic via French cote" },
  },
  dress: {
    immediate: {
      path: "latin",
      note: "French dresser 'arrange' from Latin directus",
    },
  },
  glasses: {
    immediate: {
      path: "germanic",
      note: "Plural of glass (spectacles sense)",
    },
  },
  glove: {
    immediate: { path: "germanic", note: "Old English glof" },
  },
  hat: {
    immediate: { path: "germanic", note: "Old English haet" },
  },
  jacket: {
    immediate: {
      path: "latin",
      note: "French jaquette (diminutive of jaque)",
    },
  },
  jeans: {
    immediate: {
      path: "other",
      note: "From Genoa cloth name (modern trousers sense)",
    },
  },
  pocket: {
    immediate: {
      path: "germanic",
      note: "Old North French / Germanic 'bag, pouch'",
    },
  },
  scarf: {
    immediate: {
      path: "other",
      note: "Old North French escarpe; deeper origin debated",
    },
  },
  shirt: {
    immediate: { path: "germanic", note: "Old English scyrte" },
    pie: { root: "*sker-", meaning: "cut" },
    notes: "Related to skirt/short (cut garment); Czech kosile is a different loan line.",
  },
  shoe: {
    immediate: { path: "germanic", note: "Old English scoh" },
  },
  skirt: {
    immediate: { path: "germanic", note: "Old Norse skyrta into English" },
  },
  sock: {
    immediate: { path: "latin", note: "Latin soccus 'light shoe' via Greek" },
  },
  suit: {
    immediate: {
      path: "latin",
      note: "French suite / Latin sequi 'follow' → matching set",
    },
  },
  sweater: {
    immediate: {
      path: "germanic",
      note: "Modern: sweat (Germanic) + -er",
    },
  },
  "t-shirt": {
    immediate: {
      path: "germanic",
      note: "Modern: T-shaped shirt (shirt is Germanic)",
    },
  },
  tie: {
    immediate: {
      path: "germanic",
      note: "From tie 'to bind'; necktie sense later",
    },
  },
  trousers: {
    immediate: {
      path: "other",
      note: "Gaelic/Irish triubhas via Scots into English",
    },
  },
  umbrella: {
    immediate: {
      path: "latin",
      note: "Italian ombrello from Latin umbra 'shade'",
    },
  },
  watch: {
    immediate: {
      path: "germanic",
      note: "Old English waecce 'wakefulness'; timepiece sense later",
    },
  },
  wear: {
    immediate: {
      path: "germanic",
      note: "Old English werian 'carry, wear clothes'",
    },
  },

  // Colours
  black: {
    immediate: { path: "germanic", note: "Old English blaec" },
  },
  blue: {
    immediate: {
      path: "germanic",
      note: "Old French bleu from Germanic; English reshaped the form",
    },
  },
  brown: {
    immediate: { path: "germanic", note: "Old English brun" },
    pie: { root: "*bher-", meaning: "bright, brown" },
  },
  green: {
    immediate: { path: "germanic", note: "Old English grene" },
    pie: { root: "*ghre-", meaning: "grow; green plants" },
  },
  grey: {
    immediate: { path: "germanic", note: "Old English graeg" },
  },
  pink: {
    immediate: {
      path: "other",
      note: "From the flower name pink; colour sense later English",
    },
  },
  purple: {
    immediate: { path: "latin", note: "Greek/Latin purpura via French" },
  },
  red: {
    immediate: { path: "germanic", note: "Old English read" },
    pie: { root: "*reudh-", meaning: "red" },
    czech_cognate: {
      word: "rudý",
      note: "Same root family (soft; everyday cerveny is a different word)",
    },
  },
  white: {
    immediate: { path: "germanic", note: "Old English hwit" },
    pie: { root: "*kweit-", meaning: "white, bright" },
  },
  yellow: {
    immediate: { path: "germanic", note: "Old English geolu" },
    pie: { root: "*ghel-", meaning: "shine; yellow, green" },
    czech_cognate: {
      word: "žlutý",
      note: "Same bright-colour root family (soft)",
    },
  },

  // Animals
  bear: {
    immediate: {
      path: "germanic",
      note: "Old English bera (often linked to brown)",
    },
  },
  bird: {
    immediate: { path: "germanic", note: "Old English brid 'young bird'" },
  },
  cat: {
    immediate: { path: "latin", note: "Latin cattus (earlier Mediterranean source)" },
  },
  cow: {
    immediate: { path: "germanic", note: "Old English cu" },
    pie: { root: "*gwou-", meaning: "cow, cattle" },
    notes: "Czech krava is usually treated as a different line.",
  },
  dog: {
    immediate: {
      path: "germanic",
      note: "Old English docga; deeper origin unclear",
    },
  },
  duck: {
    immediate: { path: "germanic", note: "Old English duce 'diver'" },
  },
  elephant: {
    immediate: { path: "latin", note: "Greek/Latin elephas" },
  },
  farm: {
    immediate: {
      path: "latin",
      note: "Latin firmare via French ferme 'fixed rent / farm'",
    },
  },
  frog: {
    immediate: { path: "germanic", note: "Old English frogga" },
  },
  horse: {
    immediate: { path: "germanic", note: "Old English hors" },
  },
  insect: {
    immediate: {
      path: "latin",
      note: "Latin insectum 'cut into' (segmented body)",
    },
  },
  lion: {
    immediate: { path: "latin", note: "Greek/Latin leo via French" },
  },
  monkey: {
    immediate: { path: "other", note: "Later European; origin uncertain" },
  },
  mouse: {
    immediate: { path: "germanic", note: "Old English mus" },
    pie: { root: "*mus-", meaning: "mouse" },
    czech_cognate: { word: "myš", note: "Same root family — true cousin" },
  },
  pet: {
    immediate: {
      path: "other",
      note: "Later English kept animal; origin debated",
    },
  },
  pig: {
    immediate: { path: "germanic", note: "Old English picg / pig" },
  },
  rabbit: {
    immediate: { path: "other", note: "Middle English; deeper origin uncertain" },
  },
  sheep: {
    immediate: { path: "germanic", note: "Old English sceap" },
  },
  snake: {
    immediate: { path: "germanic", note: "Old English snaca" },
    pie: { root: "*sneg-", meaning: "crawl, snake" },
  },
  wild: {
    immediate: { path: "germanic", note: "Old English wilde" },
  },
  zoo: {
    immediate: {
      path: "latin",
      note: "Short for zoological garden (Greek zoion 'animal')",
    },
  },

  // Health
  ambulance: {
    immediate: {
      path: "latin",
      note: "French ambulance from Latin ambulare 'walk' (moving hospital)",
    },
  },
  appointment: {
    immediate: {
      path: "latin",
      note: "French from Latin ad + punctum 'fixed time'",
    },
  },
  cold: {
    immediate: {
      path: "germanic",
      note: "Old English cald (temperature); illness sense later",
    },
    pie: { root: "*gel-", meaning: "cold, freeze" },
  },
  cough: {
    immediate: {
      path: "germanic",
      note: "Middle English; imitative Germanic origin",
    },
  },
  dentist: {
    immediate: {
      path: "latin",
      note: "French dentiste from Latin dens 'tooth'",
    },
  },
  doctor: {
    immediate: {
      path: "latin",
      note: "Latin doctor 'teacher'; medical sense later",
    },
  },
  fever: {
    immediate: { path: "latin", note: "Latin febris via French" },
  },
  flu: {
    immediate: {
      path: "latin",
      note: "Short for influenza (Italian, from Latin influentia)",
    },
  },
  headache: {
    immediate: {
      path: "germanic",
      note: "Compound: head + ache (both Germanic)",
    },
  },
  health: {
    immediate: {
      path: "germanic",
      note: "Old English haelth (from whole / hale)",
    },
  },
  healthy: {
    immediate: { path: "germanic", note: "From health / whole (Germanic)" },
  },
  hospital: {
    immediate: {
      path: "latin",
      note: "Latin hospitalis 'of a guest' via French",
    },
  },
  hurt: {
    immediate: {
      path: "latin",
      note: "Old French hurter 'strike' (Frankish into French)",
    },
  },
  ill: {
    immediate: { path: "germanic", note: "Old Norse illr 'bad' into English" },
  },
  medicine: {
    immediate: { path: "latin", note: "Latin medicina via French" },
  },
  nurse: {
    immediate: {
      path: "latin",
      note: "Latin nutrire 'nourish' via French",
    },
  },
  pain: {
    immediate: { path: "latin", note: "Latin poena 'penalty' via French" },
  },
  patient: {
    immediate: {
      path: "latin",
      note: "Latin patiens 'suffering / enduring'",
    },
  },
  pharmacy: {
    immediate: {
      path: "latin",
      note: "Greek pharmakon 'drug' via Latin/French",
    },
  },
  pill: {
    immediate: { path: "latin", note: "Latin pilula 'little ball'" },
  },
  rest: {
    immediate: { path: "germanic", note: "Old English raest 'rest, bed'" },
  },
  sick: {
    immediate: { path: "germanic", note: "Old English seoc" },
  },
  stomach: {
    immediate: { path: "latin", note: "Greek/Latin stomachus via French" },
  },
  temperature: {
    immediate: { path: "latin", note: "Latin temperatura via French" },
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
  "A1 Word roots. Learner-friendly PIE (no h1/h2/h3). Path-only OK; dual-layer when solid; soft Czech related-family notes OK. Batches: (1) family/body/time/nature (2) food/clothes/colours/animals/health.";

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(
  "added",
  added,
  "skipped existing",
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

for (const id of [
  "a1_food",
  "a1_clothes",
  "a1_colours",
  "a1_animals",
  "a1_health",
]) {
  const p = JSON.parse(fs.readFileSync(`data/blocks/${id}.json`, "utf8"));
  const lemmas = new Set();
  for (const b of p.blocks || []) {
    for (const it of b.items || []) {
      const L = norm(it.en);
      if (L) lemmas.add(L);
    }
  }
  const miss = [...lemmas].filter((l) => !data.entries[l]).sort();
  console.log(
    id,
    "covered",
    lemmas.size - miss.length,
    "/",
    lemmas.size,
    "missing:",
    miss.join(", ") || "—",
  );
}
