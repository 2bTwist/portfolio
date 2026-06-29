---
date: 2026-06-29
topic: Split-screen Phase 1 (static pages) implementation plan
status: plan (awaiting approval)
type: plan
references:
  - specs/research/2026-06-29-split-screen-groundwork.md
---

# Split-screen Phase 1 plan (static pages)

Deliver a VS Code-style split: drag a file from the Explorer onto the right edge of the editor to open a second pane, with a hand-rolled resizable divider. Scope: the non-MDX pages only (`/`, `/about`, `/projects`, `/experience`, `/certs`, `/music`, `/resume`, plus `/blog` index and `/privacy`). MDX content panes (`/blog/[slug]`, `/projects/[slug]`) are Phase 2. Desktop only (md+); on mobile a drop just navigates the primary pane.

Primary (left) pane stays the real SSR'd route (`children`) so SEO and the focused document are unchanged. Only the right pane is registry-rendered.

## Steps

1. **Extract page bodies.** For each Phase-1 route, move the visible JSX into a sibling `_body.tsx` exporting a component (`HomeBody`, `AboutBody`, `ProjectsBody`, `ExperienceBody`, `CertsBody`, `MusicBody`, `ResumeBody`, `BlogIndexBody`, `PrivacyBody`). `page.tsx` keeps `metadata`/canonical/OG and renders `<XBody />`. Verify each `_body` and its deps have NO server-only imports (`node:fs`, `compileMDX`); they use static data (`PROJECTS`, `profile`, `EXPERIENCE`, `CERTS`, `TRACKS`) which is client-safe. `/blog` index receives post metadata as a prop (already loaded in `layout.tsx` as `blogFiles`; pass the fuller list). No visual change to any route.

2. **Pane registry** (`components/ide/paneRegistry.ts`, client): map Explorer href -> `lazy(() => import('.../_body'))`. Unregistered hrefs (MDX, unknown) are absent; dropping one falls back to navigating the primary pane.

3. **Split store** (`components/ide/splitStore.tsx`, own client context, NOT OverlayContext/SessionProvider per groundwork gotcha #3): `{ rightHref: string | null, ratio: number }` + `openRight(href)`, `closeRight()`, `setRatio()`. Persist `ratio` to localStorage. `useSyncExternalStore` idiom to match the codebase.

4. **Split layout in Shell** (`components/ide/Shell.tsx`): when `rightHref` is set, render the editor area as a flex row: left = `children` (its own scroll container), divider, right = `<Suspense><RegistryBody href={rightHref}/></Suspense>` (its own scroll container + a minimal header: filename + close ×). Right pane is keyed to `rightHref`, NOT `usePathname` (gotcha #2). Hidden below md.

5. **Divider** (`components/ide/SplitDivider.tsx`): hand-rolled on the Explorer resize pattern (`Explorer.tsx:127-217`) — native `pointermove` on window + imperative flex-basis writes (no React re-render during drag) + pointer capture; commit `ratio` to the store + localStorage on pointerup. `role="separator"`, `aria-orientation="vertical"`, ArrowLeft/Right adjust by ~2%.

6. **Drag + drop**: Explorer file rows (`Explorer.tsx` Node) get `draggable` + `onDragStart` (set `dataTransfer` href+name). The editor area gets a right-edge drop zone that highlights on `dragover` and calls `openRight(href)` (or navigates if unregistered) on `drop`. Reuse `data-dragging` body affordance.

7. **Shared-singleton guards**: note/guard `MorphImage` (gotcha #6) and the music store when the same content could appear in both panes; Phase-1 risk is low (no MorphImage on the static set except project cards on `/` and `/projects` — verify no duplicate `morphKey` clash).

8. **Perf + tests**: registry is lazy so split code is out of the initial bundle; body extraction is a reorg (bundle-neutral). Add a behavior test for the split store (open/close/ratio) and ensure `perf/shell-render.test.tsx` still passes (pane context must not re-render on overlay/pathname churn). Run the full perf harness before commit (coordinate the dev server first).

## Out of scope (later phases)
- Phase 2: MDX content panes via a Route Handler (`GET /api/content/[...]`) or build-time static serialization; scope `ArticleToc`'s single `[data-editor-scroll]` query per pane.
- Phase 3: mobile split, vertical split, session persistence, full keyboard a11y.

## Risks
- Body extraction touches every Phase-1 page; keep each a pure move (no behavior change) and eyeball each route after.
- `CertBadge` and similar are shared (no "use client") components rendered into a client tree; fine as long as they stay free of server-only APIs.
