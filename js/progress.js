/**
 * RUE3 progress — local, honest, minimal.
 * Touched / mode complete / fruit per block; level unlocks; unit-level SRS schedule.
 * Storage is local to this browser. Corrupt data resets to defaults.
 */

const KEY = "rue3-v0.1-progress";
const AUTHOR_KEY = "rue3-v0.1-author-unlock";
/** C1/C2 stay locked for students; author unlock can open them for tree-size comparison. */
const FOREVER_LOCKED = new Set(["C1", "C2"]);
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Successful spaced reviews needed for "mastered" on a unit. */
export const MASTERY_REPS = 4;
/** Days until next review after a success at each step (then stay on last). */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];
/** Max units offered in one review queue. */
export const REVIEW_DAILY_CAP = 8;
/** Pass bar for a unit review session. */
export const REVIEW_PASS_RATIO = 0.8;
/** Stagger window (days) when migrating many fruit units at once. */
const MIGRATE_STAGGER_DAYS = 14;

function defaultData() {
  return {
    v: 1,
    unlocked: ["A1"],
    blocks: {},
    gates: {},
    /** Per tree-node review state (Phase 2 SRS). Optional on older saves. */
    nodes: {},
    /** Last map position so refresh does not dump you on A1 empty meters. */
    lastLevel: null,
    lastNodeId: null,
    updatedAt: null,
  };
}

function safeParse(raw) {
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return defaultData();
    if (d.v !== 1) return defaultData();
    if (!Array.isArray(d.unlocked)) d.unlocked = ["A1"];
    if (!d.blocks || typeof d.blocks !== "object") d.blocks = {};
    if (!d.gates || typeof d.gates !== "object") d.gates = {};
    if (!d.nodes || typeof d.nodes !== "object") d.nodes = {};
    if (!d.unlocked.includes("A1")) d.unlocked = ["A1", ...d.unlocked];
    if (d.lastLevel != null && typeof d.lastLevel !== "string") d.lastLevel = null;
    if (d.lastNodeId != null && typeof d.lastNodeId !== "string") d.lastNodeId = null;
    return d;
  } catch {
    return defaultData();
  }
}

let cache = null;
/** False only when localStorage is missing or writes fail (private mode / blocked). */
let storageOk = true;
let storageError = null;

export function getStorageStatus() {
  return { ok: storageOk, error: storageError, key: KEY };
}

export function loadProgress() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? safeParse(raw) : defaultData();
    storageOk = true;
    storageError = null;
  } catch (e) {
    cache = defaultData();
    storageOk = false;
    storageError = e && e.message ? e.message : String(e);
  }
  return cache;
}

function save() {
  const data = loadProgress();
  data.updatedAt = new Date().toISOString();
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(KEY, payload);
    // Verify round-trip — catch silent quota / blocked storage early
    const check = localStorage.getItem(KEY);
    if (check !== payload) {
      storageOk = false;
      storageError = "localStorage write did not stick";
      console.warn("[rue3 progress]", storageError);
      return false;
    }
    storageOk = true;
    storageError = null;
    return true;
  } catch (e) {
    storageOk = false;
    storageError = e && e.message ? e.message : String(e);
    console.warn("[rue3 progress] localStorage unavailable — progress is session-only", e);
    return false;
  }
}

/** Remember map level + selected unit across refresh. */
export function setLastView(level, nodeId) {
  const data = loadProgress();
  if (level) data.lastLevel = level;
  if (nodeId !== undefined) data.lastNodeId = nodeId || null;
  save();
}

export function getLastView() {
  const data = loadProgress();
  return {
    level: data.lastLevel || null,
    nodeId: data.lastNodeId || null,
    updatedAt: data.updatedAt || null,
  };
}

/** How many blocks have any practice recorded (for UI smoke checks). */
export function countTouchedBlocks() {
  const data = loadProgress();
  return Object.values(data.blocks || {}).filter(
    (b) => b && (b.touchedAt || Object.values(b.modes || {}).some(Boolean) || b.sentenceDone),
  ).length;
}

/** URL ?unlock=all or sticky local author flag (local shell only). */
export function isAuthorUnlock() {
  try {
    if (typeof location !== "undefined") {
      const q = new URLSearchParams(location.search);
      if (q.get("unlock") === "all") {
        localStorage.setItem(AUTHOR_KEY, "1");
        return true;
      }
    }
    return localStorage.getItem(AUTHOR_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthorUnlock(on) {
  try {
    if (on) localStorage.setItem(AUTHOR_KEY, "1");
    else localStorage.removeItem(AUTHOR_KEY);
  } catch {
    /* ignore */
  }
}

export function isLevelUnlocked(level) {
  // Author may open C1/C2 to preview growth silhouettes (no student content yet).
  if (isAuthorUnlock()) return true;
  if (FOREVER_LOCKED.has(level)) return false;
  if (level === "A1") return true;
  const data = loadProgress();
  return data.unlocked.includes(level);
}

/** Levels that should show locked on the rail. */
export function lockedLevels(allLevels = LEVELS) {
  return allLevels.filter((lv) => !isLevelUnlocked(lv));
}

export function unlockLevel(level) {
  if (FOREVER_LOCKED.has(level)) return false;
  const data = loadProgress();
  if (!data.unlocked.includes(level)) {
    data.unlocked.push(level);
    save();
  }
  return true;
}

export function recordGate(level, { passed, score, total }) {
  const data = loadProgress();
  const prev = data.gates[level] || { passed: false, score: null, total: null, at: null, attempts: 0 };
  prev.attempts = (prev.attempts || 0) + 1;
  prev.at = new Date().toISOString();
  prev.score = score;
  prev.total = total;
  if (passed) {
    prev.passed = true;
    if (level === "A1") unlockLevel("A2");
    else if (level === "A2") unlockLevel("B1");
    else if (level === "B1") unlockLevel("B2");
  }
  data.gates[level] = prev;
  save();
  return prev;
}

function ensureBlock(blockId, nodeId) {
  const data = loadProgress();
  if (!data.blocks[blockId]) {
    data.blocks[blockId] = {
      nodeId: nodeId || null,
      touchedAt: null,
      modes: { match: false, quiz: false, type: false, sentence: false },
      bestQuiz: null,
      lastType: null,
      sentenceDone: false,
    };
  }
  if (nodeId) data.blocks[blockId].nodeId = nodeId;
  return data.blocks[blockId];
}

/** First open of a practice block. */
export function touchBlock(blockId, nodeId) {
  if (!blockId) return;
  const b = ensureBlock(blockId, nodeId);
  if (!b.touchedAt) b.touchedAt = new Date().toISOString();
  save();
}

/**
 * Mark a ladder mode finished for a block.
 * @param {string} blockId
 * @param {"match"|"quiz"|"type"|"sentence"} mode
 * @param {{ nodeId?: string, score?: number, total?: number }} [meta]
 */
export function completeMode(blockId, mode, meta = {}) {
  if (!blockId || !mode) return;
  const b = ensureBlock(blockId, meta.nodeId);
  if (!b.touchedAt) b.touchedAt = new Date().toISOString();
  b.modes[mode] = true;
  if (mode === "quiz" && typeof meta.score === "number") {
    b.bestQuiz =
      b.bestQuiz == null ? meta.score : Math.max(b.bestQuiz, meta.score);
  }
  if (mode === "type" && typeof meta.score === "number" && typeof meta.total === "number") {
    b.lastType = [meta.score, meta.total];
  }
  // Leaf fruit: perfect Word pass (awardFruit from practice.js).
  // Trunk fruit: perfect Sentence. sentenceDone is the shared "learned/fruit" flag.
  if (mode === "type" && meta.awardFruit) {
    b.sentenceDone = true;
    if (meta.nodeId) onUnitLearned(meta.nodeId, { stagger: false });
  }
  if (mode === "sentence") {
    // perfect + awardFruit !== false → fruit.
    // Leaves pass awardFruit:false (optional carrier practice); trunk defaults true.
    const perfect = meta.perfect !== false;
    if (perfect && meta.awardFruit !== false) {
      b.sentenceDone = true;
      if (meta.nodeId) onUnitLearned(meta.nodeId, { stagger: false });
    }
  }
  save();
}

export function getBlockProgress(blockId) {
  const data = loadProgress();
  return data.blocks[blockId] || null;
}

/**
 * Honest node state from any blocks tagged with this nodeId.
 * @returns {"none"|"untouched"|"partial"|"fruit"}
 *   none = not live / no data concept; untouched = live but no practice yet
 */
export function nodeProgressState(nodeId, { isLive } = {}) {
  if (!isLive) return "none";
  const data = loadProgress();
  const blocks = Object.values(data.blocks).filter((b) => b.nodeId === nodeId);
  if (!blocks.length) return "untouched";
  // Fruit = sentenceDone flag (trunk: perfect Sentence; leaf: perfect Word)
  if (blocks.some((b) => b.sentenceDone)) return "fruit";
  if (blocks.some((b) => b.touchedAt || Object.values(b.modes).some(Boolean))) {
    return "partial";
  }
  return "untouched";
}

/** Short label for UI badges. */
export function progressLabel(state) {
  if (state === "fruit") return "fruit";
  if (state === "partial") return "touched";
  if (state === "untouched") return "not started";
  return "";
}

function hashStaggerDays(key, maxDays) {
  let h = 0;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % maxDays) + 1;
}

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function emptyNodeRecord() {
  return {
    learnedAt: null,
    successfulReps: 0,
    intervalIndex: 0,
    nextDueAt: null,
    lastReviewAt: null,
    lastScore: null,
    lastResult: null,
  };
}

function ensureNode(nodeId) {
  const data = loadProgress();
  if (!data.nodes) data.nodes = {};
  if (!data.nodes[nodeId]) data.nodes[nodeId] = emptyNodeRecord();
  return data.nodes[nodeId];
}

/**
 * Review / SRS fields for a tree node (unit).
 */
export function getNodeReview(nodeId) {
  const data = loadProgress();
  const n = (data.nodes && data.nodes[nodeId]) || null;
  return {
    successfulReps: n && typeof n.successfulReps === "number" ? n.successfulReps : 0,
    learnedAt: n && n.learnedAt ? n.learnedAt : null,
    lastReviewAt: n && n.lastReviewAt ? n.lastReviewAt : null,
    nextDueAt: n && n.nextDueAt ? n.nextDueAt : null,
    intervalIndex: n && typeof n.intervalIndex === "number" ? n.intervalIndex : 0,
    lastScore: n && n.lastScore ? n.lastScore : null,
    lastResult: n && n.lastResult ? n.lastResult : null,
  };
}

/**
 * First time a unit becomes Learned (fruit): schedule first review.
 * @param {string} nodeId
 * @param {{ stagger?: boolean, now?: number }} [opts]
 *   stagger: spread first due over ~2 weeks (migration). Default false = +1 day.
 */
export function onUnitLearned(nodeId, opts = {}) {
  if (!nodeId) return null;
  const n = ensureNode(nodeId);
  const now = opts.now != null ? opts.now : Date.now();
  if (!n.learnedAt) n.learnedAt = new Date(now).toISOString();
  // Do not reset an existing schedule on re-complete Sentence
  if (n.nextDueAt) {
    save();
    return n;
  }
  n.successfulReps = n.successfulReps || 0;
  n.intervalIndex = 0;
  const delayDays = opts.stagger
    ? hashStaggerDays(nodeId, MIGRATE_STAGGER_DAYS)
    : REVIEW_INTERVAL_DAYS[0];
  n.nextDueAt = new Date(now + delayDays * DAY_MS).toISOString();
  save();
  return n;
}

/**
 * Schedule fruit units that have no node record yet (older progress).
 * @param {Array<{ id: string, status?: string }>} treeNodes
 * @returns {number} how many units were scheduled
 */
export function migrateLearnedNodes(treeNodes) {
  let count = 0;
  for (const node of treeNodes || []) {
    if (!node || !node.id || node.id === "trunk" || node.status !== "live") continue;
    if (nodeProgressState(node.id, { isLive: true }) !== "fruit") continue;
    const rev = getNodeReview(node.id);
    if (rev.nextDueAt) continue;
    onUnitLearned(node.id, { stagger: true });
    count++;
  }
  return count;
}

/**
 * Due units for review (learned + nextDueAt <= now), most overdue first.
 * @param {Array<{ id: string, label?: string, status?: string, levels?: string[] }>} nodes
 * @param {{ limit?: number, now?: number, level?: string }} [opts]
 */
export function getDueUnits(nodes, opts = {}) {
  const limit = opts.limit != null ? opts.limit : REVIEW_DAILY_CAP;
  const now = opts.now != null ? opts.now : Date.now();
  const level = opts.level;
  // A2 thickening: also surface due A1 units (re-practise A1 words) without listing them on the A2 map.
  const levelOk = (nodeLevels) => {
    if (!level || !Array.isArray(nodeLevels)) return true;
    if (nodeLevels.includes(level)) return true;
    if (level === "A2" && nodeLevels.includes("A1")) return true;
    return false;
  };
  const due = [];
  for (const node of nodes || []) {
    if (!node || !node.id || node.id === "trunk" || node.status !== "live") continue;
    if (!levelOk(node.levels)) continue;
    if (nodeProgressState(node.id, { isLive: true }) !== "fruit") continue;
    const rev = getNodeReview(node.id);
    if (!rev.nextDueAt) continue;
    const dueMs = new Date(rev.nextDueAt).getTime();
    if (Number.isNaN(dueMs) || dueMs > now) continue;
    due.push({
      nodeId: node.id,
      label: node.label || node.id,
      nextDueAt: rev.nextDueAt,
      overdueMs: now - dueMs,
      successfulReps: rev.successfulReps,
    });
  }
  due.sort((a, b) => b.overdueMs - a.overdueMs);
  return due.slice(0, limit);
}

/**
 * Recent learn / review events for the Today card.
 * @param {Array<{ id: string, label?: string }>} nodes
 * @param {{ limit?: number, withinDays?: number }} [opts]
 */
export function getRecentActivity(nodes, opts = {}) {
  const limit = opts.limit != null ? opts.limit : 3;
  const withinDays = opts.withinDays != null ? opts.withinDays : 14;
  const cutoff = Date.now() - withinDays * DAY_MS;
  const byId = new Map((nodes || []).map((n) => [n.id, n]));
  const events = [];
  const data = loadProgress();
  for (const [nodeId, rec] of Object.entries(data.nodes || {})) {
    const label = (byId.get(nodeId) && byId.get(nodeId).label) || nodeId;
    if (rec.lastReviewAt) {
      const t = new Date(rec.lastReviewAt).getTime();
      if (t >= cutoff) {
        events.push({
          kind: "reviewed",
          nodeId,
          label,
          at: rec.lastReviewAt,
          meta: { result: rec.lastResult, score: rec.lastScore },
        });
      }
    }
    if (rec.learnedAt) {
      const t = new Date(rec.learnedAt).getTime();
      if (t >= cutoff) {
        events.push({
          kind: "learned",
          nodeId,
          label,
          at: rec.learnedAt,
          meta: {},
        });
      }
    }
  }
  // Prefer review events over learn for same unit+day when sorting
  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  // Dedupe by nodeId keeping most recent event
  const seen = new Set();
  const out = [];
  for (const e of events) {
    if (seen.has(e.nodeId)) continue;
    seen.add(e.nodeId);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Suggest one unit to learn next: first untouched, else first partial.
 * @param {Array<{ id: string, label?: string, status?: string, levels?: string[] }>} nodes
 * @param {string} level
 */
export function suggestNextUnit(nodes, level) {
  const list = (nodes || []).filter(
    (n) =>
      n &&
      n.id &&
      n.id !== "trunk" &&
      n.status === "live" &&
      Array.isArray(n.levels) &&
      n.levels.includes(level),
  );
  let partial = null;
  for (const n of list) {
    const st = nodeProgressState(n.id, { isLive: true });
    if (st === "untouched") return { nodeId: n.id, label: n.label || n.id, state: st };
    if (st === "partial" && !partial) {
      partial = { nodeId: n.id, label: n.label || n.id, state: st };
    }
  }
  return partial;
}

/**
 * Record end of a unit review session.
 * Pass: +1 successfulReps, advance interval.
 * Fail: do not lower reps; due again in 1 day.
 */
export function recordReview(nodeId, { passed, score, total } = {}) {
  if (!nodeId) return null;
  const n = ensureNode(nodeId);
  const now = Date.now();
  n.lastReviewAt = new Date(now).toISOString();
  n.lastScore =
    typeof score === "number" && typeof total === "number" ? [score, total] : n.lastScore;
  n.lastResult = passed ? "pass" : "fail";
  if (!n.learnedAt) n.learnedAt = n.lastReviewAt;

  if (passed) {
    n.successfulReps = (n.successfulReps || 0) + 1;
    const maxIdx = REVIEW_INTERVAL_DAYS.length - 1;
    // After first success, climb ladder; first review was at index 0 interval
    n.intervalIndex = Math.min((n.intervalIndex || 0) + 1, maxIdx);
    const days = REVIEW_INTERVAL_DAYS[n.intervalIndex];
    n.nextDueAt = daysFromNow(days);
  } else {
    n.intervalIndex = 0;
    n.nextDueAt = daysFromNow(REVIEW_INTERVAL_DAYS[0]);
  }
  save();
  return getNodeReview(nodeId);
}

/** Author / smoke: mark every scheduled unit due now. */
export function forceAllDue() {
  const data = loadProgress();
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  let n = 0;
  for (const rec of Object.values(data.nodes || {})) {
    if (!rec.nextDueAt && !rec.learnedAt) continue;
    rec.nextDueAt = past;
    n++;
  }
  save();
  return n;
}

export function isRemembered(nodeId) {
  return getNodeReview(nodeId).successfulReps >= 1;
}

export function isMastered(nodeId) {
  return getNodeReview(nodeId).successfulReps >= MASTERY_REPS;
}

/** Relative time label for Today card. */
export function formatRelativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

/** Short due label: "due now", "tomorrow", "Fri", etc. */
export function formatDueLabel(iso) {
  if (!iso) return "not scheduled";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "not scheduled";
  const now = Date.now();
  if (t <= now) return "due now";
  const days = Math.ceil((t - now) / DAY_MS);
  if (days <= 1) return "due tomorrow";
  if (days <= 7) {
    return `due ${new Date(iso).toLocaleDateString(undefined, { weekday: "short" })}`;
  }
  return `due in ${days}d`;
}

/**
 * Three-meter stats for a CEFR level.
 * Topic grain = live tree units (nodes with status live, not the root "trunk" shell).
 * Learned = fruit (leaf: perfect Word · trunk: perfect Sentence). Remembered = ≥1 successful review. Mastered = ≥ MASTERY_REPS.
 *
 * @param {string} level
 * @param {Array<{ id: string, status?: string, levels?: string[] }>} nodes all tree nodes (filtered here)
 * @returns {{ total: number, learned: number, remembered: number, mastered: number, partial: number }}
 */
export function levelUnitStats(level, nodes) {
  const list = (nodes || []).filter(
    (n) =>
      n &&
      n.id &&
      n.id !== "trunk" &&
      n.status === "live" &&
      Array.isArray(n.levels) &&
      n.levels.includes(level),
  );
  let learned = 0;
  let remembered = 0;
  let mastered = 0;
  let partial = 0;
  for (const n of list) {
    const st = nodeProgressState(n.id, { isLive: true });
    if (st === "fruit") learned++;
    else if (st === "partial") partial++;
    const reps = getNodeReview(n.id).successfulReps;
    // Remembered/mastered only count units that are (or were) learned — no fake glow
    if (st === "fruit" || reps > 0) {
      if (reps >= 1) remembered++;
      if (reps >= MASTERY_REPS) mastered++;
    }
  }
  return {
    total: list.length,
    learned,
    remembered,
    mastered,
    partial,
  };
}

export function resetProgress() {
  cache = defaultData();
  save();
}

export function getUnlockedList() {
  return LEVELS.filter((lv) => isLevelUnlocked(lv));
}

/** Gate record for a level, or null. */
export function getGate(level) {
  const g = loadProgress().gates[level];
  return g || null;
}

export function hasPassedGate(level) {
  const g = getGate(level);
  return Boolean(g && g.passed);
}
