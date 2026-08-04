/**
 * RUE3 Vocab v0.2 — level rail + tree + practice + honest progress
 * Visual sibling of https://pernath1200.github.io/rue2-grok/
 */

import { startPractice } from "./practice.js";
import { startA1Gate, startA2Gate } from "./gate.js";
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
  isStudentView,
  setAuthorUnlock,
  getUnlockedList,
  getGate,
  hasPassedGate,
  setLastView,
  getLastView,
  getStorageStatus,
  countTouchedBlocks,
} from "./progress.js";
import {
  mountSmokeFlagsUI,
  getSmokeApi,
  updateFlagsBadge,
} from "./smoke-flags.js";
import {
  deriveStudentTreeState,
  getHouse,
  nodesForHouse,
  trunkNodesForLevel,
  primaryNodeForHouse,
  A1_NEAR_STEM,
} from "./treeState.js";
import { renderTreeSvg } from "./treeView.js";
import {
  getInsightsToggles,
  setInsightToggle,
  loadEtymology,
  etymologyRowsForItems,
  renderEtymologyPanelHtml,
} from "./insights.js";

const STATE = {
  level: "A1",
  tree: null,
  selectedId: null,
  /** @type {string|null} 12-house selection */
  selectedHouseId: null,
  /** Trunk (core frames) selected on tree */
  selectedTrunk: false,
  view: "map", // map | practice
  pack: null,
  homePanel: null, // null | "topics" | "review"
};

/** Persist map place so refresh does not look like a wipe (especially A2 → A1 default). */
function rememberView() {
  setLastView(STATE.level, STATE.selectedId);
}

function storageWarningHtml() {
  const st = getStorageStatus();
  if (st.ok) return "";
  return (
    `<strong>Progress not saving.</strong> This browser blocked localStorage (${escapeXml(st.error || "unknown")}). ` +
    `Use a normal (non-private) window at one fixed URL — e.g. always <code>http://localhost:8091/</code>, not file:// or 127.0.0.1 mixed with localhost.`
  );
}

/** Bump when content/grading changes so smoke reloads are not stuck on stale JSON. */
const DATA_CACHE_BUST = "20260720j";

async function loadJson(path) {
  const join = path.includes("?") ? "&" : "?";
  const res = await fetch(`${path}${join}v=${DATA_CACHE_BUST}`, { cache: "no-cache" });
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
  if (level === "C1" || level === "C2") return "preview";
  return "locked";
}

function renderRail() {
  const rail = document.getElementById("level-rail");
  const levels = STATE.tree?.levels || ["A1", "A2", "B1", "B2", "C1", "C2"];

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
      // Keep clickable — author unlock opens level (C1/C2 = tree-size preview)
      btn.innerHTML = `${lv}<span class="tag">${lockTag(lv)}</span>`;
      btn.disabled = false;
      btn.title =
        lv === "C1" || lv === "C2"
          ? "Tree preview (author unlock) — little content yet"
          : "Click to open author unlock (or pass the previous level check)";
      btn.addEventListener("click", () => {
          setAuthorUnlock(true);
          const au = document.getElementById("btn-author-unlock");
          if (au) {
            au.textContent = "Author unlock: on";
            au.setAttribute("aria-pressed", "true");
          }
          STATE.level = lv;
          STATE.selectedId = null;
          STATE.selectedHouseId = null;
          STATE.selectedTrunk = true;
          const trunks = trunkNodesForLevel(STATE.tree?.nodes || [], lv);
          STATE.selectedId = trunks[0]?.id || null;
          rememberView();
          renderRail();
          renderTree();
          renderHomeChrome();
          renderSelectionDetail();
        });
    } else {
      btn.setAttribute("aria-pressed", lv === STATE.level ? "true" : "false");
      btn.textContent = lv;
      btn.addEventListener("click", () => {
        STATE.level = lv;
        STATE.selectedId = null;
        STATE.selectedHouseId = null;
        STATE.selectedTrunk = true;
        const trunks = trunkNodesForLevel(STATE.tree?.nodes || [], lv);
        STATE.selectedId = trunks[0]?.id || null;
        rememberView();
        renderRail();
        renderTree();
        renderHomeChrome();
        renderSelectionDetail();
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
      ? `<p class="today-empty">Nothing due — nice. Learn something new on the tree (Word on leaves · Sentence on trunk) to schedule reviews.</p>`
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
      if (id) openUnitIntoPractice(id);
    });
  });

  const startBtn = el.querySelector("#btn-start-reviews");
  if (startBtn) startBtn.addEventListener("click", () => openReviewQueue(due));

  const coverBtn = el.querySelector("#btn-cover-next");
  if (coverBtn && next) {
    coverBtn.addEventListener("click", () => openUnitIntoPractice(next.nodeId));
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
  // Gate unlocks the next band from the current level (A1→A2, A2→B1)
  if (STATE.level !== "A1" && STATE.level !== "A2") {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const from = STATE.level;
  const next = from === "A1" ? "A2" : "B1";
  const passPct = from === "A1" ? 80 : 90;
  const g = getGate(from);
  const passed = hasPassedGate(from) || isLevelUnlocked(next);
  const status = passed
    ? g && g.score != null
      ? `Passed · last score ${g.score}/${g.total}`
      : `${next} unlocked`
    : g
      ? `Not passed yet · last ${g.score}/${g.total} · tries ${g.attempts || 0}`
      : `Not attempted yet · pass unlocks ${next}`;

  const poolNote =
    from === "A2"
      ? " · themed A2 + 3 trunk (Codex-tagged; bulk dumps out)"
      : "";

  el.innerHTML = `
    <h2>${from} level check</h2>
    <p class="tree-legend">Thin gate: 12 Quiz · 12 Word · 6 frame sentences · ${passPct}% to pass · unlimited retries${poolNote}</p>
    <p class="gate-status">${escapeXml(status)}</p>
    <button type="button" class="block-btn" id="btn-level-gate">
      <span class="block-btn-title">${passed ? `Retake ${from} check` : `Start ${from} check →`}</span>
      <span class="block-btn-n">${passed ? "optional" : `unlock ${next}`}</span>
    </button>
  `;
  const btn = el.querySelector("#btn-level-gate");
  if (btn) {
    btn.addEventListener("click", () =>
      from === "A1" ? openA1Gate() : openA2Gate(),
    );
  }
}

function renderAuthorHint() {
  const el = document.getElementById("author-hint");
  if (!el) return;
  const bits = [];
  if (isAuthorUnlock()) {
    bits.push(
      "Author unlock on · A2–B2 open for writing · ?unlock=all sticky in this browser",
    );
  }
  const storageWarn = storageWarningHtml();
  if (storageWarn) bits.push(storageWarn);
  if (!bits.length) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.innerHTML = bits.join("<br>");
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Short labels for lists / today card. */
function treeLabel(node) {
  if (!node) return "";
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
    leaf_body_a1: "Body",
    leaf_health_a1: "Health",
    leaf_clothes_a1: "Clothes",
    trunk_recycle_a2: "Recycle",
    trunk_lexis_a2: "A2 lexis",
    trunk_chunks_a2: "Chunks",
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
    leaf_ideas_a2: "List · abstract",
    leaf_society_a2: "Society",
    leaf_media_a2: "Media",
    leaf_describing_a2: "List · adj",
    leaf_adverbs_a2: "Adverbs",
    leaf_verbs_a2: "List · verbs",
    leaf_misc_a2: "List · general",
    trunk_core_b1: "B1 frames",
    trunk_chunks_b1: "Collocations",
    trunk_abstract_b1: "Abstract",
    leaf_work_b1: "Work",
    leaf_money_b1: "Money",
    leaf_communication_b1: "Talk",
    leaf_knowledge_b1: "Travel",
    leaf_self_b1: "Self",
    leaf_home_b1: "Home",
  };
  return short[node.id] || node.label;
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
        <div class="meter-track" role="progressbar" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${n}" aria-label="${kind} ${n} of ${t} (${p}%)">
          <div class="meter-fill" style="width:${p}%"></div>
        </div>
        <div class="meter-count">${n}/${t} · ${p}%</div>
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
      <strong>Learned</strong> = fruit (Word on leaves · Sentence on trunk).
      <strong>Remembered</strong> = at least one spaced review.
      <strong>Mastered</strong> = ${MASTERY_REPS} successful reviews.
      Use <strong>Today</strong> above for due topics.
    </p>`;
}

function currentTreeState() {
  return deriveStudentTreeState(
    STATE.tree?.nodes || [],
    STATE.level,
    nodeProgressState,
  );
}

function selectHouse(houseId) {
  STATE.selectedHouseId = houseId;
  STATE.selectedTrunk = false;
  const primary = primaryNodeForHouse(
    houseId,
    STATE.tree.nodes,
    STATE.level,
    nodeProgressState,
  );
  STATE.selectedId = primary ? primary.id : null;
  rememberView();
  renderTree();
  renderSelectionDetail();
}

function selectTrunk() {
  STATE.selectedTrunk = true;
  STATE.selectedHouseId = null;
  const trunks = trunkNodesForLevel(STATE.tree.nodes, STATE.level);
  const open = trunks.find(
    (n) => nodeProgressState(n.id, { isLive: true }) !== "fruit",
  );
  STATE.selectedId = (open || trunks[0] || {}).id || null;
  rememberView();
  renderTree();
  renderSelectionDetail();
}

function renderTree() {
  const nodes = nodesForLevel(STATE.level);
  const svg = document.getElementById("tree-svg");
  const caption = document.getElementById("tree-caption");
  const treeState = currentTreeState();
  const dueN = getDueUnits(STATE.tree?.nodes || [], { level: STATE.level }).length;
  const unlocked = getUnlockedList().join(" · ");

  const built = renderTreeSvg(svg, treeState, {
    selectedHouseId: STATE.selectedHouseId,
    selectedTrunk: STATE.selectedTrunk,
    onSelectHouse: (id) => selectHouse(id),
    onSelectTrunk: () => selectTrunk(),
  });

  if (caption && built) {
    caption.textContent = `${built.caption}${dueN ? ` · due ${dueN}` : ""} · unlock: ${unlocked}`;
  }
  renderLevelMeters(STATE.level, nodes);
}

/** Detail panel: trunk list, house multi-pack, or single node. */
function renderSelectionDetail() {
  const el = document.getElementById("node-detail");
  if (!el) return;

  if (STATE.selectedTrunk) {
    renderTrunkDetail(el);
    return;
  }
  if (STATE.selectedHouseId) {
    renderHouseDetail(el, STATE.selectedHouseId);
    return;
  }
  if (STATE.selectedId) {
    const node = STATE.tree.nodes.find((n) => n.id === STATE.selectedId);
    renderNodeDetail(el, node || null);
    return;
  }
  el.innerHTML = `<p class="detail-empty">Click the <strong>trunk</strong> for core frames, or a <strong>house</strong> branch for domain leaves. Near-stem houses grow first; dim stubs open later.</p>`;
}

function renderDetail(node) {
  // Back-compat for callers that pass a node (today card, etc.)
  if (node && node.kind === "trunk") {
    STATE.selectedTrunk = true;
    STATE.selectedHouseId = null;
    STATE.selectedId = node.id;
  } else if (node && node.kind === "leaf") {
    STATE.selectedTrunk = false;
    STATE.selectedId = node.id;
    const ts = currentTreeState();
    const b = ts.branches.find((br) => br.mappedNodeIds.includes(node.id));
    STATE.selectedHouseId = b ? b.id : null;
  } else if (!node) {
    STATE.selectedId = null;
    STATE.selectedHouseId = null;
    STATE.selectedTrunk = false;
  }
  renderTree();
  renderSelectionDetail();
}

function unitRowHtml(node) {
  const live = node.status === "live";
  const prog = nodeProgressState(node.id, { isLive: live });
  const progText = live
    ? progressLabel(prog) || "not started"
    : node.status === "planned"
      ? "planned · no pack yet"
      : node.status || "—";
  return `
    <button type="button" class="block-btn unit-pick" data-node="${escapeXml(node.id)}">
      <span class="block-btn-title">${escapeXml(node.label)}</span>
      <span class="block-btn-n">${escapeXml(treeLabel(node))} · ${escapeXml(progText)}</span>
    </button>`;
}

function renderTrunkDetail(el) {
  const trunks = trunkNodesForLevel(STATE.tree.nodes, STATE.level);
  const ts = currentTreeState();
  const liveN = trunks.filter((n) => n.status === "live").length;
  const planN = trunks.filter((n) => n.status === "planned").length;
  el.innerHTML = `
    <div style="margin-bottom:0.65rem">
      <strong style="font-size:1.05rem">Trunk · core frames</strong>
      <span class="badge live" style="margin-left:0.5rem">${liveN ? "live" : "scaffold"}</span>
    </div>
    <p class="detail-schedule">Trunk width <strong>${ts.trunkWidth}</strong> · fruit ${ts.trunkFruitN}/${ts.trunkTotal} live frame units${
      planN ? ` · <strong>${planN}</strong> planned` : ""
    }</p>
    <p class="detail-hint">High-frequency frames &amp; glue — Match → Quiz → Word → Sentence</p>
    <div class="rail-label" style="margin-top:0.85rem">Frame units (${STATE.level})</div>
    <div class="block-btns" id="trunk-unit-list">
      ${trunks.map(unitRowHtml).join("") || `<p class="detail-empty">No trunk units at ${escapeXml(STATE.level)}</p>`}
    </div>
    <div class="block-list" id="block-list"></div>
  `;
  el.querySelectorAll(".unit-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-node");
      const node = STATE.tree.nodes.find((n) => n.id === id);
      if (!node) return;
      STATE.selectedId = id;
      loadAndShowBlocks(node);
    });
  });
  if (STATE.selectedId) {
    const node = trunks.find((n) => n.id === STATE.selectedId) || trunks[0];
    if (node) loadAndShowBlocks(node);
  } else if (trunks[0]) {
    STATE.selectedId = trunks[0].id;
    loadAndShowBlocks(trunks[0]);
  }
}

function renderHouseDetail(el, houseId) {
  const house = getHouse(houseId);
  const leaves = nodesForHouse(houseId, STATE.tree.nodes, STATE.level);
  const ts = currentTreeState();
  const br = ts.branches.find((b) => b.id === houseId);
  const unlocked = br ? br.unlocked : A1_NEAR_STEM.has(houseId);
  const author = isAuthorUnlock();

  if (!unlocked && !author) {
    el.innerHTML = `
      <div style="margin-bottom:0.65rem">
        <strong style="font-size:1.05rem">${escapeXml(house?.name || houseId)}</strong>
        <span class="badge" style="margin-left:0.5rem">stub</span>
      </div>
      <p class="detail-empty">This house is a short stub at ${escapeXml(STATE.level)}. Near-stem houses grow first; this branch opens as your level and trunk thicken.</p>
      <p class="detail-hint">Author unlock can open all packs for writing.</p>
    `;
    return;
  }

  const stubNote =
    !unlocked && author
      ? `<p class="detail-schedule">Stub house · <strong>author</strong> can still open packs</p>`
      : `<p class="detail-schedule">Length ${br?.length ?? "—"} · leaf density ${br?.leafDensity ?? 0} · fruit ${br?.fruitN ?? 0}/${br?.unitCount ?? 0}</p>`;

  el.innerHTML = `
    <div style="margin-bottom:0.65rem">
      <strong style="font-size:1.05rem">${escapeXml(house?.name || houseId)}</strong>
      <span class="badge live" style="margin-left:0.5rem">${unlocked ? "near-stem" : "author"}</span>
    </div>
    ${stubNote}
    <div class="rail-label" style="margin-top:0.85rem">Domain units</div>
    <div class="block-btns" id="house-unit-list">
      ${
        leaves.length
          ? leaves.map(unitRowHtml).join("")
          : `<p class="detail-empty">No live leaf packs mapped here at ${escapeXml(STATE.level)}.</p>`
      }
    </div>
    <div class="block-list" id="block-list"></div>
  `;
  el.querySelectorAll(".unit-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-node");
      const node = STATE.tree.nodes.find((n) => n.id === id);
      if (!node) return;
      STATE.selectedId = id;
      loadAndShowBlocks(node).then(() => maybeRenderInsightsForHouse(houseId));
    });
  });
  // Always reserve insights slot at house level; fill from ALL units in house
  const ensureSlot = async () => {
    if (STATE.selectedId && leaves.some((n) => n.id === STATE.selectedId)) {
      await loadAndShowBlocks(leaves.find((n) => n.id === STATE.selectedId));
    } else if (leaves[0]) {
      STATE.selectedId = leaves[0].id;
      await loadAndShowBlocks(leaves[0]);
    }
    // Re-scan whole house so insights are not empty when first unit is Clothes etc.
    await maybeRenderInsightsForHouse(houseId);
  };
  ensureSlot();
}

function renderNodeDetail(el, node) {
  if (!node) {
    el.innerHTML = `<p class="detail-empty">Click the <strong>trunk</strong> or a <strong>house</strong> on the tree.</p>`;
    return;
  }
  const badge = node.status || "planned";
  const listBadge = node.list
    ? `<span class="badge list" style="margin-left:0.35rem">word list</span>`
    : "";
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
  el.innerHTML = `
    <div style="margin-bottom:0.65rem">
      <strong style="font-size:1.05rem">${escapeXml(node.label)}</strong>
      <span class="badge ${badge}" style="margin-left:0.5rem">${escapeXml(badge)}</span>
      ${listBadge}
      ${progBadge}
    </div>
    ${scheduleLine}
    <dl class="detail">
      <dt>id</dt><dd><code>${escapeXml(node.id)}</code></dd>
      <dt>kind</dt><dd>${escapeXml(node.kind)}</dd>
      <dt>note</dt><dd>${escapeXml(node.note || "—")}</dd>
    </dl>
    <div class="block-list" id="block-list">
      ${node.status === "live" && node.content ? `<p class="detail-loading">Loading blocks…</p>` : ""}
    </div>
  `;
  if (node.status === "live" && node.content) loadAndShowBlocks(node);
}

function blockStatusLine(blockId) {
  const p = getBlockProgress(blockId);
  if (!p || !p.touchedAt) return "not started";
  const modes = p.modes || {};
  const done = ["match", "quiz", "type", "sentence"].filter((m) => modes[m]);
  if (p.sentenceDone) return `fruit · ${done.join(" · ") || "sentence"}`;
  if (done.length) return `touched · ${done.join(" · ")}`;
  return "touched";
}

async function loadAndShowBlocks(node) {
  const listEl = document.getElementById("block-list");
  if (!listEl) return;
  if (!node || node.status !== "live" || !node.content) {
    STATE.pack = null;
    const codex = node?.codex_unit
      ? `<code>${escapeXml(node.codex_unit)}</code>`
      : "—";
    listEl.innerHTML = `
      <div class="rail-label" style="margin-top:0.85rem">Scaffold</div>
      <p class="detail-empty">
        <strong>${escapeXml(node?.label || "Unit")}</strong> is
        <span class="badge">${escapeXml(node?.status || "planned")}</span>
        — no practice pack yet.
      </p>
      <p class="detail-hint">Codex ${codex}. Author content next; then set status to <code>live</code> and add <code>content</code>.</p>
      ${node?.note ? `<p class="detail-schedule">${escapeXml(node.note)}</p>` : ""}
    `;
    const slot = document.getElementById("insights-slot");
    if (slot) slot.innerHTML = "";
    return;
  }
  try {
    const pack = await loadJson(`./data/${node.content}`);
    STATE.pack = pack;
    // First block without fruit = the one Today wants you to open next
    const suggestId =
      (pack.blocks || []).find((b) => {
        const p = getBlockProgress(b.id);
        return !p || !p.sentenceDone;
      })?.id || pack.blocks?.[0]?.id;
    listEl.innerHTML = `
      <div class="rail-label" style="margin-top:0.85rem">Practice blocks (small sets)</div>
      <div class="block-btns">
        ${pack.blocks
          .map((b) => {
            const st = blockStatusLine(b.id);
            const suggest = b.id === suggestId ? " block-btn-suggest" : "";
            return `<button type="button" class="block-btn${suggest}" data-block="${b.id}">
                <span class="block-btn-title">${escapeXml(b.title)}</span>
                <span class="block-btn-n">${b.items.length} ${pack.practice === "frames" ? "frames" : "words"} · ${escapeXml(st)}</span>
              </button>`;
          })
          .join("")}
      </div>
      <p class="detail-hint">Ladder: Match → Quiz → Word → Sentence · <strong>fruit</strong> = Word on leaves, Sentence on trunk · carriers only for leaf Sentence · CZ → EN · progress stays on this browser</p>
      <div id="insights-slot"></div>
    `;
    listEl.querySelectorAll(".block-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const block = pack.blocks.find((b) => b.id === btn.dataset.block);
        if (block)
          openPractice(
            { ...block, practice: pack.practice, level: pack.level || block.level },
            pack,
          );
      });
    });
    await maybeRenderInsightsForPack(pack);
  } catch (e) {
    listEl.innerHTML = `<p class="detail-empty" style="color:var(--wrong)">${escapeXml(e.message)}</p>`;
  }
}

/**
 * Lemmas for insights: leaf items + trunk seed_vocab + frame gap_answer
 * (frame en fields are full sentences, so seeds/gaps carry the word list).
 */
function collectInsightItems(pack) {
  const items = [];
  if (!pack) return items;
  if (Array.isArray(pack.seed_vocab)) {
    for (const s of pack.seed_vocab) items.push({ en: s });
  }
  for (const b of pack.blocks || []) {
    if (!Array.isArray(b.items)) continue;
    for (const it of b.items) {
      items.push(it);
      if (it && it.gap_answer) items.push({ en: it.gap_answer });
      if (it && Array.isArray(it.gap_accepts)) {
        for (const g of it.gap_accepts) items.push({ en: g });
      }
    }
  }
  return items;
}

/** Author + insight toggle: Word roots for lemmas. */
async function maybeRenderInsightsForPack(pack) {
  await renderInsightsFromItems(collectInsightItems(pack));
}

/**
 * Scan every live leaf pack in a house (Self & body = Body + Health + Clothes).
 * Fixes empty panel when the auto-opened unit has no curated lemmas.
 */
async function maybeRenderInsightsForHouse(houseId) {
  const leaves = nodesForHouse(houseId, STATE.tree?.nodes || [], STATE.level);
  const items = [];
  for (const node of leaves) {
    if (!node.content) continue;
    try {
      const pack = await loadJson(`./data/${node.content}`);
      items.push(...collectInsightItems(pack));
    } catch {
      /* skip missing pack */
    }
  }
  await renderInsightsFromItems(items);
}

async function renderInsightsFromItems(items) {
  const slot = document.getElementById("insights-slot");
  if (!slot) return;
  slot.innerHTML = "";
  if (!isAuthorUnlock()) return;
  const toggles = getInsightsToggles();
  const parts = [];
  if (toggles.pie) {
    const data = await loadEtymology(loadJson);
    const rows = etymologyRowsForItems(items, data);
    parts.push(renderEtymologyPanelHtml(rows, { escapeHtml: escapeXml }));
  }
  slot.innerHTML = parts.join("");
}

function refreshInsightsPanel() {
  if (STATE.selectedHouseId) maybeRenderInsightsForHouse(STATE.selectedHouseId);
  else if (STATE.pack) maybeRenderInsightsForPack(STATE.pack);
}

function refreshMap() {
  showMap();
  renderRail();
  renderHomeChrome();
  if (STATE.homePanel === "review") renderHomeReviewBody();
  renderTree();
  renderGateCard();
  renderSelectionDetail();
  updateFlagsBadge();
}

function openPractice(block, pack) {
  showPractice();
  const root = document.getElementById("practice-root");
  const blockId = block.id;
  const nodeId = pack?.tree_node || STATE.selectedId;
  if (nodeId) {
    STATE.selectedId = nodeId;
    rememberView();
  }
  startPractice(root, block, {
    practice: pack?.practice,
    treeNode: nodeId,
    packId: pack?.id || pack?.tree_node || nodeId,
    packTitle: pack?.title || block.title,
    level: pack?.level || block.level || STATE.level,
    onTouch: () => {
      touchBlock(blockId, nodeId);
    },
    onModeComplete: (mode, meta) => {
      completeMode(blockId, mode, {
        nodeId,
        score: meta.score,
        total: meta.total,
        perfect: meta.perfect,
        awardFruit: meta.awardFruit,
      });
      rememberView();
    },
    onExit: () => refreshMap(),
  });
}

/**
 * Today primary CTA (rue2-style): select unit → load practice blocks → scroll
 * down to the exercise row. User clicks the block to open (not auto-start).
 */
async function openUnitIntoPractice(nodeId) {
  const node = (STATE.tree?.nodes || []).find((n) => n.id === nodeId);
  if (!node) return;
  renderDetail(node);
  rememberView();

  if (node.status === "live" && node.content) {
    try {
      await loadAndShowBlocks(node);
    } catch (e) {
      console.warn("[rue3] openUnitIntoPractice load", e);
    }
  }

  // Mark the unit row in trunk/house lists
  document.querySelectorAll(".unit-pick").forEach((btn) => {
    const on = btn.getAttribute("data-node") === nodeId;
    btn.classList.toggle("unit-pick-active", on);
    if (on) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });

  // Prefer the practice-block row; fall back to whole Practice card
  const blockList = document.getElementById("block-list");
  const suggested =
    blockList?.querySelector(".block-btn.block-btn-suggest") ||
    blockList?.querySelector(".block-btn");
  const target = suggested || blockList || document.getElementById("node-detail");
  if (suggested) {
    suggested.classList.add("block-btn-pulse");
    // brief pulse then leave the steady "suggest" ring
    setTimeout(() => suggested.classList.remove("block-btn-pulse"), 1200);
  }
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  // Word-list nodes are excluded from gate pools — the level check samples
  // only themed leaves + trunk frames (matters from A2 up; A1 has none)
  const a1Live = STATE.tree.nodes.filter(
    (n) => n.status === "live" && n.content && n.levels.includes("A1") && !n.list,
  );
  startA1Gate(root, {
    loadJson,
    a1LiveNodes: a1Live,
    onExit: () => refreshMap(),
    onDone: (opts) => {
      if (opts && opts.goLevel === "A2" && isLevelUnlocked("A2")) {
        STATE.level = "A2";
        STATE.selectedId = null;
        rememberView();
      }
      refreshMap();
    },
  });
}

function openA2Gate() {
  showPractice();
  const root = document.getElementById("practice-root");
  // Word-list nodes excluded — the level check samples themed leaves + trunk only
  const a2Live = STATE.tree.nodes.filter(
    (n) => n.status === "live" && n.content && n.levels.includes("A2") && !n.list,
  );
  startA2Gate(root, {
    loadJson,
    a2LiveNodes: a2Live,
    onExit: () => refreshMap(),
    onDone: (opts) => {
      if (opts && opts.goLevel === "B1" && isLevelUnlocked("B1")) {
        STATE.level = "B1";
        STATE.selectedId = null;
        rememberView();
      }
      refreshMap();
    },
  });
}

function wireUtilBar() {
  const btn = document.getElementById("btn-author-unlock");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = !isAuthorUnlock();
      setAuthorUnlock(next);
      renderRail();
      renderTodayCard();
      renderTree();
      btn.textContent = next ? "Author unlock: on" : "Author unlock";
      btn.setAttribute("aria-pressed", next ? "true" : "false");
      syncInsightsToggleVisibility();
      refreshInsightsPanel();
    });
    if (isAuthorUnlock()) {
      btn.textContent = "Author unlock: on";
      btn.setAttribute("aria-pressed", "true");
    }
  }
  const host = document.getElementById("smoke-flags-host");
  if (host) mountSmokeFlagsUI(host);
  const flagsBtn = document.getElementById("btn-smoke-flags");
  if (flagsBtn && !flagsBtn.dataset.wired) {
    flagsBtn.dataset.wired = "1";
    flagsBtn.addEventListener("click", () => {
      getSmokeApi()?.openList();
    });
  }
  updateFlagsBadge();
  wireInsightsToggles();
  syncInsightsToggleVisibility();
}

function wireInsightsToggles() {
  const btnR = document.getElementById("btn-word-roots");
  if (btnR && !btnR.dataset.wired) {
    btnR.dataset.wired = "1";
    const t = getInsightsToggles();
    btnR.setAttribute("aria-pressed", t.pie ? "true" : "false");
    btnR.textContent = t.pie ? "Word roots: on" : "Word roots";
    btnR.addEventListener("click", () => {
      const cur = getInsightsToggles().pie;
      const next = setInsightToggle("pie", !cur);
      btnR.setAttribute("aria-pressed", next.pie ? "true" : "false");
      btnR.textContent = next.pie ? "Word roots: on" : "Word roots";
      refreshInsightsPanel();
    });
  }
}

function syncInsightsToggleVisibility() {
  const author = isAuthorUnlock();
  const btn = document.getElementById("btn-word-roots");
  if (btn) btn.hidden = !author;
}

/* —— Home chrome (Do next · Review · Topics · How to use) —— */
const HOWTO_KEY = "rue3-howto-seen";

function renderHomeChrome() {
  const line = document.getElementById("home-next-line");
  const utilLv = document.getElementById("util-level-label");
  if (utilLv) utilLv.textContent = STATE.level;
  if (!STATE.tree) return;

  const due = getDueUnits(STATE.tree.nodes, { level: STATE.level, limit: 20 });
  const next = suggestNextUnit(STATE.tree.nodes, STATE.level);
  const live = liveUnitsForLevel(STATE.level);
  const learned = live.filter(
    (n) => nodeProgressState(n.id, { isLive: true }) === "fruit",
  ).length;

  if (line) {
    if (due.length) {
      line.innerHTML = `Next: <strong>Review</strong> · ${due.length} due · or learn something new`;
    } else if (next) {
      const verb = next.state === "partial" ? "Continue" : "Start";
      line.innerHTML = `Next: <strong>${escapeXml(next.label)}</strong> · ${escapeXml(verb)}`;
    } else {
      line.textContent = "Path busy — pick Topics or Review.";
    }
  }

  const revHint = document.getElementById("home-review-hint");
  if (revHint) {
    revHint.hidden = false;
    revHint.textContent = due.length
      ? `${due.length} topic${due.length === 1 ? "" : "s"} due for review.`
      : "Nothing due for review right now.";
  }

  const progMeta = document.getElementById("progress-summary-meta");
  if (progMeta && live.length) {
    const pct = Math.round((100 * learned) / live.length);
    progMeta.textContent = `· ${pct}% learned on ${STATE.level}`;
  }

  const topics = document.getElementById("panel-topics");
  const review = document.getElementById("review-card");
  if (topics) topics.hidden = STATE.homePanel !== "topics";
  if (review) review.hidden = STATE.homePanel !== "review";
}

function renderHomeReviewBody() {
  const body = document.getElementById("review-body");
  if (!body || !STATE.tree) return;
  const due = getDueUnits(STATE.tree.nodes, { level: STATE.level, limit: 12 });
  if (!due.length) {
    body.innerHTML = `<p class="home-hint">Nothing due today. Press Do next, or Topics.</p>`;
    return;
  }
  body.innerHTML = `
    <p class="home-hint"><strong>${due.length}</strong> due · open one or start the queue</p>
    <div class="today-actions" style="margin-bottom:0.65rem">
      <button type="button" class="home-btn home-btn-primary" id="btn-start-reviews-home">Start reviews</button>
    </div>
    <ul class="today-list">
      ${due
        .slice(0, 8)
        .map(
          (u) =>
            `<li><button type="button" class="today-link" data-select="${escapeXml(u.nodeId)}">${escapeXml(u.label)}</button></li>`,
        )
        .join("")}
    </ul>`;
  body.querySelector("#btn-start-reviews-home")?.addEventListener("click", () =>
    openReviewQueue(due),
  );
  body.querySelectorAll("[data-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-select");
      if (id) openUnitIntoPractice(id);
    });
  });
}

function showHowto() {
  const overlay = document.getElementById("howto-overlay");
  if (!overlay) return;
  overlay.hidden = false;
  const finish = (runNext) => {
    try {
      localStorage.setItem(HOWTO_KEY, "1");
    } catch {
      /* ignore */
    }
    overlay.hidden = true;
    if (runNext) void startDoNext();
  };
  const startBtn = document.getElementById("howto-start");
  const dismissBtn = document.getElementById("howto-dismiss");
  if (startBtn) startBtn.onclick = () => finish(true);
  if (dismissBtn) dismissBtn.onclick = () => finish(false);
}

async function startDoNext() {
  STATE.homePanel = null;
  renderHomeChrome();
  if (!STATE.tree) return;
  const due = getDueUnits(STATE.tree.nodes, { level: STATE.level, limit: 8 });
  // Prefer learning new if nothing due; if due, still Do next = cover next unit
  const next = suggestNextUnit(STATE.tree.nodes, STATE.level);
  if (next?.nodeId) {
    await openUnitIntoPractice(next.nodeId);
    return;
  }
  if (due.length) {
    openReviewQueue(due);
  }
}

function wireHomeActions() {
  const doNext = document.getElementById("btn-do-next");
  const btnReview = document.getElementById("btn-home-review");
  const btnTopics = document.getElementById("btn-home-topics");
  const btnHowto = document.getElementById("btn-how-to-use");
  if (doNext && !doNext.dataset.wired) {
    doNext.dataset.wired = "1";
    doNext.addEventListener("click", () => void startDoNext());
  }
  if (btnHowto && !btnHowto.dataset.wired) {
    btnHowto.dataset.wired = "1";
    btnHowto.addEventListener("click", () => showHowto());
  }
  if (btnReview && !btnReview.dataset.wired) {
    btnReview.dataset.wired = "1";
    btnReview.addEventListener("click", () => {
      STATE.homePanel = STATE.homePanel === "review" ? null : "review";
      renderHomeChrome();
      renderHomeReviewBody();
      document.getElementById("review-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
  if (btnTopics && !btnTopics.dataset.wired) {
    btnTopics.dataset.wired = "1";
    btnTopics.addEventListener("click", () => {
      STATE.homePanel = STATE.homePanel === "topics" ? null : "topics";
      renderHomeChrome();
      const det = document.getElementById("tree-details");
      if (det) det.open = true;
      document.getElementById("tree-details")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
}

async function init() {
  const err = document.getElementById("boot-error");
  try {
    // Author smoke sweep: ?smoke=all auto-plays every live block (no progress writes)
    if (new URLSearchParams(location.search).has("smoke")) {
      const { runSmoke } = await import("./smoke.js");
      await runSmoke();
      return;
    }
    loadProgress();
    // Sticky author unlock from ?unlock=all
    isAuthorUnlock();
    STATE.tree = await loadJson("./data/tree.json");
    // Exp / content-writing trees open A2–B2 without gate (student story still uses gate on stable)
    // ?student=1 suppresses this so the locked-level + gate path stays testable
    if (STATE.tree.author_open && !isAuthorUnlock() && !isStudentView()) {
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

    // Restore last map place (level + unit). Old bug: always landed on A1, so A2 work looked wiped.
    const last = getLastView();
    if (last.level && isLevelUnlocked(last.level)) {
      STATE.level = last.level;
    }
    if (last.nodeId) {
      const node = STATE.tree.nodes.find((n) => n.id === last.nodeId);
      if (node && Array.isArray(node.levels) && node.levels.includes(STATE.level)) {
        STATE.selectedId = node.id;
        if (node.kind === "trunk") {
          STATE.selectedTrunk = true;
          STATE.selectedHouseId = null;
        } else if (node.kind === "leaf") {
          STATE.selectedTrunk = false;
          const ts = deriveStudentTreeState(STATE.tree.nodes, STATE.level, nodeProgressState);
          const b = ts.branches.find((br) => br.mappedNodeIds.includes(node.id));
          STATE.selectedHouseId = b ? b.id : null;
        }
      }
    }
    if (!STATE.selectedId && !STATE.selectedTrunk && !STATE.selectedHouseId) {
      // Default: open trunk so frames are one click away
      STATE.selectedTrunk = true;
      const trunks = trunkNodesForLevel(STATE.tree.nodes, STATE.level);
      STATE.selectedId = trunks[0]?.id || null;
    }

    wireUtilBar();
    wireHomeActions();
    renderRail();
    renderHomeChrome();
    renderTree();
    renderSelectionDetail();

    // Smoke aid: confirm storage still has practice records after load
    try {
      const n = countTouchedBlocks();
      if (n > 0) {
        console.info(`[rue3 progress] restored ${n} touched block(s) · level ${STATE.level}`);
      }
    } catch {
      /* ignore */
    }
  } catch (e) {
    err.hidden = false;
    err.textContent = e.message || String(e);
  }
}

init();
