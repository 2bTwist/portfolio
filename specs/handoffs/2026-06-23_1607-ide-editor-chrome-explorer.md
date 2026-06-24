---
date: 2026-06-23T16:07:00Z
git_commit: 85ce6c4
branch: perf-harness
repository: portfolio
topic: "Editor-chrome UX pass: theme-aware traffic lights + VS Code command center + unified intuitive search (committed), then resizable explorer with escalating bouncer, deterministic tree alignment, folder-click toggle, custom Phosphor grab-hand cursor, first-sound fix (UNCOMMITTED)"
tags: [handoff, ide, explorer, cursor, sound, search, title-bar]
status: in-progress
last_updated: 2026-06-23
type: handoff
---

# Handoff: IDE editor-chrome + explorer UX pass

## Task(s)

Live tuning loop with the user on the IDE shell (a "new phase before the rest", user's words). Not from a plan doc; conversational, fast-feedback. Phase 4 (blog) is done+committed; Phases 5-6 not started (see plan `specs/plans/2026-06-22-portfolio-ide-real-build.md`).

1. **Title bar (DONE, committed 85ce6c4).** Theme-aware traffic-light dots, VS Code command-center search pill (opens ⌘K), unified intuitive search.
2. **Resizable explorer + tree polish (DONE, UNCOMMITTED).** All verified in-browser. Awaiting user OK to commit.
3. **Grab-hand cursor (DONE, UNCOMMITTED).** Rebuilt 3x: my hand-rolled SVG was "HORRIBLE" per user; final = inlined Phosphor `Hand`/`HandGrabbing` paths.
4. **First-sound-never-plays fix + cooldown bump (DONE, UNCOMMITTED).**
5. **OPEN QUESTION for user:** page `<title>` metadata uses em-dash separators site-wide ("About — Edmond Ndanji"); asked whether to switch all to comma/pipe. Awaiting answer. Also asked: flip grab hand to thumb-up (`scaleY(-1)`) to match their reference image (currently thumb-down).

## Critical References

- `components/ide/Explorer.tsx` — resizable panel + escalating bouncer + deterministic tree.
- `components/feel/CustomCursor.tsx` + `app/globals.css` (cursor + `.ide-*` + reading-surface CSS) — custom cursor incl. grab hand.
- Memory: `[[instant-drag-pattern]]`, `[[browser-mcp-dev-testing]]`, `[[prism-server-render-zero-client-js]]`, `[[phase4-blog-search-architecture]]` in `~/.claude/projects/-Users-edmond-Projects-portfolio/memory/`.

## Recent changes (uncommitted; on top of 85ce6c4)

- **Resizable explorer** `components/ide/Explorer.tsx`: width 170-300 (relaxes to 460 after "win"), persisted `localStorage["ide:explorer-width"]`. Drag handle right edge. **Native window pointer listeners** (mount-once `useEffect`), width written straight to DOM (`asideRef.style.width`) — NOT React state (binding it caused snap-back on bouncer re-renders). Bubble portaled to `document.body`, follows cursor every move while visible.
- **Escalating bouncer** `Explorer.tsx:39` `SCRIPT[]`: that's enough → I said that's enough → you don't listen → "right, privileges revoked 🔒" (locks handle `COOLDOWN_MS=8000`) → back at this again? → "okay, I give up. you win 🏳️" (silent + relax cap). Shake (`.ide-explorer--shake`) + `play("bonk")` per shove. Idle-reset only if `step<3`.
- **Tree** `Explorer.tsx` Node: folder rows are toggle `<button>` (click expands/collapses, no nav); fixed-width `.ide-twistie` + `.ide-row-icon` slots = deterministic alignment (verified d0 icons x=36, d1 x=50); bigger 12px inline-SVG chevron rotates via `.ide-twistie-icon[data-open]`.
- **Cursor** `CustomCursor.tsx`: grab hand = inlined Phosphor fill paths (`HAND_OPEN`, `HAND_GRABBING` consts), shown via `data-cursor-grab`/`data-cursor-grabbing`, rotated `-90deg` (CSS `.cursor-hand`). Screenshot fix: `hide()` removes `cursor-custom` class (native cursor only while away), onMove re-adds; added `visibilitychange` listener.
- **Sound** `sound.ts`: added `bonk` + `warmupSound()`; `SoundProvider.tsx` calls `warmupSound()` on mount (fixes first-sound-dropped) and exposes gated `play(kind)`; folder-sound detection moved from `.ide-chevron` to `.ide-row[aria-expanded]`.
- **Mobile** `components/site/SiteNav.tsx`: added missing `writing` link.
- **Globals** `app/globals.css`: `.ide-resize-handle`, `.ide-nudge` (portaled bubble), `.ide-explorer--shake`, `.ide-twistie*`, `.cursor-hand*`, traffic-light dot vars, command-center, reading-surface prose (Phase 4).
- **`app/lib/palette.ts`**: each palette has `--dot-close/min/max` (Catppuccin reds/yellows/greens; warm set on Cream).

## Learnings

- **1:1 drag needs native listeners + imperative DOM**, never bind the dragged dimension to React state. React synthetic `onPointerMove` lags (Turbopack+Compiler in dev); and `style={{width}}` re-applies stale state on any mid-drag re-render (bouncer setState) → snap-back. Full pattern saved: `[[instant-drag-pattern]]`.
- **`position:fixed` bubble was clipped** because the shake's `transform` on the aside made it the containing block + its `overflow` clipped it → "hides behind then pops". Fix = portal to body.
- **Don't hand-draw cursor icons.** Use Phosphor (already a dep). Importing the *component* added 754 B over the 216 kB budget → **inline the path data** (kept shape, dropped the component runtime) → 215.38/216.
- **Custom cursor double-draw after macOS screenshot**: OS draws cursor on unfocused window; fix = drop `cursor-custom` class on blur/visibility-hidden, re-add on move.
- **First sound dropped** = AudioContext created lazily *in* the first click (returns null first time). Warm it on mount (off click path, INP-safe).
- User feedback (saved to global rule already): **no em dashes in any writing I author** (chat, content, commits). Fixed the one bouncer message; titles still pending user decision.

## Artifacts

- Last full gate (after grab-hand): `pnpm build` OK, `pnpm size` **215.38/216 kB PASS**, `tsc --noEmit` clean. INP/LCP/e2e NOT re-run this session (only bundle re-measured).
- Throwaway cursor screenshots in container (`.playwright-mcp/`), not on host.

## Action Items & Next Steps

1. **Get user OK, then COMMIT the uncommitted batch** (6 files). Suggested msg scope: "feat(ide): resizable explorer + tree alignment + grab-hand cursor + first-sound fix". react-doctor pre-commit hook is non-blocking (warns).
2. **Answer pending questions** before/at commit: (a) em-dash separators in page `<title>`s — change all to comma/pipe? (b) flip grab hand thumb-up via `scaleY(-1)` to match reference?
3. **Re-run FULL perf gate** before moving on (only bundle was checked; INP/LCP/e2e stale). Reliable path in `PERF.md` / prior handoff: prod build → `pnpm start` → `npx tsx tools/perf-check/cli.ts check --runs 3` + `BASE_URL=… pnpm e2e` + `pnpm e2e:perf` + `pnpm test`.
4. Then resume the plan: **Phase 5 (lazy 3D cert badges)** → Phase 6. The `[[instant-drag-pattern]]` applies to Phase 5 drag-to-rotate.

## Other Notes

- **Browser testing**: containerized MCP browser can't reach `localhost`; use host LAN IP `http://192.168.1.185:3000` + `allowedDevOrigins:["192.168.1.185"]` (already in `next.config.ts`, dev-only). Drive React inputs via native value setter + `input` event; click `.ide-command-center` to open palette (Control+k swallowed by container Chrome). Full notes: `[[browser-mcp-dev-testing]]`.
- **Dev hygiene** (recurring #1 time-sink): after editing, `lsof -ti :3000 -sTCP:LISTEN | xargs kill -9; rm -rf .next; pnpm dev`, user hard-refresh (Cmd+Shift+R). NEVER bare-kill port 3000 (`[[dev-server-kill-listen-only]]`).
- A clean `pnpm dev` is currently running on :3000.
- Bundle headroom is TIGHT (215.38/216). Any new always-loaded JS needs care.
