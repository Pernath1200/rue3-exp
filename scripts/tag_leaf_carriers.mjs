/**
 * Batch-tag leaf packs with carrier `use` arrays.
 * Preserves existing use (including use: []).
 * Usage: node scripts/tag_leaf_carriers.mjs
 *        node scripts/tag_leaf_carriers.mjs --dry
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dry = process.argv.includes("--dry");

const set = (arr) => new Set(arr.map((w) => w.toLowerCase()));

const ADJ = set(`
  healthy ill sick tired hungry thirsty happy sad angry bored excited worried
  afraid cold hot warm cool big small long short tall high low old young new
  good bad nice kind friendly beautiful handsome ugly strong weak fast slow
  easy difficult hard important famous clean dirty full empty right wrong
  open closed early late busy free ready sure real best better different
  interesting boring exciting useful healthy unhealthy careful careful
  red blue green yellow black white brown grey gray pink purple orange
  quiet loud soft hard heavy light cheap expensive rich poor
  true false possible impossible necessary special normal strange
  modern traditional public private local national international
  soft hard wet dry thick thin wide narrow deep shallow
  early late modern ancient recent final first last next
  healthy sick ill well better worse best
  beautiful handsome pretty ugly clever smart stupid silly funny serious
  friendly unfriendly polite rude kind unkind lazy hardworking
  delicious tasty fresh frozen raw cooked sweet sour salty bitter
  comfortable uncomfortable dangerous safe free busy empty full
`.trim().split(/\s+/));

const PERSON = set(`
  doctor nurse patient dentist teacher student friend brother sister mother father
  man woman boy girl child person people neighbour neighbor boss waiter waitress
  driver pilot guest visitor stranger colleague husband wife son daughter baby
  adult kid parent uncle aunt cousin policeman policewoman chef cook actor
  actress singer writer artist engineer lawyer manager owner customer client
  passenger host guide tourist traveller traveler policeman police
  mum dad mom grandmother grandfather grandma grandpa aunt uncle cousin
  classmate roommate partner roommate pupil headteacher secretary
  shop assistant shopkeeper postman postwoman firefighter soldier sailor
  farmer baker butcher hairdresser plumber electrician mechanic
`.trim().split(/\s+/));

const PLACE = set(`
  hospital pharmacy hotel hostel airport station platform beach resort museum
  gallery library school university bank shop store market supermarket
  restaurant cafe cinema theatre theater park garden zoo bridge tower castle
  palace church mosque temple stadium office factory farm house flat apartment
  room kitchen bathroom bedroom street road path square city town village
  island mountain river lake sea forest cabin home countryside capital
  station cinema gym pool swimming pool playground stadium
  kitchen bathroom bedroom living room garden garage basement attic
  classroom laboratory lab library canteen corridor hall office
  shop supermarket bakery butcher greengrocer department store mall centre center
  restaurant cafe bar pub club hotel hostel campsite
  airport station bus stop port harbour harbor beach coast
  park zoo museum gallery cinema theatre church temple
  country city town village capital island mountain river lake sea forest
  street road path bridge tunnel square centre center
`.trim().split(/\s+/));

const MASS = set(`
  water bread milk rice music money coffee tea food fruit information advice
  news luggage homework furniture weather traffic english work fun love time
  health medicine luggage petrol tourism transport driving parking shopping
  swimming running reading writing cooking hiking camping skiing dancing
  singing fishing cycling travel traffic weather information advice help
  furniture homework news rice bread milk water coffee tea food fruit
  cheese meat fish chicken beef pork wine beer juice soup salt sugar
  butter oil flour pasta rice cheese meat fish chicken
  money cash time weather traffic information advice news homework
  furniture luggage equipment software hardware music fun love work
  paper plastic metal wood glass wool cotton leather
`.trim().split(/\s+/));

const ILLNESS = set(`
  headache fever cough cold flu toothache stomachache stomachache
  sore throat cold flu virus infection allergy asthma cancer
  temperature pain cough cold flu headache toothache
`.trim().split(/\s+/));

const ACTIVITY = set(`
  sightseeing shopping swimming running reading writing cooking parking
  hiking camping skiing dancing singing fishing cycling travelling traveling
  travel driving exercise sport football tennis basketball volleyball
  golf yoga pilates jogging walking cycling
`.trim().split(/\s+/));

const EVENT = set(`
  journey trip holiday vacation flight voyage cruise tour visit meeting party
  lesson class course exam test interview appointment wedding funeral concert
  show match game race festival weekend birthday anniversary break pause delay
  accident event experience adventure opportunity chance idea problem issue
  question answer story joke dream plan project hobby habit tradition custom
  delay booking reservation appointment
`.trim().split(/\s+/));

const VERB = set(`
  go come see look watch listen hear speak talk say tell ask answer
  read write work study learn teach play run walk swim drive fly
  eat drink cook clean wash buy sell pay cost open close start stop
  begin finish help need want like love hate prefer enjoy
  live stay sleep wake get take give bring put make do have be
  call send meet wait leave arrive return travel fly drive
  book pack rest recover exercise check in check out
  arrive leave book pack rest recover exercise fly travel
  work study learn teach play run walk swim drive
  open close start stop begin finish help need want
  like love hate prefer enjoy live stay sleep
  buy sell pay cost call send meet wait
  clean wash cook eat drink read write
  watch listen speak talk say tell ask answer
  get take give bring put make do
`.trim().split(/\s+/));

const FOOD_COUNT = set(`
  apple banana orange egg sandwich pizza burger salad cake biscuit cookie
  tomato potato onion carrot lemon grape pear peach plum cherry strawberry
  meal snack breakfast lunch dinner dessert ice cream chocolate
  sausage burger sandwich pizza salad soup steak
`.trim().split(/\s+/));

const BODY = set(`
  hand foot head eye ear nose mouth arm leg finger tooth teeth
  face hair neck shoulder back chest stomach knee ankle bone
  blood heart brain skin body
`.trim().split(/\s+/));

const CLOTHES = set(`
  shirt dress skirt jacket coat hat cap shoe shoes boot boots sock socks
  jumper sweater trouser trousers jeans scarf glove gloves suit tie
  t-shirt tshirt blouse jeans shorts underwear pyjamas pajamas
`.trim().split(/\s+/));

const ANIMAL = set(`
  dog cat bird horse cow pig sheep chicken fish rabbit mouse lion tiger
  elephant monkey duck goose hen cock snake spider bee butterfly
`.trim().split(/\s+/));

const TECH = set(`
  phone computer laptop tablet camera radio television tv screen keyboard
  mouse printer email internet website app message call text
`.trim().split(/\s+/));

const TIME_SKIP = set(`
  monday tuesday wednesday thursday friday saturday sunday
  january february march april may june july august september october november december
  one two three four five six seven eight nine ten eleven twelve thirteen
  fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty
  fifty sixty seventy eighty ninety hundred thousand million
  first second third fourth fifth o'clock am pm
`.trim().split(/\s+/));

const ABSTRACT_SKIP = set(`
  thing idea fact truth beauty freedom justice peace war
  success failure power control system process method way
  meaning sense reason cause result effect purpose goal
  chance luck risk danger safety security
`.trim().split(/\s+/));

const ADVERB_SKIP = set(`
  always never sometimes often usually rarely seldom
  already yet still just ever already
  very really quite too enough almost nearly
  here there now then soon later early late
  well badly fast slowly quickly carefully
  up down in out on off over under
  also too only even just
`.trim().split(/\s+/));

function cleanLemma(en) {
  return String(en || "")
    .replace(/\([^)]*\)/g, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

function lemmaKey(w) {
  return String(w || "")
    .toLowerCase()
    .replace(/[^a-z].*$/, "");
}

/**
 * @param {object} item
 * @param {{ title?: string, id?: string, packId?: string }} ctx
 * @returns {string[]|null} null = leave existing; array = set use
 */
function suggestUse(item, ctx) {
  // Preserve explicit tags (including empty skip)
  if (Array.isArray(item.use)) return null;

  const raw = cleanLemma(item.en);
  if (!raw) return [];
  const key = lemmaKey(raw);
  const pack = String(ctx.packId || "").toLowerCase();
  const title = String(ctx.title || "").toLowerCase();
  const block = String(ctx.blockId || "").toLowerCase();
  const blob = `${pack} ${title} ${block}`;

  // Multi-word phrases: careful defaults
  if (/\s/.test(raw)) {
    if (/ticket|card|phone|bag|room|shop|store|station|stop/.test(raw)) {
      return ["this_is_a", "i_have_a", "i_need_a"];
    }
    if (/sore throat|stomach ache|toothache|headache/.test(raw)) {
      return ["i_have_a"];
    }
    if (VERB.has(key) || /^(check|get|go|come|look|take|make|do)\b/.test(raw)) {
      return ["i_want_to", "we_need_to"];
    }
    // multi-word adj-ish / abstract — skip if unsure
    if (blob.includes("describ") || blob.includes("adverb") || blob.includes("idea")) {
      return [];
    }
    return ["this_is_a", "i_have_a"];
  }

  // Pack-level signals
  if (
    pack.includes("colour") ||
    pack.includes("color") ||
    block.includes("colour") ||
    block.includes("color")
  ) {
    return ["it_is", "the_bag_is"];
  }
  if (pack.includes("adverb") || blob.includes("adverb")) {
    return []; // adverbs don't fit noun/verb carriers well
  }
  if (pack.includes("verb") || block.includes("verb")) {
    if (ADJ.has(key)) return ["i_am_adj", "he_is_adj", "it_is"];
    return ["i_want_to", "we_need_to"];
  }
  if (pack.includes("feeling") || pack.includes("feelings")) {
    if (ADJ.has(key) || key.endsWith("ed") || key.endsWith("ing")) {
      return ["i_am_adj", "he_is_adj"];
    }
  }
  if (pack.includes("describ")) {
    if (
      ADJ.has(key) ||
      key.endsWith("ful") ||
      key.endsWith("ous") ||
      key.endsWith("ive") ||
      key.endsWith("able") ||
      key.endsWith("al") ||
      key.endsWith("ic") ||
      key.endsWith("y")
    ) {
      return ["it_is", "i_am_adj", "the_bag_is"];
    }
    // many describing words are adjectives not in list
    if (!PERSON.has(key) && !PLACE.has(key) && !MASS.has(key)) {
      return ["it_is", "the_bag_is"];
    }
  }
  if (pack.includes("time") || pack.includes("number")) {
    if (TIME_SKIP.has(key) || TIME_SKIP.has(raw) || /^\d+$/.test(raw)) return [];
  }

  // Word class lists
  if (TIME_SKIP.has(key) || TIME_SKIP.has(raw)) return [];
  if (ADVERB_SKIP.has(key)) return [];
  if (ABSTRACT_SKIP.has(key) && (pack.includes("idea") || pack.includes("abstract"))) {
    return ["is_important"];
  }

  if (ILLNESS.has(key) || ILLNESS.has(raw)) return ["i_have_a"];
  if (PERSON.has(key)) return ["i_am_a", "he_is_a", "this_is_a"];
  if (ADJ.has(key)) return ["i_am_adj", "he_is_adj"];
  if (ACTIVITY.has(key) || ACTIVITY.has(raw)) {
    return ["i_like_bare", "i_enjoy", "is_fun"];
  }
  if (EVENT.has(key)) {
    return ["have_a_good", "the_is_long", "this_is_a"];
  }
  if (MASS.has(key)) {
    return ["i_like_bare", "i_need_bare", "i_have_bare"];
  }
  if (PLACE.has(key) || PLACE.has(raw)) {
    return ["where_is_the", "this_is_a", "i_need_a"];
  }
  if (BODY.has(key)) return ["this_is_a", "i_have_a"];
  if (CLOTHES.has(key)) return ["this_is_a", "i_have_a", "i_need_a"];
  if (ANIMAL.has(key)) return ["this_is_a", "i_have_a", "i_like_pl"];
  if (FOOD_COUNT.has(key)) return ["this_is_a", "i_have_a", "i_need_a", "i_like_pl"];
  if (TECH.has(key)) return ["this_is_a", "i_have_a", "i_need_a", "where_is_the"];

  // Verb morphology / pack
  if (
    VERB.has(key) ||
    (pack.includes("verb") && !ADJ.has(key)) ||
    /^(rest|book|pack|fly|travel|arrive|leave|recover|exercise)$/.test(key)
  ) {
    return ["i_want_to", "we_need_to"];
  }

  // -ing activity
  if (
    /ing$/.test(key) &&
    !/thing|morning|evening|building|ring|king|spring|string|wing/.test(key)
  ) {
    return ["i_like_bare", "i_enjoy", "is_fun"];
  }

  // -ly adverb
  if (/ly$/.test(key) && key.length > 4) return [];

  // Default concrete-ish: object carriers if looks like a simple noun
  if (
    key.length >= 2 &&
    !/ly$|ed$|ing$/.test(key) &&
    !pack.includes("idea") &&
    !pack.includes("abstract") &&
    !pack.includes("misc")
  ) {
    // soft default for remaining content nouns
    return ["this_is_a", "i_have_a", "i_need_a"];
  }

  // ideas / abstract / misc leftovers
  if (pack.includes("idea") || pack.includes("abstract") || pack.includes("misc")) {
    return ["is_important"];
  }

  return [];
}

function tagPack(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (data.practice === "frames") return null;

  let added = 0;
  let skipped = 0;
  let preserved = 0;
  let empty = 0;

  for (const block of data.blocks || []) {
    for (const it of block.items || []) {
      if (Array.isArray(it.use)) {
        preserved++;
        if (it.use.length === 0) empty++;
        continue;
      }
      const use = suggestUse(it, {
        packId: data.id || path.basename(filePath, ".json"),
        title: data.title || block.title,
        blockId: block.id,
      });
      if (use === null) {
        preserved++;
        continue;
      }
      it.use = use;
      added++;
      if (use.length === 0) empty++;
      else skipped; // tagged with carriers
    }
  }

  // note
  const note = data.note || "";
  if (!/carriers/i.test(note)) {
    data.note = note
      ? `${note} · carriers via use[]`
      : "carriers via use[] · fruit = Word";
  }

  if (!dry) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  const total = (data.blocks || []).reduce(
    (n, b) => n + (b.items || []).length,
    0,
  );
  return {
    file: path.basename(filePath),
    total,
    added,
    preserved,
    emptyUse: empty,
  };
}

const dir = path.join(root, "data/blocks");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => path.join(dir, f));

const rows = [];
for (const f of files) {
  const r = tagPack(f);
  if (r) rows.push(r);
}

const sum = rows.reduce(
  (a, r) => {
    a.total += r.total;
    a.added += r.added;
    a.preserved += r.preserved;
    return a;
  },
  { total: 0, added: 0, preserved: 0 },
);

console.log(dry ? "=== DRY RUN ===" : "=== TAGGED ===");
for (const r of rows) {
  console.log(
    `${r.file.padEnd(28)} total ${String(r.total).padStart(4)}  +use ${String(r.added).padStart(4)}  keep ${String(r.preserved).padStart(3)}`,
  );
}
console.log(
  `\npacks ${rows.length} · items ${sum.total} · newly tagged ${sum.added} · preserved ${sum.preserved}`,
);
