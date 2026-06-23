import { readFileSync, existsSync } from "node:fs";

// INP proxy is measured by the Playwright perf spec (interaction layer) and
// dropped at perf-results/inp.json. Read it if present; null otherwise.
export function readInp(): number | null {
  try {
    if (existsSync("perf-results/inp.json")) {
      return JSON.parse(readFileSync("perf-results/inp.json", "utf8")).inp ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}
