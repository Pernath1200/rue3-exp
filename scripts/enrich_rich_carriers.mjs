/**
 * Enrich leaf packs with richer carrier frames (variety pass).
 * Merges domain-fit carriers into existing use[] without wiping hand tags.
 * Safe to run after fix_carrier_tags.mjs.
 *
 * node scripts/enrich_rich_carriers.mjs
 * node scripts/enrich_rich_carriers.mjs --dry
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
      .filter(Boolean)
      .map((w) => w.toLowerCase()),
  );

function clean(en) {
  return String(en || "")
    .replace(/\([^)]*\)/g, "")
    .split("/")[0]
    .trim()
    .toLowerCase();
}

const CLOTHES = set(`
  shirt dress skirt jacket coat hat cap shoe shoes boot boots sock socks
  jumper sweater trouser trousers jeans scarf glove gloves suit tie
  t-shirt tshirt blouse shorts underwear pyjamas pajamas pocket belt
`);

const ANIMALS = set(`
  dog cat bird horse cow pig sheep chicken fish rabbit mouse lion tiger
  elephant monkey duck goose hen snake spider bee butterfly pet bear frog
  insect animal
`);

const PLACES_GO = set(`
  school university hospital pharmacy bank shop store market supermarket
  restaurant cafe cinema theatre theater park garden zoo museum library
  church stadium gym pool hotel station airport office factory farm
  beach village town city country
`);

const SCHOOL = set(`
  school classroom teacher student lesson homework exam test book pen
  pencil bag desk class subject english maths math history science
`);

const FOOD_BUY = set(`
  apple banana orange egg sandwich pizza burger salad cake biscuit
  tomato potato onion carrot bread milk cheese meat fish chicken
  coffee tea water juice soup chocolate ice cream meal snack
`);

const PEOPLE_CLOSE = set(`
  boss colleague manager friend brother sister mother father husband
  wife son daughter partner neighbour neighbor teacher doctor nurse
`);

const RELATIONAL = set(`
  boss colleague manager partner friend neighbour neighbor landlord
  teacher doctor nurse secretary leader
`);

/** lemma → carriers to ensure present (merged into use) */
function enrichFor(lemma, rawEn, packId) {
  const k = lemma;
  const pack = String(packId || "").toLowerCase();
  const add = [];

  if (/\(verb\)/i.test(rawEn)) {
    return ["i_want_to", "we_need_to"];
  }

  if (CLOTHES.has(k) || pack.includes("clothes")) {
    if (CLOTHES.has(k)) add.push("i_wear", "this_is_a", "i_have_a", "i_need_a");
  }
  if (ANIMALS.has(k) || pack.includes("animal")) {
    if (ANIMALS.has(k) && k !== "wild" && k !== "tame") {
      add.push("i_have_a_pet", "this_is_a", "i_like_pl", "i_see_a");
    }
  }
  if (PLACES_GO.has(k)) {
    add.push("i_go_to", "where_is_the", "this_is_a");
  }
  if (FOOD_BUY.has(k) || (pack.includes("food") && !/\(verb\)/i.test(rawEn))) {
    if (FOOD_BUY.has(k)) add.push("i_buy_a", "i_have_a", "i_like_pl", "this_is_a");
  }
  if (RELATIONAL.has(k) || PEOPLE_CLOSE.has(k)) {
    if (RELATIONAL.has(k)) add.push("he_is_my", "he_is_a", "this_is_a");
    else if (PEOPLE_CLOSE.has(k)) add.push("he_is_a", "i_am_a", "this_is_a");
  }
  if (SCHOOL.has(k) || pack.includes("school")) {
    if (k === "school" || k === "university" || k === "classroom") {
      add.push("i_go_to", "where_is_the", "this_is_a");
    }
    if (k === "teacher" || k === "student") {
      add.push("i_am_a", "he_is_a", "he_is_my");
    }
    if (k === "homework" || k === "exam" || k === "test" || k === "lesson") {
      add.push("i_have_a", "i_need_a", "lets_talk_about");
    }
    if (k === "book" || k === "pen" || k === "pencil" || k === "bag" || k === "desk") {
      add.push("this_is_a", "i_have_a", "i_need_a");
    }
  }

  // Pack-level soft enrich when lemma unknown
  if (!add.length) {
    if (pack.includes("clothes") && !/\(verb\)/i.test(rawEn)) {
      add.push("i_wear", "this_is_a", "i_have_a");
    }
    if (pack.includes("animal") && !["wild", "tame"].includes(k)) {
      add.push("i_have_a_pet", "this_is_a", "i_like_pl");
    }
    if (pack.includes("shopping") && !/\(verb\)/i.test(rawEn)) {
      add.push("i_buy_a", "this_is_a", "i_have_a");
    }
  }

  return [...new Set(add)];
}

/**
 * Merge enrich into existing use. Don't erase empty intentional skips unless enrich is strong.
 * @returns {string[]|null}
 */
function mergeUse(existing, enrich, rawEn) {
  if (!enrich.length) return null;
  if (/\(verb\)/i.test(rawEn)) {
    return ["i_want_to", "we_need_to"];
  }
  // Intentional skip
  if (Array.isArray(existing) && existing.length === 0) {
    // only fill skips for clear domain lemmas (enrich non-empty from specific lists)
    if (enrich.length >= 2) return enrich;
    return null;
  }
  const base = Array.isArray(existing) ? existing.slice() : [];
  const BAD = new Set(["i_enjoy", "is_fun"]);
  // strip activity fun if we're putting clothes/places
  let next = base.filter((u) => !BAD.has(u) || enrich.includes(u));
  const before = next.join(",");
  for (const e of enrich) {
    if (!next.includes(e)) next.push(e);
  }
  // Prefer not stacking too many — cap at 4, keep enrich-first
  if (next.length > 4) {
    const preferred = enrich.filter((e) => next.includes(e));
    const rest = next.filter((e) => !preferred.includes(e));
    next = [...preferred, ...rest].slice(0, 4);
  }
  if (next.join(",") === before && base.length) return null;
  if (next.join(",") === (existing || []).join(",")) return null;
  return next;
}

let changed = 0;
let files = 0;
const samples = [];

for (const f of fs
  .readdirSync(dir)
  .filter((x) => x.endsWith(".json") && !x.startsWith("_"))) {
  const full = path.join(dir, f);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  if (data.practice === "frames") continue;
  const packId = data.id || f.replace(/\.json$/, "");

  // Don't overwrite carefully curated packs wholesale — still merge enrich
  let fileChanged = false;
  for (const b of data.blocks || []) {
    for (const it of b.items || []) {
      const k = clean(it.en);
      const enrich = enrichFor(k, it.en, packId);
      const neu = mergeUse(it.use, enrich, it.en);
      if (!neu) continue;
      const prev = JSON.stringify(it.use ?? null);
      if (prev === JSON.stringify(neu)) continue;
      it.use = neu;
      changed++;
      fileChanged = true;
      if (samples.length < 30) {
        samples.push({ f, en: it.en, from: prev, to: JSON.stringify(neu) });
      }
    }
  }
  if (fileChanged) {
    files++;
    if (!dry) {
      fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf8");
    }
  }
}

console.log(dry ? "=== DRY ===" : "=== ENRICHED ===");
console.log(`Items: ${changed} · Files: ${files}`);
for (const s of samples.slice(0, 20)) {
  console.log(`  ${s.f} · ${s.en}`);
  console.log(`    ${s.from} → ${s.to}`);
}
