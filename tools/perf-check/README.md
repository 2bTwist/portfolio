# perf-check

The thin verifier (grilled decision 6). Adopts the measurement engines
(Lighthouse, size-limit, the Playwright INP/CPU spec), normalizes them into **one
JSON verdict against `budgets.json`**, and exits `0` (pass) / `1` (fail).
Designed per [clig.dev](https://clig.dev): human table by default, `--json` for
the loop/agent, meaningful exit codes.

Run with `tsx` (no build step). Requires a prior `pnpm build` (size + lighthouse
read the built app and a running `pnpm start`).

## Commands

```sh
# Gate the current prod build against budgets.json (exit 1 on breach)
pnpm perf:check                 # pretty table
pnpm perf:check -- --json       # machine-readable, for the loop/agent

# Set budgets from a measured prod build (measure-then-ratchet, decision 10)
pnpm perf:calibrate             # measured + 5% headroom, floored at target
pnpm perf:calibrate -- --margin 3
```

## Flags

| flag | default | meaning |
|---|---|---|
| `--url <url>` | `http://localhost:3000/` | URL to measure |
| `--budget <file>` | `budgets.json` | budgets source of truth |
| `--runs <n>` | `5` | Lighthouse runs (median, variance control) |
| `--json` | off | machine-readable verdict |
| `--margin <pct>` | `5` | (calibrate) headroom above measured |

## Output shape (`--json`)

```json
{
  "verdict": "pass" | "fail",
  "perfScore": 98,
  "rows": [
    { "metric": "lcp", "layer": "page-load", "value": 820, "budget": 1000, "target": 1000, "unit": "ms", "pass": true }
  ]
}
```

`pass: null` means the metric isn't enforced yet (uncalibrated) or wasn't
measured this run (e.g. INP needs `pnpm e2e:perf` first).
