---
date: 2026-06-29
topic: Split-screen (VS Code-style) editor panes for the IDE shell
status: groundwork (pre-plan)
type: research
---

# Split-screen groundwork

Goal: drag a file/folder from the Explorer to a side and view two files' content at once, like VS Code split editors, with a resizable divider. Perf budget is sacred (252kB bundle, TBT/LCP gates).

## The core constraint

Next.js App Router renders exactly one route at a time. The IDE shell (`components/ide/Shell.tsx`, client) is additive chrome around `children` (the active route, kept server-rendered). Showing two different pages at once fights the single-route model, so the load-bearing decision is *how a second pane renders another file's content*.

## Approaches evaluated

| Approach | Verdict | Why |
|---|---|---|
| **Client component registry** | **Chosen** | Extract each page's visible body into a reusable, lazy-importable component keyed by route. Panes render any file from client state with no navigation. True SPA, code-split (idle panes cost 0 bytes), fits "IDE shell as additive client layer". This is how StackBlitz / CodeSandbox / VS Code Web manage panes: app state tracks open editors, the URL tracks only the focused doc. |
| Parallel routes (@slots) | Rejected for free-form | Slot content is 100% URL-driven and slots are fixed in the filesystem. Fine for a fixed dashboard (code+preview), wrong model for "drag any file into any pane at runtime". |
| iframe panes + bare layout | Rejected | Each iframe reloads the whole app (HTML+CSS+JS hydrate twice), effectively doubling the bundle budget for pane 2. Perf-disqualifying. Only for genuinely foreign content. |
| Intercepting routes | Irrelevant | 1:N overlay/modal pattern, not M:N split. |

## Recommended architecture (registry)

- Split each viewable page into `page.tsx` (routing entry: metadata, canonical, OG) and a `*_body.tsx` content component that both the route page and a split pane can render.
- A small **pane store** (own client context, NOT OverlayContext, NOT tied to global `usePathname`) holds `{ left, right }` pane targets + the divider ratio. Drag-drop sets the right pane; the URL still reflects only the focused/primary document.
- Resizable divider: **hand-roll** with the existing instant-drag pattern (native `pointermove` on window + imperative DOM writes, zero React re-render), wrapped with `role="separator"` + arrow-key resize. ~50 lines, 0 bundle bytes. (Do NOT pay react-resizable-panels' ~12kB upfront; lazy-load it only if we later need keyboard/RTL/vertical-split robustness.)
- Drag source: add `draggable` + `dragstart/dragover/drop` to Explorer rows (no DnD library); drop zones on the left/right pane edges.

## Feasibility by file (registry extraction)

EASY (static/data-driven, trivially extractable): `/` README, `/about`, `/projects`, `/experience`, `/certs`, `/music` (client island, shares the singleton audio store), `/resume` (iframe PDF, but cramped at half width).

MEDIUM (needs server data passed as props or an API): `/blog` (post list, already loaded in layout as `blogFiles`), `/blog/tag/[tag]` (filter the list client-side), `/privacy` (suppress its DataReveal side-effect in a pane).

HARD (the real blocker): `/blog/[slug]` and `/projects/[slug]`. `getPost`/`getProjectStory` read the filesystem (server-only `node:fs`), and `compileMDX` (next-mdx-remote/rsc) returns an RSC subtree that cannot cross into a client registry. Strategy for these: (a) a Route Handler `GET /api/content/[...]` that returns the compiled body on demand, or (b) build-time pre-serialization to static JSON/HTML. Defer to a later phase.

## Gotchas to carry into the plan (file:line from codebase pass)

1. `compileMDX` is RSC-only and non-serializable; `app/lib/posts.ts` + `app/lib/project-story.ts` import `node:fs` (server-only). MDX panes need an API/static seam.
2. `EditorPane` (`Shell.tsx:38`) is keyed to `usePathname()`; the right pane must be keyed independently, not to the global pathname.
3. Pane state in its own context; `SessionProvider` re-renders on pathname (proven by `perf/shell-render.test.tsx`) and overlays are deliberately separated, so don't co-locate.
4. Each pane needs its own scroll container; `ArticleToc` queries a single `[data-editor-scroll]` and would need scoping.
5. `tabFor()` only resolves `NAV` hrefs; individual blog posts aren't in NAV (they live in `blogFiles`).
6. Shared singletons can conflict if the same content is in both panes: `MorphImage` module Map (`components/content/MorphImage.tsx:51`) and the music store/NowPlayingWidget.
7. Reuse the resize pattern from `Explorer.tsx:127-217` (native listeners + imperative width writes + pointer capture).

## Proposed phasing (de-risks the MDX blocker)

- **Phase 1**: layout + drag/drop + divider + pane store + registry for the EASY/MEDIUM static pages. Proves the whole interaction end-to-end without the MDX hazard.
- **Phase 2**: MDX content panes (`/blog/[slug]`, `/projects/[slug]`) via Route Handler or build-time static serialization.
- **Phase 3** (optional): mobile behavior, vertical split, keyboard a11y polish, session persistence.

## Sources
- Next.js parallel routes / intercepting routes docs (v16.2.9); next.js discussion #68528.
- react-resizable-panels (bvaughn) ~12kB gzipped.
