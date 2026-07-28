/**
 * RUE3 exp — smoke flags (local only).
 * Same model as rue2-grok-exp: capture duds in context → list → copy for agent.
 * Does not edit pack JSON.
 */

const KEY = "rue3-exp-smoke-flags";

export const FLAG_TAGS = [
  { id: "false_wrong", label: "False wrong (my answer OK)" },
  { id: "ambiguous", label: "Ambiguous cue" },
  { id: "bad_en", label: "Bad / awkward English" },
  { id: "bad_cz", label: "Bad Czech" },
  { id: "wrong_form", label: "Wrong form / lemma target" },
  { id: "accepts_missing", label: "Accepts missing (variant OK)" },
  { id: "carrier_bad", label: "Bad carrier / Sentence model" },
  { id: "monotony", label: "Monotony / boring item" },
  { id: "ui", label: "UI / navigation" },
  { id: "other", label: "Other" },
];

function safeParse(raw) {
  try {
    const d = JSON.parse(raw);
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export function loadFlags() {
  try {
    return safeParse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
  notify();
}

const listeners = new Set();

export function onFlagsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const n = loadFlags().length;
  for (const fn of listeners) {
    try {
      fn(n);
    } catch {
      /* ignore */
    }
  }
}

export function countFlags() {
  return loadFlags().length;
}

export function addFlag(partial) {
  const list = loadFlags();
  const flag = {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    packId: partial.packId || "",
    packTitle: partial.packTitle || "",
    blockId: partial.blockId || "",
    level: partial.level || "",
    mode: partial.mode || partial.stage || "",
    stage: partial.stage || partial.mode || "",
    itemIndex: typeof partial.itemIndex === "number" ? partial.itemIndex : null,
    en: partial.en || "",
    cz: partial.cz || "",
    gap: partial.gap || "",
    gap_answer: partial.gap_answer || "",
    prompt: partial.prompt || "",
    answer: partial.answer || "",
    typed: partial.typed || "",
    tag: partial.tag || "other",
    note: (partial.note || "").trim(),
    severity: "P0",
  };
  list.push(flag);
  persist(list);
  return flag;
}

export function removeFlag(id) {
  persist(loadFlags().filter((f) => f.id !== id));
}

export function clearFlags() {
  persist([]);
}

/** Human + agent paste format */
export function formatFlagsForAgent() {
  const list = loadFlags();
  if (!list.length) return "(no smoke flags)";
  const lines = [
    `RUE3 exp smoke flags · ${list.length} item(s) · ${new Date().toISOString().slice(0, 10)}`,
    `Process P0 first. Workspace: rue3-exp (exp/autonomous). Fix content/grading only — no feature sprawl.`,
    "",
  ];
  list.forEach((f, i) => {
    lines.push(
      `${i + 1}. [${f.severity}] tag=${f.tag} mode=${f.mode || f.stage || "—"}`,
    );
    lines.push(
      `   pack=${f.packId || "—"} · block=${f.blockId || "—"} · ${f.packTitle || ""}`.trimEnd(),
    );
    if (f.level) lines.push(`   level=${f.level}`);
    if (f.itemIndex != null) lines.push(`   itemIndex=${f.itemIndex}`);
    if (f.en) lines.push(`   en: ${f.en}`);
    if (f.cz) lines.push(`   cz: ${f.cz}`);
    if (f.gap) lines.push(`   gap: ${f.gap}`);
    if (f.gap_answer) lines.push(`   expected: ${f.gap_answer}`);
    if (f.prompt) lines.push(`   prompt: ${f.prompt}`);
    if (f.answer) lines.push(`   answer: ${f.answer}`);
    if (f.typed) lines.push(`   typed: ${f.typed}`);
    if (f.note) lines.push(`   note: ${f.note}`);
    lines.push("");
  });
  return lines.join("\n");
}

export function formatFlagsJson() {
  return JSON.stringify(loadFlags(), null, 2);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Mount shared overlay UI once. Returns API { openForm, openList, refreshBadge }.
 * @param {HTMLElement} host
 */
export function mountSmokeFlagsUI(host) {
  if (!host) return null;
  if (host.dataset.mounted === "1") {
    return host._smokeApi || null;
  }
  host.dataset.mounted = "1";
  host.innerHTML = `
    <div class="smoke-overlay" id="smoke-overlay" hidden>
      <div class="smoke-panel" role="dialog" aria-modal="true" aria-labelledby="smoke-panel-title">
        <div class="smoke-panel-head">
          <h2 id="smoke-panel-title">Smoke flag</h2>
          <button type="button" class="btn-ghost smoke-close" id="smoke-close" aria-label="Close">Close</button>
        </div>
        <div id="smoke-panel-body"></div>
      </div>
    </div>
  `;

  const overlay = host.querySelector("#smoke-overlay");
  const body = host.querySelector("#smoke-panel-body");
  const titleEl = host.querySelector("#smoke-panel-title");

  function close() {
    overlay.hidden = true;
    body.innerHTML = "";
  }

  host.querySelector("#smoke-close").onclick = close;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  function showOverlay() {
    overlay.hidden = false;
  }

  function openForm(prefill = {}) {
    titleEl.textContent = "Flag item";
    const tagOpts = FLAG_TAGS.map(
      (t) =>
        `<option value="${escapeHtml(t.id)}" ${t.id === "false_wrong" ? "selected" : ""}>${escapeHtml(t.label)}</option>`,
    ).join("");
    body.innerHTML = `
      <p class="smoke-hint">Always available · saves locally · does not edit pack files until an agent processes the list.</p>
      <div class="smoke-meta">
        <div><strong>Pack</strong> ${escapeHtml(prefill.packId || "—")} · ${escapeHtml(prefill.packTitle || "")}</div>
        <div><strong>Block</strong> ${escapeHtml(prefill.blockId || "—")}${prefill.level ? " · " + escapeHtml(prefill.level) : ""}</div>
        <div><strong>Mode</strong> ${escapeHtml(prefill.stage || prefill.mode || "—")}
          ${prefill.itemIndex != null ? ` · item ${prefill.itemIndex}` : ""}</div>
        ${prefill.en ? `<div class="smoke-line"><strong>en</strong> ${escapeHtml(prefill.en)}</div>` : ""}
        ${prefill.gap ? `<div class="smoke-line"><strong>gap</strong> ${escapeHtml(prefill.gap)}</div>` : ""}
        ${prefill.gap_answer ? `<div class="smoke-line"><strong>key</strong> ${escapeHtml(prefill.gap_answer)}</div>` : ""}
        ${prefill.cz ? `<div class="smoke-line"><strong>cz</strong> ${escapeHtml(prefill.cz)}</div>` : ""}
        ${prefill.prompt && !prefill.en && !prefill.gap ? `<div class="smoke-line"><strong>prompt</strong> ${escapeHtml(prefill.prompt)}</div>` : ""}
        ${prefill.answer && !prefill.gap_answer ? `<div class="smoke-line"><strong>answer</strong> ${escapeHtml(prefill.answer)}</div>` : ""}
      </div>
      <label class="smoke-label">What you typed
        <input type="text" class="type-in" id="smoke-typed" autocomplete="off" value="${escapeHtml(prefill.typed || "")}" placeholder="your answer (if any)" />
      </label>
      <label class="smoke-label">Why
        <select id="smoke-tag">${tagOpts}</select>
      </label>
      <label class="smoke-label">Note (optional)
        <input type="text" class="type-in" id="smoke-note" autocomplete="off" placeholder="one line" />
      </label>
      <div class="nav smoke-actions">
        <button type="button" class="btn primary" id="smoke-save">Save flag</button>
        <button type="button" class="btn" id="smoke-tolist">View list</button>
      </div>
      <p class="smoke-status" id="smoke-status" hidden></p>
    `;
    showOverlay();
    const typed = body.querySelector("#smoke-typed");
    if (typed && !prefill.typed) typed.focus();
    else body.querySelector("#smoke-note")?.focus();

    body.querySelector("#smoke-save").onclick = () => {
      addFlag({
        ...prefill,
        typed: body.querySelector("#smoke-typed").value,
        tag: body.querySelector("#smoke-tag").value,
        note: body.querySelector("#smoke-note").value,
      });
      const st = body.querySelector("#smoke-status");
      st.hidden = false;
      st.textContent = `Saved · ${countFlags()} flag(s) total`;
      st.className = "smoke-status ok";
    };
    body.querySelector("#smoke-tolist").onclick = () => openList();
  }

  function openList() {
    titleEl.textContent = "Flagged items";
    const list = loadFlags();
    if (!list.length) {
      body.innerHTML = `
        <p class="smoke-hint">No flags yet. In practice, use <strong>Flag item</strong> when something is wrong or unfair.</p>
        <div class="nav"><button type="button" class="btn" id="smoke-close2">Close</button></div>
      `;
      body.querySelector("#smoke-close2").onclick = close;
      showOverlay();
      return;
    }
    const rows = list
      .map((f, i) => {
        const head = `${i + 1}. ${escapeHtml(f.tag)} · ${escapeHtml(f.packId || f.blockId || "—")}`;
        const snip = escapeHtml(
          (f.gap || f.en || f.prompt || "").slice(0, 80) || "(no stem)",
        );
        return `
          <div class="smoke-row" data-id="${escapeHtml(f.id)}">
            <div class="smoke-row-head">${head}</div>
            <div class="smoke-row-snip">${snip}</div>
            ${f.typed ? `<div class="smoke-row-typed">typed: ${escapeHtml(f.typed)}</div>` : ""}
            ${f.note ? `<div class="smoke-row-note">${escapeHtml(f.note)}</div>` : ""}
            <button type="button" class="link smoke-rm" data-id="${escapeHtml(f.id)}">Remove</button>
          </div>`;
      })
      .join("");
    body.innerHTML = `
      <p class="smoke-hint">${list.length} flag(s) · local only · Copy → paste into agent chat</p>
      <div class="smoke-list">${rows}</div>
      <div class="nav smoke-actions">
        <button type="button" class="btn primary" id="smoke-copy">Copy all for agent</button>
        <button type="button" class="btn" id="smoke-copy-json">Copy JSON</button>
        <button type="button" class="btn" id="smoke-clear">Clear all</button>
      </div>
      <p class="smoke-status" id="smoke-status" hidden></p>
    `;
    showOverlay();
    body.querySelectorAll(".smoke-rm").forEach((btn) => {
      btn.onclick = () => {
        removeFlag(btn.dataset.id);
        openList();
      };
    });
    const status = body.querySelector("#smoke-status");
    async function copyText(text, okMsg) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          throw new Error("no clipboard");
        }
        status.hidden = false;
        status.className = "smoke-status ok";
        status.textContent = okMsg;
      } catch {
        status.hidden = false;
        status.className = "smoke-status bad";
        status.textContent = "Copy blocked — select text manually if needed.";
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.className = "smoke-fallback-ta";
        body.appendChild(ta);
        ta.select();
      }
    }
    body.querySelector("#smoke-copy").onclick = () =>
      copyText(formatFlagsForAgent(), "Copied for agent — paste into chat.");
    body.querySelector("#smoke-copy-json").onclick = () =>
      copyText(formatFlagsJson(), "JSON copied.");
    body.querySelector("#smoke-clear").onclick = () => {
      if (confirm(`Clear all ${list.length} smoke flag(s)?`)) {
        clearFlags();
        openList();
      }
    };
  }

  const api = { openForm, openList, close, refreshBadge: notify };
  host._smokeApi = api;
  notify();
  return api;
}

export function getSmokeApi() {
  const host = document.getElementById("smoke-flags-host");
  if (!host) return null;
  if (host._smokeApi) return host._smokeApi;
  return mountSmokeFlagsUI(host);
}

export function updateFlagsBadge() {
  const n = countFlags();
  document.querySelectorAll("[data-smoke-badge]").forEach((el) => {
    const isListBtn =
      el.classList.contains("smoke-flag-list") ||
      el.id === "btn-smoke-flags" ||
      el.id === "p-flag-list";
    if (isListBtn) {
      el.textContent = n > 0 ? `Flagged (${n})` : "Flagged list";
    } else {
      el.textContent = n > 0 ? `Flagged (${n})` : "Flagged";
    }
    el.classList.toggle("has-flags", n > 0);
  });
}

onFlagsChange(updateFlagsBadge);
