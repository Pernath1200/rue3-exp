/**
 * Auto-play smoke harness — ?smoke=all
 *
 * Loops every live block through Match → Quiz → Word → Sentence, answering
 * correctly by reading the block data, and reports any block that throws,
 * grades a known-correct answer wrong, or fails to reach a finish screen.
 *
 * Calls startPractice directly with no-op progress callbacks, so a smoke run
 * never touches real localStorage progress.
 */

import { startPractice } from "./practice.js";
import { buildLeafSentenceItems } from "./carriers.js";

const TICK_MS = 10;
const BLOCK_TIMEOUT_MS = 30000;

function tick(ms = TICK_MS) {
  return new Promise((r) => setTimeout(r, ms));
}

function pressEnter() {
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
}

function optionLabel(el) {
  // ".opt" buttons render as <span class="knum">N</span>label
  const knum = el.querySelector(".knum");
  const n = knum ? knum.textContent : "";
  const t = el.textContent;
  return t.startsWith(n) ? t.slice(n.length) : t;
}

/** Drive one block through all four modes. Returns a result record. */
async function playBlock(container, block, practice) {
  const isFrames = practice === "frames";
  const completions = {};
  const warnings = [];
  const notes = [];
  const start = Date.now();
  const timedOut = () => Date.now() - start > BLOCK_TIMEOUT_MS;

  startPractice(container, { ...block, practice }, {
    practice,
    onTouch() {},
    onModeComplete(mode, meta) {
      completions[mode] = meta || {};
    },
    onExit() {},
  });

  const stage = () => container.querySelector("#p-stage");
  const byCz = (cz) => block.items.find((it) => it.cz === cz);

  // --- 1 · Match: pair by data-id until the finish screen offers Quiz ---
  while (!timedOut()) {
    const s = stage();
    const next = s.querySelector("#m-quiz");
    if (next) {
      next.click();
      break;
    }
    const left = s.querySelector('.m[data-side="L"]:not(.done)');
    if (left) {
      const right = s.querySelector(
        `.m[data-side="R"][data-id="${left.dataset.id}"]`,
      );
      left.click();
      if (right) right.click();
    }
    await tick();
  }

  // --- 2 · Quiz: read the prompt, click the option matching item.en ---
  while (!timedOut()) {
    const s = stage();
    const next = s.querySelector("#q-type");
    if (next) {
      next.click();
      break;
    }
    const prompt = s.querySelector(".prompt");
    const opts = [...s.querySelectorAll(".opt")];
    if (prompt && opts.length) {
      const it = byCz(prompt.textContent);
      const want = it ? it.en : null;
      const target =
        opts.find((o) => optionLabel(o) === want) || opts[0];
      if (!it || optionLabel(target) !== want) {
        warnings.push(`quiz: no option match for "${prompt.textContent}"`);
      }
      target.click();
      pressEnter(); // skip the 750ms auto-advance
    }
    await tick();
  }

  // --- 3 · Word: type the known answer, Check, Next ---
  // Carrier-less leaves end here (finish screen offers Match, no Sentence)
  let sentenceNA = false;
  while (!timedOut()) {
    const s = stage();
    const next = s.querySelector("#t-sent");
    if (next) {
      next.click();
      break;
    }
    if (s.querySelector("#t-match")) {
      sentenceNA = true;
      break;
    }
    const retry = s.querySelector("#t-retry");
    if (retry) {
      retry.click();
      await tick();
      continue;
    }
    const inp = s.querySelector("#ti");
    const chk = s.querySelector("#chk");
    if (inp && chk && !inp.disabled) {
      const cz = isFrames
        ? s.querySelector(".sub")?.textContent
        : s.querySelector(".prompt")?.textContent;
      const it = byCz(cz);
      if (!it) warnings.push(`word: no item for prompt "${cz}"`);
      inp.value = it ? (isFrames ? it.gap_answer : it.en) : "";
      chk.click(); // grade
      const fb = s.querySelector("#tfb");
      if (it && fb && fb.classList.contains("bad")) {
        warnings.push(`word: correct answer graded wrong for "${it.en}"`);
      }
      chk.click(); // next
    }
    await tick();
  }

  // --- 4 · Sentence: CZ → EN models (trunk frames, or leaf carrier frames) ---
  // Carrier picks are randomised, so probe the builder repeatedly to learn
  // the cz → en answer space; unknown prompts fall back to reveal + count-it.
  const probe = {};
  if (!isFrames) {
    for (let k = 0; k < 40; k++) {
      for (const m of buildLeafSentenceItems(block.items, {
        title: block.title,
        id: block.id,
        level: block.level,
      })) {
        probe[m.cz] = m.en;
      }
    }
  }
  let carriersPending = sentenceNA;
  while (!carriersPending && !timedOut()) {
    const s = stage();
    if (s.querySelector("#fs-type")) {
      // "No carrier sentences yet" — honest empty state, sentence N/A
      carriersPending = true;
      break;
    }
    const retry = s.querySelector("#fs-retry");
    if (retry) {
      retry.click(); // shouldn't happen with correct play; loop until clean
      await tick();
      continue;
    }
    if (s.querySelector("#fs-again")) break; // complete, 0 wrong
    const inp = s.querySelector("#ti");
    const chk = s.querySelector("#chk");
    if (inp && chk && !inp.disabled) {
      const cz = s.querySelector(".prompt")?.textContent;
      const it = isFrames ? byCz(cz) : null;
      const want = isFrames ? (it && it.en) : probe[cz];
      inp.value = want || "";
      chk.click(); // grade
      const fb = s.querySelector("#tfb");
      if (fb && fb.classList.contains("bad")) {
        // Trunk frames are deterministic — a bad grade is a real bug (hard).
        // Leaf carriers are randomised: the probe may hold a valid variant this
        // render didn't generate, so a mismatch is a soft note, recovered via
        // count-it. Content quality of carriers is hand-smoke territory.
        if (isFrames) {
          warnings.push(`sentence: model EN graded wrong for "${want}"`);
        } else if (want) {
          notes.push(`sentence variant not accepted this render: "${want}" (cz: ${cz})`);
        }
        const countIt = fb.querySelector("button.link");
        if (countIt) countIt.click();
      }
      chk.click(); // next
    }
    await tick();
  }

  const modes = ["match", "quiz", "type", "sentence"];
  if (carriersPending) completions.sentence = { na: true };
  const missing = modes.filter((m) => !completions[m]);
  const imperfect = modes.filter(
    (m) =>
      completions[m] &&
      completions[m].total != null &&
      completions[m].score !== completions[m].total,
  );
  for (const m of imperfect) {
    warnings.push(
      `${m}: scored ${completions[m].score}/${completions[m].total} with correct answers`,
    );
  }
  return {
    ok: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
    notes,
    ms: Date.now() - start,
  };
}

export async function runSmoke() {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:9999;background:#0d0d0d;" +
    "color:#fff;font:13px/1.5 Consolas,monospace;padding:12px 16px;" +
    "max-height:60vh;overflow:auto;border-bottom:2px solid #4db6c7";
  overlay.textContent = "SMOKE starting…";
  document.body.appendChild(overlay);
  const log = (line) => {
    overlay.textContent += "\n" + line;
    console.log("[smoke]", line);
    overlay.scrollTop = overlay.scrollHeight;
  };

  // Offscreen practice container so the sweep is not visually disruptive
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-10000px;top:0;width:900px;visibility:hidden";
  document.body.appendChild(container);

  const tree = await (await fetch("./data/tree.json")).json();
  const live = tree.nodes.filter((n) => n.status === "live" && n.content);
  const failures = [];
  const notesAll = [];
  let blocks = 0;

  const t0 = Date.now();
  for (const node of live) {
    let pack;
    try {
      pack = await (await fetch(`./data/${node.content}`)).json();
    } catch (e) {
      failures.push(`${node.id}: pack load failed — ${e.message}`);
      log(`FAIL ${node.id}: pack load — ${e.message}`);
      continue;
    }
    for (const block of pack.blocks) {
      blocks++;
      let res;
      try {
        res = await playBlock(container, block, pack.practice);
      } catch (e) {
        failures.push(`${block.id}: threw — ${e.message}`);
        log(`FAIL ${block.id}: threw — ${e.message}`);
        continue;
      }
      if (!res.ok) {
        const bits = [
          ...res.missing.map((m) => `mode ${m} never completed`),
          ...res.warnings,
        ];
        failures.push(`${block.id}: ${bits.join(" · ")}`);
        log(`FAIL ${block.id}: ${bits.join(" · ")}`);
      } else {
        log(`ok   ${block.id} (${res.ms}ms)`);
      }
      if (res.notes && res.notes.length) {
        notesAll.push(...res.notes.map((n) => `${block.id}: ${n}`));
      }
      container.innerHTML = "";
    }
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const noteTotal = notesAll.length;
  log("");
  if (noteTotal) log(`(${noteTotal} soft carrier-variant notes — content, not failures)`);
  log(
    failures.length
      ? `SMOKE DONE · ${blocks} blocks in ${secs}s · ${failures.length} FAILURES (listed above)`
      : `SMOKE OK · ${blocks} blocks in ${secs}s · 0 failures${noteTotal ? ` · ${noteTotal} notes` : ""}`,
  );
  overlay.style.borderBottomColor = failures.length ? "#e05252" : "#4dc77a";
}
