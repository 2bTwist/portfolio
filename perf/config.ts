// Shared measurement config (grilled decision 5: throttled prod build, median-of-N).
// Imported by the perf-check CLI and the Playwright perf spec so every layer
// measures under the SAME conditions. Never measure a dev build.

export const DEFAULT_URL = "http://localhost:3000/";
export const DEFAULT_RUNS = 5;

// 4x CPU slowdown approximates a mid-tier device (Lighthouse's default), and is
// the reproducibility knob. Network ~ "Fast 4G".
export const CPU_THROTTLE_RATE = 4;
export const NETWORK_THROTTLE = {
  downloadKbps: 9000,
  uploadKbps: 9000,
  latencyMs: 40,
};
