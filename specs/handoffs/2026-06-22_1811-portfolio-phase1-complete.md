---
date: 2026-06-22T22:11:00Z
git_commit: a76c5c8
branch: perf-harness
repository: portfolio
topic: "Portfolio IDE real build — Phase 1 (real SSR routes) complete, perf-gated; Phase 2 (IDE shell) next"
tags: [handoff, ide-rebuild, app-router, perf-harness, r3f-research, tailwind-v4]
status: in-progress
last_updated: 2026-06-22
type: handoff
---

# Handoff: Portfolio IDE real build — Phase 1 done, Phase 2 (IDE shell) next

## Task(s)
Executing the approved 6-phase plan `specs/plans/2026-06-22-portfolio-ide-real-build.md`. The throwaway prototype is being replaced by a properly-structured, perf-gated build. Core design law: every novel interaction is additive; the site is fully usable as a plain fast SSR'd site.

- **DONE — Research delegated:** perf-harness mapped; R3F/drei/three "light 3D" brief produced; both cached.
- **DONE — Perf harness calibrated** (`pnpm perf:calibrate`): budgets now live in `budgets.json`.
- **DONE — Deleted `scripts/hack_computer.sh`** (a stray network-scan/SSH-exfil script, nothing to do with the repo; user approved deletion).
- **DONE — Phase 1 (real route skeleton + data layer):** all 4 sub-tasks complete, **prod perf gate GREEN**, a11y green, JS-off verified. See Recent changes.
- **PLANNED — Phase 2 (IDE shell as additive client layout):** file-tree explorer, tabs, ⌘K palette, terminal drawer — layered over the Phase 1 routes via real `<Link>` navigation. This is what the user noticed is "missing" right now; it's deliberately deferred, not lost.
- **PLANNED — Phases 3–6:** feel/craft + sound; blog reclaim + search; lazy 3D badges; real content + palette pick + perf-loop.

## Critical References
- `specs/plans/2026-06-22-portfolio-ide-real-build.md` — the 6-phase plan. **Read first.** Each phase has automated + manual success criteria and must keep the perf gate green.
- `specs/vision/2026-06-21-portfolio-vision.md` — the brief + synthesized "good portfolio" research (the user's "creative references": Jason Cameron structure, Josh Comeau craft, Vercel ship-badge 3D pattern).
- `.agents/docs/3d/` — cached `r3f/drei/three` `llms-full.txt` for Phase 5 (do not re-fetch).

## Recent changes
Phase 1 (all new/edited on branch `perf-harness`, uncommitted):
- **Data layer (new):** `data/profile.ts`, `data/projects.ts` (has `demo?` slot + `featured`), `data/experience.ts`, `data/skills.ts`, `data/certs.ts` (empty, Phase 5).
- **Palette (new):** `app/lib/palette.ts` — `PALETTES` (Cream default darkened for a11y) + `DEFAULT_PALETTE_INDEX`. Import as `@/app/lib/palette` (alias `@/*`→repo root, NOT `@/lib/...`).
- **Routes (server components):** `app/page.tsx` (rewritten), `app/about/page.tsx`, `app/experience/page.tsx`, `app/projects/page.tsx`, `app/projects/[slug]/page.tsx` (`generateStaticParams` + async `generateMetadata`, demo slot), `app/contact/page.tsx`. All prerender ○/● static/SSG.
- **Components (new):** `components/site/SiteNav.tsx` (plain-site nav, JS-off), `components/site/PageShell.tsx`, `components/content/ui.tsx` (PageHeader/Prose/Body/Tag/TagRow/ActionLink), `components/content/ProjectCard.tsx`, `components/ClientBoot.tsx` (SW-kill + dev react-scan, the only client JS).
- **`app/layout.tsx`** — injects default palette as inline CSS vars on `<body>` (`paletteVars` from palette.ts) + SiteNav + ClientBoot + SpeedInsights.
- **`app/globals.css`** — `--mono`/`--sans` in `:root`; `.mono`, `.btn-tactile`; palette colors NO LONGER in `:root` (see Learnings).
- **Deleted prototype:** `app/page.tsx` blob is replaced; removed `app/ide-files.tsx`, `app/lib/data.ts`, `app/providers.tsx`; `pnpm remove next-view-transitions`.
- **Verification helpers (new, keep):** `scripts/axe-dump.mjs` (prints failing color-contrast nodes), `scripts/verify-shots.mjs` (SSR raw-HTML checks + screenshots + JS-disabled assertion → `perf-results/shots/`).

## Learnings
- **Tailwind v4 / Lightning CSS prunes `:root` custom properties referenced only from inline `style={{...}}`** (the optimizer can't see inline-style usage). It dead-code-eliminated the whole palette `:root` block AND the `body{background/color}` decls → `var(--accent)` resolved to nothing and tactile buttons rendered as plain text. **Fix: inject palette vars as inline style on `<body>`** (`app/layout.tsx`) from `palette.ts` (inline styles aren't pruned; single source for the Phase 2 switcher to override). Do NOT put palette colors back in a `:root{}` block in globals.css.
- **a11y color-contrast is a hard gate** (`e2e/invariants/a11y.spec.ts`, axe, on `/`). The creamy palette failed: muted text and the accent-as-text role line. Final passing values: `--muted #726552`, `--accent #a04c39` (4.45→~5:1). Verify contrast with `scripts/axe-dump.mjs` (don't trust hand-math; axe is authority).
- **Sandbox quirk:** `curl`/`head` inside shell `for`-loops or `$(command substitution)` get a stripped PATH ("command not found"); direct calls work. Do SSR/HTTP checks in Node (Playwright `request` API) instead — see `verify-shots.mjs`.
- **Path alias:** `@/*` → repo root. `@/data/foo` works; palette is `@/app/lib/palette`.
- **Next 16:** route `params` is a Promise — `await params` (the old backup-branch tag route is broken on this; fix in Phase 4).
- **LCP floor:** static near-empty page still measures ~2.16s LCP under Lighthouse Fast4G + 4× CPU throttle. It's render/throttle-bound, not JS. Push to 1000 target is Phase 6 perf-loop work, not chased now.

## Artifacts
- Plan: `specs/plans/2026-06-22-portfolio-ide-real-build.md`
- Perf harness map + 3D brief: delivered inline this session (perf details in `PERF.md`, `budgets.json`, `tools/perf-check/`).
- Cached 3D docs: `.agents/docs/3d/{r3f,drei,three}-llms-full.txt`
- Screenshots: `perf-results/shots/{home,projects,project-detail,about,contact,home-mobile,home-nojs}.png`
- Memories written: `portfolio-architecture-decision`, `portfolio-design-craft` (+ existing vision/stack/perf ones).

## Action Items & Next Steps
1. **Start Phase 2 — IDE shell as additive client layout** (plan §Phase 2). Build: persistent client layout (title bar, explorer tree, tabs, status bar) wrapping route `{children}` in the "editor pane"; explorer rows = real `<Link href>` (prefetched) mapping file→route; ⌘K palette → `router.push`; terminal drawer (`cd/ls/open/grep/theme/...`) → `router.push` + content index; palette switcher returns (client, persisted). Mobile: shell collapses to the plain stacked site. Salvage logic from git history of the old `app/page.tsx` (buildTree, terminal `run()` parser) — recoverable via `git show` if needed (it's deleted now).
2. **Watch the bundle:** currently 186 kB vs 243 budget / 170 target. Phase 2 adds the client shell — keep INP <100 and bundle ≤243.
3. **Gate each phase:** `pnpm e2e:perf && pnpm perf:check --json` + `pnpm e2e` (a11y/smoke). Full local: `pnpm perf`.
4. Pause for the user's manual confirmation at each phase boundary (per plan).

## Other Notes
- **Dev server** may still be running (`pnpm dev`, :3000). Hygiene: `pkill -f "next dev"; rm -f .next/dev/lock; lsof -ti :3000 | xargs kill -9`. Run prod gate on an alt port (`PORT=3100 pnpm start` + `perf:check --url http://localhost:3100`) to not disturb dev.
- **Decisions locked this session:** real-routes architecture (not SPA); comments dropped for v1 (no Supabase); mobile-app demo handled per-project via the `demo` slot (Appetize/Snack later); palette pick deferred to Phase 6 (CSS-vars, non-blocking); design craft + sound is its own Phase 3 workstream (current buttons are tacky-by-design until then).
- **Tone constraints:** no em dashes, no Claude/Anthropic attribution anywhere, objective/no-sycophancy. Use `2bTwist` GitHub for external PRs.
- Nothing committed yet; large untracked perf-harness + new Phase 1 files coexist with the old strip's `D` (deleted) entries in `git status`.
