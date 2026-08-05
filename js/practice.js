/**
 * Practice ladder (Martin model, RUE3 shell):
 * Match → Quiz → Type word → Type sentence (Use it)
 * Default for word modes: CZ → EN
 * Sentence mode: always produce English (CZ gloss under words)
 *
 * Leaf Sentence = carrier frames only (js/carriers.js), not free invented sentences.
 * Layer 2 bank-expand is OFF by default (dud risk); 1 model per lemma + emit gate.
 * Leaf fruit = Word complete (perfect type pass). Trunk fruit = Sentence complete.
 */

import { buildLeafSentenceItems } from "./carriers.js";
import { getSmokeApi, countFlags } from "./smoke-flags.js";
import { isStarred, toggleStar, starItemKey } from "./progress.js";

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Expand common contractions so I'm / I am grade the same. */
function expandContractions(s) {
  let t = String(s).toLowerCase();
  const pairs = [
    [/\bwon't\b/g, "will not"],
    [/\bcan't\b/g, "cannot"],
    [/\bcannot\b/g, "cannot"],
    [/\bdon't\b/g, "do not"],
    [/\bdoesn't\b/g, "does not"],
    [/\bdidn't\b/g, "did not"],
    [/\bisn't\b/g, "is not"],
    [/\baren't\b/g, "are not"],
    [/\bwasn't\b/g, "was not"],
    [/\bweren't\b/g, "were not"],
    [/\bhaven't\b/g, "have not"],
    [/\bhasn't\b/g, "has not"],
    [/\bi'm\b/g, "i am"],
    [/\byou're\b/g, "you are"],
    [/\bhe's\b/g, "he is"],
    [/\bshe's\b/g, "she is"],
    [/\bit's\b/g, "it is"],
    [/\bwe're\b/g, "we are"],
    [/\bthey're\b/g, "they are"],
    [/\bi've\b/g, "i have"],
    [/\byou've\b/g, "you have"],
    [/\bwe've\b/g, "we have"],
    [/\bthey've\b/g, "they have"],
    [/\bi'll\b/g, "i will"],
    [/\byou'll\b/g, "you will"],
    [/\bhe'll\b/g, "he will"],
    [/\bshe'll\b/g, "she will"],
    [/\bwe'll\b/g, "we will"],
    [/\bthey'll\b/g, "they will"],
    [/\bi'd\b/g, "i would"],
    [/\byou'd\b/g, "you would"],
    [/\bhe'd\b/g, "he would"],
    [/\bshe'd\b/g, "she would"],
    [/\bwe'd\b/g, "we would"],
    [/\bthey'd\b/g, "they would"],
    [/\bthere's\b/g, "there is"],
    [/\bthat's\b/g, "that is"],
    [/\bwhat's\b/g, "what is"],
    [/\bwhere's\b/g, "where is"],
    [/\bwho's\b/g, "who is"],
  ];
  for (const [re, rep] of pairs) t = t.replace(re, rep);
  return t;
}

function norm(s) {
  return (
    expandContractions(String(s))
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // BOM / zero-width / soft hyphen — invisible junk that can poison “exact” answers
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
      .replace(/[''`´]/g, "")
      // o'clock / oclock / o clock → same form (apostrophe optional)
      .replace(/\bo\s*clock\b/g, "oclock")
      // Every Unicode dash/hyphen → drop (Wi-Fi = WiFi = Wi‑Fi; not a spelling error)
      // \p{Pd} = punctuation dash; plus ASCII minus if engine misses it
      .replace(/\p{Pd}/gu, "")
      .replace(/-/g, "")
      // NBSP and other space separators → normal space
      .replace(/\p{Zs}/gu, " ")
      .replace(/[.,!?;:"()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      // wi fi (typed with a space) = wifi
      .replace(/\bwi\s+fi\b/g, "wifi")
      .replace(/^(a |an |the )/, "")
  );
}

/** Expand one answer string into normalised acceptable forms (slashes, notes). */
function accepts(answer) {
  if (answer == null || answer === "") return [];
  const forms = [answer, String(answer).replace(/\([^)]*\)/g, " ")];
  return [
    ...new Set(
      forms
        .flatMap((f) => String(f).split(/[/;]/))
        .map(norm)
        .filter(Boolean),
    ),
  ];
}

/**
 * Soft full-sentence match — near-enough English, not a free-for-all.
 * Person must stay the same: "I am from Brno" ≈ "I come from Brno",
 * but not "He is/comes from Brno" when the model is "I …".
 */
function softSentenceMatch(userNorm, primaryNorm) {
  if (!userNorm || !primaryNorm) return false;
  if (userNorm === primaryNorm) return true;

  const subjectOf = (t) => {
    const m = t.match(/^(i|you|he|she|it|we|they)\b/);
    return m ? m[1] : null;
  };
  const dropSubj = (t) =>
    t.replace(/^(i|you|he|she|it|we|they)\s+/, "").trim();

  const su = subjectOf(userNorm);
  const sp = subjectOf(primaryNorm);

  // Same predicate after stripping subject (I'm tired ≈ I am tired already via norm)
  if (su && sp && su === sp && dropSubj(userNorm) === dropSubj(primaryNorm)) {
    return true;
  }

  // Origin: same person + same place — come from ≈ be/am/is/are from
  // e.g. I come from Brno ≈ I am from Brno; NOT He is from Brno
  const fromOf = (t) => {
    const m = t.match(/\bfrom\s+(.+)$/);
    return m ? m[1].trim() : null;
  };
  const originVerb = (t) => {
    // after optional subject
    const rest = dropSubj(t);
    if (/^(come|comes|coming)\b/.test(rest)) return "come";
    if (/^(am|is|are|be|been)\b/.test(rest)) return "be";
    return null;
  };
  const fu = fromOf(userNorm);
  const fp = fromOf(primaryNorm);
  if (fu && fp && fu === fp && su && sp && su === sp) {
    const vu = originVerb(userNorm);
    const vp = originVerb(primaryNorm);
    if (vu && vp && (vu === vp || (vu === "come" && vp === "be") || (vu === "be" && vp === "come"))) {
      return true;
    }
  }

  return false;
}

/**
 * Preferred model + optional item.accepts / item.gap_accepts.
 * Show answer stays the preferred model; grading allows listed variants.
 * gap_accepts only apply when forGap (Word mode) — bare synonyms must not pass Sentence.
 */
function itemAccepts(item, primary, { forGap = false } = {}) {
  const extras = [];
  if (item && Array.isArray(item.accepts)) extras.push(...item.accepts);
  if (forGap && item && Array.isArray(item.gap_accepts)) {
    extras.push(...item.gap_accepts);
  }
  const out = new Set(accepts(primary));
  for (const a of extras) {
    for (const n of accepts(a)) out.add(n);
  }
  // Auto contraction-style twins already via expandContractions in norm
  return [...out];
}

function isCorrectAnswer(userInput, item, primary, opts = {}) {
  const { forGap = false } = opts;
  const userN = norm(userInput);
  if (!userN) return false;
  if (itemAccepts(item, primary, opts).includes(userN)) return true;
  // Soft match only for full sentences / non-gap (gate Sentence, frame Sentence)
  if (!forGap && primary && String(primary).trim().includes(" ")) {
    const primaryN = norm(primary);
    if (softSentenceMatch(userN, primaryN)) return true;
    // also soft-match against listed accepts
    if (item && Array.isArray(item.accepts)) {
      for (const a of item.accepts) {
        if (softSentenceMatch(userN, norm(a))) return true;
      }
    }
  }
  return false;
}

/**
 * Gap-fill prompt: single token → "word", multi-token (e.g. according to) → "words".
 * @param {string} answer
 * @param {{ lead?: string }} [opts]
 */
export function gapFillInstruction(answer, opts = {}) {
  const lead = opts.lead || "Type the";
  const n = String(answer || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const target = n > 1 ? "missing English words" : "missing English word";
  return `${lead} ${target}`;
}

export { norm, isCorrectAnswer, itemAccepts, softSentenceMatch, expandContractions };

/** Ball-and-box SVG diagrams (from Teaching Material basic-prepositions.html), RUE3 dark tokens. */
function diagramSvg(key) {
  const box = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#1a3338" stroke="#4db6c7" stroke-width="3"/>`;
  const obox = (x, y, w, h) =>
    `<path d="M${x} ${y} L${x} ${y + h} L${x + w} ${y + h} L${x + w} ${y}" fill="#142a2e" stroke="#4db6c7" stroke-width="3" stroke-linejoin="round"/>`;
  const ball = (cx, cy) =>
    `<circle cx="${cx}" cy="${cy}" r="16" fill="#e88a3c" stroke="#c56f27" stroke-width="2"/>`;
  const dash = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4db6c7" stroke-width="2" stroke-dasharray="5 5"/>`;
  // Vertical “street / table middle” — opposite = across from
  const divider = () =>
    `<line x1="110" y1="48" x2="110" y2="128" stroke="#4db6c7" stroke-width="2" stroke-dasharray="4 4" opacity="0.85"/>` +
    `<line x1="95" y1="130" x2="125" y2="130" stroke="#4db6c7" stroke-width="2" opacity="0.5"/>`;
  const svg = (inner) =>
    `<svg viewBox="0 0 220 150" class="scene" aria-hidden="true">${inner}</svg>`;
  const scenes = {
    in: () => svg(obox(70, 70, 80, 45) + ball(110, 96)),
    on: () => svg(box(70, 80, 80, 40) + ball(110, 64)),
    under: () => svg(box(70, 55, 80, 40) + ball(110, 116)),
    above: () => svg(box(70, 94, 80, 32) + ball(110, 44)),
    "next to": () => svg(box(58, 70, 70, 45) + ball(162, 92)),
    between: () => svg(box(22, 70, 46, 45) + box(152, 70, 46, 45) + ball(110, 92)),
    "in front of": () => svg(box(80, 56, 78, 40) + ball(102, 104)),
    behind: () => svg(ball(112, 64) + box(72, 74, 80, 44)),
    // Wide gap + middle line = across from (not “close”)
    opposite: () => svg(divider() + ball(42, 90) + box(148, 68, 54, 45)),
    // Small gap, same side of the scene, short tick — close but not touching
    near: () =>
      svg(
        box(55, 70, 60, 45) +
          ball(148, 92) +
          dash(120, 92, 130, 92),
      ),
  };
  const fn = scenes[key];
  return fn ? fn() : "";
}

function diagramBlock(item) {
  if (!item || !item.diagram) return "";
  const svg = diagramSvg(item.diagram);
  if (!svg) return "";
  return `<div class="picwrap">${svg}</div>`;
}

function promptOf(item, czToEn) {
  return czToEn ? item.cz : item.en;
}

function answerOf(item, czToEn) {
  return czToEn ? item.en : item.cz;
}

function keyWord(item) {
  return item.en.replace(/\([^)]*\)/g, "").split("/")[0].trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isFrameItem(item) {
  return Boolean(item && item.gap && item.gap_answer);
}

/** Sentence-mode item list: trunk frames as-is; leaves → multi core-frame carriers. */
function sentenceItemsFor(block, isFrames) {
  const items = block.items || [];
  if (isFrames) return items;
  return buildLeafSentenceItems(items, {
    title: block.title,
    id: block.id,
    level: block.level,
  });
}

/**
 * End-of-mode review list HTML (EN · CZ · missed? + star toggle).
 * Fruit payoff stays deferred until Continue (app onContinue gate).
 * @param {object[]} rows { item, missed }
 * @param {{ blockId: string, level?: string, nodeId?: string }} meta
 */
function modeReviewListHtml(rows, meta) {
  if (!rows || !rows.length) return "";
  const body = rows
    .map((row, i) => {
      const it = row.item || {};
      const en = it.en || it.gap_answer || "—";
      const cz = it.cz || "—";
      const key = starItemKey(meta.blockId, it);
      const on = isStarred(key);
      const missed = row.missed
        ? `<span class="mode-review-missed">missed</span>`
        : "";
      return `<li class="mode-review-row${row.missed ? " is-missed" : ""}" role="listitem" data-i="${i}">
        <button type="button" class="mode-review-star${on ? " is-on" : ""}"
          data-key="${escapeHtml(key)}" data-i="${i}"
          aria-pressed="${on ? "true" : "false"}"
          aria-label="${on ? "Unstar" : "Star"} ${escapeHtml(en)}">${on ? "★" : "☆"}</button>
        <span class="mode-review-en">${escapeHtml(en)}</span>
        <span class="mode-review-sep" aria-hidden="true">·</span>
        <span class="mode-review-cz">${escapeHtml(cz)}</span>
        ${missed}
      </li>`;
    })
    .join("");
  return `<div class="mode-review">
    <div class="mode-review-label">This pass · ${rows.length}</div>
    <ul class="mode-review-list" role="list">${body}</ul>
  </div>`;
}

/** Build review rows from practiced indices into a source list. */
function reviewRowsFromIndices(sourceItems, practicedIndices, wrongIndices) {
  const wrong = new Set(wrongIndices || []);
  const seen = new Set();
  const rows = [];
  for (const idx of practicedIndices || []) {
    if (seen.has(idx)) continue;
    seen.add(idx);
    const item = sourceItems[idx];
    if (!item) continue;
    rows.push({ item, missed: wrong.has(idx) });
  }
  return rows;
}

/**
 * @param {HTMLElement} root
 * @param {{ title: string, items: object[], practice?: string }} block
 * @param {{ onExit: () => void, practice?: string }} opts
 */
export function startPractice(root, block, opts) {
  const isFrames = opts.practice === "frames" || block.practice === "frames";
  const state = {
    mode: "match",
    czToEn: true,
    match: null,
    quiz: null,
    typ: null,
    use: null,
    sentenceList: null,
    keyHandler: null,
    advanceTimer: null,
  };
  /** One complete report per mode per practice session (finish screens re-render). */
  const reported = { match: false, quiz: false, type: false, sentence: false };
  const blockId = block.id || opts.packId || "block";
  const starMeta = {
    blockId,
    level: opts.level || block.level || null,
    nodeId: opts.treeNode || null,
  };

  function reportMode(mode, meta) {
    if (!mode || reported[mode]) return;
    reported[mode] = true;
    if (typeof opts.onModeComplete === "function") {
      opts.onModeComplete(mode, meta || {});
    }
  }

  /**
   * If fruit just landed, app shows payoff first (list already visible).
   * onContinue returns true when fruit UI took over.
   */
  function afterReviewContinue(fn) {
    if (typeof opts.onContinue === "function") {
      try {
        if (opts.onContinue() === true) return;
      } catch {
        /* fall through */
      }
    }
    fn();
  }

  /** Wire star toggles; persist immediately into rue3-v0.1-progress.stars */
  function wireModeReview(stage, rows) {
    if (!stage || !rows) return;
    stage.querySelectorAll(".mode-review-star").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const i = +btn.dataset.i;
        const row = rows[i];
        if (!row?.item) return;
        const key = btn.dataset.key || starItemKey(blockId, row.item);
        const now = toggleStar(key, {
          en: row.item.en ?? null,
          cz: row.item.cz ?? null,
          gap: row.item.gap ?? null,
          gap_answer: row.item.gap_answer ?? null,
          level: starMeta.level,
          nodeId: starMeta.nodeId,
          blockId,
        });
        btn.textContent = now ? "★" : "☆";
        btn.setAttribute("aria-pressed", now ? "true" : "false");
        btn.setAttribute(
          "aria-label",
          `${now ? "Unstar" : "Star"} ${row.item.en || row.item.gap_answer || ""}`,
        );
        btn.classList.toggle("is-on", now);
      });
    });
  }

  if (typeof opts.onTouch === "function") opts.onTouch();

  function clearKey() {
    if (state.keyHandler) {
      document.removeEventListener("keydown", state.keyHandler);
      state.keyHandler = null;
    }
    if (state.advanceTimer) {
      clearTimeout(state.advanceTimer);
      state.advanceTimer = null;
    }
  }

  /** Enter activates primary action / next — keyboard-first ladder */
  function bindEnter(handler) {
    clearKey();
    state.keyHandler = (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      handler(e);
    };
    document.addEventListener("keydown", state.keyHandler);
  }

  function bindEnterPrimary(stage) {
    bindEnter((e) => {
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      const btn =
        stage.querySelector(".btn.primary") ||
        stage.querySelector("#chk") ||
        stage.querySelector(".btn");
      if (btn && !btn.disabled) btn.click();
    });
  }

  function setMode(m) {
    clearKey();
    state.mode = m;
    state.match = null;
    state.quiz = null;
    state.typ = null;
    state.use = null;
    // Fresh sentence pass when entering Sentence (CZ→EN models for trunk + leaves)
    if (m === "sentence") state.sentenceList = null;
    render();
  }

  /** Items for mode 4: frames or leaf-generated sentence models. */
  function sentenceList() {
    if (!state.sentenceList) {
      state.sentenceList = sentenceItemsFor(block, isFrames);
    }
    return state.sentenceList;
  }

  /** Live item context for smoke Flag (always-visible toolbar). */
  const flagContext = {
    stage: "match",
    itemIndex: null,
    en: "",
    cz: "",
    gap: "",
    gap_answer: "",
    prompt: "",
    answer: "",
    typed: "",
  };

  function setFlagContext(partial) {
    Object.assign(flagContext, partial);
  }

  function contextFromItem(it, itemIndex, stageExtra = {}) {
    if (!it) {
      setFlagContext({
        itemIndex: itemIndex ?? null,
        en: "",
        cz: "",
        gap: "",
        gap_answer: "",
        prompt: "",
        answer: "",
        ...stageExtra,
      });
      return;
    }
    setFlagContext({
      itemIndex: typeof itemIndex === "number" ? itemIndex : null,
      en: it.en || "",
      cz: it.cz || "",
      gap: it.gap || "",
      gap_answer: it.gap_answer || "",
      prompt: "",
      answer: "",
      ...stageExtra,
    });
  }

  function openSmokeFlag() {
    const api = getSmokeApi();
    if (!api) return;
    const ti = root.querySelector("#ti, #si, textarea.type-area, input.type-in");
    if (ti && "value" in ti) {
      setFlagContext({ typed: String(ti.value || "") });
    }
    api.openForm({
      packId: opts.treeNode || opts.packId || block.tree_node || block.id || "",
      packTitle: opts.packTitle || block.title || "",
      blockId: block.id || "",
      level: block.level || opts.level || "",
      stage: flagContext.stage || state.mode || "",
      mode: state.mode || "",
      itemIndex: flagContext.itemIndex,
      en: flagContext.en || "",
      cz: flagContext.cz || "",
      gap: flagContext.gap || "",
      gap_answer: flagContext.gap_answer || "",
      prompt: flagContext.prompt || "",
      answer: flagContext.answer || "",
      typed: flagContext.typed || "",
    });
  }

  function openSmokeList() {
    getSmokeApi()?.openList();
  }

  function renderChrome(statusText) {
    const modes = [
      ["match", "1 · Match"],
      ["quiz", "2 · Quiz"],
      ["type", "3 · Word"],
      ["sentence", "4 · Sentence"],
    ];
    const showDir = state.mode !== "sentence";
    const nFlags = countFlags();
    return `
      <div class="practice-head">
        <div class="practice-title">${escapeHtml(block.title)}</div>
        <div class="practice-meta">${block.items.length} ${isFrames ? "frames" : "words"}${block.level ? ` · ${escapeHtml(block.level)}` : ""}${isFrames ? " · trunk seed" : ""}</div>
      </div>
      <div class="modes">
        ${modes
          .map(
            ([id, label]) =>
              `<button type="button" class="mode ${state.mode === id ? "active" : ""}" data-mode="${id}">${label}</button>`,
          )
          .join("")}
      </div>
      <div class="bar">
        <span id="p-status">${escapeHtml(statusText || "")}</span>
        <span class="bar-tools">
          ${
            showDir
              ? `<button type="button" class="dir" id="p-dir">${state.czToEn ? "CZ → EN" : "EN → CZ"}</button>`
              : `<span class="dir-static">Write in English</span>`
          }
        </span>
      </div>
      <div class="smoke-toolbar" role="toolbar" aria-label="Smoke flags">
        <button type="button" class="btn smoke-flag-btn" id="p-flag" title="Flag this item for smoke review (F)">⚑ Flag item</button>
        <button type="button" class="btn smoke-flag-list" id="p-flag-list" data-smoke-badge title="View flagged items · copy for agent">${nFlags > 0 ? `Flagged (${nFlags})` : "Flagged list"}</button>
        <span class="smoke-toolbar-hint">Smoke · local notes for the agent</span>
      </div>
      <div id="p-stage" class="stage"></div>
      <div class="practice-exit">
        <button type="button" class="btn-ghost" id="p-exit">← Back to tree</button>
      </div>
    `;
  }

  function wireChrome() {
    root.querySelectorAll(".mode").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });
    const dir = root.querySelector("#p-dir");
    if (dir) {
      dir.addEventListener("click", () => {
        state.czToEn = !state.czToEn;
        state.match = null;
        state.quiz = null;
        state.typ = null;
        clearKey();
        render();
      });
    }
    root.querySelector("#p-exit").addEventListener("click", () => {
      clearKey();
      opts.onExit();
    });
    root.querySelector("#p-flag")?.addEventListener("click", () => openSmokeFlag());
    root.querySelector("#p-flag-list")?.addEventListener("click", () => openSmokeList());
  }

  function newMatch() {
    const pool = shuffle(block.items).slice(0, Math.min(6, block.items.length));
    const left = pool.map((it, i) => ({ t: promptOf(it, state.czToEn), id: i }));
    const right = shuffle(
      pool.map((it, i) => ({ t: answerOf(it, state.czToEn), id: i })),
    );
    state.match = {
      pool,
      left,
      right,
      sel: null,
      doneIds: new Set(),
      total: pool.length,
    };
  }

  function renderMatch(stage) {
    if (!state.match) newMatch();
    const m = state.match;
    const doneCount = m.doneIds.size;
    setFlagContext({
      stage: "match",
      itemIndex: null,
      en: "",
      cz: "",
      gap: "",
      gap_answer: "",
      prompt: "match board",
      answer: "",
      typed: "",
    });

    if (doneCount === m.total) {
      reportMode("match");
      const rows = (m.pool || []).map((item) => ({ item, missed: false }));
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">All matched</div>
          <div class="sub">Next: Quiz → Word → Sentence · Enter continues</div>
          ${modeReviewListHtml(rows, starMeta)}
          <div class="nav">
            <button type="button" class="btn" id="m-again">New set</button>
            <button type="button" class="btn primary" id="m-quiz">2 · Quiz →</button>
          </div>
        </div>`;
      wireModeReview(stage, rows);
      stage.querySelector("#m-again").onclick = () => {
        newMatch();
        render();
      };
      stage.querySelector("#m-quiz").onclick = () =>
        afterReviewContinue(() => setMode("quiz"));
      bindEnterPrimary(stage);
      return `Matched ${doneCount} of ${m.total}`;
    }

    const col = (arr, side) =>
      arr
        .map((x) => {
          const done = m.doneIds.has(x.id);
          const cls = done ? "m done" : "m";
          const label = done ? `✓ ${x.t}` : x.t;
          return `<button type="button" class="${cls}" data-side="${side}" data-id="${x.id}" ${done ? "disabled" : ""}>${escapeHtml(label)}</button>`;
        })
        .join("");

    stage.innerHTML = `<div class="match"><div>${col(m.left, "L")}</div><div>${col(m.right, "R")}</div></div>`;
    stage.querySelectorAll(".m:not(.done)").forEach((el) => {
      el.addEventListener("click", () => {
        const id = +el.dataset.id;
        const side = el.dataset.side;
        if (!m.sel) {
          m.sel = { id, side, el };
          el.classList.add("sel");
          return;
        }
        if (m.sel.side === side) {
          m.sel.el.classList.remove("sel");
          m.sel = { id, side, el };
          el.classList.add("sel");
          return;
        }
        if (m.sel.id === id) {
          // Pair found — persist in state so re-render keeps them eliminated
          m.doneIds.add(id);
          m.sel.el.classList.remove("sel");
          m.sel.el.classList.add("done");
          m.sel.el.disabled = true;
          m.sel.el.textContent = "✓ " + m.sel.el.textContent.replace(/^✓\s*/, "");
          el.classList.add("done");
          el.disabled = true;
          el.textContent = "✓ " + el.textContent.replace(/^✓\s*/, "");
          m.sel = null;
          // Refresh status line + full board when complete
          setTimeout(() => render(), doneCount + 1 >= m.total ? 280 : 0);
          if (doneCount + 1 < m.total) {
            const st = root.querySelector("#p-status");
            if (st) st.textContent = `Matched ${m.doneIds.size} of ${m.total}`;
          }
        } else {
          const a = m.sel.el;
          a.classList.add("wrong");
          el.classList.add("wrong");
          setTimeout(() => {
            a.classList.remove("wrong", "sel");
            el.classList.remove("wrong");
          }, 450);
          m.sel = null;
        }
      });
    });
    return `Matched ${doneCount} of ${m.total}`;
  }

  /** @param {number[] | null} onlyIndices item indices to practice (retry wrong) */
  function newQuiz(onlyIndices) {
    const list = block.items;
    const order =
      onlyIndices && onlyIndices.length
        ? shuffle(onlyIndices.slice())
        : shuffle(list.map((_, i) => i));
    state.quiz = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      wrong: [], // item indices missed this pass
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderQuiz(stage) {
    const list = block.items;
    if (!state.quiz) newQuiz();
    const q = state.quiz;
    const passLen = q.order.length;

    if (q.pos >= q.order.length) {
      const wrongN = q.wrong.length;
      reportMode("quiz", { score: q.score, total: passLen });
      const sub =
        wrongN > 0
          ? `${wrongN} to retry · or continue to Word`
          : "All correct · next: Word";
      const rows = reviewRowsFromIndices(list, q.order, q.wrong);
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Quiz done</div>
          <div class="scoreline">${q.score} / ${passLen}</div>
          <div class="sub">${sub}${q.retryPass ? " (retry pass)" : ""}</div>
          ${modeReviewListHtml(rows, starMeta)}
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="q-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="q-type">3 · Word →</button>`
                : `<button type="button" class="btn" id="q-again">Try full set</button>
                   <button type="button" class="btn primary" id="q-type">3 · Word →</button>`
            }
          </div>
          ${
            wrongN > 0
              ? `<button type="button" class="link" id="q-again">Try full set</button>`
              : ""
          }
        </div>`;
      wireModeReview(stage, rows);
      const retryBtn = stage.querySelector("#q-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newQuiz(q.wrong.slice());
          render();
        };
      }
      stage.querySelector("#q-type").onclick = () =>
        afterReviewContinue(() => setMode("type"));
      const again = stage.querySelector("#q-again");
      if (again) {
        again.onclick = () => {
          newQuiz();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Finished · ${wrongN} wrong`
        : `Finished · ${q.score}/${passLen}`;
    }

    const itemIndex = q.order[q.pos];
    const it = list[itemIndex];
    contextFromItem(it, itemIndex, {
      stage: "quiz",
      prompt: promptOf(it, state.czToEn),
      answer: answerOf(it, state.czToEn),
      typed: "",
    });
    const correct = answerOf(it, state.czToEn);
    const others = shuffle(
      list.filter((x) => answerOf(x, state.czToEn) !== correct),
    )
      .slice(0, 3)
      .map((x) => answerOf(x, state.czToEn));
    const opts = shuffle([correct, ...others]);

    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        <div class="prompt">${escapeHtml(promptOf(it, state.czToEn))}</div>
        <div class="sub">Choose the ${state.czToEn ? "English" : "Czech"} — 1–4 to answer · Enter for next</div>
        <div class="opts">
          ${opts
            .map(
              (o, i) =>
                `<button type="button" class="opt" data-i="${i}"><span class="knum">${i + 1}</span>${escapeHtml(o)}</button>`,
            )
            .join("")}
        </div>
      </div>`;

    const goNextQuestion = () => {
      if (state.advanceTimer) {
        clearTimeout(state.advanceTimer);
        state.advanceTimer = null;
      }
      q.pos++;
      q.answered = false;
      render();
    };

    const pick = (i) => {
      if (q.answered) return;
      q.answered = true;
      const buttons = [...stage.querySelectorAll(".opt")];
      if (opts[i] === correct) {
        buttons[i].classList.add("correct");
        q.score++;
      } else {
        buttons[i].classList.add("wrong");
        const ci = opts.indexOf(correct);
        if (ci >= 0) buttons[ci].classList.add("correct");
        if (!q.wrong.includes(itemIndex)) q.wrong.push(itemIndex);
      }
      // Auto-advance; Enter skips the wait
      state.advanceTimer = setTimeout(goNextQuestion, 750);
    };

    stage.querySelectorAll(".opt").forEach((el) => {
      el.addEventListener("click", () => pick(+el.dataset.i));
    });

    clearKey();
    state.keyHandler = (e) => {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "Enter") {
        if (q.answered) {
          e.preventDefault();
          goNextQuestion();
        }
        return;
      }
      if (q.answered) return;
      if (e.target.closest("button.mode, button.dir, #p-exit")) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= opts.length) {
        e.preventDefault();
        pick(n - 1);
      }
    };
    document.addEventListener("keydown", state.keyHandler);

    const passLabel = q.retryPass ? "retry" : "set";
    return `Question ${q.pos + 1} of ${passLen} (${passLabel}) · Score ${q.score}`;
  }

  /** @param {number[] | null} onlyIndices item indices to practice (retry wrong) */
  function newType(onlyIndices) {
    const list = block.items;
    const order =
      onlyIndices && onlyIndices.length
        ? shuffle(onlyIndices.slice())
        : shuffle(list.map((_, i) => i));
    state.typ = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      missedThis: false,
      wrong: [], // item indices missed this pass
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderType(stage) {
    const list = block.items;
    if (!state.typ) newType();
    const t = state.typ;
    const passLen = t.order.length;

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      const perfect = wrongN === 0;
      // Leaf fruit = perfect Word pass (carrier Sentence is optional).
      reportMode("type", {
        score: t.score,
        total: passLen,
        perfect,
        awardFruit: !isFrames && perfect,
      });
      const hasSent = isFrames || sentenceList().length > 0;
      let sub;
      if (wrongN > 0) {
        sub = hasSent
          ? `${wrongN} to retry · or continue to Sentence`
          : `${wrongN} to retry for fruit`;
      } else if (isFrames) {
        sub = "All correct · next: Sentence";
      } else if (hasSent) {
        sub = "All correct · fruit on the leaf · optional Sentence →";
      } else {
        sub = "All correct · fruit on the leaf · Sentence needs carriers for this unit";
      }
      const sentBtn = hasSent
        ? `<button type="button" class="${perfect && !isFrames ? "btn" : "btn primary"}" id="t-sent">4 · Sentence →</button>`
        : "";
      const primaryAfter =
        wrongN > 0
          ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
             ${sentBtn}`
          : hasSent
            ? `<button type="button" class="btn" id="t-again">Try full set</button>
               <button type="button" class="btn primary" id="t-sent">4 · Sentence →</button>`
            : `<button type="button" class="btn primary" id="t-again">Try full set</button>
               <button type="button" class="btn" id="t-match">1 · Match</button>`;
      const rows = reviewRowsFromIndices(list, t.order, t.wrong);
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Type-in done</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${sub}${t.retryPass ? " (retry pass)" : ""}</div>
          ${modeReviewListHtml(rows, starMeta)}
          <div class="nav">${primaryAfter}</div>
          ${
            wrongN > 0
              ? `<button type="button" class="link" id="t-again">Try full set</button>`
              : ""
          }
        </div>`;
      wireModeReview(stage, rows);
      const retryBtn = stage.querySelector("#t-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newType(t.wrong.slice());
          render();
        };
      }
      const sent = stage.querySelector("#t-sent");
      if (sent) {
        sent.onclick = () => afterReviewContinue(() => setMode("sentence"));
      }
      const matchBtn = stage.querySelector("#t-match");
      if (matchBtn) {
        matchBtn.onclick = () => afterReviewContinue(() => setMode("match"));
      }
      const again = stage.querySelector("#t-again");
      if (again) {
        again.onclick = () => {
          newType();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Finished · ${wrongN} wrong`
        : `Finished · ${t.score}/${passLen}`;
    }

    const itemIndex = t.order[t.pos];
    const it = list[itemIndex];
    const frame = isFrameItem(it);
    // Frames: always gap-fill in English (seed production). Leaves: CZ↔EN word.
    const prompt = frame
      ? it.gap
      : promptOf(it, state.czToEn);
    const answer = frame ? it.gap_answer : answerOf(it, state.czToEn);
    contextFromItem(it, itemIndex, {
      stage: "type",
      prompt,
      answer,
      typed: "",
    });
    const sub = frame
      ? `${gapFillInstruction(answer)} · Enter = check / next`
      : `Type the ${state.czToEn ? "English" : "Czech"} · Enter = check / next`;
    const passLabel = t.retryPass ? "retry" : "set";
    stage.innerHTML = `
      <div class="q">
        ${diagramBlock(it)}
        ${frame ? `<div class="sub" style="margin-bottom:0.35rem">${escapeHtml(it.cz)}</div>` : ""}
        <div class="prompt prompt-gap">${escapeHtml(prompt)}</div>
        <div class="sub">${sub}</div>
        <input class="type-in" id="ti" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here…" />
        <div class="fb" id="tfb"></div>
        <div class="nav"><button type="button" class="btn primary" id="chk">Check</button></div>
        <button type="button" class="link" id="skip">Show answer</button>
      </div>`;

    const inp = stage.querySelector("#ti");
    const chk = stage.querySelector("#chk");
    const fb = stage.querySelector("#tfb");
    const skip = stage.querySelector("#skip");
    inp.addEventListener("input", () => setFlagContext({ typed: inp.value }));
    inp.focus();

    function goNext() {
      if (t.missedThis) {
        const idx = t.order[t.pos];
        if (!t.wrong.includes(idx)) t.wrong.push(idx);
      }
      t.pos++;
      t.answered = false;
      t.missedThis = false;
      render();
    }

    function afterGrade() {
      inp.disabled = true;
      skip.style.visibility = "hidden";
      chk.textContent = t.pos === passLen - 1 ? "See score" : "Next";
      chk.onclick = goNext;
      chk.focus();
    }

    function grade() {
      if (t.answered) return;
      t.answered = true;
      t.missedThis = false;
      if (isCorrectAnswer(inp.value, it, answer, { forGap: frame })) {
        t.score++;
        fb.textContent = "✓ Correct";
        fb.className = "fb good";
      } else {
        t.missedThis = true;
        fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(answer)}</span>`;
        fb.className = "fb bad";
        const s = document.createElement("button");
        s.type = "button";
        s.className = "link";
        s.textContent = "I was right → count it";
        s.onclick = () => {
          t.score++;
          t.missedThis = false;
          s.textContent = "counted ✓";
          s.disabled = true;
        };
        fb.appendChild(document.createElement("br"));
        fb.appendChild(s);
      }
      afterGrade();
    }

    chk.onclick = () => {
      if (t.answered) goNext();
      else grade();
    };
    skip.onclick = () => {
      if (t.answered) return;
      inp.value = "";
      grade();
    };

    bindEnter((e) => {
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      if (t.answered) goNext();
      else grade();
    });

    return `${passLabel} ${t.pos + 1} / ${passLen} · score ${t.score}`;
  }

  // ---- 4 · Sentence: CZ → EN (trunk frames + leaf models from unit words) ----
  function newFrameSentence(onlyIndices) {
    const list = sentenceList();
    const order =
      onlyIndices && onlyIndices.length
        ? shuffle(onlyIndices.slice())
        : shuffle(list.map((_, i) => i));
    state.typ = {
      order,
      pos: 0,
      score: 0,
      answered: false,
      missedThis: false,
      wrong: [],
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderFrameSentence(stage) {
    const list = sentenceList();
    // Leaf with no carriers: honest empty (fruit already from Word).
    if (!isFrames && !list.length) {
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">No carrier sentences yet</div>
          <div class="sub">
            Leaf Sentence recycles fixed core frames (e.g. <em>I'd like a ticket</em>, <em>There is a…</em>), not free invented lines.
            This unit has no tagged / allowlisted carriers — fruit comes from <strong>Word</strong> (mode 3).
          </div>
          <div class="nav">
            <button type="button" class="btn primary" id="fs-type">3 · Word →</button>
            <button type="button" class="btn" id="fs-match">1 · Match</button>
          </div>
        </div>`;
      stage.querySelector("#fs-type").onclick = () => setMode("type");
      stage.querySelector("#fs-match").onclick = () => setMode("match");
      bindEnterPrimary(stage);
      return "Sentence · carriers pending";
    }
    if (!state.typ) newFrameSentence();
    const t = state.typ;
    const passLen = t.order.length;
    const leafHint = isFrames
      ? "Reproduce the English frame"
      : "Unit word in a fixed carrier frame";

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      // Trunk fruit = perfect Sentence. Leaf fruit already from Word; Sentence still reports.
      if (wrongN === 0) {
        reportMode("sentence", {
          score: t.score,
          total: passLen,
          perfect: true,
          awardFruit: isFrames,
        });
      }
      const rows = reviewRowsFromIndices(list, t.order, t.wrong);
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">${wrongN > 0 ? "Not complete yet" : "Section complete"}</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${
            wrongN > 0
              ? `${wrongN} wrong · retry until all correct${isFrames ? " for fruit" : ""}`
              : isFrames
                ? "Full sentences from Czech — all correct · fruit on the trunk."
                : "Carrier sentences complete · fruit already from Word on leaves."
          }${t.retryPass ? " (retry pass)" : ""}</div>
          ${modeReviewListHtml(rows, starMeta)}
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="fs-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="fs-match">1 · Match</button>`
                : `<button type="button" class="btn" id="fs-again">Try full set</button>
                   <button type="button" class="btn primary" id="fs-match">1 · Match again</button>`
            }
          </div>
          ${
            wrongN > 0
              ? `<button type="button" class="link" id="fs-again">Try full set</button>`
              : ""
          }
        </div>`;
      wireModeReview(stage, rows);
      const retryBtn = stage.querySelector("#fs-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newFrameSentence(t.wrong.slice());
          render();
        };
      }
      stage.querySelector("#fs-match").onclick = () =>
        afterReviewContinue(() => setMode("match"));
      const again = stage.querySelector("#fs-again");
      if (again) {
        again.onclick = () => {
          newFrameSentence();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Retry · ${wrongN} wrong`
        : `Complete · ${t.score}/${passLen}`;
    }

    const itemIndex = t.order[t.pos];
    const it = list[itemIndex];
    contextFromItem(it, itemIndex, {
      stage: "sentence",
      prompt: it.cz || "",
      answer: it.en || "",
      typed: "",
    });
    stage.innerHTML = `
      <div class="q">
        <div class="sub">Sentence <strong>${t.pos + 1}</strong> of <strong>${passLen}</strong>${t.retryPass ? " (retry)" : ""} · type the English</div>
        ${diagramBlock(it)}
        <div class="prompt" style="font-size:1.2rem">${escapeHtml(it.cz)}</div>
        <div class="sub">${escapeHtml(leafHint)} · Enter = check / next</div>
        <textarea class="type-in type-area" id="ti" rows="2" autocomplete="off" spellcheck="false" placeholder="type the English sentence…"></textarea>
        <div class="fb" id="tfb"></div>
        <div class="nav"><button type="button" class="btn primary" id="chk">Check</button></div>
        <button type="button" class="link" id="skip">Show answer</button>
      </div>`;

    const inp = stage.querySelector("#ti");
    const chk = stage.querySelector("#chk");
    const fb = stage.querySelector("#tfb");
    const skip = stage.querySelector("#skip");
    inp.addEventListener("input", () => setFlagContext({ typed: inp.value }));
    inp.focus();

    function goNext() {
      if (t.missedThis) {
        const idx = t.order[t.pos];
        if (!t.wrong.includes(idx)) t.wrong.push(idx);
      }
      t.pos++;
      t.answered = false;
      t.missedThis = false;
      render();
    }

    function afterGrade() {
      inp.disabled = true;
      skip.style.visibility = "hidden";
      chk.textContent = t.pos === passLen - 1 ? "Finish ✓" : "Next";
      chk.onclick = goNext;
      chk.focus();
    }

    function grade() {
      if (t.answered) return;
      t.answered = true;
      t.missedThis = false;
      if (isCorrectAnswer(inp.value, it, it.en)) {
        t.score++;
        fb.textContent = "✓ Correct";
        fb.className = "fb good";
      } else {
        t.missedThis = true;
        fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(it.en)}</span>`;
        fb.className = "fb bad";
        const s = document.createElement("button");
        s.type = "button";
        s.className = "link";
        s.textContent = "I was right → count it";
        s.onclick = () => {
          t.score++;
          t.missedThis = false;
          s.textContent = "counted ✓";
          s.disabled = true;
        };
        fb.appendChild(document.createElement("br"));
        fb.appendChild(s);
      }
      afterGrade();
    }

    chk.onclick = () => {
      if (t.answered) goNext();
      else grade();
    };
    skip.onclick = () => {
      if (t.answered) return;
      inp.value = "";
      grade();
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (t.answered) goNext();
      else grade();
    });
    bindEnter((e) => {
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      if (t.answered) goNext();
      else grade();
    });

    return `Sentence ${t.pos + 1} of ${passLen} · score ${t.score}`;
  }

  function renderSentence(stage) {
    return renderFrameSentence(stage);
  }

  function render() {
    clearKey();
    root.innerHTML = renderChrome("…");
    wireChrome();
    const stage = root.querySelector("#p-stage");
    let status = "";
    if (state.mode === "match") status = renderMatch(stage);
    else if (state.mode === "quiz") status = renderQuiz(stage);
    else if (state.mode === "type") status = renderType(stage);
    else status = renderSentence(stage);
    const st = root.querySelector("#p-status");
    if (st) st.textContent = status || "";
  }

  // Persistent 'F' shortcut for flag form — ignores typing fields; torn down on exit
  const flagKeyHandler = (e) => {
    if (e.key !== "f" && e.key !== "F") return;
    if (e.target.closest("input, textarea, select")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    openSmokeFlag();
  };
  document.addEventListener("keydown", flagKeyHandler);
  const origExit = opts.onExit;
  opts.onExit = () => {
    document.removeEventListener("keydown", flagKeyHandler);
    if (typeof origExit === "function") origExit();
  };

  // App can abort keys when replacing practice with first-fruit payoff
  root.__rueTeardown = () => {
    clearKey();
    document.removeEventListener("keydown", flagKeyHandler);
    root.__rueTeardown = null;
  };

  render();
}
