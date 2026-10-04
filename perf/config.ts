// Shared measurement config (grilled decision 5: throttled prod build, median-of-N).
// Imported by the perf-check CLI and the Playwright perf spec so every layer
// measures under the SAME conditions. Never measure a dev build.

export const DEFAULT_URL = "http://localhost:3000/";
export const DEFAULT_RUNS = 5;

// 4x CPU slowdown approximates a mid-tier device (Lighthouse's default), and is
// the reproducibility knob. Network conditions are named in budgets.json and
// defined once in perf/network-profiles.json (see perf/lighthouse-settings.js).
export const CPU_THROTTLE_RATE = 4;
