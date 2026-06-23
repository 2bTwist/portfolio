---
date: 2026-06-22T19:47:41Z
git_commit: a76c5c8
branch: perf-harness
repository: portfolio
topic: "Rebuild portfolio from scratch as an IDE-style site; prototyping phase"
tags: [handoff, ide-prototype, palettes, motion, service-worker, turbopack]
status: in-progress
last_updated: 2026-06-22
type: handoff
---

# Handoff: Portfolio rebuild as a navigable-IDE site (prototype phase)

## Task(s)
Rebuilding Edmond's portfolio from a blank Next.js shell. Currently in the **prototyping / direction-finding** phase (pre-`/groundwork`).

- **DONE** Strip old portfolio to bare shell. Backup on branch `backup/pre-strip-bare-bones`.
- **DONE** Research + vision doc synthesized: `specs/vision/2026-06-21-portfolio-vision.md`.
- **DONE** Direction chosen by user: **Full IDE interface** (the site *is* an editor, not a scrollable site with IDE flavor).
- **DONE** Built the IDE prototype (explorer → single pane, tabs, Cmd+K palette, terminal, status bar, 3 palettes, tactile buttons).
- **DONE** Course-corrected: removed Jason-Cameron-cloned furniture (bento grid, live clock, location card, "All services nominal", click counter).
- **DONE** Fixed two blocking bugs: stale-service-worker reload loop, and a Turbopack workspace-root crash.
- **IN PROGRESS / BLOCKED ON USER** Confirm the reload loop is gone after a hard reload, then **pick a palette** (Cream / Latte / Frappé).
- **PLANNED** Develop chosen palette (type + spacing); solve mobile; remaining vision features (blog, 3D badges, live app demo); then `/groundwork` → `/grill-me` → `/plan`.
- **PARALLEL (user-driven)** A perf harness was scaffolded on branch `perf-harness` (Playwright, Vitest, Lighthouse, size-limit, bundle-analyzer, react-scan). Not yet integrated with the prototype work.

## Critical References
- `specs/vision/2026-06-21-portfolio-vision.md` — the living vision/brief (12 sections, 7 open decisions). Read first.
- Reference site studied (do NOT clone): `jasoncameron.dev` + `terminal.jasoncameron.dev`. The over-cloning of his bento dashboard was the user's main complaint — keep references at "what they list", not "how it looks".
- Memory: `portfolio-rebuild-vision`, `portfolio-stack-pnpm` (in the project memory dir).

## Recent changes
- `app/page.tsx` — the entire IDE shell (client). Explorer tree `buildTree()` page.tsx:12; `openFile`/`closeTab` page.tsx:54-70; global shortcuts (⌘K, Ctrl+`, Esc) page.tsx:73; `CommandPalette` and `Terminal` components lower in the file (terminal commands: ls, open/cat/cd, grep, theme, clear, whoami, pwd).
- `app/ide-files.tsx` — `FILES` registry (README, about, experience, projects/*, writing/*, contact) with JSX `body` + flat `text` for grep/palette search. Content is placeholder.
- `app/lib/data.ts` — `PALETTES` (Cream, Latte, Frappé soft-dark; CSS-var sets) + `PROJECTS` (4 sample, web/mobile).
- `app/providers.tsx` — `PaletteProvider`/`usePalette`; `useKillStaleServiceWorker()` providers.tsx:36; `useReactScan()` providers.tsx:36-41 (user-added, dev-only).
- `app/globals.css` — `.btn-tactile` skeuomorphic press button (CSS only), `--mono`/`--sans` vars. Has leftover `::view-transition-*` rules (now unused, harmless).
- `public/sw.js` — **kill-switch service worker** (self-unregisters + clears caches + reloads once). Fix for the loop.
- `next.config.ts` — `reactCompiler: true`, `turbopack.root: path.resolve(".")` (next.config.ts:9), wrapped in `@next/bundle-analyzer` (user-added; `ANALYZE=true pnpm build`).
- `app/layout.tsx` — renders `<Providers>` + `<SpeedInsights/>` (user-added).

## Learnings
- **Service-worker reload loop (root cause):** the OLD portfolio registered a SW at `/sw.js`. After the strip it 404'd, so the stale worker kept forcing reloads (`GET /` + `GET /sw.js 404` looping in the dev log). In-page `navigator.serviceWorker...unregister()` (providers.tsx) **cannot win** because the page reloads before JS finishes. The robust fix is serving a real self-destruct worker at `public/sw.js` — the browser refetches that URL at the network level regardless of page state. Keep `public/sw.js` indefinitely.
- **Turbopack crash:** Next 16.2.9 Turbopack intermittently mis-inferred the workspace root as `app/` (couldn't resolve `next` from there) under the reload storm. Deterministic fix = pin `turbopack.root`. If it recurs: `rm -rf .next`, kill stale `next`, restart.
- **View Transitions card-morph glitched** because the card had a Motion hover `translateY` transform on the same element carrying `viewTransitionName` → snapshot captured mid-transform + small→big crossfade ghosting. The full-IDE model sidesteps it: files open **in-pane** with a 0.18s fade. `next-view-transitions` is installed but now **unused** (remove if no morph returns).
- **Design law (do not break):** every novel interaction is additive; the site stays usable as a plain site. North star = **low cognitive load**.
- **Single palette, NO light/dark flip.** Soft creamy, Catppuccin-derived. User wants heavy palette prototyping before locking.
- **pnpm only** (`package-lock.json` removed). `ignore-scripts` on globally → `sharp`/`unrs-resolver` build scripts ignored (fine for dev).

## Artifacts
- Prototype code: `app/page.tsx`, `app/ide-files.tsx`, `app/lib/data.ts`, `app/providers.tsx`, `app/globals.css`, `public/sw.js`, `next.config.ts`.
- Vision: `specs/vision/2026-06-21-portfolio-vision.md`.
- This handoff: `specs/handoffs/2026-06-22_1547-portfolio-ide-rebuild.md`.
- Backup of full old portfolio: branch `backup/pre-strip-bare-bones` (MDX blog + tag routes + RSS + Supabase comments — reclaim the blog from here).

## Action Items & Next Steps
1. **Confirm the loop is dead** — user does one hard reload (Cmd+Shift+R) or incognito. Dev server runs on `:3000` (`pnpm dev`).
2. **User picks a palette** (Cream / Latte / Frappé). Then develop it: typography, spacing, real content.
3. **Solve mobile** — explorer is `hidden md:block` (page.tsx:128); the IDE-on-phone story is unsolved (vision open decision #6).
4. **Decide on project "expand"** — the dramatic card→page morph was removed (it was the glitch). If wanted, redo it as an in-pane maximize animation, not a route morph.
5. **Remaining vision features:** tagged + full-text-searchable blog (reclaim MDX from backup branch; client search via Fuse.js/FlexSearch); 3D rotatable cert badges (react-three-fiber + drei, lazy-loaded); live mobile-app demo (Appetize.io vs Expo Snack — price Appetize first).
6. **Then** `/groundwork` → `/grill-me` → `/plan` for the real (non-throwaway) build.

## Other Notes
- **Prototype code is throwaway** — inline styles + CSS vars, one big client component. Do not treat as final architecture.
- Versions: Next **16.2.9** (security bump from vulnerable 16.0.7), React **19.2.7**, motion 12.40.
- Branch is `perf-harness` (not `main`); lots of untracked perf tooling present (`PERF.md`, `e2e/`, `perf/`, `bench/`, `budgets.json`, `playwright.config.ts`, `vitest.config.ts`, `.size-limit.js`, `lighthouserc.js`). Clarify with user whether perf-gating runs now or after a palette is chosen.
- Tone constraints (user): no em dashes, no Claude/Anthropic attribution anywhere, objective/no-sycophancy.
- Dev-server hygiene: only one `next dev` at a time; if port 3000 stuck → `pkill -f "next dev"; rm -f .next/dev/lock; lsof -ti :3000 | xargs kill -9`.
