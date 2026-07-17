/**
 * RUE3 Grok v0.1 — level rail + tree + practice + honest progress
 * Visual sibling of https://pernath1200.github.io/rue2-grok/
 */

import { startPractice } from "./practice.js";
import { startA1Gate } from "./gate.js";
import {
  loadProgress,
  touchBlock,
  completeMode,
  getBlockProgress,
  nodeProgressState,
  progressLabel,
  isLevelUnlocked,
  isAuthorUnlock,
  setAuthorUnlock,
  getUnlockedList,
  getGate,
  hasPassedGate,
} from "./progress.js";

const STATE = {
  level: "A1",
  tree: null,
  selectedId: null,
  view: "map", // map | practice
  pack: null,
};

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

function nodesForLevel(level) {
  if (!STATE.tree) return [];
  return STATE.tree.nodes.filter((n) => n.levels.includes(level));
}

function showMap() {
  STATE.view = "map";
  document.getElementById("view-map").hidden = false;
  document.getElementById("view-practice").hidden = true;
}

function showPractice() {
  STATE.view = "practice";
  document.getElementById("view-map").hidden = true;
  document.getElementById("view-practice").hidden = false;
}

function lockTag(level) {
  if (level === "C1") return "not yet";
  return "locked";
}

function renderRail() {
  const rail = document.getElementById("level-rail");
  const levels = STATE.tree?.levels || ["A1", "A2", "B1", "B2", "C1"];

  // If current level became locked, snap back to A1
  if (!isLevelUnlocked(STATE.level)) {
    STATE.level = "A1";
  }

  rail.innerHTML = "";
  for (const lv of levels) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-btn";
    const locked = !isLevelUnlocked(lv);
    if (locked) {
      btn.classList.add("is-locked");
      btn.disabled = true;
      btn.innerHTML = `${lv}<span class="tag">${lockTag(lv)}</span>`;
      btn.title =
        lv === "C1"
          ? "Not yet"
          : "Pass the previous level check to unlock (or author unlock)";
    } else {
      btn.setAttribute("aria-pressed", lv === STATE.level ? "true" : "false");
      btn.textContent = lv;
      btn.addEventListener("click", () => {
        STATE.level = lv;
        STATE.selectedId = null;
        renderRail();
        renderTree();
        renderDetail(null);
      });
    }
    rail.appendChild(btn);
  }

  renderAuthorHint();
  renderGateCard();
}

function renderGateCard() {
  const el = document.getElementById("gate-card");
  if (!el) return;
  // Gate is for unlocking the next band from A1
  if (STATE.level !== "A1") {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const g = getGate("A1");
  const passed = hasPassedGate("A1") || isLevelUnlocked("A2");
  const status = passed
    ? g && g.score != null
      ? `Passed · last score ${g.score}/${g.total}`
      : "A2 unlocked"
    : g
      ? `Not passed yet · last ${g.score}/${g.total} · tries ${g.attempts || 0}`
      : "Not attempted yet · pass unlocks A2";

  el.innerHTML = `
    <h2>A1 level check</h2>
    <p class="tree-legend">Thin gate: 12 Quiz · 12 Word · 6 frame sentences · 80% to pass · unlimited retries</p>
    <p class="gate-status">${escapeXml(status)}</p>
    <button type="button" class="block-btn" id="btn-a1-gate">
      <span class="block-btn-title">${passed ? "Retake A1 check" : "Start A1 check →"}</span>
      <span class="block-btn-n">${passed ? "optional" : "unlock A2"}</span>
    </button>
  `;
  const btn = el.querySelector("#btn-a1-gate");
  if (btn) btn.addEventListener("click", openA1Gate);
}

function renderAuthorHint() {
  const el = document.getElementById("author-hint");
  if (!el) return;
  if (isAuthorUnlock()) {
    el.hidden = false;
    el.textContent =
      "Author unlock on · A2–B2 open for writing · ?unlock=all sticky in this browser";
  } else {
    el.hidden = true;
    el.textContent = "";
  }
}

/**
 * A1 sapling layout (attempt 1 — load-bearing metaphor, not org chart).
 * - Ground + vertical trunk wood (drawn in renderTree)
 * - Frame packs sit on the shaft (bottom → top = foundation → newer glue)
 * - Domain leaves fan in a canopy dome above
 * Returns { positions, W, H, meta }
 */
function layoutNodes(nodes) {
  const W = 680;
  const H = 560;
  const cx = W / 2;
  const positions = new Map();

  // Hub on the trunk (parent for edges)
  const hub = { x: cx, y: 300 };
  positions.set("trunk", hub);

  const trunkKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "trunk");
  const leafKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "leaf");
  const craft = nodes.filter((n) => n.kind === "craft");

  // Frames along the shaft — zigzag; tighter when many P4+ packs
  const shaftTop = 145;
  const shaftBot = 400;
  trunkKids.forEach((n, i) => {
    const nT = trunkKids.length;
    const t = nT <= 1 ? 0.5 : i / (nT - 1);
    const y = shaftBot - t * (shaftBot - shaftTop);
    const xOff = nT > 6 ? 34 : 28;
    const x = cx + (i % 2 === 0 ? -xOff : xOff);
    positions.set(n.id, { x, y, role: "shaft" });
  });

  // Canopy: dome — wider span when many leaves (P2+)
  leafKids.forEach((n, i) => {
    const nL = leafKids.length;
    const t = nL <= 1 ? 0.5 : i / (nL - 1);
    const span = Math.min(480, 280 + nL * 18);
    const x = cx + (t - 0.5) * span;
    const y = 42 + Math.pow(t - 0.5, 2) * (90 + nL * 2);
    positions.set(n.id, { x, y, role: "canopy" });
  });

  craft.forEach((n, i) => {
    positions.set(n.id, { x: cx + 200, y: 400 + i * 28, role: "craft" });
  });

  nodes.forEach((n, i) => {
    if (!positions.has(n.id)) {
      positions.set(n.id, {
        x: 60 + (i % 4) * 90,
        y: 400 + Math.floor(i / 4) * 28,
        role: "other",
      });
    }
  });

  return {
    positions,
    W,
    H,
    meta: {
      cx,
      groundY: 400,
      trunkTopY: 130,
      trunkBotY: 400,
      hub,
    },
  };
}

/** Short labels for dense sapling (full name stays in detail panel). */
function treeLabel(node) {
  const short = {
    trunk_frames_a1: "Be / Have",
    trunk_prepositions_a1: "Preps",
    trunk_adjectives_a1: "Adjectives",
    trunk_can_like_want_a1: "Can · like",
    trunk_there_time_a1: "There · time",
    trunk_verbs_daily_a1: "V · daily",
    trunk_verbs_say_a1: "V · say",
    trunk_verbs_action_a1: "V · action",
    trunk_social_a1: "Social",
    trunk_glue_questions_a1: "Wh- Q",
    trunk_glue_quantity_a1: "Some/any",
    trunk_glue_linkers_a1: "And/but",
    trunk_glue_modals_a1: "Will/must",
    trunk_verbs_more_a1: "V · more",
    trunk_verbs_more2_a1: "V · more2",
    trunk_glue_pronouns_a1: "Pronouns",
    leaf_home_family: "Home",
    leaf_places: "Places",
    leaf_food_a1: "Food",
    leaf_time_a1: "Time",
    leaf_freetime_a1: "Free time",
    leaf_work_a1: "Work",
    leaf_colours_a1: "Colours",
    leaf_clothes_a1: "Clothes",
    leaf_body_a1: "Body",
    leaf_animals_a1: "Animals",
    leaf_school_a1: "School",
    leaf_tech_a1: "Tech",
    leaf_nature_a1: "Nature",
    leaf_shopping_a1: "Shopping",
    leaf_ideas_a1: "Ideas",
  };
  return short[node.id] || node.label;
}

function branchPath(from, to, sway = 0) {
  const mx = (from.x + to.x) / 2 + sway;
  const my = Math.min(from.y, to.y) - 18 - Math.abs(to.x - from.x) * 0.08;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTree() {
  const nodes = nodesForLevel(STATE.level);
  const svg = document.getElementById("tree-svg");
  const caption = document.getElementById("tree-caption");
  const live = nodes.filter((n) => n.status === "live").length;
  const unlocked = getUnlockedList().join(" · ");
  const stage =
    STATE.level === "A1" ? "sapling" : STATE.level === "A2" ? "young tree" : "tree";
  caption.textContent = `${STATE.level} ${stage} · ${live} live · unlock: ${unlocked} · fills as you practise`;

  const { positions, W, H, meta } = layoutNodes(nodes);
  const { cx, groundY, trunkTopY, trunkBotY, hub } = meta;

  // Growth fill: tree densifies as nodes move untouched → touched → fruit
  const liveNodes = nodes.filter((n) => n.status === "live" && n.id !== "trunk");
  let fruitN = 0;
  let partialN = 0;
  for (const n of liveNodes) {
    const st = nodeProgressState(n.id, { isLive: true });
    if (st === "fruit") fruitN++;
    else if (st === "partial") partialN++;
  }
  const liveCount = Math.max(1, liveNodes.length);
  const growth = (fruitN + partialN * 0.45) / liveCount; // 0..1
  const canopyRx = 120 + growth * 120;
  const canopyRy = 48 + growth * 48;
  const canopyOp = 0.04 + growth * 0.14;
  const woodOp = 0.1 + growth * 0.22;
  const growthPct = Math.round(growth * 100);

  // Background layers — wood + ground + canopy that fills with growth
  let scenery = "";
  scenery += `<ellipse class="tree-canopy-wash" cx="${cx}" cy="95" rx="${canopyRx.toFixed(1)}" ry="${canopyRy.toFixed(1)}" style="opacity:${canopyOp.toFixed(3)}" />`;
  // Soft “leaf mass” dots in canopy — count scales with fruit
  const leafDots = Math.round(4 + fruitN * 1.2 + partialN * 0.4);
  for (let i = 0; i < leafDots; i++) {
    const t = leafDots <= 1 ? 0.5 : i / (leafDots - 1);
    const ang = Math.PI * (0.15 + 0.7 * t);
    const rad = 40 + (i % 5) * 14 + growth * 30;
    const lx = cx + Math.cos(ang) * rad * (0.7 + (i % 3) * 0.15);
    const ly = 55 + Math.sin(ang) * rad * 0.35 + (i % 4) * 6;
    const lr = 3 + (i % 3);
    const lop = 0.15 + growth * 0.45;
    scenery += `<circle class="tree-growth-leaf" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${lr}" style="opacity:${lop.toFixed(3)}" />`;
  }
  scenery += `<path class="tree-trunk-wood" d="
    M ${cx - 14} ${trunkBotY}
    Q ${cx - 10} ${(trunkBotY + trunkTopY) / 2} ${cx - 7} ${trunkTopY}
    L ${cx + 7} ${trunkTopY}
    Q ${cx + 10} ${(trunkBotY + trunkTopY) / 2} ${cx + 14} ${trunkBotY}
    Z" style="opacity:${woodOp.toFixed(3)}" />`;
  scenery += `<ellipse class="tree-ground" cx="${cx}" cy="${groundY + 8}" rx="120" ry="16" />`;
  scenery += `<text class="tree-ground-label" x="${cx}" y="${groundY + 28}" text-anchor="middle">A1 · growth ${growthPct}% · fruit ${fruitN}/${liveNodes.length}</text>`;

  // Branches: canopy = curved; shaft frames = short sticks into the wood
  let edges = "";
  for (const n of nodes) {
    if (!n.parent) continue;
    const to = positions.get(n.id);
    if (!to) continue;
    if (n.kind === "leaf") {
      const from = { x: cx, y: trunkTopY + 20 };
      const sway = (to.x - cx) * 0.15;
      edges += `<path class="edge edge-branch" d="${branchPath(from, to, sway)}" />`;
    } else if (n.kind === "trunk" && n.id !== "trunk") {
      edges += `<line class="edge edge-shaft" x1="${cx}" y1="${to.y}" x2="${to.x}" y2="${to.y}" />`;
    } else {
      const from = positions.get(n.parent) || hub;
      edges += `<line class="edge" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
    }
  }

  let circles = "";
  for (const n of nodes) {
    if (n.id === "trunk") continue; // wood is the trunk — no extra hub disc
    const p = positions.get(n.id);
    if (!p) continue;
    const r = n.kind === "trunk" ? 13 : n.kind === "craft" ? 10 : 15;
    const sel = STATE.selectedId === n.id ? " is-selected" : "";
    const liveCls = n.status === "live" ? " is-live" : "";
    const prog = nodeProgressState(n.id, { isLive: n.status === "live" });
    const progCls =
      prog === "fruit"
        ? " prog-fruit"
        : prog === "partial"
          ? " prog-partial"
          : prog === "untouched"
            ? " prog-untouched"
            : "";
    const label = treeLabel(n);
    // Leaf labels above canopy nodes; shaft labels outside
    const labelY = n.kind === "leaf" ? p.y - r - 8 : p.y + r + 13;
    const labelX =
      n.kind === "trunk" && n.id !== "trunk"
        ? p.x + (p.x < cx ? -10 : 10)
        : p.x;
    const anchor =
      n.kind === "trunk" && n.id !== "trunk"
        ? p.x < cx
          ? "end"
          : "start"
        : "middle";
    circles += `
      <g class="node-hit" data-id="${n.id}">
        <circle class="node-circle kind-${n.kind} status-${n.status || "planned"}${sel}${liveCls}${progCls}"
          cx="${p.x}" cy="${p.y}" r="${r}" />
        <text class="node-label kind-${n.kind}" x="${labelX}" y="${labelY}" text-anchor="${anchor}">${escapeXml(label)}</text>
      </g>`;
  }

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = scenery + edges + circles;

  svg.querySelectorAll(".node-hit").forEach((g) => {
    g.addEventListener("click", () => {
      const id = g.getAttribute("data-id");
      STATE.selectedId = id;
      renderTree();
      const node = nodes.find((n) => n.id === id) || STATE.tree.nodes.find((n) => n.id === id);
      renderDetail(node || null);
    });
  });
}

function renderDetail(node) {
  const el = document.getElementById("node-detail");
  if (!node) {
    el.innerHTML = `<p class="detail-empty">Select a node on the <strong>sapling</strong>: frames on the <strong>trunk</strong>, domains in the <strong>canopy</strong> (leaves).</p>`;
    return;
  }

  const badge = node.status || "planned";
  const prog = nodeProgressState(node.id, { isLive: node.status === "live" });
  const progText = progressLabel(prog);
  const progBadge = progText
    ? `<span class="badge prog-${prog}" style="margin-left:0.35rem">${escapeXml(progText)}</span>`
    : "";

  let actions = "";
  if (node.status === "live" && node.content) {
    actions = `
      <div class="block-list" id="block-list">
        <p class="detail-loading">Loading blocks…</p>
      </div>`;
  }

  el.innerHTML = `
    <div style="margin-bottom:0.65rem">
      <strong style="font-size:1.05rem">${escapeXml(node.label)}</strong>
      <span class="badge ${badge}" style="margin-left:0.5rem">${escapeXml(badge)}</span>
      ${progBadge}
    </div>
    <dl class="detail">
      <dt>id</dt><dd><code>${escapeXml(node.id)}</code></dd>
      <dt>kind</dt><dd>${escapeXml(node.kind)}</dd>
      <dt>note</dt><dd>${escapeXml(node.note || "—")}</dd>
    </dl>
    ${actions}
  `;

  if (node.status === "live" && node.content) {
    loadAndShowBlocks(node);
  }
}

function blockStatusLine(blockId) {
  const p = getBlockProgress(blockId);
  if (!p || !p.touchedAt) return "not started";
  const modes = p.modes || {};
  const done = ["match", "quiz", "type", "sentence"].filter((m) => modes[m]);
  if (p.sentenceDone || modes.sentence) return `fruit · ${done.join(" · ") || "sentence"}`;
  if (done.length) return `touched · ${done.join(" · ")}`;
  return "touched";
}

async function loadAndShowBlocks(node) {
  const listEl = document.getElementById("block-list");
  if (!listEl) return;
  try {
    const pack = await loadJson(`./data/${node.content}`);
    STATE.pack = pack;
    listEl.innerHTML = `
      <div class="rail-label" style="margin-top:0.85rem">Practice blocks (small sets)</div>
      <div class="block-btns">
        ${pack.blocks
          .map((b) => {
            const st = blockStatusLine(b.id);
            return `<button type="button" class="block-btn" data-block="${b.id}">
                <span class="block-btn-title">${escapeXml(b.title)}</span>
                <span class="block-btn-n">${b.items.length} ${pack.practice === "frames" ? "frames" : "words"} · ${escapeXml(st)}</span>
              </button>`;
          })
          .join("")}
      </div>
      <p class="detail-hint">Ladder: Match → Quiz → Word → <strong>Sentence</strong> (production / fruit) · CZ → EN · progress stays on this browser</p>
    `;
    listEl.querySelectorAll(".block-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const block = pack.blocks.find((b) => b.id === btn.dataset.block);
        if (block) openPractice({ ...block, practice: pack.practice }, pack);
      });
    });
  } catch (e) {
    listEl.innerHTML = `<p class="detail-empty" style="color:var(--wrong)">${escapeXml(e.message)}</p>`;
  }
}

function openPractice(block, pack) {
  showPractice();
  const root = document.getElementById("practice-root");
  const blockId = block.id;
  const nodeId = pack?.tree_node || STATE.selectedId;
  startPractice(root, block, {
    practice: pack?.practice,
    onTouch: () => {
      touchBlock(blockId, nodeId);
    },
    onModeComplete: (mode, meta) => {
      completeMode(blockId, mode, {
        nodeId,
        score: meta.score,
        total: meta.total,
      });
    },
    onExit: () => {
      showMap();
      renderRail();
      renderTree();
      const node = STATE.tree.nodes.find((n) => n.id === STATE.selectedId);
      renderDetail(node || null);
    },
  });
}

function openA1Gate() {
  showPractice();
  const root = document.getElementById("practice-root");
  const a1Live = STATE.tree.nodes.filter(
    (n) => n.status === "live" && n.content && n.levels.includes("A1"),
  );
  startA1Gate(root, {
    loadJson,
    a1LiveNodes: a1Live,
    onExit: () => {
      showMap();
      renderRail();
      renderTree();
      renderGateCard();
      const node = STATE.tree.nodes.find((n) => n.id === STATE.selectedId);
      renderDetail(node || null);
    },
    onDone: (opts) => {
      showMap();
      if (opts && opts.goLevel === "A2" && isLevelUnlocked("A2")) {
        STATE.level = "A2";
        STATE.selectedId = null;
      }
      renderRail();
      renderTree();
      renderGateCard();
      renderDetail(null);
    },
  });
}

function wireUtilBar() {
  const btn = document.getElementById("btn-author-unlock");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = !isAuthorUnlock();
    setAuthorUnlock(next);
    renderRail();
    renderTree();
    btn.textContent = next ? "Author unlock: on" : "Author unlock";
    btn.setAttribute("aria-pressed", next ? "true" : "false");
  });
  if (isAuthorUnlock()) {
    btn.textContent = "Author unlock: on";
    btn.setAttribute("aria-pressed", "true");
  }
}

async function init() {
  const err = document.getElementById("boot-error");
  try {
    loadProgress();
    // Sticky author unlock from ?unlock=all
    isAuthorUnlock();
    STATE.tree = await loadJson("./data/tree.json");
    wireUtilBar();
    renderRail();
    renderTree();
    const live = STATE.tree.nodes.find((n) => n.status === "live");
    if (live) {
      STATE.selectedId = live.id;
      renderTree();
      renderDetail(live);
    } else {
      renderDetail(null);
    }
  } catch (e) {
    err.hidden = false;
    err.textContent = e.message || String(e);
  }
}

init();
