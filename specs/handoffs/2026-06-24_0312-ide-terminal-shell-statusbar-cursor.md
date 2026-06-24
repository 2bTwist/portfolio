---
date: 2026-06-24T03:12:00Z
git_commit: 85ce6c4
branch: perf-harness
repository: portfolio
topic: "Live IDE-shell UX pass: accurate cwd terminal (cd/ls/tab-complete/ghost), drag-resize + block caret, tab context menu + Alt shortcuts, clickable explorer breadcrumb + folder-row nav, git status-bar widget, editor-position readout, native-drag cursor fix, title-bar back/forward + alignment — all UNCOMMITTED"
tags: [handoff, ide, terminal, cursor, statusbar, explorer, tabs]
status: in-progress
last_updated: 2026-06-24
type: handoff
---

# Handoff: IDE shell UX pass (terminal shell + status bar + cursor + explorer)

## Task(s)

Continuation of the live conversational tuning loop on the IDE shell (same mode as the prior handoff `2026-06-23_1607-...`). Rapid-fire user requests, each verified in-browser. **Nothing committed this whole session** — one giant uncommitted batch on top of `85ce6c4`. Phase 4 (blog) done+committed; Phases 5-6 of `specs/plans/2026-06-22-portfolio-ide-real-build.md` NOT started.

All items below are DONE + verified in-browser unless marked otherwise.

## Recent changes (all uncommitted, on top of 85ce6c4)

**Cursor (`components/feel/CustomCursor.tsx`, `app/globals.css`)**
- White outline on the arrow: `stroke="#fff"`, `paintOrder="stroke"`, `strokeWidth 1.25` (outline sits outside the fill, no shrink).
- **Pointing hand over interactive elements** (`a,button,.ide-row,.ide-swatch,.ide-pill,.btn`): inlined Phosphor `HandPointing` fill path (`HAND_POINTING`); shown via existing `data-cursor-hover`.
- **Lazy-loaded the cursor** — new `components/feel/CursorMount.tsx` (`dynamic(ssr:false)` wrapper); `app/layout.tsx` imports `CursorMount` not `CustomCursor`. Reason: reclaim bundle (cursor is hidden until first move; decorative). This is what got us back under budget.
- z-index → `2147483647` (was 9999) so the fake cursor is above the context menu/palette (10000).
- **Native-drag fix** (the "mouse freezes / element snaps back on drag" bug): `window dragstart → preventDefault` in the cursor effect. Native HTML drag of an `<a>` (tab/row/link) froze `pointermove` and showed a snap-back ghost. Cancelling native drag keeps the cursor tracking.
- **Terminal resize cursor**: `onMove` now also detects `.ide-terminal-resize` → `data-cursor-grab` + `data-cursor-axis="y"`; while `data-cursor-grabbing==="true"` it early-returns (drag owns the flags). CSS: `[data-cursor-axis="y"] .cursor-hand--grab/--grabbing { transform: none }` = **hand faces UP** (user reversed an initial face-down). Explorer keeps default `rotate(-90deg)` (left).

**Terminal — now a real cwd shell (`components/ide/Terminal.tsx`, biggest change)**
- Module-scope `sessionLines`/`sessionCwd` persist history+cwd across any remount (bulletproof vs the "cleared on nav" report I could NOT reproduce). `onSubmit` + cd write them SYNCHRONOUSLY before navigating (race-proof).
- cwd model over `nav.ts` TREE: `entriesAt`, `routeForCwd`, `promptFor` (zsh `<dir> %`; root basename = `edmond`), `candidatesFor`, `commonPrefix`. `cd projects`→`projects %`, `ls` reflects cwd, `cd ..`/`cd ~`, no `→` echo. `open`/`cat` resolve within cwd; folders→routes so cd/open also navigate (openTab+router.push).
- **Tab completion** (commands first-token, dir entries otherwise; LCP/full) via input `onKeyDown`; **fish ghost** suggestion. Ghost cursor sits ON first ghost char (`.ide-terminal-caret-char`, blinks block↔dim) — NO gap (was a separate block creating a gap).
- **Block caret** = invisible `<input>` keystroke sink + visible `.ide-terminal-live` (prompt+typed+caret all one inline-flex line, shared baseline). `$`-size mismatch fixed (form `font-size:0.8rem`).
- **Drag-resize** top handle `.ide-terminal-resize` (imperative refs, `[[instant-drag-pattern]]`, 90px–70vh, persists `ide.terminal-height`).
- `clear` keeps GREETING; close `×` flex-centered; focus on every open (`termOpen` effect + rAF).
- First-open delay fixed: `Shell.tsx` warms `CommandPalette`+`Terminal` chunks on `requestIdleCallback`.

**Tabs (`components/ide/Tabs.tsx`, `store.tsx`)**: right-click context menu (Close/Close Others/Close All, portaled, clamped) + `closeOthers`/`closeAll` in store. Shortcuts use `e.code` (KeyW/KeyA) not e.key (macOS Option+W = "∑"): **Alt+W / Alt+Shift+W / Alt+Shift+A** (Cmd+W is browser-reserved — user chose Alt + VS Code hint labels).

**Explorer (`components/ide/Explorer.tsx`)**: title is a clickable `Breadcrumb` (`~/edmond / projects / ledger`, each crumb navigates+opens tab; non-route segments like `/writing/tag` render plain to avoid 404; `NAV_HREFS` set). Title is **lowercase now** (removed `text-transform:uppercase`). Folder rows are `<Link>` that **navigate + toggle** open/close on click (user wanted toggle, not always-expand); chevron `.ide-twistie-hit` toggles without navigating (stopPropagation).

**Status bar (`components/ide/StatusBar.tsx`)**: removed ⌘K pill; terminal/sound/RSS now compact hand-drawn stroke icons (`.ide-pill--icon`); RSS→`/rss.xml`. **Git widget** (`.ide-git`): branch+shortSha linked to GitHub commit, dirty `*`, build-time data from new server util `app/lib/git.ts` (threaded layout→Shell→StatusBar; `import type GitInfo` keeps node:child_process out of client bundle). **Editor-position readout** `Ln X, Col Y (N selected)  Spaces: 2`: real — Ln/Col from text selection/caret geometry in `[data-editor-scroll]` pane, `(N selected)` from `window.getSelection()`, scroll fallback. Problems `⊗0 ⚠0` counters were added then REMOVED (user disliked fake data).

**Title bar (`Shell.tsx`)**: back/forward `←→` buttons (`.ide-nav-btn`, `router.back/forward`) wrapped with command-center in `.ide-titlebar-center` (group centered; command-center no longer self-absolute). macOS traffic-light hover glyphs (×/−/fullscreen) added earlier in session. ⌘K badge tightened to edge (`.ide-command-center` right padding `0.35→0.2rem`). Git icon↔name gap tightened (`.ide-git svg { margin-right:-0.28rem }`).

**Page breadcrumbs removed** (redundant with explorer breadcrumb): inline `README.md` (`app/page.tsx`) + `projects/[slug]` line; `filename` prop fully removed from `PageHeader` (`components/content/ui.tsx`) and all 6 callers (about/contact/projects/experience/writing/tag). Page `<title>` separators switched em-dash → `" - "` (rss.ts too).

**Budget**: `budgets.json` bundleKB **216→217** (user's explicit call when git widget pushed over; lazy-cursor had already clawed back the rest). Last `pnpm size` = **216.5/217 PASS**.

## Learnings / state of mind

- **THREE bugs I could NOT reproduce in the headless MCP browser** (drag-lag, terminal-cleared-on-nav, click-closes-terminal). Root cause almost certainly **stale HMR**: I did ~18 `rm -rf .next; pnpm dev` restarts, each severs the user's open-tab HMR socket → they ran stale/broken JS. **Going forward: only restart for CSS changes; component changes hot-reload.** Always tell the user to hard-refresh (Cmd+Shift+R) after a restart.
- The "drag lag / mouse freeze" WAS real and IS fixed — it was native HTML drag (see cursor section), not the resize handles. I wasted time profiling the wrong drag (resize handle = `<div>`, can't start native drag).
- Turbopack CSS HMR is flaky here (recurring) — that's why CSS needs the `.next` wipe.
- `[[instant-drag-pattern]]`, `[[browser-mcp-dev-testing]]` (host LAN IP `192.168.1.185:3000`), `[[dev-server-kill-listen-only]]` all still apply.

## Artifacts / verification

- tsc clean throughout. Last full gate NOT re-run end-to-end — only `pnpm size` (216.5/217 PASS) after the editor-readout add. **INP/LCP/e2e are STALE across this whole batch.**
- A clean `pnpm dev` is running on :3000 (bg task `b2bfowexi`).
- Browser-verified each feature via MCP (`192.168.1.185:3000`); throwaway screenshots in container `.playwright-mcp/`.

## Next Steps

1. **User should hard-refresh** — several recent "bugs" are likely stale HMR, not code.
2. **COMMIT this batch** — it's enormous and uncommitted. Suggested split or one big `feat(ide): cwd terminal shell + status-bar git/position + tab menu + explorer breadcrumb + cursor polish`. react-doctor pre-commit hook is non-blocking.
3. **Re-run the FULL perf gate** before/after commit (only bundle is fresh): prod build → `pnpm start` → `npx tsx tools/perf-check/cli.ts check --runs 3` + `BASE_URL=… pnpm e2e` + `pnpm e2e:perf` + `pnpm test`.
4. Open threads if user returns to them: ⌘K edge gap now 4px (user may want different); terminal `open <file>` is cwd-scoped (can't `open ledger` from root — must `cd projects` first) — confirm that's desired.
5. Then resume the plan: **Phase 5 (lazy 3D cert badges)** → Phase 6.

## Other Notes

- Bundle headroom tight (216.5/217). Any new always-loaded JS needs care; lazy-load decorative stuff (pattern: `CursorMount`).
- Claude Code upgraded 2.1.186→2.1.187 mid-session (local only; user's next relaunch).
- `app/lib/git.ts` prefers Vercel `VERCEL_GIT_*` env on deploy, falls back to local `git`; deployed site shows clean branch (no `*`) + links the deploy commit.
