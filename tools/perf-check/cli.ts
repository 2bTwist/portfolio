#!/usr/bin/env -S npx tsx
import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { measureLighthouse } from "./engines/lighthouse";
import { measureBundleKB } from "./engines/size";
import { readInp } from "./engines/inp";
import { DEFAULT_URL, DEFAULT_RUNS } from "../../perf/config";

// The thin verifier (grilled decision 6). Adopts the measurement engines,
// normalizes to ONE verdict vs budgets.json, exits 0/1. clig.dev contract:
// human table by default, --json for the loop/agent, meaningful exit code.

type Metric = { budget: number | null; target: number; unit: string; layer: string };
type Budgets = { url: string; measurement: { runs: number }; metrics: Record<string, Metric> };

function loadBudgets(p = "budgets.json"): Budgets {
  return JSON.parse(readFileSync(p, "utf8"));
}

async function measureAll(url: string, runs: number) {
  const [lh, bundleKB] = await Promise.all([measureLighthouse(url, runs), measureBundleKB()]);
  return {
    lcp: lh.lcp, cls: lh.cls, tbt: lh.tbt,
    inp: readInp(), bundleKB, perfScore: lh.perfScore,
  } as Record<string, number | null>;
}

const program = new Command();
program
  .name("perf-check")
  .description("Measure web performance and emit one verdict vs budgets.json");

program
  .command("check")
  .description("Measure and gate against budgets.json (exit 1 on any breach)")
  .option("--url <url>", "URL to measure", DEFAULT_URL)
  .option("--budget <file>", "budgets file", "budgets.json")
  .option("--runs <n>", "lighthouse runs (median)", String(DEFAULT_RUNS))
  .option("--json", "machine-readable output for the loop/agent", false)
  .action(async (opts) => {
    const budgets = loadBudgets(opts.budget);
    const measured = await measureAll(opts.url, Number(opts.runs));
    const rows = Object.entries(budgets.metrics).map(([k, m]) => {
      const value = measured[k] ?? null;
      const pass = value == null || m.budget == null ? null : value <= m.budget;
      return { metric: k, layer: m.layer, value, budget: m.budget, target: m.target, unit: m.unit, pass };
    });
    const verdict = rows.some((r) => r.pass === false) ? "fail" : "pass";

    if (opts.json) {
      console.log(JSON.stringify({ verdict, perfScore: measured.perfScore, rows }, null, 2));
    } else {
      console.log(`\nperf-check ${verdict.toUpperCase()}  (perf score ~${Math.round(measured.perfScore ?? 0)})\n`);
      for (const r of rows) {
        const v = r.value == null ? "—" : r.unit === "score" ? r.value.toFixed(3) : String(Math.round(r.value));
        const b = r.budget == null ? "(uncalibrated)" : `${r.budget}${r.unit}`;
        const mark = r.pass === null ? "·" : r.pass ? "✓" : "✗";
        console.log(`  ${mark} ${r.metric.padEnd(9)} ${v.padStart(7)} ${r.unit === "score" ? "" : r.unit}  budget ${b}  target ${r.target}${r.unit}  [${r.layer}]`);
      }
      console.log("");
    }
    process.exit(verdict === "fail" ? 1 : 0);
  });

program
  .command("calibrate")
  .description("Set each budget from a measured prod build, with headroom, floored at target (decision 10)")
  .option("--url <url>", "URL to measure", DEFAULT_URL)
  .option("--budget <file>", "budgets file", "budgets.json")
  .option("--runs <n>", "runs", String(DEFAULT_RUNS))
  .option("--margin <pct>", "headroom above measured (noise buffer), %", "5")
  .action(async (opts) => {
    const budgets = loadBudgets(opts.budget);
    const measured = await measureAll(opts.url, Number(opts.runs));
    const margin = 1 + Number(opts.margin) / 100;
    for (const [k, m] of Object.entries(budgets.metrics)) {
      const value = measured[k];
      if (value == null) continue;
      const calibrated = m.unit === "score" ? Number((value * margin).toFixed(3)) : Math.ceil(value * margin);
      m.budget = Math.max(calibrated, m.target); // never set looser than the excellent target
    }
    writeFileSync(opts.budget, JSON.stringify(budgets, null, 2) + "\n");
    console.log(`Calibrated ${opts.budget}: measured + ${opts.margin}% headroom, floored at target.`);
  });

program.parseAsync();
