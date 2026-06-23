// Bundle-byte gate. Reads the bundle budget from budgets.json (single source of
// truth). Falls back to the excellent target until calibrated.
const b = require("./budgets.json");
const limit = (b.metrics.bundleKB.budget ?? b.metrics.bundleKB.target) + " kB";

module.exports = [
  {
    name: "client JS (all route chunks)",
    path: ".next/static/chunks/**/*.js",
    limit,
    gzip: true,
  },
];
