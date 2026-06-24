// Bundle-byte gate. Measures INITIAL-LOAD JS only — the chunks actually
// referenced by the prerendered route HTML — so lazy chunks (e.g. the
// command-palette/terminal `motion` chunk, the three.js cert-badge chunk) don't
// count against the route budget (the plan's "separate size-limit entry" rule).
// Initial budget comes from budgets.json; the 3D chunk is bounded separately so
// it can't grow unnoticed without ever touching the route budget.
const fs = require("node:fs");
const path = require("node:path");
const b = require("./budgets.json");
const limit = (b.metrics.bundleKB.budget ?? b.metrics.bundleKB.target) + " kB";

// Separate bound for the lazy three/fiber/drei payload (gzip). three barely
// tree-shakes, so this is just a tripwire against unbounded growth — NOT the
// route budget. Measured ~ and ratcheted with headroom (decision 10).
const THREE_CHUNK_LIMIT = "320 kB";

// Collect every chunk referenced by a prerendered HTML file = the initial load.
function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const initial = new Set();
for (const html of walk(".next/server/app", [])) {
  const text = fs.readFileSync(html, "utf8");
  for (const m of text.matchAll(/chunks\/([a-zA-Z0-9_-]+\.js)/g)) {
    initial.add(`.next/static/chunks/${m[1]}`);
  }
}
const paths = [...initial].filter((p) => fs.existsSync(p));

// Find the lazy 3D chunk(s): any chunk NOT on the initial path that carries a
// three.js / react-three signature.
const THREE_MARKER = /WebGLRenderer|isBufferGeometry|@react-three|PresentationControls/;
const threeChunks = [];
function walkChunks(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkChunks(p);
    else if (e.name.endsWith(".js") && !initial.has(p)) {
      if (THREE_MARKER.test(fs.readFileSync(p, "utf8"))) threeChunks.push(p);
    }
  }
}
walkChunks(".next/static/chunks");

module.exports = [
  {
    name: "initial-load JS (route chunks; lazy chunks excluded)",
    path: paths.length ? paths : [".next/static/chunks/**/*.js"],
    limit,
    gzip: true,
  },
  ...(threeChunks.length
    ? [
        {
          name: "lazy 3D chunk (three/fiber/drei; off the route budget)",
          path: threeChunks,
          limit: THREE_CHUNK_LIMIT,
          gzip: true,
        },
      ]
    : []),
];
