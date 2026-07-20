/**
 * Practice ladder (Martin model, RUE3 shell):
 * Match → Quiz → Type word → Type sentence (Use it)
 * Default for word modes: CZ → EN
 * Sentence mode: always produce English (CZ gloss under words)
 */

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
  return expandContractions(String(s))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´]/g, "")
    // o'clock / oclock / o clock → same form (apostrophe optional)
    .replace(/\bo\s*clock\b/g, "oclock")
    .replace(/[.,!?;:"()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a |an |the )/, "");
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

const SENTENCE_FRAMES = [
  "Write one true sentence about you, using these words.",
  "Write one sentence about your home or family, using these words.",
  "Ask a question using one (or both) of the words.",
  "Make a negative sentence using one of the words.",
  "Write about yesterday using one of the words.",
];

function isFrameItem(item) {
  return Boolean(item && item.gap && item.gap_answer);
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
    keyHandler: null,
    advanceTimer: null,
  };
  /** One complete report per mode per practice session (finish screens re-render). */
  const reported = { match: false, quiz: false, type: false, sentence: false };

  function reportMode(mode, meta) {
    if (!mode || reported[mode]) return;
    reported[mode] = true;
    if (typeof opts.onModeComplete === "function") {
      opts.onModeComplete(mode, meta || {});
    }
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
    // Keep saved sentences when re-entering sentence mode from the mode bar
    if (m !== "sentence") state.use = null;
    else if (!state.use) newUse();
    render();
  }

  function renderChrome(statusText) {
    const modes = [
      ["match", "1 · Match"],
      ["quiz", "2 · Quiz"],
      ["type", "3 · Word"],
      ["sentence", "4 · Sentence"],
    ];
    const showDir = state.mode !== "sentence";
    return `
      <div class="practice-head">
        <div class="practice-title">${escapeHtml(block.title)}</div>
        <div class="practice-meta">${block.items.length} ${isFrames ? "frames" : "words"} · A1${isFrames ? " · trunk seed" : ""}</div>
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
        ${
          showDir
            ? `<button type="button" class="dir" id="p-dir">${state.czToEn ? "CZ → EN" : "EN → CZ"}</button>`
            : `<span class="dir-static">Write in English</span>`
        }
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
  }

  function newMatch() {
    const pool = shuffle(block.items).slice(0, Math.min(6, block.items.length));
    const left = pool.map((it, i) => ({ t: promptOf(it, state.czToEn), id: i }));
    const right = shuffle(
      pool.map((it, i) => ({ t: answerOf(it, state.czToEn), id: i })),
    );
    state.match = {
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

    if (doneCount === m.total) {
      reportMode("match");
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">All matched</div>
          <div class="sub">Next: Quiz → Word → Sentence · Enter continues</div>
          <div class="nav">
            <button type="button" class="btn" id="m-again">New set</button>
            <button type="button" class="btn primary" id="m-quiz">2 · Quiz →</button>
          </div>
        </div>`;
      stage.querySelector("#m-again").onclick = () => {
        newMatch();
        render();
      };
      stage.querySelector("#m-quiz").onclick = () => setMode("quiz");
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
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Quiz done</div>
          <div class="scoreline">${q.score} / ${passLen}</div>
          <div class="sub">${sub}${q.retryPass ? " (retry pass)" : ""}</div>
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
      const retryBtn = stage.querySelector("#q-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newQuiz(q.wrong.slice());
          render();
        };
      }
      stage.querySelector("#q-type").onclick = () => setMode("type");
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
      reportMode("type", { score: t.score, total: passLen });
      const sub =
        wrongN > 0
          ? `${wrongN} to retry · or continue to Sentence`
          : "All correct · next: Sentence";
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Type-in done</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${sub}${t.retryPass ? " (retry pass)" : ""}</div>
          <div class="nav">
            ${
              wrongN > 0
                ? `<button type="button" class="btn primary" id="t-retry">Retry wrong (${wrongN})</button>
                   <button type="button" class="btn" id="t-sent">4 · Sentence →</button>`
                : `<button type="button" class="btn" id="t-again">Try full set</button>
                   <button type="button" class="btn primary" id="t-sent">4 · Sentence →</button>`
            }
          </div>
          ${
            wrongN > 0
              ? `<button type="button" class="link" id="t-again">Try full set</button>`
              : ""
          }
        </div>`;
      const retryBtn = stage.querySelector("#t-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newType(t.wrong.slice());
          render();
        };
      }
      stage.querySelector("#t-sent").onclick = () => setMode("sentence");
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

    const it = list[t.order[t.pos]];
    const frame = isFrameItem(it);
    // Frames: always gap-fill in English (seed production). Leaves: CZ↔EN word.
    const prompt = frame
      ? it.gap
      : promptOf(it, state.czToEn);
    const answer = frame ? it.gap_answer : answerOf(it, state.czToEn);
    const sub = frame
      ? "Type the missing English word · Enter = check / next"
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

  // ---- 4 · Type sentence (Use it) ----
  function deal() {
    const words = shuffle(block.items);
    const n = words.length >= 2 && Math.random() > 0.35 ? 2 : 1;
    return {
      words: words.slice(0, n),
      frame: SENTENCE_FRAMES[Math.floor(Math.random() * SENTENCE_FRAMES.length)],
    };
  }

  function sentenceTarget() {
    return block.items.length;
  }

  function newUse() {
    state.use = {
      n: 1,
      sentences: [],
      cur: deal(),
      answered: false,
      review: false,
      complete: false,
    };
  }

  function copySentences(sentences, msgEl) {
    const text = sentences.map((s) => "• " + s).join("\n");
    const ok = () => {
      if (msgEl) msgEl.textContent = "Copied — paste to notes / teacher.";
    };
    const fail = () => {
      if (msgEl) msgEl.textContent = "Copy blocked — select the list and copy.";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else fail();
  }

  function renderSentenceComplete(stage) {
    const u = state.use;
    const target = sentenceTarget();
    reportMode("sentence", { score: u.sentences.length, total: target });
    stage.innerHTML = `
      <div class="q sent-review">
        <div class="prompt">Section complete</div>
        <div class="scoreline">${u.sentences.length} / ${target}</div>
        <div class="sub">You wrote ${target} sentences for this block — fruit on the leaf.</div>
        <div class="sent-list-mini">
          ${u.sentences.map((s) => `<div class="sent">${escapeHtml(s)}</div>`).join("")}
        </div>
        <div class="nav">
          <button type="button" class="btn" id="u-again">Try again</button>
          <button type="button" class="btn primary" id="u-copy-done">Copy all</button>
        </div>
        <div class="sub" id="cmsg" style="margin-top:0.5rem"></div>
        <button type="button" class="link" id="u-more">Write more (optional)</button>
      </div>`;

    stage.querySelector("#u-again").onclick = () => {
      newUse();
      render();
    };
    stage.querySelector("#u-copy-done").onclick = () => {
      copySentences(u.sentences, stage.querySelector("#cmsg"));
    };
    stage.querySelector("#u-more").onclick = () => {
      // Optional extra practice beyond target
      u.complete = false;
      u.answered = false;
      u.cur = deal();
      u.n = u.sentences.length + 1;
      render();
    };
    bindEnterPrimary(stage);
    return `Complete · ${u.sentences.length} / ${target}`;
  }

  function renderSentenceReview(stage) {
    const u = state.use;
    const target = sentenceTarget();
    stage.innerHTML = `
      <div class="q sent-review">
        <div class="prompt" style="font-size:1.15rem">My sentences</div>
        <div class="sub">${u.sentences.length} / ${target} toward complete · Enter goes back</div>
        ${
          u.sentences.length
            ? u.sentences
                .map((s) => `<div class="sent">${escapeHtml(s)}</div>`)
                .join("")
            : `<div class="sub">Nothing saved yet.</div>`
        }
        <div class="nav">
          <button type="button" class="btn primary" id="u-back">◀ Back</button>
          ${
            u.sentences.length
              ? `<button type="button" class="btn" id="u-copy">Copy all</button>`
              : ""
          }
        </div>
        <div class="sub" id="cmsg" style="margin-top:0.5rem"></div>
      </div>`;

    stage.querySelector("#u-back").onclick = () => {
      u.review = false;
      if (!u.answered) u.cur = deal();
      u.answered = false;
      render();
    };
    const cp = stage.querySelector("#u-copy");
    if (cp) {
      cp.onclick = () =>
        copySentences(u.sentences, stage.querySelector("#cmsg"));
    }
    bindEnterPrimary(stage);
    return `${u.sentences.length} / ${target} sentences`;
  }

  /** Trunk frames: reproduce full English from Czech (supports retry wrong) */
  function newFrameSentence(onlyIndices) {
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
      wrong: [],
      retryPass: Boolean(onlyIndices && onlyIndices.length),
    };
  }

  function renderFrameSentence(stage) {
    const list = block.items;
    if (!state.typ) newFrameSentence();
    const t = state.typ;
    const passLen = t.order.length;

    if (t.pos >= t.order.length) {
      const wrongN = t.wrong.length;
      reportMode("sentence", { score: t.score, total: passLen });
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">Section complete</div>
          <div class="scoreline">${t.score} / ${passLen}</div>
          <div class="sub">${
            wrongN > 0
              ? `${wrongN} to retry · seed frames`
              : "Full sentences from Czech — seed frames locked in."
          }${t.retryPass ? " (retry pass)" : ""}</div>
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
      const retryBtn = stage.querySelector("#fs-retry");
      if (retryBtn) {
        retryBtn.onclick = () => {
          newFrameSentence(t.wrong.slice());
          render();
        };
      }
      stage.querySelector("#fs-match").onclick = () => setMode("match");
      const again = stage.querySelector("#fs-again");
      if (again) {
        again.onclick = () => {
          newFrameSentence();
          render();
        };
      }
      bindEnterPrimary(stage);
      return wrongN > 0
        ? `Complete · ${wrongN} wrong`
        : `Complete · ${t.score}/${passLen}`;
    }

    const it = list[t.order[t.pos]];
    stage.innerHTML = `
      <div class="q">
        <div class="sub">Sentence <strong>${t.pos + 1}</strong> of <strong>${passLen}</strong>${t.retryPass ? " (retry)" : ""} · type the English</div>
        ${diagramBlock(it)}
        <div class="prompt" style="font-size:1.2rem">${escapeHtml(it.cz)}</div>
        <div class="sub">Reproduce the English frame · Enter = check / next</div>
        <textarea class="type-in type-area" id="ti" rows="2" autocomplete="off" spellcheck="false" placeholder="type the English sentence…"></textarea>
        <div class="fb" id="tfb"></div>
        <div class="nav"><button type="button" class="btn primary" id="chk">Check</button></div>
        <button type="button" class="link" id="skip">Show answer</button>
      </div>`;

    const inp = stage.querySelector("#ti");
    const chk = stage.querySelector("#chk");
    const fb = stage.querySelector("#tfb");
    const skip = stage.querySelector("#skip");
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
    // Trunk seed frames: reproduce model sentences (not free leaf production)
    if (isFrames) return renderFrameSentence(stage);

    if (!state.use) newUse();
    const u = state.use;
    const target = sentenceTarget();

    if (u.complete) return renderSentenceComplete(stage);
    if (u.review) return renderSentenceReview(stage);

    // Progress index: next sentence to write is sentences.length + 1 (unless mid-feedback)
    const progressNum = Math.min(u.sentences.length + (u.answered ? 0 : 1), target);
    const c = u.cur;
    stage.innerHTML = `
      <div class="q">
        <div class="words">
          ${c.words
            .map(
              (w) =>
                `<span class="pill">${escapeHtml(w.en)}<small>${escapeHtml(w.cz)}</small></span>`,
            )
            .join("")}
        </div>
        <div class="frame-prompt">${escapeHtml(c.frame)}</div>
        <div class="sub" style="margin-bottom:0.5rem">
          Sentence <strong>${progressNum}</strong> of <strong>${target}</strong>
          · Enter = save / next · Shift+Enter = new line
        </div>
        <textarea class="type-in type-area" id="ui" rows="3" autocomplete="off" spellcheck="false" placeholder="type your sentence in English…"></textarea>
        <div class="fb" id="ufb"></div>
        <div class="nav"><button type="button" class="btn primary" id="udone">Done</button></div>
        <button type="button" class="link" id="usaved">My sentences (${u.sentences.length} / ${target})</button>
      </div>`;

    const ta = stage.querySelector("#ui");
    const fb = stage.querySelector("#ufb");
    const btn = stage.querySelector("#udone");
    ta.focus();

    function advanceOrSave() {
      if (!u.answered) {
        const text = ta.value.trim();
        if (!text) {
          fb.textContent = "Type a sentence first.";
          fb.className = "fb";
          fb.style.color = "var(--muted)";
          return;
        }
        u.answered = true;
        ta.disabled = true;
        u.sentences.push(text);
        const lower = text.toLowerCase();
        const used = c.words.filter((w) =>
          lower.includes(keyWord(w).toLowerCase()),
        );
        if (used.length === c.words.length) {
          fb.textContent =
            "✓ Saved — you used: " + used.map(keyWord).join(", ");
          fb.className = "fb good";
        } else {
          const missing = c.words
            .filter((w) => !used.includes(w))
            .map(keyWord)
            .join(", ");
          fb.textContent = "Saved. Tip: it didn’t contain: " + missing;
          fb.className = "fb";
          fb.style.color = "var(--muted)";
        }
        const hitTarget = u.sentences.length >= target;
        btn.textContent = hitTarget ? "Finish ✓" : "Next";
        btn.focus();
      } else {
        if (u.sentences.length >= target) {
          u.complete = true;
          render();
          return;
        }
        u.n++;
        u.cur = deal();
        u.answered = false;
        render();
      }
    }

    btn.onclick = advanceOrSave;

    ta.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      advanceOrSave();
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();
      advanceOrSave();
    });

    bindEnter((e) => {
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      advanceOrSave();
    });

    stage.querySelector("#usaved").onclick = () => {
      u.review = true;
      render();
    };

    return `Sentence ${progressNum} of ${target} · saved ${u.sentences.length}`;
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

  render();
}
