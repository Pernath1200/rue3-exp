const fs = require("fs");
const path = require("path");

const tree = JSON.parse(fs.readFileSync("data/tree.json", "utf8"));
const gateSrc = fs.readFileSync("js/gate.js", "utf8");
const exclude = new Set([
  "leaf_describing_a2",
  "leaf_adverbs_a2",
  "leaf_verbs_a2",
  "leaf_misc_a2",
  "leaf_ideas_a2",
]);

function packStats(rel) {
  const full = path.join("data", rel);
  if (!fs.existsSync(full)) return null;
  const p = JSON.parse(fs.readFileSync(full, "utf8"));
  const blocks = p.blocks || [];
  let items = 0;
  const blockSizes = [];
  let missingCz = 0;
  let missingEn = 0;
  let framesOk = 0;
  let framesBad = 0;
  for (const b of blocks) {
    const n = (b.items || []).length;
    blockSizes.push({ id: b.id, n, title: b.title });
    for (const it of b.items || []) {
      items++;
      if (!it.en) missingEn++;
      if (!it.cz) missingCz++;
      if (p.practice === "frames") {
        if (it.gap && it.gap_answer) framesOk++;
        else framesBad++;
      }
    }
  }
  return {
    practice: p.practice || "words",
    codex: p.codex_unit || p.codex || null,
    blocks: blocks.length,
    items,
    blockSizes,
    missingCz,
    missingEn,
    framesOk,
    framesBad,
    tiny: blockSizes.filter((b) => b.n > 0 && b.n < 8),
    huge: blockSizes.filter((b) => b.n > 16),
  };
}

const a2 = tree.nodes.filter(
  (n) => n.levels && n.levels.includes("A2") && n.status === "live",
);

console.log("=== A2 GATE POOL vs OUT ===\n");
let gateWords = 0;
let gateFrames = 0;
let outItems = 0;

const rows = [];
for (const n of a2) {
  const st = n.content ? packStats(n.content) : null;
  const hasCodex = Boolean(n.codex_unit);
  const inExclude = exclude.has(n.id);
  const inGate = hasCodex && !inExclude && st;
  if (st) {
    if (inGate) {
      if (st.practice === "frames") gateFrames += st.items;
      else gateWords += st.items;
    } else outItems += st.items;
  }
  rows.push({ n, st, inGate, hasCodex, inExclude });
}

console.log("GATE-IN:");
for (const r of rows.filter((x) => x.inGate)) {
  const s = r.st;
  console.log(
    `  ${r.n.kind.padEnd(5)} ${String(s.items).padStart(4)} it  ${s.blocks}b  ${s.practice.padEnd(6)}  ${r.n.codex_unit}  ${r.n.id}  · ${r.n.label}`,
  );
  if (s.tiny.length)
    console.log(
      `       tiny blocks (<8): ${s.tiny.map((b) => b.id + ":" + b.n).join(", ")}`,
    );
  if (s.huge.length)
    console.log(
      `       huge blocks (>16): ${s.huge.map((b) => b.id + ":" + b.n).join(", ")}`,
    );
  if (s.missingCz || s.missingEn || s.framesBad)
    console.log(
      `       issues: missingCz=${s.missingCz} missingEn=${s.missingEn} framesBad=${s.framesBad}`,
    );
  if (s.codex && s.codex !== r.n.codex_unit)
    console.log(`       pack/tree codex mismatch: pack=${s.codex}`);
}

console.log("\nGATE-OUT:");
for (const r of rows.filter((x) => !x.inGate)) {
  const s = r.st;
  const why = !s
    ? "no pack"
    : !r.hasCodex
      ? "no codex_unit on tree"
      : r.inExclude
        ? "mega exclude"
        : "other";
  console.log(
    `  ${why.padEnd(16)} ${(s ? String(s.items) : "—").padStart(4)} it  ${r.n.id}  · ${r.n.label}  codex=${r.n.codex_unit || "—"}`,
  );
}

console.log("\n=== POOL SIZES FOR GATE ===");
console.log("gate words items:", gateWords);
console.log("gate frames items:", gateFrames);
console.log("out items:", outItems);
console.log(
  "gate needs: quiz~12 words preferred, word 12, sent 6 frames — ok if words>=12 and frames>=6",
);

// Codex distribution in gate
const byCodex = {};
for (const r of rows.filter((x) => x.inGate)) {
  const c = r.n.codex_unit || "?";
  byCodex[c] = (byCodex[c] || 0) + (r.st?.items || 0);
}
console.log("\n=== GATE ITEMS BY CODEX ===");
for (const [c, n] of Object.entries(byCodex).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${c}`);
}

// Theme spine coverage vs Codex THM 01-09
const thm = {};
for (const r of rows) {
  const c = r.n.codex_unit || "";
  const m = c.match(/V_THM-A1B1-(\d+)/);
  if (m) thm[m[1]] = (thm[m[1]] || []).concat(r.n.label + (r.inGate ? "" : " [out]"));
}
console.log("\n=== THM 01-09 SPINE ===");
for (let i = 1; i <= 10; i++) {
  const k = String(i).padStart(2, "0");
  console.log(`  THM-${k}: ${(thm[k] || ["MISSING"]).join(" · ")}`);
}

// Trunk spine
console.log("\n=== TRUNK SPINE (A2) ===");
for (const id of [
  "trunk_recycle_a2",
  "trunk_lexis_a2",
  "trunk_chunks_a2",
]) {
  const r = rows.find((x) => x.n.id === id);
  if (!r) {
    console.log("  MISSING", id);
    continue;
  }
  console.log(
    `  ${id}: ${r.st.items} items, ${r.st.blocks} blocks, framesBad=${r.st.framesBad}, gate=${r.inGate}`,
  );
  for (const b of r.st.blockSizes) {
    console.log(`     - ${b.n}  ${b.id}  ${b.title}`);
  }
}
