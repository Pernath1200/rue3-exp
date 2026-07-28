/**
 * RUE3 exp — optional Insights layer (Word roots · PIE).
 * Author-toggle only. Does not affect progress, fruit, or grading.
 * Leibniz / NSM lives in semantic-codex (archived from RUE3 2026-07-27).
 */

const TOGGLE_KEY = "rue3-insights-toggles";

let etymologyCache = null;
let etymologyLoadPromise = null;

const PATH_LABELS = {
  germanic: "Germanic",
  latin: "Latin",
  other: "Other",
};

export function normLemma(en) {
  return String(en || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split("/")[0]
    .replace(/[.,!?;:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function defaultToggles() {
  return { pie: false, roget: false };
}

export function getInsightsToggles() {
  try {
    const raw = localStorage.getItem(TOGGLE_KEY);
    if (!raw) return defaultToggles();
    const d = JSON.parse(raw);
    return {
      pie: Boolean(d.pie),
      roget: Boolean(d.roget),
    };
  } catch {
    return defaultToggles();
  }
}

export function setInsightToggle(name, on) {
  const t = getInsightsToggles();
  if (name === "pie" || name === "roget") {
    t[name] = Boolean(on);
  }
  try {
    localStorage.setItem(TOGGLE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
  return t;
}

export async function loadEtymology(loadJson) {
  if (etymologyCache) return etymologyCache;
  if (etymologyLoadPromise) return etymologyLoadPromise;
  etymologyLoadPromise = (async () => {
    try {
      const data = await loadJson("./data/insights/etymology.json");
      etymologyCache =
        data && data.entries ? data : { version: 1, entries: {} };
    } catch {
      etymologyCache = { version: 1, entries: {} };
    }
    return etymologyCache;
  })();
  return etymologyLoadPromise;
}

export function getEtymologyEntry(lemma, data) {
  const key = normLemma(lemma);
  if (!key || !data || !data.entries) return null;
  return data.entries[key] || null;
}

/**
 * Collect Word roots rows for a list of pack items.
 * @returns {Array<{ lemma: string, entry: object }>}
 */
export function etymologyRowsForItems(items, data) {
  if (!data || !Array.isArray(items)) return [];
  const seen = new Set();
  const rows = [];
  for (const it of items) {
    const lemma = normLemma(it && it.en);
    if (!lemma || seen.has(lemma)) continue;
    seen.add(lemma);
    const entry = getEtymologyEntry(lemma, data);
    if (entry) rows.push({ lemma, entry });
  }
  return rows;
}

function pathLabel(path) {
  const key = String(path || "").toLowerCase();
  return PATH_LABELS[key] || (path ? String(path) : "Other");
}

export function renderEtymologyPanelHtml(rows, { escapeHtml }) {
  if (!rows || !rows.length) {
    return `<div class="insights-panel" id="insights-etymology">
      <div class="insights-head">Word roots</div>
      <p class="insights-empty">No curated etymology for words in this unit yet.</p>
    </div>`;
  }
  const body = rows
    .map(({ lemma, entry }) => {
      const bits = [];
      const cz = entry.czech_cognate;
      if (cz && cz.bridge) {
        bits.push(
          `<div class="insights-bridge"><span class="bridge-tag">English relatives</span> ${escapeHtml(cz.bridge)}</div>`,
        );
      }
      if (cz && cz.word) {
        bits.push(
          `<div class="insights-cognate"><span class="cognate-tag">Czech cousin</span> <strong>${escapeHtml(cz.word)}</strong>${
            cz.note
              ? ` <span class="insights-cognate-note">${escapeHtml(cz.note)}</span>`
              : ""
          }</div>`,
        );
      }
      const imm = entry.immediate || {};
      const path = pathLabel(imm.path);
      const pathNote = imm.note ? escapeHtml(imm.note) : "";
      bits.push(
        `<div class="insights-path-line"><span class="path-tag">${escapeHtml(path)}</span>${
          pathNote ? ` <span class="insights-path-note">${pathNote}</span>` : ""
        }</div>`,
      );
      if (entry.pie && entry.pie.root) {
        const meaning = entry.pie.meaning
          ? ` · “${escapeHtml(entry.pie.meaning)}”`
          : "";
        bits.push(
          `<div class="insights-pie"><span class="insights-pie-label">PIE</span> ${escapeHtml(entry.pie.root)}${meaning}</div>`,
        );
      }
      if (entry.notes && String(entry.notes).trim()) {
        bits.push(
          `<div class="insights-notes">${escapeHtml(entry.notes)}</div>`,
        );
      }
      return `<div class="insights-row">
        <div class="insights-lemma">${escapeHtml(lemma)}</div>
        ${bits.join("")}
      </div>`;
    })
    .join("");
  return `<div class="insights-panel" id="insights-etymology">
    <div class="insights-head">Word roots <span class="insights-sub">path · relatives · Czech cousins · author experiment</span></div>
    ${body}
  </div>`;
}
