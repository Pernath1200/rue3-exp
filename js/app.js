/**
 * RUE3 Grok v0.1 — level rail + tree + practice + honest progress
 * Visual sibling of https://pernath1200.github.io/rue2-grok/
 */

import { startPractice } from "./practice.js";
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
  const W = 560;
  const H = 460;
  const cx = W / 2;
  const positions = new Map();

  // Hub on the trunk (parent for edges)
  const hub = { x: cx, y: 300 };
  positions.set("trunk", hub);

  const trunkKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "trunk");
  const leafKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "leaf");
  const craft = nodes.filter((n) => n.kind === "craft");

  // Frames along the shaft — slight zigzag so labels stay readable
  const shaftTop = 175;
  const shaftBot = 355;
  trunkKids.forEach((n, i) => {
    const nT = trunkKids.length;
    const t = nT <= 1 ? 0.5 : i / (nT - 1);
    const y = shaftBot - t * (shaftBot - shaftTop);
    const x = cx + (i % 2 === 0 ? -28 : 28);
    positions.set(n.id, { x, y, role: "shaft" });
  });

  // Canopy: dome — higher in the middle, wider left/right
  leafKids.forEach((n, i) => {
    const nL = leafKids.length;
    const t = nL <= 1 ? 0.5 : i / (nL - 1);
    const x = cx + (t - 0.5) * 420;
    const y = 48 + Math.pow(t - 0.5, 2) * 100;
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
    leaf_home_family: "Home",
    leaf_places: "Places",
    leaf_food_a1: "Food",
    leaf_time_a1: "Time",
    leaf_freetime_a1: "Free time",
    leaf_work_a1: "Work",
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
  caption.textContent = `${STATE.level} ${stage} · ${live} live · unlock: ${unlocked}`;

  const { positions, W, H, meta } = layoutNodes(nodes);
  const { cx, groundY, trunkTopY, trunkBotY, hub } = meta;

  // Background layers — wood + ground + soft canopy wash
  let scenery = "";
  scenery += `<ellipse class="tree-canopy-wash" cx="${cx}" cy="95" rx="210" ry="78" />`;
  scenery += `<path class="tree-trunk-wood" d="
    M ${cx - 14} ${trunkBotY}
    Q ${cx - 10} ${(trunkBotY + trunkTopY) / 2} ${cx - 7} ${trunkTopY}
    L ${cx + 7} ${trunkTopY}
    Q ${cx + 10} ${(trunkBotY + trunkTopY) / 2} ${cx + 14} ${trunkBotY}
    Z" />`;
  scenery += `<ellipse class="tree-ground" cx="${cx}" cy="${groundY + 8}" rx="120" ry="16" />`;
  scenery += `<text class="tree-ground-label" x="${cx}" y="${groundY + 28}" text-anchor="middle">A1 · roots of use</text>`;

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
