---
date: 2026-06-29T17:13:00Z
git_commit: b70a432
branch: main
repository: portfolio
topic: "Split-screen editor panes (drag a file into a split) — Phase 1 + Phase 2 built + verified, all UNCOMMITTED"
tags: [handoff, split-screen, ide-shell, EditorArea, splitStore, rowDrag, paneRegistry, MdxPaneBody]
status: in-progress
last_updated: 2026-06-29
type: handoff
---

# Handoff: Split-screen editor panes (Phase 1 + Phase 2)

## Task(s)
VS Code–style split editor: drag a file/folder from the Explorer (or an editor tab) into the editor to view two files side-by-side, with a resizable divider.

- **DONE (uncommitted) — Phase 1**: drag-to-split for the static pages, pane store, hand-rolled divider, pointer-based drag, drag chip. Plan: `specs/plans/2026-06-29-split-screen-phase1-plan.md`. Groundwork: `specs/research/2026-06-29-split-screen-groundwork.md`.
- **DONE (uncommitted) — Phase 2**: blog posts + project stories splittable via a content API route (MDX serialized server-side, rendered client-side with `MDXRemote`).
- **NOT committed**: the ENTIRE feature is uncommitted (see `git status` — 11 modified + ~18 new files). User said "hold, I'll try it first" before committing. Earlier music + blog-rename work IS committed (`7ad1ebc`, `3c856aa`, `b70a432`).
- **BLOCKED on user verification**: my container test-browser can't reach their dev server over LAN since it restarted mid-session (see Learnings). I verified logic via simulated pointer events + curl, NOT a live human drag of every case. User must hard-refresh (Cmd+Shift+R) and confirm.

## Critical References
- `specs/plans/2026-06-29-split-screen-phase1-plan.md` — the implementation plan (Phase 1/2/3 scope).
- `specs/research/2026-06-29-split-screen-groundwork.md` — why client-registry over parallel-routes/iframe; the MDX-RSC blocker; gotchas table.
- Memory `instant-drag-pattern` + `dev-server-css-rebuild-flaky` + `dev-server-kill-listen-only` — all bit this session.

## Architecture (how the split works)
- **Render approach**: client component registry, NOT parallel routes/iframe. Each viewable page split into a thin `page.tsx` (metadata/JSON-LD) + a reusable `*_body.tsx`. Left pane = the real SSR'd route (`children`); right pane = a registry body. URL tracks only the focused/left doc.
- **Drag**: POINTER-based (NOT HTML5 DnD — that can't be automated/verified and failed for the user). `components/ide/rowDrag.ts` `beginRowDrag()` starts after a 6px threshold so clicks still navigate; on release over `[data-editor-root]` calls `openRight()`. `consumeSuppressClick()` cancels the row's click after a drag.
- **State**: `components/ide/splitStore.ts` (`rightHref` + persisted `leftFraction`, `useSyncExternalStore`, own module — NOT Overlay/Session context). `components/ide/dragStore.ts` (in-flight drag: active/href/name/over + imperative chip position via `moveChip`).
- **Divider**: `components/ide/SplitDivider.tsx` — native pointer listeners write `--lf` CSS var on the container imperatively (no re-render), commits ratio on pointerup. CSS `.ide-split-left { flex-basis: calc(var(--lf)*100%) }` (md+ only, so mobile is unaffected).

## Recent changes (file:line)
- `components/ide/Shell.tsx:174` — editor area is now `<EditorArea><EditorPane>{children}</EditorPane></EditorArea>`; `<DragGhost/>` added near end (`Shell.tsx` ~188).
- `components/ide/EditorArea.tsx` (NEW) — single vs split layout; `data-editor-root` for drop hit-test; reads `useDrag()` for the drop overlay; right pane keyed by `rightHref`, rendered via `createElement(paneFor(rightHref))` in `<Suspense>`.
- `components/ide/paneRegistry.ts` (NEW) — `PANE_REGISTRY` (8 static `_body` lazy imports) + `paneFor(href)`: returns static body, else `MdxPaneBody` for `/^\/(blog|projects)\/[^/]+$/`, else null.
- `components/ide/Explorer.tsx` — file + folder `<Link>` rows got `onPointerDown={beginRowDrag}` + click wrapped in `consumeSuppressClick()` (removed the old HTML5 `draggable`/`onDragStart`).
- `components/ide/Tabs.tsx:~82` — tab `<div>` got `onPointerDown={beginRowDrag}`, Link onClick wrapped in `consumeSuppressClick()`.
- 8 `_body.tsx` (NEW, by sub-agent): `app/_body.tsx` HomeBody, `app/about/_body.tsx`, projects, experience, certs, music, resume, privacy. `page.tsx` keeps metadata + JSON-LD + (`/privacy`) DataRevealMount.
- `app/api/pane/route.ts` (NEW) — GET `?href=` → `serialize()` MDX for `/blog/<slug>` (getPost) or `/projects/<slug>` (getProject+getProjectStory); returns `{title, mdx, fallback?}`. `runtime="nodejs"`.
- `components/ide/MdxPaneBody.tsx` (NEW) — client; reads `rightHref`, fetches `/api/pane`, renders `<MDXRemote {...mdx} components={MDXComponents}/>` inside `.prose-content`.
- `components/ide/splitStore.test.ts` (NEW) — 3 passing behavior tests.
- `app/globals.css` (END) — `.ide-split-*`, `.ide-split-divider`, `.ide-drop-overlay`, `.ide-drag-ghost` styles.

## Learnings (state of mind / dead ends)
- **HTML5 drag-and-drop was a dead end**: it can't be triggered by automation (Playwright `dragTo` uses mouse events, not native DnD), so I couldn't verify it, and it failed for the user. REPLACED entirely with pointer events (rowDrag.ts). Pointer events ARE simulatable — verified split opens via dispatched pointerdown/move/up.
- **`react-dom/server` is BANNED in App Router** — first Phase-2 attempt (`renderToStaticMarkup` of compiled MDX in a route) 500'd with "You're importing a component that imports react-dom/server". Fix: `next-mdx-remote/serialize` (server) + `MDXRemote` (client). v6 still exports `./serialize` and `.` (MDXRemote). No CSP header in next.config, so MDXRemote's Function-eval is fine.
- **`react-hooks` lint is strict** (React Compiler): no ref writes during render (SplitDivider — read `fraction` prop directly in the keyboard handler), no component derived during render (EditorArea — lowercase `rightBody` + `createElement`), no synchronous setState in effect (MdxPaneBody — rely on the keyed remount instead).
- **globals.css HMR is flaky** (bit me TWICE): appended CSS doesn't compile until the file is bumped. The `.ide-drag-ghost` rule existed but `getComputedStyle` showed `display:block` (rule not compiled) → chip rendered as an invisible full-width block off-screen → "I can't see the chip." Forced a recompile.
- **It's NOT about `.md`**: split works for Phase-1 top-level pages (incl. `.pdf`/`.mp3`/`projects/` folder). The user was dragging the per-article MDX pages (`cisco-mcp.ts`, blog posts) which were Phase-2-deferred. Phase 2 now covers them.
- **`paneFor` is type-independent** for opening the split (returns a lazy component synchronously); body load/render is separate (Suspense).

## Artifacts
- New: 8 `_body.tsx`, `EditorArea.tsx`, `splitStore.ts`(+`.test.ts`), `dragStore.ts`, `rowDrag.ts`, `SplitDivider.tsx`, `DragGhost.tsx`, `paneRegistry.ts`, `MdxPaneBody.tsx`, `app/api/pane/route.ts`.
- Docs: `specs/plans/2026-06-29-split-screen-phase1-plan.md`, `specs/research/2026-06-29-split-screen-groundwork.md`.
- Memory written this session: `music-vinyl-player.md` (earlier sub-task).

## Action Items & Next Steps
1. **User verifies (hard-refresh first)**: chip follows cursor; drag from Explorer rows AND tabs; Phase-2 split for blog posts/project files renders content. Report breakage.
2. **Commit when user confirms** — one big batch (Phase 1 + Phase 2). Suggested: `feat(ide): split-screen editor panes (drag a file into a split)`. Constraints: NO Claude attribution, NO em dashes, conventional-commit style.
3. **Perf**: NOT run locally (needs prod build; would disrupt their dev server). CI gates bundle/LH/perf on commit. Bundle risk: `EditorArea`+store+divider+registry are in Shell's client bundle (small); `_body` + `MdxPaneBody` are lazy (out of initial bundle).
4. **Not done / Phase 3 candidates**: `/blog` index folder isn't splittable (needs post-list data seam); per-pane scroll for `ArticleToc`'s single `[data-editor-scroll]`; mobile/vertical split; the tonearm-drop polish on the vinyl (separate, flagged earlier).

## Other Notes
- **Dev server**: theirs restarted on its own mid-session (new `next-server` PID); it's UP and serving (`curl localhost:3000` → 200) but my container browser (LAN `192.168.1.191:3000`) can't reach it since (timeouts/refused). Their app is fine — it's my test-harness reach. DO NOT kill/restart their dev server (memory `dev-server-kill-listen-only`).
- Constraints (persist): pnpm (ignore-scripts on); commit/push only when asked; AskUserQuestion for decisions; no em dashes; objective tone.
- Pre-commit prints "React Doctor found staged regressions" — NON-BLOCKING (CI gate is `--blocking error`).
- Project file extensions in explorer (web=`.ts`, mobile=`.tsx`) are INTENTIONAL (`app/lib/nav.ts` `projectFileName`) — user confirmed keep.
