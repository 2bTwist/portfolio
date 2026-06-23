import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DEFAULT_RUNS } from "../../../perf/config";

const run = promisify(execFile);

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type LhResult = { lcp: number; cls: number; tbt: number; perfScore: number };

// Shell out to the lighthouse CLI (not the node API) — the API's browser-eval
// code breaks under tsx/esbuild's name-keeping. Median-of-N (grilled decision 5).
async function once(url: string) {
  const { stdout } = await run(
    "pnpm",
    [
      "exec", "lighthouse", url,
      "--quiet",
      "--only-categories=performance",
      "--output=json",
      "--output-path=stdout",
      "--chrome-flags=--headless=new --no-sandbox",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const lhr = JSON.parse(stdout.slice(stdout.indexOf("{")));
  const a = lhr.audits;
  return {
    lcp: a["largest-contentful-paint"].numericValue ?? 0,
    cls: a["cumulative-layout-shift"].numericValue ?? 0,
    tbt: a["total-blocking-time"].numericValue ?? 0,
    perf: (lhr.categories.performance.score ?? 0) * 100,
  };
}

export async function measureLighthouse(url: string, runs = DEFAULT_RUNS): Promise<LhResult> {
  const r = [];
  for (let i = 0; i < runs; i++) r.push(await once(url));
  return {
    lcp: median(r.map((x) => x.lcp)),
    cls: median(r.map((x) => x.cls)),
    tbt: median(r.map((x) => x.tbt)),
    perfScore: median(r.map((x) => x.perf)),
  };
}
