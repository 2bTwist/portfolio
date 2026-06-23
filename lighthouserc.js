// Lighthouse CI lab gate. budgets.json is the single source of truth: only
// metrics with a calibrated (non-null) budget are enforced as errors; the rest
// stay as warnings until `pnpm perf:calibrate` fills them in (decision 10).
const budgets = require("./budgets.json");
const m = budgets.metrics;

const assertions = {
  "categories:performance": ["warn", { minScore: 0.9 }],
};
function gate(key, auditId) {
  if (m[key] && m[key].budget != null) {
    assertions[auditId] = ["error", { maxNumericValue: m[key].budget, aggregationMethod: "median" }];
  }
}
gate("lcp", "largest-contentful-paint");
gate("cls", "cumulative-layout-shift");
gate("tbt", "total-blocking-time");

module.exports = {
  ci: {
    collect: {
      numberOfRuns: budgets.measurement.runs || 5,
      startServerCommand: "pnpm start",
      url: [budgets.url],
    },
    assert: { preset: "lighthouse:no-pwa", assertions },
    upload: { target: "temporary-public-storage" },
  },
};
