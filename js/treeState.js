/**
 * RUE3 Tree Model state — derive StudentTreeState from progress + tree nodes.
 * Single progress truth (progress.js) → this module → treeView SVG.
 * Visual-first: pack IDs unchanged; houses are a fixed 12-slot mapping layer.
 */

/** Fixed 12 branch houses — order = visual slots (stable forever). */
export const HOUSES = [
  { id: "house_self_body", name: "Self & body", short: "Self" },
  { id: "house_money", name: "Money & possessions", short: "Money" },
  { id: "house_communication", name: "Communication", short: "Talk" },
  { id: "house_home_family", name: "Home & family", short: "Home" },
  { id: "house_creativity", name: "Creativity & love", short: "Create" },
  { id: "house_work_daily", name: "Work & daily routine", short: "Work" },
  { id: "house_partnerships", name: "Partnerships", short: "Partners" },
  { id: "house_change", name: "Change & transformation", short: "Change" },
  { id: "house_knowledge_travel", name: "Knowledge & travel", short: "Travel" },
  { id: "house_public", name: "Public life", short: "Public" },
  { id: "house_community", name: "Community", short: "Community" },
  { id: "house_inner", name: "Inner life & belief", short: "Inner" },
];

/**
 * Pack/node id → house id.
 * A1 near-stem active houses: self_body, home_family, work_daily, knowledge_travel
 * (Food folds into home; time+places into knowledge_travel.)
 */
export const NODE_TO_HOUSE = {
  // --- A1 near-stem leaves ---
  leaf_home_family: "house_home_family",
  leaf_food_a1: "house_home_family",
  leaf_body_a1: "house_self_body",
  leaf_health_a1: "house_self_body",
  leaf_clothes_a1: "house_self_body",
  leaf_work_a1: "house_work_daily",
  leaf_freetime_a1: "house_work_daily",
  leaf_places: "house_knowledge_travel",
  leaf_time_a1: "house_knowledge_travel",

  // --- A1 outer leaves → houses (stub at A1) ---
  leaf_colours_a1: "house_creativity",
  leaf_animals_a1: "house_knowledge_travel",
  leaf_school_a1: "house_community",
  leaf_tech_a1: "house_communication",
  leaf_nature_a1: "house_knowledge_travel",
  leaf_shopping_a1: "house_money",
  leaf_ideas_a1: "house_inner",

  // Social frames live on trunk for practice; house tag for canopy only if needed
  trunk_social_a1: "house_communication",

  // --- A2 leaves ---
  leaf_home_a2: "house_home_family",
  leaf_family_a2: "house_home_family",
  leaf_food_a2: "house_home_family",
  leaf_health_a2: "house_self_body",
  leaf_clothes_a2: "house_self_body",
  leaf_work_a2: "house_work_daily",
  leaf_routine_a2: "house_work_daily",
  leaf_freetime_a2: "house_work_daily",
  leaf_sports_a2: "house_work_daily",
  leaf_travel_a2: "house_knowledge_travel",
  leaf_school_a2: "house_community",
  leaf_nature_a2: "house_knowledge_travel",
  leaf_tech_a2: "house_communication",
  leaf_media_a2: "house_communication",
  leaf_shopping_a2: "house_money",
  leaf_society_a2: "house_public",
  leaf_feelings_a2: "house_inner",
  leaf_ideas_a2: "house_inner",
  leaf_describing_a2: "house_creativity",
  leaf_adverbs_a2: "house_creativity",
  leaf_verbs_a2: "house_work_daily",
  leaf_misc_a2: "house_inner",

  // --- B1 trunk (no house; core) + six active branches ---
  leaf_work_b1: "house_work_daily",
  leaf_money_b1: "house_money",
  leaf_communication_b1: "house_communication",
  leaf_knowledge_b1: "house_knowledge_travel",
  leaf_self_b1: "house_self_body",
  leaf_home_b1: "house_home_family",
};

/**
 * Houses unlocked (practiceable) at each stage.
 * A1/A2 (exp): any house that has live leaf content is open — full topic access.
 *   (Poster “tiny sapling” look is visual only; we do not hide vocab.)
 * B1: six houses open for deepening (poster: SEL MON COM HOM WRK KNO); six dim-present.
 * B2: all twelve open.
 */
export const A1_NEAR_STEM = new Set([
  "house_self_body",
  "house_home_family",
  "house_work_daily",
  "house_knowledge_travel",
]);

/** Poster B1 open houses (Codex V_SEL/MON/COM/HOM/WRK/KNO). */
export const B1_OPEN = new Set([
  "house_self_body",
  "house_money",
  "house_communication",
  "house_home_family",
  "house_work_daily",
  "house_knowledge_travel",
]);

const STAGE_NEAR_STEM = {
  // Filled dynamically in derive for A1/A2 from live leaf mappings
  A1: null,
  A2: null,
  B1: B1_OPEN,
  B2: new Set(HOUSES.map((h) => h.id)),
};

const STUB_LENGTH = 14;
const NEAR_STEM_BASE = 38;
const PARTIAL_WEIGHT = 0.35;

/**
 * @param {"none"|"untouched"|"partial"|"fruit"} st
 * @returns {number} 0–1 unit contribution
 */
function unitScore(st) {
  if (st === "fruit") return 1;
  if (st === "partial") return PARTIAL_WEIGHT;
  return 0;
}

/**
 * @param {Array<{ id: string, kind?: string, status?: string, levels?: string[] }>} treeNodes
 * @param {string} level
 * @param {(nodeId: string, opts: { isLive: boolean }) => string} nodeProgressState
 */
export function deriveStudentTreeState(treeNodes, level, nodeProgressState) {
  // C1/C2 must stay C1/C2 (not fall back to A1 sapling) — size is the stage signal
  const stage = ["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)
    ? level
    : "A1";
  const nodes = Array.isArray(treeNodes) ? treeNodes : [];
  /** Author preview: full mature canopy even with no C1/C2 content yet */
  const previewCanopy = stage === "C1" || stage === "C2";

  const liveAtLevel = (n) =>
    n &&
    n.id &&
    n.id !== "trunk" &&
    n.status === "live" &&
    Array.isArray(n.levels) &&
    n.levels.includes(stage);

  // --- Trunk width from trunk-kind units at this stage ---
  const trunkNodes = nodes.filter((n) => liveAtLevel(n) && n.kind === "trunk");
  let trunkSum = 0;
  for (const n of trunkNodes) {
    const st = nodeProgressState(n.id, { isLive: true });
    trunkSum += unitScore(st);
  }
  // Preview stages: show a solid stem (no content yet) so the tree reads mature
  const trunkWidth = previewCanopy
    ? stage === "C2"
      ? 92
      : 78
    : trunkNodes.length
      ? Math.min(100, Math.round((100 * trunkSum) / trunkNodes.length))
      : 0;

  // Group leaf (+ tagged) nodes by house
  /** @type {Map<string, Array<{ id: string, status: string, kind: string }>>} */
  const byHouse = new Map(HOUSES.map((h) => [h.id, []]));
  for (const n of nodes) {
    if (!liveAtLevel(n)) continue;
    if (n.kind === "trunk" && n.id !== "trunk_social_a1") continue; // social optional tag only
    const houseId = NODE_TO_HOUSE[n.id];
    if (!houseId || !byHouse.has(houseId)) continue;
    // Prefer leaves for canopy density; social trunk can list under communication later
    if (n.kind === "leaf" || n.id === "trunk_social_a1") {
      byHouse.get(houseId).push(n);
    }
  }

  // A1/A2: unlock every house that has live leaf content (full topic access)
  // C1/C2 preview: all 12 houses present as full limbs (silhouette of mature tree)
  let nearStem = STAGE_NEAR_STEM[stage];
  if (previewCanopy) {
    nearStem = new Set(HOUSES.map((h) => h.id));
  } else if (stage === "A1" || stage === "A2" || !nearStem) {
    nearStem = new Set();
    for (const h of HOUSES) {
      const leaves = (byHouse.get(h.id) || []).filter((n) => n.kind === "leaf");
      if (leaves.length) nearStem.add(h.id);
    }
  }

  const branches = HOUSES.map((h) => {
    const mapped = byHouse.get(h.id) || [];
    // Only count leaves toward density (not social trunk)
    const leafMapped = mapped.filter((n) => n.kind === "leaf");
    const unlocked = nearStem.has(h.id);
    let densSum = 0;
    let fruitN = 0;
    let partialN = 0;
    for (const n of leafMapped) {
      const st = nodeProgressState(n.id, { isLive: true });
      densSum += unitScore(st);
      if (st === "fruit") fruitN++;
      else if (st === "partial") partialN++;
    }
    let leafDensity = leafMapped.length
      ? Math.min(100, Math.round((100 * densSum) / leafMapped.length))
      : 0;

    // Dim-present branches (B1+): short but visible; unlocked grow with leaf work
    let length = STUB_LENGTH;
    if (previewCanopy) {
      // Full canopy silhouette — not progress-scaled (no C content yet)
      length = stage === "C2" ? 96 : 88;
      leafDensity = stage === "C2" ? 88 : 72;
    } else if (unlocked) {
      const growth = leafMapped.length
        ? Math.round((55 * densSum) / Math.max(1, leafMapped.length))
        : 0;
      // Base length scales slightly with how many units hang on the house
      const unitBoost = Math.min(20, leafMapped.length * 4);
      length = Math.min(100, NEAR_STEM_BASE + unitBoost + growth);
    } else if (stage === "B1" || stage === "B2") {
      length = STUB_LENGTH + 6; // present in model, not yet open
    }

    // Flowers: B2 dense fruit, or C preview silhouette
    const flowers = previewCanopy
      ? stage === "C2"
        ? 3
        : 2
      : stage === "B2" && unlocked && leafDensity >= 70
        ? Math.min(3, 1 + Math.floor(leafDensity / 40))
        : 0;

    return {
      id: h.id,
      name: h.name,
      short: h.short,
      length,
      leafDensity,
      unlocked,
      yellowing: false,
      flowers,
      mappedNodeIds: leafMapped.map((n) => n.id),
      fruitN,
      partialN,
      unitCount: leafMapped.length,
    };
  });

  return {
    stage,
    trunkWidth,
    branches,
    trunkNodeIds: trunkNodes.map((n) => n.id),
    trunkFruitN: trunkNodes.filter(
      (n) => nodeProgressState(n.id, { isLive: true }) === "fruit",
    ).length,
    trunkPartialN: trunkNodes.filter(
      (n) => nodeProgressState(n.id, { isLive: true }) === "partial",
    ).length,
    trunkTotal: trunkNodes.length,
  };
}

/** House definition by id. */
export function getHouse(houseId) {
  return HOUSES.find((h) => h.id === houseId) || null;
}

/** Node is listed on the map at this level (live packs + planned scaffold). */
function listedAtLevel(n, level) {
  return (
    n &&
    (n.status === "live" || n.status === "planned") &&
    Array.isArray(n.levels) &&
    n.levels.includes(level)
  );
}

/** All live/planned leaf nodes mapped to a house at a level. */
export function nodesForHouse(houseId, treeNodes, level) {
  return (treeNodes || []).filter(
    (n) =>
      listedAtLevel(n, level) &&
      n.kind === "leaf" &&
      NODE_TO_HOUSE[n.id] === houseId,
  );
}

/** Live/planned trunk nodes at level (planned = B1 scaffold visible). */
export function trunkNodesForLevel(treeNodes, level) {
  return (treeNodes || []).filter(
    (n) => listedAtLevel(n, level) && n.kind === "trunk",
  );
}

/**
 * Primary node for a house: first incomplete (partial/untouched), else first fruit, else first.
 * @param {string} houseId
 * @param {object[]} treeNodes
 * @param {string} level
 * @param {(id: string, opts: { isLive: boolean }) => string} nodeProgressState
 */
export function primaryNodeForHouse(houseId, treeNodes, level, nodeProgressState) {
  const list = nodesForHouse(houseId, treeNodes, level);
  if (!list.length) return null;
  const scored = list.map((n) => ({
    n,
    st: nodeProgressState(n.id, { isLive: true }),
  }));
  const open = scored.find((x) => x.st !== "fruit");
  return (open || scored[0]).n;
}
