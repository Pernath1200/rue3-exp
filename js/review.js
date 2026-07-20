/**
 * Unit review queue — Quiz + Word sample, scored, feeds SRS schedule.
 * Not the full ladder; first learn still uses practice.js.
 */

import { isCorrectAnswer } from "./practice.js";
import {
  recordReview,
  REVIEW_PASS_RATIO,
  formatDueLabel,
  MASTERY_REPS,
} from "./progress.js";

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

function isFrameItem(item) {
  return Boolean(item && item.gap && item.gap_answer);
}

function sample(items, n) {
  if (!items.length) return [];
  return shuffle(items).slice(0, Math.min(n, items.length));
}

function flattenPack(pack) {
  const out = [];
  for (const b of pack.blocks || []) {
    for (const it of b.items || []) out.push(it);
  }
  return out;
}

/**
 * @param {HTMLElement} root
 * @param {{
 *   units: Array<{ nodeId: string, label: string }>,
 *   loadPack: (nodeId: string) => Promise<object|null>,
 *   onDone: () => void,
 *   onExit: () => void,
 * }} opts
 */
export function startReviewQueue(root, opts) {
  const queue = (opts.units || []).slice();
  const results = [];
  let qi = 0;
  let keyHandler = null;

  function clearKey() {
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
  }

  function bindEnter(fn) {
    clearKey();
    keyHandler = (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (e.target.closest("textarea")) return;
      e.preventDefault();
      fn(e);
    };
    document.addEventListener("keydown", keyHandler);
  }

  function chrome(title, status) {
    return `
      <div class="practice-head">
        <div class="practice-title">${escapeHtml(title)}</div>
        <div class="practice-meta">Review · unit ${qi + 1} of ${queue.length}</div>
      </div>
      <div class="practice-modes" style="justify-content:space-between">
        <span id="r-status" class="practice-status">${escapeHtml(status || "")}</span>
        <span class="dir-static">CZ → EN · scored</span>
      </div>
      <div id="r-stage" class="practice-stage"></div>
      <div class="practice-foot">
        <button type="button" class="btn-ghost" id="r-exit">← Back to tree</button>
      </div>`;
  }

  function wireExit() {
    const btn = root.querySelector("#r-exit");
    if (btn) {
      btn.onclick = () => {
        clearKey();
        opts.onExit();
      };
    }
  }

  function showSummary() {
    clearKey();
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    root.innerHTML = `
      <div class="practice-head">
        <div class="practice-title">Review done</div>
        <div class="practice-meta">Today's queue</div>
      </div>
      <div class="practice-stage">
        <div class="q">
          <div class="prompt">Queue complete</div>
          <div class="scoreline">${passed} passed · ${failed} to revisit soon</div>
          <div class="sub">Remembered / Mastered meters update on passes only.</div>
          <ul class="today-list" style="text-align:left;margin:1rem auto;max-width:22rem">
            ${results
              .map(
                (r) =>
                  `<li><strong>${escapeHtml(r.label)}</strong> — ${r.score}/${r.total} · ${
                    r.passed ? "pass" : "fail"
                  }</li>`,
              )
              .join("")}
          </ul>
          <div class="nav">
            <button type="button" class="btn primary" id="r-done">Back to map</button>
          </div>
        </div>
      </div>
      <div class="practice-foot">
        <button type="button" class="btn-ghost" id="r-exit">← Back to tree</button>
      </div>`;
    root.querySelector("#r-done").onclick = () => {
      clearKey();
      opts.onDone();
    };
    wireExit();
    bindEnter(() => root.querySelector("#r-done")?.click());
  }

  async function runUnit() {
    if (qi >= queue.length) {
      showSummary();
      return;
    }
    const unit = queue[qi];
    let pack;
    try {
      pack = await opts.loadPack(unit.nodeId);
    } catch {
      pack = null;
    }
    if (!pack) {
      results.push({
        nodeId: unit.nodeId,
        label: unit.label,
        score: 0,
        total: 0,
        passed: false,
        error: true,
      });
      qi++;
      runUnit();
      return;
    }

    const items = flattenPack(pack);
    const quizItems = sample(items, 6);
    const wordItems = sample(items, 6);
    const total = quizItems.length + wordItems.length;
    let score = 0;
    let phase = "quiz"; // quiz | word | result
    let pos = 0;
    let answered = false;

    root.innerHTML = chrome(unit.label, "");
    wireExit();
    const stage = root.querySelector("#r-stage");
    const statusEl = root.querySelector("#r-status");

    function setStatus() {
      if (statusEl) {
        statusEl.textContent =
          phase === "quiz"
            ? `Quiz ${pos + 1}/${quizItems.length} · score ${score}`
            : phase === "word"
              ? `Word ${pos + 1}/${wordItems.length} · score ${score}`
              : `Score ${score}/${total}`;
      }
    }

    function finishUnit() {
      const passed = total > 0 && score / total >= REVIEW_PASS_RATIO;
      const rev = recordReview(unit.nodeId, { passed, score, total });
      results.push({
        nodeId: unit.nodeId,
        label: unit.label,
        score,
        total,
        passed,
      });
      phase = "result";
      clearKey();
      const need = Math.ceil(REVIEW_PASS_RATIO * total);
      const reps = rev ? rev.successfulReps : 0;
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">${passed ? "Unit passed" : "Keep this one warm"}</div>
          <div class="scoreline">${score} / ${total}</div>
          <div class="sub">
            Need ${need} to pass ·
            ${passed ? `successful reviews: ${reps}${reps >= MASTERY_REPS ? " · Mastered" : reps >= 1 ? " · Remembered" : ""}` : "reps unchanged"}
            · next ${escapeHtml(formatDueLabel(rev && rev.nextDueAt))}
          </div>
          <div class="nav">
            <button type="button" class="btn primary" id="r-next">
              ${qi + 1 < queue.length ? "Next unit →" : "See summary"}
            </button>
          </div>
        </div>`;
      stage.querySelector("#r-next").onclick = () => {
        qi++;
        runUnit();
      };
      bindEnter(() => stage.querySelector("#r-next")?.click());
      setStatus();
    }

    function renderQuiz() {
      answered = false;
      if (pos >= quizItems.length) {
        phase = "word";
        pos = 0;
        renderWord();
        return;
      }
      const it = quizItems[pos];
      const correct = it.en;
      const others = shuffle(items.filter((x) => x.en !== correct))
        .slice(0, 3)
        .map((x) => x.en);
      const optsQ = shuffle([correct, ...others]);
      stage.innerHTML = `
        <div class="q">
          <div class="prompt">${escapeHtml(it.cz || it.en)}</div>
          <div class="sub">Choose the English — 1–4 · Enter for next</div>
          <div class="opts">
            ${optsQ
              .map(
                (o, i) =>
                  `<button type="button" class="opt" data-i="${i}"><span class="knum">${i + 1}</span>${escapeHtml(o)}</button>`,
              )
              .join("")}
          </div>
        </div>`;
      setStatus();

      const goNext = () => {
        pos++;
        renderQuiz();
      };
      const pick = (i) => {
        if (answered) return;
        answered = true;
        const buttons = [...stage.querySelectorAll(".opt")];
        if (optsQ[i] === correct) {
          buttons[i].classList.add("correct");
          score++;
        } else {
          buttons[i].classList.add("wrong");
          const ci = optsQ.indexOf(correct);
          if (ci >= 0) buttons[ci].classList.add("correct");
        }
        setStatus();
        setTimeout(goNext, 650);
      };
      stage.querySelectorAll(".opt").forEach((el) => {
        el.addEventListener("click", () => pick(+el.dataset.i));
      });
      clearKey();
      keyHandler = (e) => {
        if (e.target.closest("input, textarea")) return;
        if (e.key === "Enter" && answered) {
          e.preventDefault();
          goNext();
          return;
        }
        if (answered) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= optsQ.length) {
          e.preventDefault();
          pick(n - 1);
        }
      };
      document.addEventListener("keydown", keyHandler);
    }

    function renderWord() {
      answered = false;
      if (pos >= wordItems.length) {
        finishUnit();
        return;
      }
      const it = wordItems[pos];
      const frame = isFrameItem(it);
      const prompt = frame ? it.gap : it.cz;
      const answer = frame ? it.gap_answer : it.en;
      stage.innerHTML = `
        <div class="q">
          ${frame ? `<div class="sub" style="margin-bottom:0.35rem">${escapeHtml(it.cz)}</div>` : ""}
          <div class="prompt prompt-gap">${escapeHtml(prompt)}</div>
          <div class="sub">Type the ${frame ? "missing word" : "English"} · Enter = check / next</div>
          <input class="type-in" id="r-ti" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <div class="fb" id="r-fb"></div>
          <div class="nav"><button type="button" class="btn primary" id="r-chk">Check</button></div>
        </div>`;
      setStatus();
      const inp = stage.querySelector("#r-ti");
      const chk = stage.querySelector("#r-chk");
      const fb = stage.querySelector("#r-fb");
      inp.focus();

      const goNext = () => {
        pos++;
        renderWord();
      };

      const grade = () => {
        if (answered) return;
        answered = true;
        if (isCorrectAnswer(inp.value, it, answer, { forGap: frame })) {
          score++;
          fb.textContent = "✓ Correct";
          fb.className = "fb good";
        } else {
          fb.innerHTML = `✗ Answer: <span class="reveal">${escapeHtml(answer)}</span>`;
          fb.className = "fb bad";
          const s = document.createElement("button");
          s.type = "button";
          s.className = "link";
          s.textContent = "I was right → count it";
          s.onclick = () => {
            score++;
            s.textContent = "counted ✓";
            s.disabled = true;
            setStatus();
          };
          fb.appendChild(document.createElement("br"));
          fb.appendChild(s);
        }
        inp.disabled = true;
        chk.textContent = "Next";
        chk.onclick = goNext;
        chk.focus();
        setStatus();
      };

      chk.onclick = () => {
        if (answered) goNext();
        else grade();
      };
      clearKey();
      keyHandler = (e) => {
        if (e.key !== "Enter" || e.shiftKey) return;
        if (e.target.closest("textarea")) return;
        e.preventDefault();
        if (answered) goNext();
        else grade();
      };
      document.addEventListener("keydown", keyHandler);
    }

    if (total === 0) {
      finishUnit();
    } else if (quizItems.length) {
      renderQuiz();
    } else {
      phase = "word";
      renderWord();
    }
  }

  if (!queue.length) {
    root.innerHTML = `
      <div class="practice-head">
        <div class="practice-title">Review</div>
      </div>
      <div class="practice-stage">
        <div class="q">
          <div class="prompt">Nothing due</div>
          <div class="sub">Learn a unit (finish Sentence) to schedule reviews.</div>
          <div class="nav"><button type="button" class="btn primary" id="r-done">Back to map</button></div>
        </div>
      </div>`;
    root.querySelector("#r-done").onclick = () => opts.onDone();
    return;
  }

  runUnit();
}
