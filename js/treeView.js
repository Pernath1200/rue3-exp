/**
 * RUE3 vocabulary tree SVG — poster-aligned natural line art.
 * Visual target: Poster_Tree-Growth-Stages_RUE3_2026-07-20
 *
 * Growth = stage size (A1 sapling → C2 full frame) + fruit densifying limbs.
 * Trunk progress = gradual colouring (blank → faint → solid), not per-band labels.
 * Future levels: switch the level rail — no ghost overlays.
 */

import { HOUSES } from "./treeState.js";

const W = 720;
const H = 620;
const CX = W / 2;

/**
 * Fixed natural layout per house — attach fraction along trunk (0=top, 1=bottom),
 * lean (-1 left … +1 right), reach (0–1 how far out). Stable across stages.
 * Order matches HOUSES indices for growth-in-place.
 */
const BRANCH_LAYOUT = [
  // Self & body — lower left limb
  { attach: 0.55, lean: -0.92, reach: 0.72, bow: 0.35 },
  // Money — mid-right
  { attach: 0.42, lean: 0.95, reach: 0.78, bow: -0.25 },
  // Communication — mid-left
  { attach: 0.38, lean: -0.78, reach: 0.7, bow: 0.4 },
  // Home & family — upper-right near stem
  { attach: 0.28, lean: 0.72, reach: 0.65, bow: -0.3 },
  // Creativity & love — upper-left
  { attach: 0.22, lean: -0.55, reach: 0.68, bow: 0.45 },
  // Work & daily — upper-right
  { attach: 0.32, lean: 0.55, reach: 0.7, bow: -0.35 },
  // Partnerships — high left
  { attach: 0.15, lean: -0.4, reach: 0.75, bow: 0.5 },
  // Change — high right
  { attach: 0.18, lean: 0.38, reach: 0.72, bow: -0.4 },
  // Knowledge & travel — crown-left
  { attach: 0.1, lean: -0.22, reach: 0.8, bow: 0.55 },
  // Public life — crown-right
  { attach: 0.12, lean: 0.25, reach: 0.78, bow: -0.5 },
  // Community — lower-far left
  { attach: 0.62, lean: -1.05, reach: 0.55, bow: 0.2 },
  // Inner life — lower-far right
  { attach: 0.58, lean: 1.05, reach: 0.55, bow: -0.2 },
];

/** Full labels always — stage only shortens when space is tight (A1). */
const HOUSE_LABEL = {
  house_self_body: { short: "Self & body", A1: "Self & body", A2: "Body & health" },
  house_money: { short: "Money", A1: "Shopping", A2: "Shopping" },
  house_communication: { short: "Communication", A1: "Tech", A2: "Communication" },
  house_home_family: { short: "Home & family", A1: "Home · food", A2: "Home · food" },
  house_creativity: { short: "Creativity & love", A1: "Colours", A2: "Creativity" },
  house_work_daily: { short: "Work & routine", A1: "Work · free time", A2: "Work · free time" },
  house_partnerships: { short: "Partnerships", A1: "Partnerships", A2: "Partnerships" },
  house_change: { short: "Change", A1: "Change", A2: "Change" },
  house_knowledge_travel: { short: "Knowledge & travel", A1: "Places · world", A2: "Places · travel" },
  house_public: { short: "Public life", A1: "Public life", A2: "Public life" },
  house_community: { short: "Community", A1: "School", A2: "Community" },
  house_inner: { short: "Inner life", A1: "Ideas", A2: "Inner life" },
};

/**
 * Extra labeled twigs on A1/A2 so poster topics (Food, Family, Free time, Travel…)
 * appear even when several map to one house. Click still opens the house.
 */
const EXTRA_TOPIC_TWIGS = {
  A1: [
    { houseId: "house_home_family", label: "Food", attach: 0.4, lean: -0.85, reach: 0.48, bow: 0.25 },
    { houseId: "house_home_family", label: "Family", attach: 0.3, lean: 0.88, reach: 0.5, bow: -0.28 },
    { houseId: "house_work_daily", label: "Work", attach: 0.34, lean: 0.6, reach: 0.55, bow: -0.2 },
    { houseId: "house_knowledge_travel", label: "Time", attach: 0.48, lean: -0.7, reach: 0.42, bow: 0.3 },
    { houseId: "house_home_family", label: "Home", attach: 0.36, lean: -0.5, reach: 0.4, bow: 0.35 },
  ],
  A2: [
    { houseId: "house_self_body", label: "Body & health", attach: 0.5, lean: -0.9, reach: 0.62, bow: 0.3 },
    { houseId: "house_home_family", label: "Home", attach: 0.34, lean: -0.55, reach: 0.55, bow: 0.35 },
    { houseId: "house_home_family", label: "Food", attach: 0.4, lean: -0.75, reach: 0.5, bow: 0.28 },
    { houseId: "house_home_family", label: "Family", attach: 0.3, lean: 0.7, reach: 0.55, bow: -0.3 },
    { houseId: "house_work_daily", label: "Work", attach: 0.32, lean: 0.55, reach: 0.58, bow: -0.25 },
    { houseId: "house_work_daily", label: "Free time", attach: 0.44, lean: -0.65, reach: 0.52, bow: 0.32 },
    { houseId: "house_knowledge_travel", label: "Time", attach: 0.52, lean: -0.45, reach: 0.45, bow: 0.25 },
    { houseId: "house_knowledge_travel", label: "Places", attach: 0.28, lean: 0.85, reach: 0.58, bow: -0.35 },
    { houseId: "house_knowledge_travel", label: "Travel", attach: 0.12, lean: 0.35, reach: 0.65, bow: -0.45 },
    { houseId: "house_money", label: "Shopping", attach: 0.38, lean: 0.95, reach: 0.6, bow: -0.22 },
  ],
};

/**
 * Poster-scale growth (relative canopy ~ of C2 fill):
 *   A1 ~12%  sapling          — tiny stick + few tips
 *   A2 ~22%  young sapling
 *   B1 ~40%  young tree       — first “real tree” shape begins
 *   B2 ~62%  spreading tree   — reads as a proper tree
 *   C1 ~82%  mature tree
 *   C2 100%  old oak          — only stage that fills the frame
 *
 * Labels sit in outer columns (long leaders) so small trees stay readable.
 */
function stageMeta(stage) {
  const groundY = 545;
  const trunkBot = 535;
  const base = {
    groundY,
    trunkBot,
    showHouseLabels: true,
    useExtraTwigs: false,
    // Outer label columns (px from viewBox edge) + lead length from tip
    labelMarginX: 18,
    labelLead: 48,
    labelSize: 14,
  };

  if (stage === "A1") {
    return {
      ...base,
      label: "sapling",
      trunkTop: 430, // ~105px stem — true sapling
      minHalf: 2.2,
      maxHalf: 4.5,
      maxReach: 58,
      stroke: 1.35,
      showDimHouses: false,
      showFlowers: false,
      leafBase: 2,
      leafScale: 0.55,
      limbMin: 0.55, // solid limbs still short
      skipEmptyHouses: true,
      labelLead: 72, // long lines away from tiny tree
      labelSize: 15,
    };
  }
  if (stage === "A2") {
    return {
      ...base,
      label: "young sapling",
      trunkTop: 375, // ~160px stem
      minHalf: 2.8,
      maxHalf: 6,
      maxReach: 95,
      stroke: 1.5,
      showDimHouses: false,
      showFlowers: false,
      leafBase: 2,
      leafScale: 0.65,
      limbMin: 0.5,
      skipEmptyHouses: true,
      labelLead: 64,
      labelSize: 15,
    };
  }
  if (stage === "B1") {
    return {
      ...base,
      label: "young tree",
      trunkTop: 300, // ~235px
      minHalf: 4,
      maxHalf: 10,
      maxReach: 145,
      stroke: 1.7,
      showDimHouses: true,
      showFlowers: false,
      leafBase: 3,
      leafScale: 0.8,
      limbMin: 0.45,
      labelLead: 56,
      labelSize: 14,
    };
  }
  if (stage === "B2") {
    return {
      ...base,
      label: "spreading tree",
      trunkTop: 210, // ~325px — first full canopy
      minHalf: 6,
      maxHalf: 16,
      maxReach: 210,
      stroke: 1.95,
      showDimHouses: true,
      showFlowers: true,
      leafBase: 4,
      leafScale: 1,
      limbMin: 0.42,
      labelLead: 44,
      labelSize: 14,
    };
  }
  if (stage === "C1") {
    return {
      ...base,
      label: "mature tree",
      trunkTop: 130,
      minHalf: 8,
      maxHalf: 22,
      maxReach: 260,
      stroke: 2.15,
      showDimHouses: true,
      showFlowers: true,
      leafBase: 5,
      leafScale: 1.1,
      limbMin: 0.4,
      labelLead: 36,
      labelSize: 14,
    };
  }
  // C2 old oak — fills the frame
  return {
    ...base,
    label: "old oak",
    trunkTop: 55,
    minHalf: 10,
    maxHalf: 28,
    maxReach: 310,
    stroke: 2.35,
    showDimHouses: true,
    showFlowers: true,
    leafBase: 6,
    leafScale: 1.2,
    limbMin: 0.4,
    labelLead: 28,
    labelSize: 14,
  };
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function houseLabel(houseId, stage) {
  const row = HOUSE_LABEL[houseId];
  if (!row) return houseId;
  if (stage === "A1" || stage === "A2") return row[stage] || row.short;
  return row.short;
}

function trunkHalf(trunkWidth, meta) {
  const t = Math.max(0, Math.min(100, trunkWidth || 0)) / 100;
  return meta.minHalf + t * (meta.maxHalf - meta.minHalf);
}

/** Two-line trunk (left + right edges) — blank structure always visible. */
function trunkEdges(halfBot, halfTop, bot, top) {
  const mid = (bot + top) / 2;
  const left = `M ${CX - halfBot} ${bot} Q ${CX - halfBot * 0.88} ${mid} ${CX - halfTop * 0.85} ${top}`;
  const right = `M ${CX + halfBot} ${bot} Q ${CX + halfBot * 0.88} ${mid} ${CX + halfTop * 0.85} ${top}`;
  // crown tip join
  const tip = `M ${CX - halfTop * 0.85} ${top} Q ${CX} ${top - 14} ${CX + halfTop * 0.85} ${top}`;
  return { left, right, tip };
}

/** Closed stem body for progressive fill (blank → faint → full). */
function trunkBodyPath(halfBot, halfTop, bot, top) {
  const mid = (bot + top) / 2;
  const lb = CX - halfBot;
  const lt = CX - halfTop * 0.85;
  const rb = CX + halfBot;
  const rt = CX + halfTop * 0.85;
  return (
    `M ${lb.toFixed(1)} ${bot} ` +
    `Q ${(CX - halfBot * 0.88).toFixed(1)} ${mid.toFixed(1)} ${lt.toFixed(1)} ${top} ` +
    `Q ${CX} ${(top - 14).toFixed(1)} ${rt.toFixed(1)} ${top} ` +
    `Q ${(CX + halfBot * 0.88).toFixed(1)} ${mid.toFixed(1)} ${rb.toFixed(1)} ${bot} Z`
  );
}

/**
 * Trunk colouring progress 0..1 from frame fruit / partial / width.
 * Fruit counts full; partial counts lightly so starting a frame still tints.
 */
function trunkColourProgress(treeState) {
  const total = treeState.trunkTotal || 0;
  const fruit = treeState.trunkFruitN || 0;
  const partial = treeState.trunkPartialN || 0;
  if (total > 0) {
    return Math.max(0, Math.min(1, (fruit + partial * 0.4) / total));
  }
  return Math.max(0, Math.min(1, (treeState.trunkWidth || 0) / 100));
}

function pointedLeaf(cx, cy, ang, size) {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const pts = [
    [0, -size * 0.1],
    [size * 0.28, size * 0.2],
    [0, size],
    [-size * 0.28, size * 0.2],
  ];
  const map = ([px, py]) => {
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    return `${(cx + rx).toFixed(1)},${(cy + ry).toFixed(1)}`;
  };
  return `M ${map(pts[0])} L ${map(pts[1])} L ${map(pts[2])} L ${map(pts[3])} Z`;
}

/**
 * Natural branch: attaches on trunk side at height, curves outward and up.
 * @returns {{ d: string, tipX: number, tipY: number, attachX: number, attachY: number, angle: number }}
 */
function naturalBranch(layout, length01, meta, sidePrefer) {
  const { attach, lean, reach, bow } = layout;
  const trunkLen = meta.trunkBot - meta.trunkTop;
  const attachY = meta.trunkTop + attach * trunkLen;
  // attach slightly off centreline toward lean
  const attachX = CX + lean * (3 + length01 * 4);
  const len = (0.35 + length01 * 0.65) * reach * meta.maxReach;
  const tipX = attachX + lean * len;
  // grow upward as well as out
  const tipY = attachY - len * (0.55 + Math.abs(bow) * 0.25);
  // control point for organic bow (S-curve)
  const c1x = attachX + lean * len * 0.35 + bow * 18;
  const c1y = attachY - len * 0.15;
  const c2x = attachX + lean * len * 0.7 - bow * 12;
  const c2y = attachY - len * 0.55;
  const d = `M ${attachX.toFixed(1)} ${attachY.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`;
  const angle = Math.atan2(tipX - attachX, attachY - tipY); // from up
  return { d, tipX, tipY, attachX, attachY, angle, c2x, c2y };
}

/** Leaves along the outer third of the branch (not a tip blob). */
function leavesAlongBranch(branch, density, unlocked, meta) {
  if (!unlocked) return "";
  const scale = meta.leafScale != null ? meta.leafScale : 1;
  const n = Math.max(
    meta.leafBase,
    Math.min(10, Math.round(meta.leafBase + (density / 100) * 5 * scale)),
  );
  let out = "";
  for (let i = 0; i < n; i++) {
    const t = 0.45 + (i / Math.max(1, n - 1)) * 0.52;
    const spread = 3.5 * scale;
    const lx =
      branch.attachX +
      (branch.tipX - branch.attachX) * t +
      Math.sin(i * 1.7) * spread;
    const ly =
      branch.attachY +
      (branch.tipY - branch.attachY) * t +
      Math.cos(i * 1.3) * spread * 0.75;
    const size = (5.5 + (density / 100) * 5 + (i % 2)) * scale;
    const leafAng = branch.angle + (i % 2 === 0 ? 0.5 : -0.5);
    const op = 0.5 + (density / 100) * 0.4;
    out += `<path class="tv-leaf" d="${pointedLeaf(lx, ly, leafAng, size)}" style="opacity:${op.toFixed(2)}" />`;
  }
  return out;
}

function flowerCluster(cx, cy, density, show) {
  if (!show || density < 55) return "";
  const n = density >= 85 ? 3 : 2;
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 4 + i * 2;
    out += `<circle class="tv-flower" cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.7).toFixed(1)}" r="2" />`;
  }
  return out;
}

function asymmetry(houseId, stage) {
  // Slight irregularity only once the canopy is broad
  if (stage !== "B2" && stage !== "C1" && stage !== "C2") return 1;
  let h = 0;
  for (let i = 0; i < houseId.length; i++) h = (h * 31 + houseId.charCodeAt(i)) | 0;
  return 0.82 + (Math.abs(h % 100) / 100) * 0.36;
}

/**
 * Labels in outer columns — long leaders so the tree can stay small and readable.
 * @param {{ y?: number, slot?: number }} [layout] optional stacked y override
 */
function leaderLabel(x, y, lean, text, dim, meta, layout = {}) {
  const side = lean >= 0 ? 1 : -1;
  const margin = meta.labelMarginX != null ? meta.labelMarginX : 18;
  const lead = meta.labelLead != null ? meta.labelLead : 48;
  const fontSize = meta.labelSize != null ? meta.labelSize : 14;
  // Outer column near viewBox edge (away from canopy)
  const lx = side > 0 ? W - margin : margin;
  const ly = layout.y != null ? layout.y : y;
  // Elbow: short run from tip, then long horizontal to column
  const elbowX = x + side * Math.min(lead * 0.45, 28);
  const elbowY = ly;
  const anchor = side > 0 ? "end" : "start";
  // text sits just inside the margin column
  const tx = side > 0 ? lx - 4 : lx + 4;
  const cls = dim
    ? "tv-label tv-label-dim tv-label-hit"
    : "tv-label tv-label-live tv-label-hit";
  const padW = Math.max(56, String(text).length * (fontSize * 0.62));
  const padH = fontSize + 10;
  const padX = side > 0 ? tx - padW : tx;
  const padY = ly - fontSize * 0.75;
  return `
    <path class="tv-leader${dim ? " tv-leader-dim" : ""}" d="M ${x.toFixed(1)} ${y.toFixed(1)} L ${elbowX.toFixed(1)} ${elbowY.toFixed(1)} L ${tx.toFixed(1)} ${ly.toFixed(1)}" fill="none" />
    <rect class="tv-hit-dot" x="${padX.toFixed(1)}" y="${padY.toFixed(1)}" width="${padW.toFixed(1)}" height="${padH.toFixed(1)}" rx="4" />
    <text class="${cls}" x="${tx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="${fontSize}">${escapeXml(text)}</text>`;
}

/** Stack labels on each side so long leaders don’t pile on one y. */
function assignLabelSlots(items) {
  const left = items.filter((it) => it.lean < 0).sort((a, b) => a.tipY - b.tipY);
  const right = items.filter((it) => it.lean >= 0).sort((a, b) => a.tipY - b.tipY);
  const place = (list) => {
    if (!list.length) return;
    const top = 70;
    const bot = 500;
    const span = Math.max(1, list.length - 1);
    const gap = Math.min(36, (bot - top) / Math.max(1, span));
    // Center the stack around the median tip y when few labels
    let y0 = list.length === 1 ? list[0].tipY : top + (bot - top - gap * span) / 2;
    y0 = Math.max(top, Math.min(bot - gap * span, y0));
    list.forEach((it, i) => {
      it.labelY = y0 + i * gap;
    });
  };
  place(left);
  place(right);
  return items;
}

function drawLimb(bodyParts, opts) {
  const {
    houseId,
    label,
    layout,
    length01,
    dens,
    unlocked,
    dim,
    selected,
    meta,
    labelY,
  } = opts;
  const branch = naturalBranch(layout, length01, meta);
  const sel = selected ? " is-selected" : "";
  const kind = unlocked ? "live" : "dim";
  const strokeOp = unlocked ? 0.9 : 0.28;
  const branchW = unlocked ? meta.stroke * (0.9 + dens / 250) : meta.stroke * 0.65;
  const leafSc = meta.leafScale != null ? meta.leafScale : 1;

  let s = `<g class="tv-hit tv-house${sel}" data-house="${escapeXml(houseId)}" data-kind="${kind}" role="button" tabindex="0" aria-label="${escapeXml(label || houseId)}">`;
  // Fat invisible path first (captures clicks along whole limb)
  s += `<path class="tv-branch-hit" d="${branch.d}" />`;
  s += `<circle class="tv-hit-dot" cx="${branch.tipX.toFixed(1)}" cy="${branch.tipY.toFixed(1)}" r="22" />`;
  s += `<circle class="tv-hit-dot" cx="${((branch.attachX + branch.tipX) / 2).toFixed(1)}" cy="${((branch.attachY + branch.tipY) / 2).toFixed(1)}" r="18" />`;
  s += `<path class="tv-branch tv-branch-${kind}" d="${branch.d}" style="opacity:${strokeOp.toFixed(2)};stroke-width:${branchW.toFixed(2)}" />`;
  if (unlocked) {
    s += leavesAlongBranch(branch, dens, true, meta);
    s += flowerCluster(branch.tipX, branch.tipY, dens, meta.showFlowers);
  } else {
    s += `<path class="tv-leaf tv-leaf-dim" d="${pointedLeaf(branch.tipX, branch.tipY, branch.angle, 5 * leafSc)}" style="opacity:0.25" />`;
  }
  if (label) {
    s += leaderLabel(branch.tipX, branch.tipY, layout.lean, label, dim, meta, {
      y: labelY != null ? labelY : branch.tipY,
    });
  }
  s += `</g>`;
  bodyParts.push(s);
}

/**
 * @param {object} treeState
 * @param {{ selectedHouseId?: string|null, selectedTrunk?: boolean }} opts
 */
export function buildTreeSvg(treeState, opts = {}) {
  const { selectedHouseId = null, selectedTrunk = false } = opts;
  const stage = treeState.stage || "A1";
  const meta = stageMeta(stage);
  const colourP = trunkColourProgress(treeState);

  const half = trunkHalf(treeState.trunkWidth, meta);
  const halfBot = half * 1.15;
  const halfTop = half * 0.65;

  const limbs = [];
  const branches = treeState.branches || [];
  const byId = new Map(branches.map((b) => [b.id, b]));
  const limbMin = meta.limbMin != null ? meta.limbMin : 0.4;

  // Collect solid limbs first so we can stack outer labels without collisions
  const solidPlan = [];
  for (let i = 0; i < HOUSES.length; i++) {
    const def = HOUSES[i];
    const b = byId.get(def.id) || {
      id: def.id,
      length: 14,
      leafDensity: 0,
      unlocked: false,
      unitCount: 0,
    };
    const unlocked = Boolean(b.unlocked);
    const unitCount = b.unitCount || (b.mappedNodeIds && b.mappedNodeIds.length) || 0;
    if (!unlocked && !meta.showDimHouses) continue;
    // Don't draw empty houses on A1/A2 (no vocab there yet)
    // C1/C2 preview passes unitCount 0 but full length — still draw
    const previewCanopy = stage === "C1" || stage === "C2";
    if (!previewCanopy) {
      if (meta.skipEmptyHouses && unlocked && unitCount === 0) continue;
      if (meta.skipEmptyHouses && !unlocked && unitCount === 0) continue;
    }

    let length01 = Math.max(0, Math.min(100, b.length)) / 100;
    if (!unlocked && !previewCanopy) length01 = Math.min(length01, 0.22);
    length01 *= asymmetry(b.id, stage);
    // Cap solid limb growth by stage so A1 never looks like a canopy
    // C1/C2 use full length from treeState (preview silhouette)
    if (!previewCanopy) {
      length01 = Math.min(length01, stage === "A1" ? 0.7 : stage === "A2" ? 0.82 : 1);
    }
    const dens = unlocked
      ? Math.max(unitCount > 0 ? 28 : 0, b.leafDensity || 0)
      : b.leafDensity || 0;

    const label = meta.showHouseLabels ? houseLabel(b.id, stage) : null;
    const layout = BRANCH_LAYOUT[i];
    const len = Math.max(length01, unlocked ? limbMin : length01);
    const tip = naturalBranch(layout, len, meta);

    solidPlan.push({
      houseId: b.id,
      label,
      layout,
      length01: len,
      dens,
      unlocked,
      dim: !unlocked,
      selected: selectedHouseId === b.id,
      lean: layout.lean,
      tipY: tip.tipY,
    });
  }
  assignLabelSlots(solidPlan);
  for (const plan of solidPlan) {
    drawLimb(limbs, {
      houseId: plan.houseId,
      label: plan.label,
      layout: plan.layout,
      length01: plan.length01,
      dens: plan.dens,
      unlocked: plan.unlocked,
      dim: plan.dim,
      selected: plan.selected,
      meta,
      stage,
      labelY: plan.labelY,
    });
  }

  // Trunk: faint blank structure always; body fill colours with frame progress
  const edges = trunkEdges(halfBot, halfTop, meta.trunkBot, meta.trunkTop);
  const body = trunkBodyPath(halfBot, halfTop, meta.trunkBot, meta.trunkTop);
  const trunkSel = selectedTrunk ? " is-selected" : "";
  const trunkHitW = Math.max(28, halfBot * 2 + 12);
  // Fill opacity: near-zero when blank, soft mid, solid when complete
  const fillOp = (0.04 + colourP * 0.72).toFixed(3);
  // Edge stroke: readable blank structure → stronger when coloured
  const edgeOp = (0.22 + colourP * 0.7).toFixed(3);
  const edgeW = (1.2 + colourP * 0.9).toFixed(2);
  // Bottom-up colour intensity (stronger at base as you learn)
  const gradId = "tv-trunk-grad";
  const midStop = Math.max(0.12, Math.min(0.92, 1 - colourP * 0.85));

  let trunk = `<g class="tv-hit tv-trunk${trunkSel}" data-trunk="1" role="button" tabindex="0" aria-label="Core frames">`;
  trunk += `<defs>
    <linearGradient id="${gradId}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="${(0.15 + colourP * 0.85).toFixed(3)}" />
      <stop offset="${(midStop * 100).toFixed(0)}%" stop-color="var(--accent)" stop-opacity="${(0.05 + colourP * 0.55).toFixed(3)}" />
      <stop offset="100%" stop-color="var(--accent)" stop-opacity="${(0.02 + colourP * 0.35).toFixed(3)}" />
    </linearGradient>
  </defs>`;
  trunk += `<rect class="tv-hit-dot" x="${(CX - trunkHitW / 2).toFixed(1)}" y="${(meta.trunkTop + 8).toFixed(1)}" width="${trunkHitW.toFixed(1)}" height="${Math.max(40, meta.trunkBot - meta.trunkTop - 16).toFixed(1)}" rx="6" />`;
  // Progressive fill (colour grows with fruit)
  trunk += `<path class="tv-trunk-fill" d="${body}" style="fill:url(#${gradId});opacity:${fillOp}" />`;
  // Blank structure outline (always present, strengthens with progress)
  trunk += `<path class="tv-trunk-edge" d="${edges.left}" style="opacity:${edgeOp};stroke-width:${edgeW}" />`;
  trunk += `<path class="tv-trunk-edge" d="${edges.right}" style="opacity:${edgeOp};stroke-width:${edgeW}" />`;
  trunk += `<path class="tv-trunk-edge" d="${edges.tip}" style="opacity:${edgeOp};stroke-width:${edgeW}" />`;
  trunk += `<text class="tv-trunk-label" x="${CX}" y="${(meta.trunkTop + meta.trunkBot) / 2 + 4}" text-anchor="middle" style="opacity:${(0.35 + colourP * 0.5).toFixed(2)}">Core</text>`;
  trunk += `</g>`;

  const ground = `<line class="tv-ground-line" x1="100" y1="${meta.groundY}" x2="${W - 100}" y2="${meta.groundY}" />`;

  const fruitN = treeState.trunkFruitN || 0;
  const totalN = treeState.trunkTotal || 0;
  const meter = `<text class="tv-trunk-meter" x="${CX}" y="${meta.groundY + 18}" text-anchor="middle">${escapeXml(
    `${stage} · ${meta.label} · core ${fruitN}/${totalN || "—"}`,
  )}</text>`;

  // Ground, trunk (under limbs), limbs, caption
  const html = ground + trunk + limbs.join("") + meter;

  const unlockedN = branches.filter((b) => b.unlocked).length;
  const caption = [
    `${stage} ${meta.label}`,
    `core ${fruitN}/${totalN || 0}`,
    `houses ${unlockedN}/12`,
  ].join(" · ");

  return { html, W, H, caption, viewBox: `0 0 ${W} ${H}` };
}

export function renderTreeSvg(svgEl, treeState, opts = {}) {
  if (!svgEl) return null;
  const built = buildTreeSvg(treeState, opts);
  svgEl.setAttribute("viewBox", built.viewBox);
  svgEl.innerHTML = built.html;
  // Ensure SVG itself does not block (some browsers)
  svgEl.style.pointerEvents = "auto";

  const bindHouse = (g) => {
    const activate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = g.getAttribute("data-house");
      if (id && typeof opts.onSelectHouse === "function") opts.onSelectHouse(id);
    };
    g.addEventListener("click", activate);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") activate(e);
    });
  };
  svgEl.querySelectorAll(".tv-house").forEach(bindHouse);

  const trunk = svgEl.querySelector(".tv-trunk");
  if (trunk) {
    const activate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof opts.onSelectTrunk === "function") opts.onSelectTrunk();
    };
    trunk.addEventListener("click", activate);
    trunk.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") activate(e);
    });
  }
  return built;
}
