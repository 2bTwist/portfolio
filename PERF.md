# Performance harness

A layered harness that reports what happens performance-wise on every change —
from page load (Core Web Vitals) down to the render/CPU level — and gates against
`budgets.json`. Full design + rationale: `specs/plans/2026-06-22-groundwork-perf-harness.md`.

## How to use it WITHOUT hurting your velocity

There are three ways to run it, ordered by how little they touch your flow:

### 1. CI (default — zero local cost)
Every push/PR triggers `.github/workflows/perf.yml`, four parallel gates:
`lint-test`, `bundle`, `lab-cwv`, `e2e-perf`. **You keep coding; the machine
measures.** This is the "launched in the background while you work" mode — it
runs on GitHub's runners, never on your laptop. You only look when a gate goes
red. Bundle deltas are commented on the PR.

### 2. Local one-shot, backgrounded (when you want a local read)
```sh
pnpm perf            # build + bundle + e2e perf + verdict, all at once
```
It's slow (prod build + median-of-N Lighthouse + Playwright), so **background
it** and keep working:
```sh
pnpm perf > perf.log 2>&1 &     # then: cat perf.log when it finishes
```
Or just ask the agent to run it in the background — it'll notify you on completion.

### 3. The autonomous loop (deliberate, for serious implementation)
Invoke the `perf-loop` skill (alongside `/implement`) when a design is settled
and you want it driven to the excellent bar. It optimizes until budgets pass or
it hits a severe tradeoff and escalates with a written analysis. **Not for
prototyping** — it's a "we mean it now" state.

## First-time setup (once)
```sh
pnpm build                       # produce a prod build to measure
pnpm start &                     # serve it on :3000
pnpm perf:calibrate              # fill budgets.json from your real numbers
kill %1                          # stop the server
```
Until you calibrate, `budgets.json` budgets are `null` and gates only warn.

## Command reference
| command | layer | what it does |
|---|---|---|
| `pnpm test` | render/CPU | Vitest unit + render-count gates (fast) |
| `pnpm test:watch` | render/CPU | watch mode while coding |
| `pnpm size` | bundle | size-limit byte gate (needs `pnpm build`) |
| `pnpm lh` | page-load | Lighthouse CI CWV (median-of-5) |
| `pnpm e2e` | correctness | functional + a11y invariants |
| `pnpm e2e:perf` | interaction | INP proxy + CPU flame profile → `perf-results/` |
| `pnpm perf:check` | all | one verdict vs budgets.json (exit 0/1) |
| `pnpm perf:calibrate` | all | set budgets from measured prod build |
| `pnpm analyze` | bundle | visual bundle treemap |
| `pnpm perf` | all | the whole suite in one shot |

## Inspecting the CPU profile
`pnpm e2e:perf` writes `perf-results/homepage.cpuprofile`. Open Chrome DevTools →
Performance → load that file to see the flame chart (function-level, the deepest
view the web exposes — there is no per-CPU-instruction profiling for web).

## Dev-time
`pnpm dev` shows the React Scan overlay (highlights what re-renders) — dev only,
never shipped. This is your instant feedback while coding.
