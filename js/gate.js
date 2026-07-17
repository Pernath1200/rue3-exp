/**
 * A1 thin level check — Quiz + Word + frame Sentence.
 * Pass (≥80%) unlocks A2 via progress.recordGate.
 * Same grading rules as practice ladder; no free leaf writing.
 */

import { isCorrectAnswer } from "./practice.js";
import { recordGate, getGate, hasPassedGate, isLevelUnlocked } from "./progress.js";

const QUIZ_N = 12;
const WORD_N = 12; // half leaf, half frame gap
const SENT_N = 6;
const PASS_RATIO = 0.8;

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pick(arr, n) {
  if (!arr.length) return [];
  const s = shuffle(arr);
  if (s.length >= n) return s.slice(0, n);
  // top up with repeats if pool too small
  const out = s.slice();
  while (out.length < n) out.push(s[out.length % s.length]);
  return out;
}

/**
 * @param {(path: string) => Promise<object>} loadJson
 * @param {object[]} a1LiveNodes tree nodes live on A1 with content
 */
export async function loadA1Pools(loadJson, a1LiveNodes) {
  const words = [];
  const frames = [];
  for (const n of a1LiveNodes) {
    if (!n.content) continue;
    try {
      const pack = await loadJson(`./data/${n.content}`);
      const isFrames = pack.practice === "frames";
      for (const b of pack.blocks || []) {
        for (const it of b.items || []) {
          const row = { ...it, _node: n.id, _block: b.id };
          if (isFrames || (it.gap && it.gap_answer)) frames.push(row);
          else words.push(row);
        }
      }
    } catch {
      /* skip broken pack */
    }
  }
  return { words, frames };
}

function buildPaper(pools) {
  const quizWords = pick(pools.words, Math.min(QUIZ_N, Math.max(4, pools.words.length)));
  // pad quiz from frames as CZ→EN full line if few words
  let quizItems = quizWords.map((it) => ({ kind: "word", item: it }));
  if (quizItems.length < QUIZ_N) {
    const extra = pick(pools.frames, QUIZ_N - quizItems.length);
    quizItems = quizItems.concat(extra.map((it) => ({ kind: "frame", item: it })));
  } else {
    quizItems = quizItems.slice(0, QUIZ_N);
  }

  const wordLeaf = pick(pools.words, Math.ceil(WORD_N / 2));
  const wordFrame = pick(
    pools.frames.filter((f) => f.gap && f.gap_answer),
    Math.floor(WORD_N / 2),
  );
  let typeItems = [
    ...wordLeaf.map((it) => ({ kind: "leaf", item: it })),
    ...wordFrame.map((it) => ({ kind: "gap", item: it })),
  ];
  typeItems = shuffle(typeItems);
  if (typeItems.length < WORD_N) {
    const more = pick(pools.words, WORD_N - typeItems.length);
    typeItems = typeItems.concat(more.map((it) => ({ kind: "leaf", item: it })));
  }
  typeItems = typeItems.slice(0, WORD_N);

  const sentItems = pick(
    pools.frames.filter((f) => f.en && f.cz),
    SENT_N,
  ).map((it) => ({ kind: "sentence", item: it }));

  return { quizItems, typeItems, sentItems };
}

function quizOptions(item, kind, poolWords, poolFrames) {
  const correct = kind === "frame" ? item.en : item.en;
  const pool = kind === "frame" ? poolFrames : poolWords;
  const others = shuffle(
    pool.filter((x) => (kind === "frame" ? x.en : x.en) !== correct),
  )
    .slice(0, 3)
    .map((x) => (kind === "frame" ? x.en : x.en));
  while (others.length < 3 && pool.length > 1) {
    const x = pool[Math.floor(Math.random() * pool.length)];
    const t = kind === "frame" ? x.en : x.en;
    if (t !== correct && !others.includes(t)) others.push(t);
    else break;
  }
  return shuffle([correct, ...others.slice(0, 3)]);
}

/**
 * @param {HTMLElement} root
 * @param {{ loadJson: Function, a1LiveNodes: object[], onExit: () => void, onDone: () => void }} opts
 */
export async function startA1Gate(root, opts) {
  const pools = await loadA1Pools(opts.loadJson, opts.a1LiveNodes);
  if (pools.words.length < 4 && pools.frames.length < 4) {
    root.innerHTML = `
      <div class="practice-head">
        <div class="practice-title">A1 level check</div>
        <div class="practice-meta">Not enough live content</div>
      </div>
      <div class="q">
        <div class="sub">Add A1 packs first, then try again.</div>
        <div class="nav"><button type="button" class="btn primary" id="g-exit">← Back</button></div>
      </div>`;
    root.querySelector("#g-exit").onclick = () => opts.onExit();
    return;
  }

  let paper = buildPaper(pools);
  const total =
    paper.quizItems.length + paper.typeItems.length + paper.sentItems.length;
  const passNeed = Math.ceil(total * PASS_RATIO);

  const state = {
    phase: "intro", // intro | quiz | type | sentence | done
    qi: 0,
    ti: 0,
    si: 0,
    score: 0,
    answered: false,
    keyHandler: null,
    recorded: false,
  };

  function clearKey() {
    if (state.keyHandler) {
      document.removeEventListener("keydown", state.keyHandler);
      state.keyHandler = null;
    }
  }

  function chrome(meta) {
    return `
      <div class="practice-head">
        <div class="practice-title">A1 level check</div>
        <div class="practice-meta">${escapeHtml(meta)}</div>
      </div>
      <div class="bar">
        <span id="g-status">Score ${state.score} · need ${passNeed} / ${total} to unlock A2</span>
        <span class="dir-static">CZ → EN · scored</span>
      </div>
      <div id="g-stage" class="stage"></div>
      <div class="practice-exit">
        <button type="button" class="btn-ghost" id="g-exit">← Exit check</button>
      </div>`;
  }

  function wireExit() {
    root.querySelector("#g-exit").onclick = () => {
      clearKey();
      opts.onExit();
    };
  }

  function setStatus() {
    const st = root.querySelector("#g-status");
    if (st) {
      st.textContent = `Score ${state.score} · need ${passNeed} / ${total} to unlock A2`;
    }
  }

  function renderIntro() {
    clearKey();
    const prev = getGate("A1");
    const already = hasPassedGate("A1") || isLevelUnlocked("A2");
    root.innerHTML = chrome("thin gate · not an exam");
    const stage = root.querySelector("#g-stage");
    stage.innerHTML = `
      <div class="q">
        <div class="prompt" style="font-size:1.2rem">Unlock A2</div>
        <div class="sub" style="text-align:left;max-width:28rem;margin:0.75rem auto 1rem">
          <strong>${QUIZ_N}</strong> Quiz · <strong>${WORD_N}</strong> Word · <strong>${SENT_N}</strong> frame sentences<br>
          Pass: <strong>${passNeed}</strong> / ${total} (${Math.round(PASS_RATIO * 100)}%) · unlimited retries<br>
          Flexible grading (near-enough English counts) · <em>I was right</em> if still marked wrong
        </div>
        ${
          prev
            ? `<div class="sub">Last attempt: ${prev.score}/${prev.total}${prev.passed ? " · passed ✓" : ""} · tries ${prev.attempts || 0}</div>`
            : ""
        }
        ${
          already
            ? `<div class="sub" style="color:var(--correct)">A2 is already unlocked on this browser.</div>`
            : ""
        }
        <div class="nav">
          <button type="button" class="btn primary" id="g-start">Start check →</button>
        </div>
      </div>`;
    wireExit();
    stage.querySelector("#g-start").onclick = () => {
      state.phase = "quiz";
      state.qi = 0;
      state.ti = 0;
      state.si = 0;
      state.score = 0;
      state.answered = false;
      render();
    };
  }

  function renderQuiz() {
    clearKey();
    if (state.qi >= paper.quizItems.length) {
      state.phase = "type";
      state.ti = 0;
      state.answered = false;
      render();
      return;
    }
    const row = paper.quizItems[state.qi];
    const it = row.item;
    const prompt = it.cz;
    const optsList = quizOptions(it, row.kind, pools.words, pools.frames);
    root.innerHTML = chrome(
      `1 · Quiz · ${state.qi + 1} / ${paper.quizItems.length}`,
    );
    const stage = root.querySelector("#g-stage");
    stage.innerHTML = `
      <div class="q">
        <div class="prompt">${escapeHtml(prompt)}</div>
        <div class="sub">Choose the English · 1–4</div>
        <div class="opts">
          ${optsList
            .map(
              (o, i) =>
                `<button type="button" class="opt" data-i="${i}"><span class="knum">${i + 1}</span>${escapeHtml(o)}</button>`,
            )
            .join("")}
        </div>
      </div>`;
    wireExit();
    setStatus();

    const correct = row.kind === "frame" ? it.en : it.en;
    const pick = (i) => {
      if (state.answered) return;
      state.answered = true;
      const buttons = [...stage.querySelectorAll(".opt")];
      if (optsList[i] === correct) {
        buttons[i].classList.add("correct");
        state.score++;
      } else {
        buttons[i].classList.add("wrong");
        const ci = optsList.indexOf(correct);
        if (ci >= 0) buttons[ci].classList.add("correct");
      }
      setStatus();
      setTimeout(() => {
        state.qi++;
        state.answered = false;
        render();
      }, 650);
    };

    stage.querySelectorAll(".opt").forEach((el) => {
      el.addEventListener("click", () => pick(+el.dataset.i));
    });
    state.keyHandler = (e) => {
      if (state.answered) return;
      if (e.target.closest("input, textarea")) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= optsList.length) {
        e.preventDefault();
        pick(n - 1);
      }
    };
    document.addEventListener("keydown", state.keyHandler);
  }

  function renderType() {
    clearKey();
    if (state.ti >= paper.typeItems.length) {
      state.phase = "sentence";
      state.si = 0;
      state.answered = false;
      render();
      return;
    }
    const row = paper.typeItems[state.ti];
    const it = row.item;
    const isGap = row.kind === "gap";
    const prompt = isGap ? it.gap : it.cz;
    const answer = isGap ? it.gap_answer : it.en;
    root.innerHTML = chrome(
      `2 · Word · ${state.ti + 1} / ${paper.typeItems.length}`,
    );
    const stage = root.querySelector("#g-stage");
    stage.innerHTML = `
      <div class="q">
        ${isGap ? `<div class="sub" style="margin-bottom:0.35rem">${escapeHtml(it.cz)}</div>` : ""}
        <div class="prompt prompt-gap">${escapeHtml(prompt)}</div>
        <div class="sub">${isGap ? "Type the missing word" : "Type the English"} · Enter = check / next</div>
        <input class="type-in" id="g-ti" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <div class="fb" id="g-fb"></div>
        <div class="nav"><button type="button" class="btn primary" id="g-chk">Check</button></div>
      </div>`;
    wireExit();
    setStatus();
    const inp = stage.querySelector("#g-ti");
    const chk = stage.querySelector("#g-chk");
    const fb = stage.querySelector("#g-fb");
    inp.focus();

    function goNext() {
      state.ti++;
      state.answered = false;
      render();
    }

    function grade() {
      if (state.answered) return;
      state.answered = true;
      const ok = isCorrectAnswer(inp.value, it, answer, { forGap: isGap });
      if (ok) {
        state.score++;
        fb.textContent = "✓ Correct";
        fb.className = "fb good";
      } else {
        fb.innerHTML = `✗ Model: <span class="reveal">${escapeHtml(answer)}</span>`;
        fb.className = "fb bad";
        const s = document.createElement("button");
        s.type = "button";
        s.className = "link";
        s.textContent = "I was right → count it";
        s.onclick = () => {
          state.score++;
          s.textContent = "counted ✓";
          s.disabled = true;
          setStatus();
        };
        fb.appendChild(document.createElement("br"));
        fb.appendChild(s);
      }
      setStatus();
      inp.disabled = true;
      chk.textContent = "Next";
      chk.onclick = goNext;
      chk.focus();
    }

    chk.onclick = () => {
      if (state.answered) goNext();
      else grade();
    };
    state.keyHandler = (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      if (state.answered) goNext();
      else grade();
    };
    document.addEventListener("keydown", state.keyHandler);
  }

  function renderSentence() {
    clearKey();
    if (state.si >= paper.sentItems.length) {
      finish();
      return;
    }
    const it = paper.sentItems[state.si].item;
    root.innerHTML = chrome(
      `3 · Sentence · ${state.si + 1} / ${paper.sentItems.length}`,
    );
    const stage = root.querySelector("#g-stage");
    stage.innerHTML = `
      <div class="q">
        <div class="prompt" style="font-size:1.15rem">${escapeHtml(it.cz)}</div>
        <div class="sub">Type the English frame · Enter = check / next</div>
        <textarea class="type-in type-area" id="g-ti" rows="2" autocomplete="off" spellcheck="false"></textarea>
        <div class="fb" id="g-fb"></div>
        <div class="nav"><button type="button" class="btn primary" id="g-chk">Check</button></div>
      </div>`;
    wireExit();
    setStatus();
    const inp = stage.querySelector("#g-ti");
    const chk = stage.querySelector("#g-chk");
    const fb = stage.querySelector("#g-fb");
    inp.focus();

    function goNext() {
      state.si++;
      state.answered = false;
      render();
    }

    function grade() {
      if (state.answered) return;
      state.answered = true;
      const ok = isCorrectAnswer(inp.value, it, it.en);
      if (ok) {
        state.score++;
        fb.textContent = "✓ Correct";
        fb.className = "fb good";
      } else {
        fb.innerHTML = `✗ Model: <span class="reveal">${escapeHtml(it.en)}</span>`;
        fb.className = "fb bad";
        const s = document.createElement("button");
        s.type = "button";
        s.className = "link";
        s.textContent = "I was right → count it";
        s.onclick = () => {
          state.score++;
          s.textContent = "counted ✓";
          s.disabled = true;
          setStatus();
        };
        fb.appendChild(document.createElement("br"));
        fb.appendChild(s);
      }
      setStatus();
      inp.disabled = true;
      chk.textContent = "Next";
      chk.onclick = goNext;
      chk.focus();
    }

    chk.onclick = () => {
      if (state.answered) goNext();
      else grade();
    };
    inp.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (state.answered) goNext();
      else grade();
    });
    state.keyHandler = (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      if (state.answered) goNext();
      else grade();
    };
    document.addEventListener("keydown", state.keyHandler);
  }

  function finish() {
    clearKey();
    state.phase = "done";
    const passed = state.score >= passNeed;
    let rec = getGate("A1");
    if (!state.recorded) {
      state.recorded = true;
      rec = recordGate("A1", {
        passed,
        score: state.score,
        total,
      });
    }
    root.innerHTML = chrome("finished");
    const stage = root.querySelector("#g-stage");
    stage.innerHTML = `
      <div class="q">
        <div class="prompt">${passed ? "A2 unlocked" : "Not yet"}</div>
        <div class="scoreline">${state.score} / ${total}</div>
        <div class="sub">
          ${
            passed
              ? "You passed the A1 level check. A2 is open on the level rail."
              : `Need ${passNeed} correct. Attempt ${(rec && rec.attempts) || 1} · try again anytime.`
          }
        </div>
        <div class="nav">
          ${
            passed
              ? `<button type="button" class="btn primary" id="g-a2">Go to A2 →</button>
                 <button type="button" class="btn" id="g-map">Back to map</button>`
              : `<button type="button" class="btn primary" id="g-retry">Try again</button>
                 <button type="button" class="btn" id="g-map">Back to map</button>`
          }
        </div>
      </div>`;
    wireExit();
    const map = stage.querySelector("#g-map");
    if (map) {
      map.onclick = () => {
        clearKey();
        opts.onDone();
      };
    }
    const a2 = stage.querySelector("#g-a2");
    if (a2) {
      a2.onclick = () => {
        clearKey();
        opts.onDone({ goLevel: "A2" });
      };
    }
    const retry = stage.querySelector("#g-retry");
    if (retry) {
      retry.onclick = () => {
        paper = buildPaper(pools);
        state.phase = "quiz";
        state.qi = 0;
        state.ti = 0;
        state.si = 0;
        state.score = 0;
        state.answered = false;
        state.recorded = false;
        render();
      };
    }
  }

  function render() {
    if (state.phase === "intro") renderIntro();
    else if (state.phase === "quiz") renderQuiz();
    else if (state.phase === "type") renderType();
    else if (state.phase === "sentence") renderSentence();
    else if (state.phase === "done") finish();
  }

  state.phase = "intro";
  render();
}
