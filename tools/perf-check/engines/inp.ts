import { readFileSync, existsSync } from "node:fs";

// INP proxy is measured by the Playwright perf spec (interaction layer) and
// dropped at perf-results/inp.json. Bind it to the measured URL and current
// build so a prior run cannot satisfy this build's gate.
export function readInp(url: string): number {
  if (!existsSync("perf-results/inp.json")) {
    throw new Error("INP proxy artifact is missing; run pnpm e2e:perf first");
  }
  if (!existsSync(".next/BUILD_ID")) {
    throw new Error("Current production build ID is missing");
  }

  let artifact: { inp?: unknown; url?: unknown; buildId?: unknown };
  try {
    artifact = JSON.parse(readFileSync("perf-results/inp.json", "utf8"));
  } catch {
    throw new Error("INP proxy artifact is not valid JSON");
  }
  if (typeof artifact.inp !== "number" || !Number.isFinite(artifact.inp)) {
    throw new Error("INP proxy artifact has no finite metric");
  }
  if (typeof artifact.url !== "string" || new URL(artifact.url).href !== new URL(url).href) {
    throw new Error("INP proxy artifact was measured for a different URL");
  }
  const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
  if (artifact.buildId !== buildId) {
    throw new Error("INP proxy artifact was measured for a different production build");
  }
  return artifact.inp;
}
