// Bundle-byte gate. Measures INITIAL-LOAD JS only — the chunks actually
// referenced by the prerendered route HTML — so lazy chunks (e.g. the
// command-palette/terminal `motion` chunk) don't count against the route budget
// (the plan's "separate size-limit entry" rule). Budget comes from budgets.json.
const fs = require("node:fs");
const path = require("node:path");
const b = require("./budgets.json");
const limit = (b.metrics.bundleKB.budget ?? b.metrics.bundleKB.target) + " kB";

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

module.exports = [
  {
    name: "initial-load JS (route chunks; lazy chunks excluded)",
    path: paths.length ? paths : [".next/static/chunks/**/*.js"],
    limit,
    gzip: true,
  },
];
