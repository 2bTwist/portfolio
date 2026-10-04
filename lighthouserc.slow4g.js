// The Lighthouse CI gate re-run on Lighthouse's default mobile network (Slow 4G),
// slower than the conditions budgets.json declares. Same audits and gates as
// lighthouserc.js, except LCP: a miss here is reported as a warning, a signal
// about slow mobile networks, not a budget failure.
const base = require("./lighthouserc.js");
const { lighthouseSettings } = require("./perf/lighthouse-settings.js");

const lcp = base.ci.assert.assertions["largest-contentful-paint"];

module.exports = {
  ci: {
    ...base.ci,
    collect: { ...base.ci.collect, settings: lighthouseSettings("Slow4G") },
    assert: {
      ...base.ci.assert,
      assertions: { ...base.ci.assert.assertions, "largest-contentful-paint": ["warn", lcp[1]] },
    },
    upload: { ...base.ci.upload, outputDir: "./lhci-results-slow4g" },
  },
};
