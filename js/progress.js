/**
 * RUE3 progress — local, honest, minimal.
 * Touched / mode complete / fruit per block; level unlocks (A1 open; A2+ via gate later).
 * Storage is local to this browser. Corrupt data resets to defaults.
 */

const KEY = "rue3-v0.1-progress";
const AUTHOR_KEY = "rue3-v0.1-author-unlock";
const FOREVER_LOCKED = new Set(["C1"]);
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

function defaultData() {
  return {
    v: 1,
    unlocked: ["A1"],
    blocks: {},
    gates: {},
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
    if (!d.unlocked.includes("A1")) d.unlocked = ["A1", ...d.unlocked];
    return d;
  } catch {
    return defaultData();
  }
}

let cache = null;

export function loadProgress() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? safeParse(raw) : defaultData();
  } catch {
    cache = defaultData();
  }
  return cache;
}

function save() {
  const data = loadProgress();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode — progress is session-only in memory */
  }
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
  if (FOREVER_LOCKED.has(level)) return false;
  if (level === "A1") return true;
  if (isAuthorUnlock()) return true;
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
  if (mode === "sentence") {
    b.sentenceDone = true;
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
  if (blocks.some((b) => b.sentenceDone || b.modes.sentence)) return "fruit";
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
