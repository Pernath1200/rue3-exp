/**
 * Global dud scrub for leaf carrier tags.
 *
 * Rules:
 *  - Rooms / building parts / orgs: never "I need a basement/department"
 *  - Building fabric: never "I enjoy ceiling/heating"
 *  - People roles: "He is my …" / "I am a …", not "I need a employee"
 *  - Negative events: never "Have a good accident"
 *  - Explicit lemma overrides still win
 *
 * Usage: node scripts/fix_carrier_tags.mjs
 *        node scripts/fix_carrier_tags.mjs --dry
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dir = path.join(root, "data/blocks");
const dry = process.argv.includes("--dry");

const set = (s) =>
  new Set(
    s
      .trim()
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .filter(Boolean),
  );

function clean(en) {
  return String(en || "")
    .replace(/\([^)]*\)/g, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

// ── Semantic classes ──────────────────────────────────────────────

/** Spaces you can be "in" or ask "where is" — not "I need a …" as primary */
const ROOMS_PLACES = set(`
  basement attic balcony garage hall corridor kitchen bathroom bedroom
  living room dining room office department factory workplace apartment
  flat house hotel hostel room garden park school university hospital
  pharmacy bank shop store market restaurant cafe cinema theatre theater
  station airport platform museum library church stadium farm
  countryside capital island mountain river lake sea forest bridge tower
  castle palace street road square village town city country
  classroom laboratory canteen playground gym pool
  lift elevator lobby entrance exit
`);

/** Building fabric / fixed structure */
const BUILDING_PARTS = set(`
  ceiling roof floor wall walls stairs stair window door gate fence
  chimney basement? 
`);
// fix accidental
const BUILDING_PARTS_CLEAN = set(`
  ceiling roof floor wall walls stairs stair window door gate fence
  chimney balcony
`);

/** Orgs / institutions you work in/for */
const ORGS = set(`
  company firm business department team industry staff employer
  organisation organization government council union charity
  hospital school university college factory office workplace
`);

/** People / roles */
const PEOPLE = set(`
  boss colleague manager employee employer doctor nurse teacher student
  waiter driver engineer secretary officer leader landlord neighbour neighbor
  partner worker farmer actor actress singer dancer player writer
  patient dentist pilot tourist traveller traveler guest visitor
  friend brother sister mother father man woman boy girl child
  husband wife son daughter parent customer client passenger
  businessman professional owner lady gentleman guy couple
  person people adult kid baby mum dad
`);

/** Illnesses / symptoms — "I have a …" */
const ILLNESS = set(`
  headache fever cough cold flu toothache backache stomachache
  allergy injury disease illness virus cancer symptom pain
  temperature infection cold
`);

/** Mass / uncountable — bare have/need */
const MASS = set(`
  furniture heating housework washing rubbish money time work
  staff unemployment energy blood stress furniture luggage
  water bread milk rice coffee tea food fruit information advice
  news homework furniture weather traffic music fun love
  medicine heat rent central heating
`);

/** Adjectives / states */
const ADJ = set(`
  healthy ill sick tired hungry thirsty happy sad angry bored
  excited worried afraid nervous surprised unhappy lonely jealous
  proud fit unfit allergic unemployed professional broken
  early late good bad big small new old wild tame free busy
  full empty open closed ready sure real special normal
  single married divorced engaged pregnant retired
`);

/** Pure adverbs / directions — skip Sentence */
const SKIP = set(`
  upstairs downstairs today tomorrow yesterday tonight now ago
  always never often sometimes soon here there already yet still
  colour color
`);

/** Never "have a good X" */
const NO_HAVE_A_GOOD = set(`
  accident problem issue delay death cancer disease illness injury
  unemployment war pain stress danger emergency
`);

/** Activity-ish only — enjoy/fun ok */
const ACTIVITY_OK = set(`
  swimming running reading writing cooking shopping hiking camping
  skiing dancing singing fishing cycling exercise training sport
  football tennis basketball sightseeing travel travelling traveling
`);

// ── Explicit overrides (highest priority) ─────────────────────────

const FIX = {
  // time / discourse
  today: [],
  tomorrow: [],
  yesterday: [],
  tonight: [],
  now: [],
  ago: [],
  early: ["it_is", "i_am_adj"],
  late: ["it_is", "i_am_adj"],
  morning: ["this_is_a"],
  evening: ["this_is_a"],
  afternoon: ["this_is_a"],
  night: ["this_is_a"],
  day: ["this_is_a", "have_a_good"],
  week: ["this_is_a"],
  month: ["this_is_a"],
  year: ["this_is_a"],
  hour: ["this_is_a"],
  minute: ["this_is_a"],
  weekend: ["have_a_good"],
  time: ["i_have_bare", "i_need_bare"],
  number: ["this_is_a"],

  // health
  allergic: ["i_am_adj", "he_is_adj"],
  broken: ["it_is", "the_bag_is"],
  fit: ["i_am_adj", "he_is_adj"],
  unfit: ["i_am_adj", "he_is_adj"],
  breathe: ["i_want_to", "we_need_to"],
  unemployed: ["i_am_adj", "he_is_adj"],
  professional: ["i_am_a", "he_is_a", "i_am_adj"],

  // work / orgs (rich)
  department: ["i_work_in", "where_is_the", "this_is_a"],
  company: ["i_work_for", "i_work_in", "this_is_a"],
  office: ["i_work_in", "where_is_the", "this_is_a"],
  factory: ["i_work_in", "i_go_to", "where_is_the", "this_is_a"],
  workplace: ["i_work_in", "i_go_to", "where_is_the", "this_is_a"],
  industry: ["i_work_in", "lets_talk_about"],
  employer: ["i_work_for", "he_is_a", "this_is_a"],
  employee: ["i_am_a", "he_is_a", "this_is_a"],
  boss: ["he_is_my", "he_is_a", "this_is_a"],
  colleague: ["he_is_my", "he_is_a", "this_is_a"],
  manager: ["he_is_my", "i_am_a", "he_is_a"],
  career: ["i_look_for", "i_have_a", "lets_talk_about"],
  job: ["i_look_for", "i_have_a", "i_need_a"],
  contract: ["i_sign_a", "i_have_a", "i_need_a"],
  application: ["i_send_a", "i_have_a", "i_need_a"],
  interview: ["i_have_a_meeting", "i_have_a", "i_need_a"],
  meeting: ["i_have_a_meeting", "i_have_a", "lets_talk_about"],
  conference: ["i_have_a_meeting", "i_have_a", "lets_talk_about"],
  salary: ["i_get_a", "i_have_a", "i_need_a"],
  wage: ["i_get_a", "i_have_a"],
  training: ["i_have_a", "i_need_a", "i_look_for"],
  team: ["i_work_in", "i_have_a", "this_is_a"],
  staff: ["i_have_bare", "this_is_a"],
  unemployment: ["lets_talk_about", "is_important"],
  skill: ["i_have_a", "i_need_a", "lets_talk_about"],
  profession: ["lets_talk_about", "this_is_a"],

  // home / building
  basement: ["this_is_a", "where_is_the"],
  ceiling: ["this_is_a", "where_is_the"],
  roof: ["this_is_a", "where_is_the"],
  floor: ["this_is_a", "where_is_the"],
  wall: ["this_is_a", "where_is_the"],
  stairs: ["this_is_a", "where_is_the"],
  stair: ["this_is_a"],
  hall: ["this_is_a", "where_is_the"],
  garage: ["this_is_a", "where_is_the", "i_have_a"],
  balcony: ["this_is_a", "where_is_the", "i_have_a"],
  attic: ["this_is_a", "where_is_the"],
  downstairs: [],
  upstairs: [],
  heating: ["i_have_bare", "i_need_bare"],
  "central heating": ["i_have_bare", "i_need_bare"],
  furniture: ["i_have_bare", "i_need_bare"],
  housework: ["i_have_bare", "i_need_bare"],
  washing: ["i_have_bare", "i_need_bare"],
  rubbish: ["i_have_bare", "i_need_bare"],
  landlord: ["he_is_my", "he_is_a", "this_is_a"],
  neighbour: ["he_is_my", "he_is_a", "this_is_a"],
  neighbor: ["he_is_my", "he_is_a", "this_is_a"],
  apartment: ["this_is_a", "where_is_the", "i_have_a", "i_go_to"],
  lift: ["this_is_a", "where_is_the"],
  shop: ["i_go_to", "this_is_a", "where_is_the"],
  store: ["i_go_to", "this_is_a", "where_is_the"],
  market: ["i_go_to", "this_is_a", "where_is_the"],
  restaurant: ["i_go_to", "this_is_a", "where_is_the"],
  cafe: ["i_go_to", "this_is_a", "where_is_the"],
  café: ["i_go_to", "this_is_a", "where_is_the"],
  gym: ["i_go_to", "this_is_a", "where_is_the"],
  farm: ["i_go_to", "this_is_a", "where_is_the"],
  school: ["i_go_to", "where_is_the", "this_is_a"],
  university: ["i_go_to", "where_is_the", "this_is_a"],
  hospital: ["i_go_to", "where_is_the", "this_is_a"],
  bank: ["i_go_to", "where_is_the", "this_is_a"],
  park: ["i_go_to", "where_is_the", "this_is_a"],
  cinema: ["i_go_to", "where_is_the", "this_is_a"],
  office: ["i_work_in", "i_go_to", "where_is_the", "this_is_a"],

  // health
  backache: ["i_have_a"],
  injury: ["i_have_a"],
  disease: ["i_have_a"],
  illness: ["i_have_a"],
  stress: ["i_have_bare"],
  diet: ["i_have_a", "i_need_a"],
  blood: ["i_have_bare"],
  energy: ["i_have_bare", "i_need_bare"],
  danger: ["is_important"],
  death: ["is_important"],
  height: ["i_have_a"],
  weight: ["i_have_a"],
  treatment: ["i_need_a", "i_have_a"],
  drug: ["i_need_a", "this_is_a"],
  symptom: ["i_have_a"],
  emergency: ["this_is_a"],
  chemist: ["this_is_a", "where_is_the"],
  prescription: ["i_have_a", "i_need_a"],
  bandage: ["i_have_a", "i_need_a"],
  "sore throat": ["i_have_a"],
  stomach: ["this_is_a", "i_have_a"],
  hair: ["i_have_bare"],

  // events
  accident: ["this_is_a", "the_is_long"],
  problem: ["i_have_a", "this_is_a"],
  issue: ["i_have_a", "this_is_a"],
  delay: ["the_is_long", "this_is_a"],

  // phrases
  "feel better": ["i_want_to"],
  "get better": ["i_want_to", "we_need_to"],
  "see a doctor": ["i_want_to", "we_need_to"],
  "take medicine": ["i_want_to", "we_need_to"],
  "look after": ["i_want_to", "we_need_to"],

  colour: [],
  color: [],
  hungry: ["i_am_adj", "he_is_adj"],
  thirsty: ["i_am_adj", "he_is_adj"],
  wild: ["it_is", "the_bag_is"],
  pet: ["i_have_a_pet", "this_is_a", "i_like_pl"],
  pocket: ["this_is_a", "i_have_a"],
  clothes: ["i_wear", "i_have_bare", "i_need_bare"],
  // shopping / money language
  price: ["this_is_a", "lets_talk_about"],
  cheap: ["it_is", "the_bag_is"],
  expensive: ["it_is", "the_bag_is"],
  cost: [],
  buy: ["i_want_to", "we_need_to"],
  sell: ["i_want_to", "we_need_to"],
  pay: ["i_want_to", "we_need_to"],
  money: ["i_have_bare", "i_need_bare", "i_get_a"],
  // school oddities
  college: ["i_go_to", "where_is_the", "this_is_a"],
  course: ["i_have_a", "i_need_a", "lets_talk_about"],
  subject: ["i_have_a", "lets_talk_about", "this_is_a"],
  class: ["i_have_a", "i_go_to", "this_is_a"],
  centre: ["where_is_the", "this_is_a", "i_go_to"],
  center: ["where_is_the", "this_is_a", "i_go_to"],
  way: ["this_is_a", "where_is_the"],
  map: ["this_is_a", "i_have_a", "i_need_a"],
  // family / people
  single: ["i_am_adj", "he_is_adj"],
  married: ["i_am_adj", "he_is_adj"],
  divorced: ["i_am_adj", "he_is_adj"],
  engaged: ["i_am_adj", "he_is_adj"],
  owner: ["i_am_a", "he_is_a", "this_is_a"],
  lady: ["this_is_a", "i_am_a"],
  gentleman: ["this_is_a", "he_is_a", "i_am_a"],
  guy: ["this_is_a", "he_is_a"],
  couple: ["this_is_a", "i_see_a"],
  // food: Czech fazole = beans (plural); avoid "a bean"
  bean: ["i_like_pl"],
  beans: ["i_like_pl", "i_have_bare", "i_need_bare"],
  pea: ["i_like_pl", "i_have_bare", "i_buy_a"],
  rice: ["i_like_bare", "i_have_bare", "i_need_bare"],
};

/** Bad carriers to strip from a class, then ensure fallbacks */
const STRIP = {
  rooms: new Set(["i_need_a", "i_enjoy", "is_fun", "i_like_bare", "i_like_pl", "have_a_good"]),
  building: new Set([
    "i_need_a",
    "i_enjoy",
    "is_fun",
    "i_like_bare",
    "i_like_pl",
    "have_a_good",
    "i_have_a",
    "i_need_bare",
  ]),
  orgs: new Set(["i_need_a", "i_enjoy", "is_fun", "i_like_bare", "have_a_good"]),
  people: new Set(["i_need_a", "i_have_a", "i_enjoy", "is_fun", "i_like_bare", "i_like_pl"]),
  illness: new Set(["i_need_a", "this_is_a", "i_enjoy", "is_fun", "where_is_the"]),
  mass: new Set(["this_is_a", "where_is_the", "i_am_a", "i_enjoy", "is_fun"]),
};

const FALLBACK = {
  rooms: ["this_is_a", "where_is_the"],
  building: ["this_is_a", "where_is_the"],
  orgs: ["this_is_a", "where_is_the", "i_work_in"],
  people: ["i_am_a", "he_is_a", "he_is_my", "this_is_a"],
  illness: ["i_have_a"],
  mass: ["i_have_bare", "i_need_bare"],
  adj: ["i_am_adj", "he_is_adj", "it_is"],
};

function classOf(k) {
  if (SKIP.has(k)) return "skip";
  if (ADJ.has(k)) return "adj";
  if (ILLNESS.has(k)) return "illness";
  if (PEOPLE.has(k)) return "people";
  if (BUILDING_PARTS_CLEAN.has(k)) return "building";
  if (ORGS.has(k)) return "orgs";
  if (ROOMS_PLACES.has(k)) return "rooms";
  if (MASS.has(k)) return "mass";
  return null;
}

function unique(arr) {
  return [...new Set(arr)];
}

/**
 * @param {string} lemma cleaned
 * @param {string[]|undefined} use
 * @param {string} rawEn original en field
 * @returns {string[]|null} new use array, or null if no change
 */
function scrubUse(lemma, use, rawEn = "") {
  const k = lemma;
  const isVerbGloss = /\(verb\)/i.test(rawEn) || /\bverb\b/i.test(rawEn);

  if (Object.prototype.hasOwnProperty.call(FIX, k) && !isVerbGloss) {
    return FIX[k];
  }

  // Explicit verb gloss: force want/need to; strip noun/place frames
  if (isVerbGloss) {
    const target = ["i_want_to", "we_need_to"];
    if (!Array.isArray(use) || !use.length) return target;
    const already =
      use.includes("i_want_to") &&
      use.includes("we_need_to") &&
      use.every((u) => target.includes(u));
    if (already) return null;
    return target;
  }

  const cls = classOf(k);
  if (cls === "skip") return [];

  let next = Array.isArray(use) ? use.slice() : null;
  if (!next) {
    // no tags — apply class defaults only for known duds
    if (cls && FALLBACK[cls]) return FALLBACK[cls].slice();
    return null;
  }

  let changed = false;

  // Negative events
  if (next.includes("have_a_good") && NO_HAVE_A_GOOD.has(k)) {
    next = next.filter((u) => u !== "have_a_good");
    changed = true;
  }

  // Enjoy/fun only for real activities
  if (
    (next.includes("i_enjoy") || next.includes("is_fun")) &&
    !ACTIVITY_OK.has(k) &&
    !/ing$/.test(k)
  ) {
    next = next.filter((u) => u !== "i_enjoy" && u !== "is_fun");
    changed = true;
  }

  // Class strip rules
  if (cls && STRIP[cls]) {
    const before = next.join(",");
    next = next.filter((u) => !STRIP[cls].has(u));
    if (next.join(",") !== before) changed = true;
    if (!next.length && FALLBACK[cls]) {
      next = FALLBACK[cls].slice();
      changed = true;
    }
  }

  // Rooms / building / orgs: always keep a sane location/identity frame
  if (cls === "rooms" || cls === "orgs" || cls === "building") {
    if (next.length === 1 && next[0] === "i_need_a") {
      next = FALLBACK[cls].slice();
      changed = true;
    }
    const hasPlaceFrame = next.some((u) =>
      ["this_is_a", "where_is_the", "i_work_in", "i_work_for", "i_go_to"].includes(u),
    );
    if (!hasPlaceFrame) {
      next = unique([...next, ...FALLBACK[cls]]);
      changed = true;
    }
    if (
      (cls === "rooms" || cls === "building") &&
      next.includes("this_is_a") &&
      !next.includes("where_is_the")
    ) {
      next = unique([...next, "where_is_the"]);
      changed = true;
    }
  }

  // Prefer rich work frames — ensure i_need_a not sole org frame
  if (cls === "orgs" && next.includes("i_need_a") && next.length > 1) {
    next = next.filter((u) => u !== "i_need_a");
    changed = true;
  }

  next = unique(next);
  if (!changed) return null;
  return next;
}

// ── Run ───────────────────────────────────────────────────────────

let changedItems = 0;
let changedFiles = 0;
const samples = [];

for (const f of fs
  .readdirSync(dir)
  .filter((x) => x.endsWith(".json") && !x.startsWith("_"))) {
  const full = path.join(dir, f);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  if (data.practice === "frames") continue;

  let fileChanged = false;
  for (const b of data.blocks || []) {
    for (const it of b.items || []) {
      const k = clean(it.en);
      const prev = JSON.stringify(it.use ?? null);
      const neu = scrubUse(k, it.use, it.en);
      if (neu === null) continue;
      const neuS = JSON.stringify(neu);
      if (neuS === prev) continue;
      it.use = neu;
      changedItems++;
      fileChanged = true;
      if (samples.length < 40) {
        samples.push({
          file: f,
          en: it.en,
          from: prev,
          to: neuS,
        });
      }
    }
  }

  if (fileChanged) {
    changedFiles++;
    if (!dry) {
      fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf8");
    }
  }
}

console.log(dry ? "=== DRY RUN ===" : "=== APPLIED ===");
console.log(`Items changed: ${changedItems}`);
console.log(`Files touched: ${changedFiles}`);
console.log("\nSample changes:");
for (const s of samples.slice(0, 25)) {
  console.log(`  ${s.file} · ${s.en}`);
  console.log(`    ${s.from} → ${s.to}`);
}
