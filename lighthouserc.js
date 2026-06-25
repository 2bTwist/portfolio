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

// Lighthouse's experimental "insight" audits are strict, noisy, and often not
// actionable for a Next app (e.g. legacy-javascript fires on Next's own nomodule
// polyfills). Turn them off so the gate stays focused on the calibrated budgets.
const INSIGHT_AUDITS = [
  "cls-culprits-insight",
  "document-latency-insight",
  "dom-size-insight",
  "duplicated-javascript-insight",
  "font-display-insight",
  "forced-reflow-insight",
  "image-delivery-insight",
  "interaction-to-next-paint-insight",
  "lcp-discovery-insight",
  "lcp-breakdown-insight",
  "legacy-javascript-insight",
  "modern-http-insight",
  "network-dependency-tree-insight",
  "render-blocking-insight",
  "slow-css-selector-insight",
  "third-parties-insight",
  "viewport-insight",
  "cache-insight",
];
for (const id of INSIGHT_AUDITS) assertions[id] = "off";

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
