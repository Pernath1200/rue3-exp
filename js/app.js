/**
 * RUE3 Grok v0.1 — level rail + tree + practice + honest progress
 * Visual sibling of https://pernath1200.github.io/rue2-grok/
 */

import { startPractice } from "./practice.js";
import { startA1Gate } from "./gate.js";
import { startReviewQueue } from "./review.js";
import {
  loadProgress,
  touchBlock,
  completeMode,
  getBlockProgress,
  nodeProgressState,
  progressLabel,
  levelUnitStats,
  MASTERY_REPS,
  migrateLearnedNodes,
  getDueUnits,
  getRecentActivity,
  suggestNextUnit,
  getNodeReview,
  formatRelativeTime,
  formatDueLabel,
  forceAllDue,
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
      // Keep clickable for C1 message / author-unlock path (disabled buttons swallow clicks)
      btn.innerHTML = `${lv}<span class="tag">${lockTag(lv)}</span>`;
      if (lv === "C1") {
        btn.disabled = true;
        btn.title = "Not yet";
      } else {
        btn.disabled = false;
        btn.title = "Click to open author unlock (or pass the previous level check)";
        btn.addEventListener("click", () => {
          setAuthorUnlock(true);
          const au = document.getElementById("btn-author-unlock");
          if (au) {
            au.textContent = "Author unlock: on";
            au.setAttribute("aria-pressed", "true");
          }
          STATE.level = lv;
          STATE.selectedId = null;
          renderRail();
          renderTree();
          renderTodayCard();
          renderDetail(null);
        });
      }
    } else {
      btn.setAttribute("aria-pressed", lv === STATE.level ? "true" : "false");
      btn.textContent = lv;
      btn.addEventListener("click", () => {
        STATE.level = lv;
        STATE.selectedId = null;
        renderRail();
        renderTree();
        renderTodayCard();
        renderDetail(null);
      });
    }
    rail.appendChild(btn);
  }

  renderAuthorHint();
  renderGateCard();
}

function liveUnitsForLevel(level) {
  return (STATE.tree?.nodes || []).filter(
    (n) =>
      n.id !== "trunk" &&
      n.status === "live" &&
      Array.isArray(n.levels) &&
      n.levels.includes(level),
  );
}

function renderTodayCard() {
  const el = document.getElementById("today-card");
  if (!el || !STATE.tree) return;
  el.hidden = false;
  const level = STATE.level;
  const live = liveUnitsForLevel(level);
  const due = getDueUnits(STATE.tree.nodes, { level, limit: 8 });
  const recent = getRecentActivity(STATE.tree.nodes, { limit: 3 });
  const next = suggestNextUnit(STATE.tree.nodes, level);

  const dueList =
    due.length === 0
      ? `<p class="today-empty">Nothing due — nice. Learn something new on the tree, or finish Sentence on a unit to schedule reviews.</p>`
      : `<ul class="today-list">
          ${due
            .slice(0, 5)
            .map(
              (u) =>
                `<li><button type="button" class="today-link" data-select="${escapeXml(u.nodeId)}">${escapeXml(u.label)}</button></li>`,
            )
            .join("")}
          ${due.length > 5 ? `<li class="today-more">+${due.length - 5} more in queue</li>` : ""}
        </ul>`;

  const recentList =
    recent.length === 0
      ? `<p class="today-empty">No recent activity yet.</p>`
      : `<ul class="today-list">
          ${recent
            .map((e) => {
              const verb =
                e.kind === "reviewed"
                  ? e.meta?.result === "fail"
                    ? "Reviewed (retry soon)"
                    : "Reviewed"
                  : "Learned";
              return `<li><strong>${escapeXml(verb)}</strong> ${escapeXml(e.label)} · ${escapeXml(formatRelativeTime(e.at))}</li>`;
            })
            .join("")}
        </ul>`;

  const coverHtml = next
    ? `<p class="today-cover"><strong>Cover next:</strong>
         <button type="button" class="today-link" data-select="${escapeXml(next.nodeId)}">${escapeXml(next.label)}</button>
         <span class="today-muted">(${next.state === "partial" ? "started" : "not started"})</span>
       </p>`
    : `<p class="today-empty">All live units on ${escapeXml(level)} are started — keep reviewing.</p>`;

  const primary =
    due.length > 0
      ? `<button type="button" class="btn primary" id="btn-start-reviews">Start reviews (${due.length})</button>`
      : next
        ? `<button type="button" class="btn primary" id="btn-cover-next">Open ${escapeXml(next.label)} →</button>`
        : `<button type="button" class="btn primary" id="btn-browse-tree">Browse tree</button>`;

  el.innerHTML = `
    <h2>Today · ${escapeXml(level)}</h2>
    <p class="tree-legend">Topics to cover · what needs repeating · what you did recently. Reviews are whole units (words live inside).</p>
    <div class="today-grid">
      <div class="today-block">
        <div class="today-label">Due now <span class="today-badge">${due.length}</span></div>
        ${dueList}
      </div>
      <div class="today-block">
        <div class="today-label">Recently</div>
        ${recentList}
      </div>
    </div>
    ${coverHtml}
    <div class="today-actions">
      ${primary}
      ${due.length > 0 && next ? `<button type="button" class="btn" id="btn-cover-next">Learn new instead</button>` : ""}
      ${isAuthorUnlock() ? `<button type="button" class="btn" id="btn-force-due" title="Author: mark all scheduled units due now">Force due (test)</button>` : ""}
    </div>
  `;

  el.querySelectorAll("[data-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-select");
      const node = STATE.tree.nodes.find((n) => n.id === id);
      if (!node) return;
      STATE.selectedId = id;
      renderTree();
      renderDetail(node);
      document.getElementById("node-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  const startBtn = el.querySelector("#btn-start-reviews");
  if (startBtn) startBtn.addEventListener("click", () => openReviewQueue(due));

  const coverBtn = el.querySelector("#btn-cover-next");
  if (coverBtn && next) {
    coverBtn.addEventListener("click", () => {
      const node = STATE.tree.nodes.find((n) => n.id === next.nodeId);
      if (!node) return;
      STATE.selectedId = next.nodeId;
      renderTree();
      renderDetail(node);
      document.getElementById("node-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const browse = el.querySelector("#btn-browse-tree");
  if (browse) {
    browse.addEventListener("click", () => {
      document.getElementById("tree-svg")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const force = el.querySelector("#btn-force-due");
  if (force) {
    force.addEventListener("click", () => {
      forceAllDue();
      renderTodayCard();
      renderTree();
    });
  }
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
 * Sapling layout — attempt 2: fixed silhouette regions.
 * Trunk packs = stacked wood bands · Leaves = canopy leaf shapes · Labels quiet.
 */
function layoutNodes(nodes) {
  const W = 720;
  const H = 600;
  const cx = W / 2;
  const positions = new Map();

  const groundY = 520;
  const trunkBotY = 500;
  const trunkTopY = 200;
  const hub = { x: cx, y: (trunkBotY + trunkTopY) / 2 };
  positions.set("trunk", hub);

  const trunkKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "trunk");
  const leafKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "leaf");
  const craft = nodes.filter((n) => n.kind === "craft");

  // Trunk bands: bottom → top (foundation first), centred on shaft
  const nT = Math.max(1, trunkKids.length);
  const bandH = Math.min(22, (trunkBotY - trunkTopY - 8) / nT);
  trunkKids.forEach((n, i) => {
    const yBot = trunkBotY - i * bandH;
    const yTop = yBot - bandH + 1;
    const yMid = (yTop + yBot) / 2;
    const side = i % 2 === 0 ? -1 : 1;
    positions.set(n.id, {
      x: cx,
      y: yMid,
      yTop,
      yBot,
      role: "shaft",
      labelSide: side,
      bandH,
    });
  });

  // Canopy leaf slots — dome fan above trunk top
  const nL = Math.max(1, leafKids.length);
  leafKids.forEach((n, i) => {
    const t = nL <= 1 ? 0.5 : i / (nL - 1);
    const span = Math.min(520, 300 + nL * 14);
    const x = cx + (t - 0.5) * span;
    const y = 70 + Math.pow(t - 0.5, 2) * 95;
    // angle for leaf tip: point outward from crown
    const ang = Math.atan2(y - (trunkTopY - 10), x - cx);
    positions.set(n.id, {
      x,
      y,
      role: "canopy",
      ang,
      size: 26,
    });
  });

  craft.forEach((n, i) => {
    positions.set(n.id, { x: cx + 220, y: groundY - 20 + i * 28, role: "craft", size: 14 });
  });

  nodes.forEach((n, i) => {
    if (!positions.has(n.id)) {
      positions.set(n.id, {
        x: 80 + (i % 4) * 90,
        y: groundY - 40 + Math.floor(i / 4) * 24,
        role: "other",
        size: 14,
      });
    }
  });

  return {
    positions,
    W,
    H,
    meta: { cx, groundY, trunkTopY, trunkBotY, hub, bandH },
  };
}

/** Short labels (muted in SVG; full name in detail panel). */
function treeLabel(node) {
  const short = {
    trunk_frames_a1: "Be / Have",
    trunk_prepositions_a1: "Preps",
    trunk_adjectives_a1: "Adjectives",
    trunk_can_like_want_a1: "Can · like",
    trunk_there_time_a1: "There · time",
    trunk_verbs_daily_a1: "Verbs · daily",
    trunk_verbs_say_a1: "Verbs · say",
    trunk_verbs_action_a1: "Verbs · action",
    trunk_social_a1: "Social",
    trunk_glue_questions_a1: "Wh- questions",
    trunk_glue_quantity_a1: "Some · any",
    trunk_glue_linkers_a1: "And · but",
    trunk_glue_modals_a1: "Will · must",
    trunk_verbs_more_a1: "Verbs · more",
    trunk_verbs_more2_a1: "Verbs · more 2",
    trunk_verbs_more3_a1: "Verbs · more 3",
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
    leaf_health_a1: "Health",
    leaf_animals_a1: "Animals",
    leaf_school_a1: "School",
    leaf_tech_a1: "Tech",
    leaf_nature_a1: "Nature",
    leaf_shopping_a1: "Shopping",
    leaf_ideas_a1: "Ideas",
    trunk_past_a2: "Past",
    trunk_past_irreg_a2: "Past irreg",
    trunk_perfect_a2: "Perfect",
    trunk_future_a2: "Future",
    trunk_compare_a2: "Compare",
    trunk_quantity_a2: "Quantity",
    trunk_time_preps_a2: "Time preps",
    trunk_chunks_a2: "Chunks",
    trunk_glue_a2: "Glue",
    leaf_travel_a2: "Travel",
    leaf_health_a2: "Health",
    leaf_home_a2: "Home",
    leaf_work_a2: "Work",
    leaf_family_a2: "Family",
    leaf_food_a2: "Food",
    leaf_shopping_a2: "Shopping",
    leaf_routine_a2: "Routine",
    leaf_freetime_a2: "Free time",
    leaf_sports_a2: "Sport",
    leaf_nature_a2: "Nature",
    leaf_tech_a2: "Tech",
    leaf_school_a2: "School",
    leaf_clothes_a2: "Clothes",
    leaf_feelings_a2: "Feelings",
    leaf_ideas_a2: "Ideas",
    leaf_society_a2: "Society",
    leaf_media_a2: "Media",
    leaf_describing_a2: "Describe",
    leaf_adverbs_a2: "Adverbs",
    leaf_verbs_a2: "Verbs",
    leaf_misc_a2: "General",
  };
  return short[node.id] || node.label;
}

function branchPath(from, to, sway = 0) {
  const mx = (from.x + to.x) / 2 + sway;
  const my = Math.min(from.y, to.y) - 12 - Math.abs(to.x - from.x) * 0.06;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

/** Leaf silhouette path centred at (x,y), rotated toward ang (radians). */
function leafShapePath(x, y, size, ang) {
  const s = size;
  // local leaf: tip at +y, base at -y
  const pts = [
    [0, -s * 0.55],
    [s * 0.38, -s * 0.1],
    [s * 0.42, s * 0.35],
    [0, s * 0.6],
    [-s * 0.42, s * 0.35],
    [-s * 0.38, -s * 0.1],
  ];
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const map = ([px, py]) => {
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    return `${(x + rx).toFixed(1)},${(y + ry).toFixed(1)}`;
  };
  return `M ${map(pts[0])} L ${pts.slice(1).map(map).join(" L ")} Z`;
}

/** Progress → fill strength for region paint (tree body, not badge colour). */
function regionPaint(prog, isLive) {
  if (!isLive) {
    return { fillOp: 0.03, strokeOp: 0.2, branchOp: 0.12, state: "empty" };
  }
  if (prog === "fruit") {
    return { fillOp: 0.78, strokeOp: 0.85, branchOp: 0.75, state: "fruit" };
  }
  if (prog === "partial") {
    return { fillOp: 0.38, strokeOp: 0.55, branchOp: 0.45, state: "partial" };
  }
  // live but untouched — ghost slot
  return { fillOp: 0.06, strokeOp: 0.28, branchOp: 0.18, state: "slot" };
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Three honest meters: learned (fruit) · remembered (≥1 review) · mastered (≥4 reviews).
 * Review meters stay at 0 until Phase 2 SRS writes node successfulReps.
 */
function renderLevelMeters(level, nodes) {
  const el = document.getElementById("level-meters");
  if (!el) return;
  const s = levelUnitStats(level, nodes);
  const t = s.total || 0;
  const pct = (n) => (t ? Math.round((100 * n) / t) : 0);
  const bar = (n, kind) => {
    const p = pct(n);
    return `
      <div class="meter-row meter-${kind}">
        <div class="meter-label">${kind === "learned" ? "Learned" : kind === "remembered" ? "Remembered" : "Mastered"}</div>
        <div class="meter-track" role="progressbar" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${n}" aria-label="${kind} ${n} of ${t}">
          <div class="meter-fill" style="width:${p}%"></div>
        </div>
        <div class="meter-count">${n}/${t}</div>
      </div>`;
  };
  el.innerHTML = `
    <div class="meters-head">
      <span class="meters-title">${level} progress</span>
      <span class="meters-sub">${s.partial ? `+${s.partial} started · ` : ""}${t} units</span>
    </div>
    ${bar(s.learned, "learned")}
    ${bar(s.remembered, "remembered")}
    ${bar(s.mastered, "mastered")}
    <p class="meters-hint">
      <strong>Learned</strong> = finished Sentence on that unit.
      <strong>Remembered</strong> = at least one spaced review.
      <strong>Mastered</strong> = ${MASTERY_REPS} successful reviews.
      Use <strong>Today</strong> above for due topics.
    </p>`;
}

function renderTree() {
  const nodes = nodesForLevel(STATE.level);
  const svg = document.getElementById("tree-svg");
  const caption = document.getElementById("tree-caption");
  const live = nodes.filter((n) => n.status === "live").length;
  const unlocked = getUnlockedList().join(" · ");
  const stage =
    STATE.level === "A1" ? "sapling" : STATE.level === "A2" ? "young tree" : "tree";

  const { positions, W, H, meta } = layoutNodes(nodes);
  const { cx, groundY, trunkTopY, trunkBotY } = meta;

  const liveNodes = nodes.filter((n) => n.status === "live" && n.id !== "trunk");
  let fruitN = 0;
  let partialN = 0;
  for (const n of liveNodes) {
    const st = nodeProgressState(n.id, { isLive: true });
    if (st === "fruit") fruitN++;
    else if (st === "partial") partialN++;
  }
  const dueN = getDueUnits(STATE.tree?.nodes || [], { level: STATE.level }).length;
  caption.textContent = `${STATE.level} ${stage} · fruit ${fruitN}/${liveNodes.length}${dueN ? ` · due ${dueN}` : ""} · unlock: ${unlocked}`;
  renderLevelMeters(STATE.level, nodes);

  // --- Fixed skeleton (always visible, quiet) ---
  let scenery = "";
  // Soft crown guide (empty canopy outline)
  scenery += `<ellipse class="tree-skeleton-crown" cx="${cx}" cy="95" rx="240" ry="88" />`;
  // Ghost trunk shaft
  scenery += `<path class="tree-skeleton-trunk" d="
    M ${cx - 16} ${trunkBotY}
    Q ${cx - 11} ${(trunkBotY + trunkTopY) / 2} ${cx - 9} ${trunkTopY}
    L ${cx + 9} ${trunkTopY}
    Q ${cx + 11} ${(trunkBotY + trunkTopY) / 2} ${cx + 16} ${trunkBotY}
    Z" />`;
  scenery += `<ellipse class="tree-ground" cx="${cx}" cy="${groundY}" rx="130" ry="18" />`;
  scenery += `<text class="tree-ground-label" x="${cx}" y="${groundY + 28}" text-anchor="middle">Tree fills as you complete units</text>`;

  // --- Branches (leaf units): strength from progress ---
  let regions = "";
  const leafKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "leaf");
  const trunkKids = nodes.filter((n) => n.parent === "trunk" && n.kind === "trunk");

  for (const n of leafKids) {
    const p = positions.get(n.id);
    if (!p) continue;
    const prog = nodeProgressState(n.id, { isLive: n.status === "live" });
    const paint = regionPaint(prog, n.status === "live");
    const from = { x: cx, y: trunkTopY + 4 };
    const sway = (p.x - cx) * 0.12;
    const sel = STATE.selectedId === n.id ? " is-selected" : "";
    regions += `<path class="tree-branch fill-${paint.state}${sel}" d="${branchPath(from, p, sway)}" style="opacity:${paint.branchOp}" />`;
  }

  // --- Trunk bands (frame units) ---
  for (const n of trunkKids) {
    const p = positions.get(n.id);
    if (!p) continue;
    const prog = nodeProgressState(n.id, { isLive: n.status === "live" });
    const paint = regionPaint(prog, n.status === "live");
    const sel = STATE.selectedId === n.id ? " is-selected" : "";
    const halfW = 15;
    const y1 = p.yTop;
    const y2 = p.yBot;
    // Slight taper: wider at bottom of whole tree
    const taper = 1 + ((p.y - trunkTopY) / (trunkBotY - trunkTopY)) * 0.15;
    const w = halfW * taper;
    regions += `
      <g class="node-hit" data-id="${n.id}">
        <rect class="tree-band fill-${paint.state}${sel}"
          x="${(cx - w).toFixed(1)}" y="${y1.toFixed(1)}"
          width="${(w * 2).toFixed(1)}" height="${Math.max(2, y2 - y1).toFixed(1)}"
          rx="3" style="opacity:${paint.fillOp}" />
        <rect class="tree-band-stroke fill-${paint.state}${sel}"
          x="${(cx - w).toFixed(1)}" y="${y1.toFixed(1)}"
          width="${(w * 2).toFixed(1)}" height="${Math.max(2, y2 - y1).toFixed(1)}"
          rx="3" style="opacity:${paint.strokeOp}" />
        <text class="tree-label-quiet" x="${(cx + p.labelSide * (w + 8)).toFixed(1)}" y="${(p.y + 3).toFixed(1)}"
          text-anchor="${p.labelSide < 0 ? "end" : "start"}">${escapeXml(treeLabel(n))}</text>
      </g>`;
  }

  // --- Canopy leaf shapes ---
  for (const n of leafKids) {
    const p = positions.get(n.id);
    if (!p) continue;
    const prog = nodeProgressState(n.id, { isLive: n.status === "live" });
    const paint = regionPaint(prog, n.status === "live");
    const sel = STATE.selectedId === n.id ? " is-selected" : "";
    // Leaf points outward from crown centre
    const ang = Math.atan2(p.y - 90, p.x - cx) + Math.PI / 2;
    const d = leafShapePath(p.x, p.y, p.size || 26, ang);
    const labelY = p.y + (p.size || 26) * 0.75 + 10;
    regions += `
      <g class="node-hit" data-id="${n.id}">
        <path class="tree-leaf fill-${paint.state}${sel}" d="${d}" style="opacity:${paint.fillOp}" />
        <path class="tree-leaf-stroke fill-${paint.state}${sel}" d="${d}" style="opacity:${paint.strokeOp}" />
        <text class="tree-label-quiet" x="${p.x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle">${escapeXml(treeLabel(n))}</text>
      </g>`;
  }

  // Craft — quiet side mark only
  const craft = nodes.filter((n) => n.kind === "craft");
  for (const n of craft) {
    const p = positions.get(n.id);
    if (!p) continue;
    const sel = STATE.selectedId === n.id ? " is-selected" : "";
    regions += `
      <g class="node-hit" data-id="${n.id}">
        <circle class="tree-craft${sel}" cx="${p.x}" cy="${p.y}" r="8" />
        <text class="tree-label-quiet" x="${p.x}" y="${p.y + 20}" text-anchor="middle">${escapeXml(treeLabel(n))}</text>
      </g>`;
  }

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = scenery + regions;

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
    el.innerHTML = `<p class="detail-empty">Click a <strong>trunk band</strong> or <strong>canopy leaf</strong> on the tree. Filled regions = progress; labels are names only.</p>`;
    return;
  }

  const badge = node.status || "planned";
  const prog = nodeProgressState(node.id, { isLive: node.status === "live" });
  const progText = progressLabel(prog);
  const progBadge = progText
    ? `<span class="badge prog-${prog}" style="margin-left:0.35rem">${escapeXml(progText)}</span>`
    : "";
  const rev = getNodeReview(node.id);
  let scheduleLine = "";
  if (prog === "fruit" || rev.nextDueAt) {
    const bits = [];
    if (rev.successfulReps >= MASTERY_REPS) bits.push("Mastered");
    else if (rev.successfulReps >= 1) bits.push(`Remembered · ${rev.successfulReps}×`);
    else bits.push("Learned · not reviewed yet");
    if (rev.nextDueAt) bits.push(formatDueLabel(rev.nextDueAt));
    scheduleLine = `<p class="detail-schedule">${escapeXml(bits.join(" · "))}</p>`;
  }

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
    ${scheduleLine}
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

function refreshMap() {
  showMap();
  renderRail();
  renderTodayCard();
  renderTree();
  renderGateCard();
  const node = STATE.tree.nodes.find((n) => n.id === STATE.selectedId);
  renderDetail(node || null);
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
    onExit: () => refreshMap(),
  });
}

async function openReviewQueue(dueList) {
  const units =
    dueList ||
    getDueUnits(STATE.tree.nodes, { level: STATE.level, limit: 8 });
  showPractice();
  const root = document.getElementById("practice-root");
  startReviewQueue(root, {
    units: units.map((u) => ({ nodeId: u.nodeId, label: u.label })),
    loadPack: async (nodeId) => {
      const node = STATE.tree.nodes.find((n) => n.id === nodeId);
      if (!node || !node.content) return null;
      return loadJson(`./data/${node.content}`);
    },
    onExit: () => refreshMap(),
    onDone: () => refreshMap(),
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
    onExit: () => refreshMap(),
    onDone: (opts) => {
      if (opts && opts.goLevel === "A2" && isLevelUnlocked("A2")) {
        STATE.level = "A2";
        STATE.selectedId = null;
      }
      refreshMap();
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
    renderTodayCard();
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
    // Exp / content-writing trees open A2–B2 without gate (student story still uses gate on stable)
    if (STATE.tree.author_open && !isAuthorUnlock()) {
      setAuthorUnlock(true);
    }
    // Fruit units from older sessions get staggered first-review dates
    migrateLearnedNodes(STATE.tree.nodes);
    // Author smoke: ?review=due marks all scheduled units due now
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("review") === "due") forceAllDue();
    } catch {
      /* ignore */
    }
    wireUtilBar();
    renderRail();
    renderTodayCard();
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
