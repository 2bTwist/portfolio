/* Lighthouse settings for a named network profile at budgets.json's CPU
   slowdown. budgets.json names the profile its budgets hold under
   (`measurement.network`); perf/network-profiles.json says what each name
   means, in Lighthouse's throttling shape:
   - Fast4G is Chrome DevTools' "Fast 4G" preset (front_end/core/sdk/
     NetworkManager.ts): 9 Mbps down and 1.5 Mbps up derated by 0.9, 60 ms
     round trip, 165 ms request latency.
   - Slow4G is Lighthouse's own mobile default.
   Lighthouse CI (lighthouserc*.js) and the perf-check engine both build their
   settings here, so every Lighthouse run says which conditions it measured. */
const budgets = require("../budgets.json");
const profiles = require("./network-profiles.json");

function lighthouseSettings(network) {
  const profile = profiles[network];
  if (!profile) throw new Error(`Unknown network profile "${network}" (see perf/network-profiles.json)`);
  return {
    throttlingMethod: "simulate",
    throttling: { ...profile, cpuSlowdownMultiplier: budgets.measurement.cpuThrottle },
  };
}

module.exports = { lighthouseSettings, declaredNetwork: budgets.measurement.network };
