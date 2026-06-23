# Groundwork: React/Next.js performance harness + autonomous perf-loop — 2026-06-22

A deliberately-invoked harness that holds serious React/web work to an **excellent** bar. Its centerpiece is an **autonomous perf-optimization loop**: after a component/feature is built, a separate adversarial agent drives e2e tests replicating real user behaviors, a `perf check` verifier measures from page-load down to the render/CPU level, and the loop keeps improving until budgets are met , stopping only at the budget or at a severe tradeoff it escalates. Substrate tools are adopted; only the verifier + budgets + invariants are built.

> **Status:** revised after a `/grill-me` session on 2026-06-22, then IMPLEMENTED 2026-06-22 on branch `perf-harness` (uncommitted).
>
> **Implementation status (2026-06-22):** All 7 phases built and verified.
> - ✅ Phase 1 Foundation — Vitest (2 render-count tests pass), Playwright config (BASE_URL-overridable), `budgets.json`, `perf/config.ts`, `.github/workflows/perf.yml` (4 jobs).
> - ✅ Phase 2 Lab gates — `lighthouserc.js` (reads budgets.json), `.size-limit.js` (switched preset-app→@size-limit/file; bundle measured **235 KB gz**), bundle-analyzer wired.
> - ✅ Phase 3 Dev visibility — dev-only React Scan in `providers.tsx`, `react-hooks/exhaustive-deps`=error (surfaced + fixed `app/page.tsx:44`). Lint clean (0 errors).
> - ✅ Phase 4 `perf check` CLI — `tools/perf-check/` (commander, tsx, child_process engines; node API swapped out due to tsx/esbuild `__name` break). Verified end-to-end: `check` (perf score 98, LCP 2409ms, bundle 230KB) + `calibrate` (floor-at-target logic correct).
> - ✅ Phase 5 Deep measurement — `e2e/perf.spec.ts` verified (INP proxy **56ms**, `homepage.cpuprofile` 222KB written via CDP); tachometer scaffolded in `bench/`.
> - ✅ Phase 6 Loop skill — `~/.claude/skills/perf-loop/SKILL.md` registered; invariant suite `e2e/invariants/{smoke,a11y}.spec.ts`.
> - ✅ Phase 7 RUM — `<SpeedInsights/>` in `app/layout.tsx`.
> - ⚠️ **Real finding on first run:** the a11y invariant FAILED on a genuine `color-contrast` violation (the creamy palette). The harness works; this is a design decision for the user (fix contrast vs scope the gate). Budgets remain uncalibrated (`null`) pending a user calibration run.

## Current state (5 bullets max)
- Stack: **Next.js 16.2.9, React 19.2.7, Tailwind 4, TS 5, pnpm**; **React Compiler already on** (`next.config.ts:4`, `babel-plugin-react-compiler@1.0.0`) , auto-memoization handles most needless re-renders at compile time.
- **Zero tests, zero CI, zero perf tooling.** Scripts: `dev/build/start/lint`. ESLint extends `eslint-config-next/core-web-vitals` (`eslint.config.mjs:2`).
- Tiny surface: **1 route (`/`), ~818 lines** (`app/page.tsx` 514, `app/ide-files.tsx` 200, `app/lib/data.ts` 104). Deployed to **Vercel** (manual, no `vercel.json`).
- An interactive teaching artifact exists at `cn-explainer.html` (animation loop) , a fair first target for the microbench/CPU layer.
- Machine posture: `ignore-scripts=true`, socket prefix for new installs , constrains adding young single-maintainer runtime deps.

## Grilled decisions (source of truth)
1. **Purpose = all four** (learning / production guardrail / reusable template / agent-ops). Tiebreaker when they conflict: **dependency order first, then production value.** Learning + template are cross-cutting constraints (smallest-real-example; portable, copy-pasteable config), not phases.
2. **Test runner = Vitest only.** reassure (render-regression) needs Jest; not worth a 2nd runner on a compiler-on repo. Render-count checks done via React Profiler in Vitest; revisit reassure only if the app grows enough to justify Jest.
3. **"Excellent" is per-layer, above each layer's noise/physics floor** (corrects the "good = nanoseconds" category error):
   - Function/render layer (hot fns, component render time): **sub-microsecond / nanosecond** , this is where "1ms is slow" is correct.
   - Interaction layer (INP): floor is **one frame** (16.7ms@60Hz / 8.3ms@120Hz); target sub-frame (~<100ms INP). Nanoseconds physically impossible/imperceptible here.
   - Page-load layer (LCP/CLS): network+device bound; target **sub-1s LCP**. Nanoseconds not a thing.
4. **Acceptance is verifier-driven, not agent self-report.** Budgets live in a committed `budgets.json` the loop **cannot edit**. e2e behavior scripts are authored by a **separate adversarial agent role**, not the builder (preserves independent verification , "never be the sole verifier of your own output").
5. **Measurement env = throttled prod build, median-of-N, local.** Always `next build && next start` (never dev , dev is 2-10x slower/non-representative). Fixed CDP CPU/network throttle for reproducibility. Budget margin must exceed measured stddev. Microbench A/B uses statistically-rigorous sampling (tachometer), not raw wall-clock.
6. **`perf check` CLI built; measurement engines adopted.** Thin orchestrator: runs adopted engines, normalizes to **one JSON verdict vs budgets.json**, exits 0/1. TypeScript (must call engines' programmatic APIs in-process). `commander` or `citty`. Designed per **clig.dev** (human-readable default, `--json`, meaningful exit codes, config+flags). Tunables: `--runs`, `--throttle`, `--budget`, `--url`, `--json`, `--max-iterations`.
7. **Loop safety = correctness-first invariants + escalate.** Hard invariants the loop cannot violate: functional e2e + a11y stay green (correctness dominates perf), cannot edit budgets, cannot silently remove a feature/animation. If the only path to budget breaks an invariant or needs a UX sacrifice → **stop and escalate with a written tradeoff analysis + best-achieved numbers.** Iteration cap; at cap, escalate (never auto-accept).
8. **Triggers tiered by what's measurable + cost.** Cheap per-component: bundle-delta, render-count (Profiler), microbench. Expensive at feature/page boundaries + pre-merge: CWV/INP, CPU trace, median-of-N prod build. Per-invocation **cost ceiling** (max iterations + token/time budget) so a session can't run away.
9. **Orchestration = native Claude Code primitives** (`/loop`, the Workflow tool, `autoresearch` skill) for loop+gate. **gnhf** (ralph/autoresearch loop runner) and **no-mistakes** (pre-push AI validation gate) are studied as **reference designs only**, not runtime deps (young, single-maintainer; supply-chain risk vs machine posture). We build the verifier; the harness provides the loop.
10. **Budgets = measure-then-ratchet, excellent as floor target.** First run sets each budget just under measured throttled-prod value (a small win required, not all-red); record per-layer excellent target (Russell device-based: e.g. <~170KB JS on mid-tier mobile, sub-1s LCP, sub-frame INP, sub-µs hot fns); each accepted win ratchets the budget down toward target. Loop always has a reachable next step.

## Solutions surveyed
- **Lighthouse CI** `@lhci/cli` (https://github.com/GoogleChrome/lighthouse-ci) , Google lab-CWV gate. `lighthouserc.js` assertions (`level | [level, options]`, `maxNumericValue`/`minScore`), `numberOfRuns`+aggregation for variance, `error`→non-zero exit. MIT.
- **Unlighthouse** (https://github.com/harlan-zw/unlighthouse) , site-wide Lighthouse CLI, parallel, smart sampling. MIT. For multi-route later.
- **size-limit** + `@size-limit/preset-app` (https://github.com/ai/size-limit) , byte-budget gate; `andresz1/size-limit-action` PR comments + rejects over-budget. MIT.
- **google/tachometer** (https://github.com/google/tachometer) , **statistically rigorous** JS benchmark runner: repeated sampling until a **95% confidence interval** distinguishes A/B. The correct tool for the noise floor + cn-vs-cnfast-class A/B questions. (Endorsed by Nolan Lawson.) Apache-2.0.
- **Playwright + CDP** `@playwright/test` (https://playwright.dev) , e2e + INP (needs real interaction) + **CPU sampling profiles / traces** via `newCDPSession()`→`Profiler.*`/`tracing` (flame charts). The deepest layer web exposes. Apache-2.0.
- **React Scan** `react-scan` (https://github.com/aidenybai/react-scan) , dev-time render overlay, no code change. MIT. Dev-only.
- **Vercel Speed Insights + web-vitals** (https://web.dev/vitals) , production RUM (real-device LCP/CLS/INP). Field truth.
- **Reference designs (not deps): gnhf** (https://github.com/kunchenguid/gnhf) , loop runner: `--max-iterations`/`--max-tokens`/`--stop-when`, commit-per-iteration, rollback-on-failure, exponential backoff, agent-agnostic. **no-mistakes** (https://github.com/kunchenguid/no-mistakes) , pre-push disposable-worktree AI validation pipeline that auto-fixes safe issues and escalates the rest. Both implement ralph (Geoffrey Huntley) / autoresearch (Karpathy) patterns.

**Convergence note:** every 2026 source maps the same layers to the same engines; the only *unfilled* gap across all of them is a verifier-driven, budget-aware verdict that an autonomous loop can poll , which is exactly the `perf check` CLI we build. gnhf+no-mistakes independently arrive at the loop+gate shape we grilled to, confirming the architecture.

**Build vs adopt.** Adopt every measurement engine and the loop/gate orchestration (native primitives). Build only: `perf check` CLI, `budgets.json` schema + ratchet, the invariant test suite, and the loop/gate skill wiring. No off-the-shelf tool unifies measurement→budget-verdict→autonomous-loop with independent verification; that glue is ours.

## Canonical guidance consulted
- **Alex Russell** (https://infrequently.org/2017/10/can-you-afford-it-real-world-web-performance-budgets/) , budgets must be anchored to a representative device + network, not a feeling. Basis for decision 10's targets.
- **Addy Osmani** (https://addyosmani.com/blog/performance-budgets/) , "a limit which the team is not allowed to exceed." Basis for the committed, loop-uneditable budgets.json.
- **Tim Kadlec / SpeedCurve** (https://www.speedcurve.com/blog/performance-budgets-guide/) , budget = threshold on the metrics you care most about, monitored over time (the ratchet).
- **Google / Lighthouse CI** (https://github.com/GoogleChrome/lighthouse-ci) , "Run Lighthouse many times to reduce variance." Basis for median-of-N.
- **google/tachometer + Nolan Lawson** (https://nolanlawson.com/2024/08/05/reliable-javascript-benchmarking-with-tachometer/) , repeat-sample to statistical confidence; basis for the A/B microbench engine.
- **clig.dev** (https://clig.dev) , CLI design: human-first, `--json` for machines, meaningful exit codes, config+flags. Basis for the verifier's UX contract.
- **web.dev / Core Web Vitals** , INP is interaction-driven (must measure with interactions); CWV "good" thresholds. Basis for decision 3.

## What's good (do not change)
- `next.config.ts:4` `reactCompiler: true` , highest-leverage perf setting, correctly on.
- `eslint.config.mjs:2-3` , already extends `core-web-vitals` + `typescript`; lint layer partially in place.
- `public/sw.js` + `app/providers.tsx` , kill-switch SW correctly avoids a stale-cache trap; don't reintroduce a caching SW without measuring.
- pnpm + lockfile + `ignore-scripts` , matches machine supply-chain defaults; all additions via `pnpm add -D`.

## Phases

> **Altitude note.** Repo is 1 route / ~818 lines, compiler on. Phases 1-3 are immediately useful. Phases 4-7 are the autonomous-loop infrastructure, built ahead of strict need because it's the headline goal + a learning vehicle. Each phase is independently valuable and stoppable. Build the verifier (Phase 4) before the loop (Phase 6) , the loop has nothing to poll without it.

### Phase 1: Foundation , Vitest + Playwright + CI skeleton + measurement env + budgets.json
**Why.** Everything polls the same measurement env and budgets. (a) Lighthouse CI "run many times to reduce variance"; Russell device-anchored budgets. (b) `vitest`, `@playwright/test`.
**Files.** `package.json`, `vitest.config.ts` (new), `playwright.config.ts` (new), `budgets.json` (new), `.github/workflows/perf.yml` (new), `scripts/measure-env.ts` (new , prod build + CDP throttle helper).
**Steps.**
1. `pnpm add -D vitest @testing-library/react @testing-library/dom jsdom @playwright/test`.
2. `playwright.config.ts`: fixed CPU/network throttle (CDP), N-run projects; always target `next start` (prod build).
3. `budgets.json` skeleton (empty thresholds + recorded `target` per metric).
4. CI skeleton: install → `pnpm build` → run gates (filled in next phases).
**Verification.** [ ] `pnpm exec playwright test` runs against a prod build; [ ] CI green on a trivial test.
**Effort.** Medium. **Trigger.** Now.

### Phase 2: Lab gates , Lighthouse CI (CWV) + size-limit (bundle), calibrated
**Why.** Page-load layer, highest user-facing ROI. (a) Osmani/Kadlec budgets. (b) `@lhci/cli`, `size-limit`.
**Files.** `lighthouserc.js` (new), `.size-limit.json` (new), `next.config.ts` (bundle-analyzer, env-gated), `.github/workflows/perf.yml`, `budgets.json`.
**Steps.** `pnpm add -D @lhci/cli size-limit @size-limit/preset-app @next/bundle-analyzer`; calibrate budgets by measuring once then setting just under (decision 10); wire `error`-level assertions + `size-limit-action`.
**Verification.** [ ] heavy import → `pnpm size` fails; [ ] 1MB blocking image → LH LCP assertion fails; both revert clean. [ ] PR shows size bot.
**Effort.** Medium. **Trigger.** After Phase 1.

### Phase 3: Dev visibility , React Scan + eslint-react-hooks
**Why.** Tight local feedback; verifies React Compiler is actually eliminating renders. (b) `react-scan`, `eslint-plugin-react-hooks`.
**Files.** `app/providers.tsx` (dev-only `scan()`), `eslint.config.mjs`, `package.json`.
**Steps.** `pnpm add -D react-scan eslint-plugin-react-hooks`; dev-guarded scan init; strict hooks ruleset (keeps RC effective).
**Verification.** [ ] overlay flashes only truly re-rendering components; [ ] hooks violation fails lint.
**Effort.** Low. **Trigger.** Now (parallel to 1-2).

### Phase 4: Build the `perf check` verifier CLI (the gap)
**Why.** The single verifier every gate and the loop polls. (a) clig.dev contract. (b) wraps adopted engines.
**Files.** `tools/perf-check/` (new TS package): `cli.ts`, `engines/{lighthouse,size,playwright-inp,tachometer}.ts`, `verdict.ts`, `README.md`. `budgets.json`.
**Steps.**
1. `pnpm add -D commander` (or `citty`).
2. `perf check --url <u> --budget budgets.json [--runs N --throttle 4 --json]` → runs engines in-process, normalizes to `{verdict, metrics:{lcp,inp,cls,bundleKB,hotFns}, vsTarget}`, exit 0/1.
3. clig.dev: pretty table by default, `--json` for the agent, non-zero exit on fail.
4. Reference gnhf's flag surface (`--max-iterations`) so verbs compose with the loop.
**Verification.** [ ] `perf check --json` emits valid verdict on the real prod build; [ ] exit code flips with a deliberate regression; [ ] reading only `--json`, an agent can decide pass/fail.
**Effort.** Medium-High. **Trigger.** After Phase 2 (needs engines + budgets).

### Phase 5: Deep measurement , tachometer (A/B microbench) + Playwright/CDP (INP + CPU flame)
**Why.** Hot-fn + interaction + CPU layer; the cn-vs-cnfast question done rigorously. (a) tachometer CI; web.dev INP. (b) `google/tachometer`, Playwright CDP.
**Files.** `bench/*.tach.html` or tachometer config (new), `e2e/perf.spec.ts` (INP + `.cpuprofile` capture), `perf-check` engines.
**Steps.** Add tachometer for any provably-hot fn (the `cn-explainer.html` animation loop is candidate #1); Playwright CDP `Profiler.start/stop` → save flame-chart artifact; `onINP` during scripted interaction.
**Verification.** [ ] tachometer reports A/B with CI bounds; [ ] `.cpuprofile` opens as a flame chart in DevTools; [ ] main-thread-blocking interaction fails the INP budget.
**Effort.** High. **Trigger.** After Phase 4; when a hot fn or real interaction exists.

### Phase 6: The autonomous perf-loop skill (centerpiece)
**Why.** The headline: invoke-to-optimize-until-excellent, with independent verification + escalation. (a) ralph/autoresearch patterns; correctness-first invariants. (b) native `/loop` + Workflow + `autoresearch`; reference gnhf/no-mistakes.
**Files.** `~/.claude/skills/perf-loop/SKILL.md` (new), `e2e/invariants/*.spec.ts` (functional + a11y), loop wiring.
**Steps.**
1. Invariant suite (functional e2e + a11y via `@axe-core/playwright`) , the hard gate.
2. Loop skill: builder agent optimizes; **separate adversarial sub-agent** authors behavior scripts; each iteration runs `perf check --json` + invariants; ratchet budgets on accept; stop at budget-met OR escalate on invariant-conflict/cap with a written tradeoff doc.
3. Tiered triggers + per-invocation cost ceiling (decision 8).
4. Mirror gnhf's commit-per-iteration + rollback-on-failure and no-mistakes' worktree-validate-escalate, using harness primitives.
**Verification.** [ ] a deliberately-slow component drives the loop until budget met; [ ] a UX-sacrificing-only path makes it escalate, not proceed; [ ] loop cannot edit budgets.json; [ ] cap reached → escalates with best-so-far.
**Effort.** High. **Trigger.** After Phases 4-5 (loop needs the verifier + deep metrics).

### Phase 7: RUM , Vercel Speed Insights + web-vitals
**Why.** Lab ≠ field; only RUM measures truth. (a) web.dev field data. (b) `@vercel/speed-insights`.
**Files.** `app/layout.tsx`.
**Steps.** `pnpm add @vercel/speed-insights`; mount `<SpeedInsights/>`.
**Verification.** [ ] real-visitor CWV appear post-deploy.
**Effort.** Low. **Trigger.** Anytime (independent).

## Out of scope
- **reassure / Jest** , deferred (decision 2); render-count via Vitest+Profiler instead.
- **CodSpeed** , superseded by tachometer for rigorous A/B (decision 5); revisit only for hosted CI flame-graph diffs.
- **gnhf/no-mistakes as runtime deps** , reference only (decision 9).
- **Removing/replacing `cn`** , no `cn` in repo; irrelevant until reusable className-override components exist.
- **Self-hosted LHCI server / Grafana, load testing (k6), per-CPU-instruction profiling** , out of scope (CDP sampling profiler is the web floor).

## Hand-off
Run `/grill-me` again only if a decision above feels unsettled (the tree has been walked once).
Then `/implement specs/plans/2026-06-22-groundwork-perf-harness.md` to execute Phase 1.
