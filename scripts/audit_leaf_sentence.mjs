/**
 * Audit leaf Sentence carrier coverage + dump generated models.
 *
 * Usage (from repo root):
 *   node scripts/audit_leaf_sentence.mjs
 *   node scripts/audit_leaf_sentence.mjs --pack a2_travel
 *   node scripts/audit_leaf_sentence.mjs --duds-only
 *   node scripts/audit_leaf_sentence.mjs --pack a2_shopping --strict
 *
 * Layer 0/1: shows allowlist vs tagged vs skipped, and every model EN/CZ.
 * --strict: exit 1 if hard dud rules fire (emit-gate / EN quality / soft pedagogical duds).
 * Note: cz_case_soft is soft debt only — does NOT fail --strict.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const {
  buildLeafSentenceItems,
  buildCarrierModel,
  resolveCarrierIds,
  resolveExpandedCarrierIds,
  classifyCarrierRole,
  leafSentenceCoverage,
  isCarrierModelSafe,
  isCarrierSafeForLemma,
  filterSafeCarrierIds,
  cleanEnLemma,
  CONCRETE_OBJECT_ALLOWLIST,
  CARRIERS,
} = await import(pathToFileURL(path.join(root, "js/carriers.js")).href);

const args = process.argv.slice(2);
const packFilter = (() => {
  const i = args.indexOf("--pack");
  return i >= 0 ? args[i + 1] : null;
})();
const dudsOnly = args.includes("--duds-only");
const strict = args.includes("--strict");
let hardFailCount = 0;
let softFailCount = 0;
/** @type {{ pack: string, flags: string[], en: string, lemma?: string }[]} */
const hardFailExamples = [];

/** Evaluative / non-entity adjectives that should not ride this_is_a. */
const EVAL_ADJ_LEMMAS = new Set([
  "spicy",
  "delicious",
  "digital",
  "sorry",
  "open",
  "closed",
  "fine",
  "great",
  "wonderful",
  "fantastic",
  "perfect",
  "popular",
  "quick",
  "common",
  "complete",
  "correct",
  "similar",
  "amazing",
  "boring",
  "interesting",
  "favourite",
  "favorite",
  "tall",
  "short",
  "blonde",
  "online",
  "everyday",
  "regular",
  "usual",
]);

/**
 * Multiword lemmas that must not take count/article frames
 * (prep/particle/idiom — not compound nouns like "credit card").
 */
const SOFT_COUNT_MULTIWORDS = new Set([
  "according to",
  "try on",
  "next to",
  "in front of",
  "all right",
  "any more",
  "anymore",
  "used to",
  "per cent",
  "percent",
  "because of",
  "instead of",
  "out of",
  "as well",
  "each other",
  "one another",
  "of course",
  "at least",
  "at most",
  "for example",
  "such as",
  "up to",
  "away from",
  "apart from",
  "rather than",
  "as for",
  "due to",
  "prior to",
  "close to",
  "far from",
]);

/** Hard flags that fail --strict (cz_case_soft is intentionally excluded). */
const HARD_FLAG_SET = new Set([
  "emit_gate",
  "carrier_lemma_unsafe",
  "hard_dud",
  "odd_like_the",
  "odd_need_activity",
  "odd_have_event",
  "odd_like_abroad",
  "odd_need_border",
  "odd_like_booking",
  // Wave 4 soft-pedagogical hard fails
  "soft_this_is_a_adj",
  "soft_need_have_person",
  "soft_count_multiword",
  "soft_glue_is_important",
  "soft_i_am_food_adj",
  "soft_this_is_a_prep",
  "silent_tagged_zero",
]);

/** Heuristic dud flags on a generated model (for smoke triage). */
function dudFlags(model, lemma) {
  const flags = [];
  const en = String(model.en || "").toLowerCase();
  const w = String(lemma || model._lemma || "").toLowerCase();

  if (!isCarrierModelSafe(model, lemma || model._lemma)) {
    flags.push("emit_gate");
  }
  if (model.carrier && !isCarrierSafeForLemma(lemma || model._lemma, model.carrier)) {
    flags.push("carrier_lemma_unsafe");
  }
  if (en.includes(`like the ${w}`) && /booking|reservation|delay|border/.test(w)) {
    flags.push("odd_like_the");
  }
  if (en.includes(`need ${w}`) && /sightseeing|tourism|driving|camping/.test(w)) {
    flags.push("odd_need_activity");
  }
  if (en.includes(`have ${w}`) && /sightseeing|tourism|journey/.test(w)) {
    flags.push("odd_have_event");
  }
  if (en.includes("i like abroad") || en.includes("i like the abroad")) {
    flags.push("odd_like_abroad");
  }
  if (en.includes("i need a border") || en.includes("i need border")) {
    flags.push("odd_need_border");
  }
  if (en.includes("i like the booking") || en.includes("i like booking")) {
    flags.push("odd_like_booking");
  }
  if (/\b(a|an)\s+cash\b|\badvertisings\b|buy an advertise|saw a quality|had a quality|like a cash/i.test(en)) {
    flags.push("hard_dud");
  }
  // Czech still using nominative lemma after potřebuju (known soft issue — NOT hard)
  if (/potřebuj[ui] .+\./i.test(model.cz) && model.carrier === "i_need_a") {
    flags.push("cz_case_soft");
  }

  // --- Wave 4 pedagogical soft duds (hard under --strict) ---

  // 1. this is a + evaluative adjective
  const lemmaBase = w.replace(/\s*\([^)]*\)\s*/g, " ").trim().split(/\s+/)[0] || w;
  if (
    /^this is an? (spicy|delicious|digital|sorry|open|closed|fine|great|wonderful|fantastic|perfect|popular|quick|common|complete|correct|similar|amazing|boring|interesting|favourite|favorite|tall|short|blonde|online)\b/i.test(
      en,
    ) ||
    (model.carrier === "this_is_a" &&
      (EVAL_ADJ_LEMMAS.has(w) || EVAL_ADJ_LEMMAS.has(lemmaBase)))
  ) {
    flags.push("soft_this_is_a_adj");
  }

  // 2. need/have + person role objectified
  if (
    /i (need|have) an? (athlete|runner|customer|chef|vegetarian|guest|scientist|journalist|author|reporter|listener|thief|criminal|detective|president|queen)\b/i.test(
      en,
    )
  ) {
    flags.push("soft_need_have_person");
  }
  if (/^i am an? people\b/i.test(en) || /^he is an? police\b/i.test(en) || /^i am an? police\b/i.test(en)) {
    flags.push("soft_need_have_person");
  }

  // 3. multiword function phrase forced into count frames (not compound nouns)
  if (
    /\s/.test(w) &&
    /^(this is|i have|i need|i buy) an? .+/i.test(en) &&
    SOFT_COUNT_MULTIWORDS.has(w)
  ) {
    flags.push("soft_count_multiword");
  }

  // 4. glue/pronoun/modal + is important
  if (
    /^(myself|himself|herself|itself|ourselves|themselves|might|shall|including|whose|neither|none) is important/i.test(
      en,
    )
  ) {
    flags.push("soft_glue_is_important");
  }

  // 5. taste adj on person (i am spicy/delicious/sweet)
  if (/^i am (spicy|delicious|sweet)\b/i.test(en)) {
    flags.push("soft_i_am_food_adj");
  }

  // 6. this is a + direction/prep
  if (
    /^this is an? (left|right|near|opposite|between|behind|straight)\b/i.test(en)
  ) {
    flags.push("soft_this_is_a_prep");
  }

  return flags;
}

function isHardDud(flags) {
  return flags.some((f) => HARD_FLAG_SET.has(f));
}

function isSoftOnly(flags) {
  return flags.length > 0 && !isHardDud(flags);
}

/**
 * Coverage hole: item has non-empty use[] with known carriers, but after the
 * same app path (resolve → filterSafe → build + emit gate) it emits 0 models.
 * Independent of setCap (which only truncates the final set).
 * @param {object[]} items
 * @returns {{ en: string, use: string[], reason: string }[]}
 */
function findSilentTaggedZeros(items) {
  const holes = [];
  for (const item of items || []) {
    if (!Array.isArray(item.use) || item.use.length === 0) continue;
    const known = item.use.filter((id) => CARRIERS[id]);
    if (!known.length) continue;

    // App path without expand (matches buildLeafSentenceItems default)
    let ids = resolveCarrierIds(item);
    ids = filterSafeCarrierIds(item, ids);
    if (!ids.length) {
      holes.push({
        en: String(item.en || ""),
        use: item.use.slice(),
        reason: "all_filtered",
      });
      continue;
    }

    const word = cleanEnLemma(item);
    let emitted = 0;
    for (const carrierId of ids) {
      const model = buildCarrierModel(item, carrierId);
      if (model && isCarrierModelSafe(model, word)) emitted++;
    }
    if (!emitted) {
      holes.push({
        en: String(item.en || ""),
        use: item.use.slice(),
        reason: "emit_gate_all",
      });
    }
  }
  return holes;
}

function loadLeafPacks() {
  const dir = path.join(root, "data/blocks");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const packs = [];
  for (const f of files) {
    if (f.startsWith("_")) continue;
    const full = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    if (data.practice === "frames") continue;
    if (packFilter && !f.includes(packFilter) && data.id !== packFilter) continue;
    packs.push({ file: f, data });
  }
  return packs;
}

const packs = loadLeafPacks();
let totalItems = 0;
let totalEligible = 0;
let totalTagged = 0;
let totalAllow = 0;
let totalSkipped = 0;
let totalModels = 0;
let dudCount = 0;
let silentZeroCount = 0;
const packRows = [];

console.log("=== Leaf Sentence carrier audit ===\n");

for (const { file, data } of packs) {
  const items = [];
  for (const b of data.blocks || []) {
    for (const it of b.items || []) items.push(it);
  }
  const cov = leafSentenceCoverage(items);
  totalItems += cov.total;
  totalEligible += cov.eligible;
  totalTagged += cov.tagged;
  totalAllow += cov.allowlisted;
  totalSkipped += cov.skipped;

  const models = buildLeafSentenceItems(items, {
    title: data.title,
    id: data.id,
    level: data.level,
    // default path: no expand (matches app)
  });
  totalModels += models.length;

  const packDuds = [];
  let packHard = 0;
  let packSoft = 0;

  for (const m of models) {
    const flags = dudFlags(m, m._lemma);
    if (flags.length) {
      dudCount++;
      packDuds.push({ m, flags });
      if (isHardDud(flags)) {
        hardFailCount++;
        packHard++;
        if (hardFailExamples.length < 24) {
          hardFailExamples.push({
            pack: data.id || file,
            flags: flags.filter((f) => HARD_FLAG_SET.has(f)),
            en: m.en,
            lemma: m._lemma,
          });
        }
      } else {
        softFailCount++;
        packSoft++;
      }
    }
  }

  // silent_tagged_zero: coverage holes on tagged lemmas
  const silentHoles = findSilentTaggedZeros(items);
  silentZeroCount += silentHoles.length;
  for (const hole of silentHoles) {
    const flags = ["silent_tagged_zero"];
    hardFailCount++;
    packHard++;
    dudCount++;
    packDuds.push({
      m: {
        en: hole.en,
        cz: `(no model · ${hole.reason})`,
        carrier: "—",
        _lemma: hole.en,
      },
      flags,
    });
    if (hardFailExamples.length < 24) {
      hardFailExamples.push({
        pack: data.id || file,
        flags,
        en: hole.en,
        lemma: hole.en,
      });
    }
  }

  const carrierTypeCounts = {};
  for (const m of models) {
    const c = m.carrier || "?";
    carrierTypeCounts[c] = (carrierTypeCounts[c] || 0) + 1;
  }

  packRows.push({
    file,
    id: data.id,
    level: data.level,
    ...cov,
    models: models.length,
    duds: packDuds.length,
    hard: packHard,
    soft: packSoft,
    silent: silentHoles.length,
    types: Object.keys(carrierTypeCounts).length,
  });

  if (dudsOnly && !packDuds.length) continue;

  console.log(
    `## ${file}  [${data.level || "?"}]  items ${cov.total} · eligible ${cov.eligible} (tag ${cov.tagged} / allow ${cov.allowlisted}) · skip ${cov.skipped} · models ${models.length} · frame_types ${Object.keys(carrierTypeCounts).length} · heuristic_duds ${packDuds.length} (hard ${packHard} / soft ${packSoft}${silentHoles.length ? ` / silent0 ${silentHoles.length}` : ""})`,
  );

  if (!dudsOnly) {
    // Per-item: base tags → role → expanded bank size
    for (const it of items) {
      const base = resolveCarrierIds(it);
      const exp = resolveExpandedCarrierIds(it, { level: data.level });
      const role = classifyCarrierRole(base) || "—";
      const mark = base.length ? base.join(",") : "—";
      console.log(
        `   · ${it.en}  [${role}]  base ${base.length} → exp ${exp.length}  ·  ${mark}`,
      );
    }
    console.log("   --- models (one Sentence pass sample) ---");
    for (const m of models) {
      const flags = dudFlags(m, m._lemma);
      const flagStr = flags.length ? `  ⚠ ${flags.join(",")}` : "";
      console.log(`   [${m.carrier}] EN: ${m.en}  |  CZ: ${m.cz}${flagStr}`);
    }
    for (const hole of silentHoles) {
      console.log(
        `   [—] EN: ${hole.en}  |  CZ: (no model · ${hole.reason})  ⚠ silent_tagged_zero  use=${JSON.stringify(hole.use)}`,
      );
    }
    const topTypes = Object.entries(carrierTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([k, n]) => `${k}×${n}`)
      .join(" · ");
    if (topTypes) console.log(`   frame mix: ${topTypes}`);
  } else {
    for (const { m, flags } of packDuds) {
      console.log(`   ⚠ ${flags.join(",")}  [${m.carrier}] ${m.en}  ←  ${m.cz}`);
    }
  }
  console.log("");
}

console.log("=== Summary ===");
console.log(`packs:           ${packs.length}`);
console.log(`leaf items:      ${totalItems}`);
console.log(`eligible:        ${totalEligible} (${pct(totalEligible, totalItems)})`);
console.log(`  tagged use:    ${totalTagged}`);
console.log(`  allowlist:     ${totalAllow}`);
console.log(`skipped (none):  ${totalSkipped} (${pct(totalSkipped, totalItems)})`);
console.log(`models built:    ${totalModels}`);
console.log(`heuristic duds:  ${dudCount}`);
console.log(`  hard duds:     ${hardFailCount}`);
console.log(`  soft duds:     ${softFailCount}  (cz_case_soft etc — not --strict)`);
console.log(`  silent zero:   ${silentZeroCount}`);
console.log(`carriers known:  ${Object.keys(CARRIERS).length}`);
console.log(`allowlist size:  ${CONCRETE_OBJECT_ALLOWLIST.size}`);
console.log(`expand default:  off (opt-in only)`);
console.log(`models/lemma:    1 (app default)`);

if (strict && hardFailCount > 0) {
  console.error(`\n--strict FAIL: ${hardFailCount} hard dud(s)`);
  const show = hardFailExamples.slice(0, 12);
  for (const ex of show) {
    console.error(
      `  · [${ex.pack}] ${ex.flags.join(",")}  EN: ${ex.en}${ex.lemma && ex.lemma !== ex.en ? `  ← ${ex.lemma}` : ""}`,
    );
  }
  if (hardFailCount > show.length) {
    console.error(`  … +${hardFailCount - show.length} more`);
  }
  process.exit(1);
}
if (strict) {
  console.log("\n--strict OK");
}

// Worst coverage packs (high skip rate)
const worst = packRows
  .filter((r) => r.total >= 8)
  .map((r) => ({ ...r, skipRate: r.skipped / r.total }))
  .sort((a, b) => b.skipRate - a.skipRate)
  .slice(0, 12);
console.log("\n=== Highest skip rate (need use: tags) ===");
for (const r of worst) {
  console.log(
    `  ${(r.skipRate * 100).toFixed(0)}% skip  ${r.file}  (${r.skipped}/${r.total})`,
  );
}

function pct(a, b) {
  if (!b) return "0%";
  return `${Math.round((100 * a) / b)}%`;
}
