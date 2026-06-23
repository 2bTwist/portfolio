---
date: 2026-06-22
branch: perf-harness
status: approved-phasing
type: plan
tags: [portfolio, ide, rebuild, app-router, perf-gated, r3f, blog]
---

# Portfolio IDE Real Build — Implementation Plan

## Overview

Rebuild the portfolio properly: **SSR'd real App Router routes first** (a plain, fast, crawlable site), then layer the IDE shell, the feel/craft layer, the blog, and lazy 3D on top. This is the inverse of the throwaway prototype, which built the IDE shell and forgot the actual website.

Core design law (do not break): **every novel interaction is additive; the site is fully usable as a plain fast site.** The file-tree, tabs, ⌘K palette, and terminal are a client layer over real routes — ignore every gimmick and you still reach best-work / resume / contact in ~1 click, with JS off, as a crawler.

The build is gated end-to-end by the existing perf harness. Calibrated budgets (`budgets.json`, 2026-06-22): **bundleKB ≤ 243**, **LCP ≤ 2539ms** (target 1000), **CLS ≤ 0.05**, **TBT ≤ 150ms**, **INP ≤ 100ms**, plus the e2e a11y invariant. Each phase must keep the gate green.

## Current State Analysis

- **The prototype is one `"use client"` blob.** `app/page.tsx:1` is `"use client"`; the entire IDE plus every "file" body renders client-side. Clicking a file is `setActiveId` state (`app/page.tsx:54-58`), not navigation — there are **no real URLs** (`/projects/ledger` does not exist). A crawler or JS-off visitor gets one empty client shell. This is why measured **LCP ≈ 2.4s** for an essentially empty page.
- **Content is hardcoded JSX**, not data. `app/ide-files.tsx:87` (`FILES`) mixes presentation (`<H>`, `<P>`, `<Tag>`) with content; projects come from `app/lib/data.ts:63` (`PROJECTS`), posts are inline (`app/ide-files.tsx:68`, `POSTS`). No `data/` layer.
- **Inline styles + CSS vars throughout**, palette via React context that injects `palette.vars` onto a wrapper div (`app/providers.tsx:43-63`). Palettes in `app/lib/data.ts:9` (Cream/Latte/Frappé).
- **Stack**: Next 16.2.9, React 19.2.7, `motion@^12.40`, Tailwind 4, React Compiler on (`next.config.ts:6`), `turbopack.root` pinned (`next.config.ts:9`). `next-view-transitions@^0.3.5` is installed but **unused** (`package.json:25`) — remove. No `three`/`@react-three/*` yet.
- **Salvageable logic** (port, don't keep wholesale): tree grouping `buildTree()` (`app/page.tsx:12`), `findFile()` (`app/page.tsx:30`), terminal command parser `run()` (`app/page.tsx:401-449`, verbs ls/open/cat/cd/grep/theme/clear/whoami/pwd), `.btn-tactile` CSS (`app/globals.css`), palette var sets.
- **Perf harness** is real and calibrated. One local gate: `pnpm perf`. Agent gate: `pnpm e2e:perf` then `pnpm perf:check --json`. CI: `.github/workflows/perf.yml` runs lint-test, bundle, lab-cwv, e2e on PR. The a11y invariant currently **fails** on a genuine `color-contrast` violation from the creamy palette (muted text) — must be fixed in Phase 1 to keep the gate green.
- **Blog to reclaim** lives on branch `backup/pre-strip-bare-bones` (read-only inventory done): `lib/posts.ts` (gray-matter, frontmatter `title`/`date`/`summary`/`tags`, slug from filename), MDX via `next-mdx-remote/rsc` `compileMDX`, MDX component set (`MDXComponents`, `Callout`, `Mark`, `CodeBlock` via `prism-react-renderer`, `CopyButton`, `ReadingProgress`), RSS (`lib/rss.ts` + `app/rss.xml/route.ts`, **hardcoded `eddyb.dev`**), tag routes (`tag/[tag]/page.tsx` uses **sync `params` — broken on Next 16**). The Supabase comments/stats surface forces a **site-wide `middleware.ts`** `getUser()` on every request — dropped for v1. No search lib ever existed.
- **3D research** cached at `.agents/docs/3d/` (r3f/drei/three `llms-full.txt`). Key constraint: three.js barely tree-shakes; any real scene is a **~150-230 kB gzip async chunk** that must be kept 100% off the initial route and measured as a separate size-limit entry.

## Desired End State

A perf-gated portfolio where:
- Every section is a real, server-rendered, crawlable URL with its own metadata; the site works fully with JS disabled.
- The IDE shell (tree, tabs, ⌘K, terminal) is an additive client layout that makes navigation feel like an editor, driving prefetched route transitions — never the only path to content.
- Micro-interactions and a subtle sound layer give the site Comeau-grade feel, with global mute + reduced-motion respect.
- The blog is tagged, full-text-searchable, comments-free, SSG.
- Cert badges render in 3D, lazily, at zero first-paint cost.
- LCP is well under the prototype's 2.4s; bundle stays under budget; INP < 100ms.

**Verify:** `pnpm perf` green; `curl`-ing a route with JS disabled shows real content; `view-source` shows SSR'd HTML per route; bundle treemap (`pnpm analyze`) shows three.js only in an async chunk.

### Key Discoveries
- SPA blob → ~2.4s LCP is architectural, not a tuning problem (`app/page.tsx:1` client boundary). Real SSR routes are the fix.
- The a11y gate is genuinely red on muted-text contrast — a Phase 1 blocker, not a harness bug.
- Tag route `tag/[tag]/page.tsx` on the backup branch is broken on Next 16 (sync `params`); `[slug]` already does it right — copy that pattern.
- Supabase middleware (`middleware.ts` → `getUser()` per request) is the single biggest reclaim cost; dropping comments removes it entirely.
- three.js chunk must be a **separate** size-limit entry or it blows the 243 kB route budget on paper.

## What We're NOT Doing
- No Supabase comments/likes/views in v1 (drop the entire surface; can re-add scoped to blog routes later).
- No global live mobile-app demo; a per-project demo slot in the project-detail layout, filled project-by-project later (Appetize vs Snack priced then).
- No light/dark flip; single palette, CSS-vars, pick deferred to Phase 6 (non-blocking throughout).
- No `@pierre/trees` — the custom tree (~10 nodes) is enough (vision §11 agreed).
- No terminal subdomain in v1 — inline drawer only.
- No `next-view-transitions` (unused; removed).
- No `TableOfContents` reclaim unless heading extraction is wired (it was an orphan on the old branch).

## Implementation Approach
Build the plain site, then make it an IDE, then make it feel good, then add writing and 3D, then real content. Salvage logic from the prototype but treat its architecture as discarded. Keep the perf gate green at every phase; the three.js chunk and the search index and the audio samples are all lazy/async and measured separately.

Relevant installed skills, by phase: `frontend-design` + `animation-vocabulary` (Phase 3), `perf-loop` (Phase 6, and any phase that goes red), `tdd` (render-count and invariant tests).

---

## Phase 1: Real route skeleton + data layer

### Overview
Replace the SPA blob with real server-rendered routes and a typed content layer. Outcome: a crawlable, JS-off-usable, sub-second-LCP plain site with **no IDE chrome yet**.

### Changes Required

#### 1. Data layer
**Files**: `data/projects.ts`, `data/experience.ts`, `data/skills.ts`, `data/certs.ts`, `data/profile.ts`
**Changes**: Move content out of `app/ide-files.tsx` / `app/lib/data.ts` into typed, server-importable modules. `Project` keeps `id/title/kind(web|mobile)/blurb/detail/tags` and gains `links` (live/repo), `cover`, and an optional `demo` slot (for the per-project mobile demo). Keep palettes in a dedicated `app/lib/palette.ts`.

#### 2. Route tree (server components)
**Files**: `app/page.tsx` (rewritten, server), `app/about/page.tsx`, `app/experience/page.tsx`, `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`, `app/contact/page.tsx`. (Writing routes land in Phase 4.)
**Changes**: Each is a server component rendering from the data layer with a presentational component set (`components/content/*`). `generateStaticParams` for `projects/[slug]`. Per-route `generateMetadata` (title/description/OG). The project-detail layout reserves a `demo` region.

#### 3. Palette without the client-context wrapper
**File**: `app/layout.tsx`, `app/globals.css`
**Changes**: Inject the default palette's CSS vars at the `:root`/`body` level (server-rendered, no context needed for a single default palette). The runtime palette switcher returns in Phase 2 as additive client state. Bump `--muted` (and any failing pair) to satisfy the a11y color-contrast invariant. Remove `next-view-transitions`.

#### 4. Cleanup
**Files**: delete/retire `app/ide-files.tsx`, `app/page.tsx` (old client blob) once content is migrated; `app/providers.tsx` trimmed (keep `useKillStaleServiceWorker`; palette context deferred to Phase 2).

### Success Criteria

#### Automated Verification
- [ ] Type checks + lint: `pnpm lint`
- [ ] Build succeeds, routes prerendered static: `pnpm build` (build output lists `/`, `/about`, `/experience`, `/projects`, `/projects/[slug]`, `/contact` as `○ (Static)`)
- [ ] Render-count/unit gates: `pnpm test`
- [ ] a11y + smoke invariants pass: `pnpm e2e` (color-contrast now green)
- [ ] Perf gate: `pnpm e2e:perf && pnpm perf:check --json` → `verdict: pass`; LCP materially below 2539ms baseline; bundle ≤ 243 kB

#### Manual Verification
- [ ] `view-source` on each route shows real SSR'd content (not an empty shell)
- [ ] Disable JS in DevTools → every section's content is present and links work
- [ ] `/projects/ledger` is a real, directly-loadable URL
- [ ] No visual regression of the creamy aesthetic from the contrast fix

**After this phase passes automated verification, pause for manual confirmation before the next phase.**

---

## Phase 2: IDE shell as additive client layout

### Overview
Layer the editor experience over the real routes. The shell is a client layout; the content underneath stays server-rendered and standalone.

### Changes Required

#### 1. Shell layout
**File**: `app/(shell)/layout.tsx` or a `components/ide/Shell.tsx` mounted in `app/layout.tsx`
**Changes**: Persistent title bar, explorer tree, tab bar, status bar wrapping `{children}` (the active route, rendered into the "editor pane"). Client component; reads route via `usePathname`.

#### 2. Explorer tree (real navigation)
**File**: `components/ide/Explorer.tsx`
**Changes**: Port `buildTree()` logic; tree entries are **`<Link href>`** (prefetched), mapping file→route. Folder collapse state client-side. Active row = current pathname. Git-status-style markers as decoration.

#### 3. Tabs, palette, terminal
**Files**: `components/ide/Tabs.tsx`, `components/ide/CommandPalette.tsx`, `components/ide/Terminal.tsx`
**Changes**: Tabs remember opened routes in session state; clicking navigates. ⌘K palette searches a content index and `router.push`es. Terminal drawer: port `run()`; `cd/open/cat` → `router.push`, `grep` → content index (full search in Phase 4), `theme` → palette switch, `help/ls/clear/whoami/pwd`. Global shortcuts (⌘K, Ctrl+`, Esc).

#### 4. Palette switcher returns (additive)
**File**: `app/providers.tsx`
**Changes**: Re-introduce palette context as a client enhancement over the server default; status-bar swatches switch it. Persists to `localStorage`.

#### 5. Motion + mobile
**Changes**: `motion` route-transition on the editor pane (respect `prefers-reduced-motion`). On phone (`md` breakpoint), shell collapses to the plain stacked site (routes already standalone) — explorer/tabs hidden, content full-width.

### Success Criteria

#### Automated Verification
- [ ] `pnpm lint`, `pnpm build`, `pnpm test` pass
- [ ] `pnpm e2e` invariants pass (shell keeps content reachable; a11y green)
- [ ] Perf gate green: `pnpm e2e:perf && pnpm perf:check --json` → `pass`; **INP < 100ms** with the client shell mounted; bundle ≤ 243 kB (shell JS measured)

#### Manual Verification
- [ ] Tree/tabs/palette/terminal navigate to real URLs (address bar changes)
- [ ] Browser back/forward works; refresh on any route keeps you there
- [ ] JS-off still renders the plain site (shell degrades, content intact)
- [ ] Phone view = clean stacked site, no broken IDE chrome
- [ ] Route transitions feel instant (prefetch working), no jank

**After this phase passes automated verification, pause for manual confirmation before the next phase.**

---

## Phase 3: Feel & craft layer (Comeau-grade micro-interactions + sound)

### Overview
The differentiator. Rebuild the tactile button properly and add spring micro-interactions plus a subtle sound layer. The current `.btn-tactile` reads tacky and is replaced. Invoke `frontend-design` + `animation-vocabulary` during implementation.

### Changes Required

#### 1. Tactile button, redone
**Files**: `components/ui/Button.tsx`, `app/globals.css`
**Changes**: Comeau press-layer technique — a base layer + a foreground layer that translates down on `:active`, real shadow/lighting, spring easing, focus-visible ring. Replace `.btn-tactile` usages. Variants: primary/ghost.

#### 2. Micro-interactions
**Files**: tree/tab/palette components
**Changes**: Spring folder expand/collapse (height/opacity), tab open/close, file-row hover, palette open/close — `motion` springs tuned per `animation-vocabulary` (ease-out default, frequency-of-use scaling). All gated by `prefers-reduced-motion`.

#### 3. Sound layer
**Files**: `components/feel/sound.ts`, a `SoundProvider`
**Changes**: Web Audio. Subtle samples (or synthesized) for button press, folder toggle, terminal keypress. **First-interaction gating** (autoplay policy), **global mute** (persisted, default chosen during impl), respect `prefers-reduced-motion`/reduced-data. Audio assets/decoder lazy-loaded on first interaction — never on initial load.

### Design identity wishlist (user brief 2026-06-22 — capture now, decide during impl)

These are the user's explicit "bits and pieces" for the feel of the page. None are decided yet; an agent picks the actual packs/values at impl time and runs them past the user. The bar (user's words): "playful, modern, clicky-looking," the **modernized version of the cool web of back in the day** — fun flourishes that still match the page's vibe/theme/aesthetic, **integrated, never out of place**. All additive (the plain site must not need any of it) and all perf/reduced-motion gated.

1. **Font pack** — not chosen. Wants a playful-yet-modern character. Pick a display/body pairing (subset, self-hosted via `@fontsource` or similar, measured against the bundle/LCP budget); show the user options before committing.
2. **Icon set** — playful, modern, "clicky-looking" icons (not flat generic). Evaluate candidates (e.g. an animated/duotone set) for tone fit + tree-shakeability; `lucide-react` is the current Phase 4 default but reassess against this brief.
3. **Braille-style loader** — a braille-dot loader/spinner as the page's loading motif. Tiny, CSS/canvas, reduced-motion fallback to a static state.
4. **Custom minimalist cursor** — a minimal custom cursor (with hover/active states on interactive targets). Desktop/pointer only; never on touch; respect reduced-motion; must not hurt INP or hit-targets.
5. **Retro-modern flourishes** — the "cool web of back in the day, modernized" grab-bag: tasteful hover/idle micro-flourishes that read as crafted, not gimmicky. Collect a shortlist at impl and cut anything that fights the aesthetic.

**Reference bar for this phase — PostHog.com (user-supplied 2026-06-22).** This is the target *level* of niceties, easter eggs, and overall vibe the user wants for the feel/craft pass. Concrete things called out:
- **Floating ray-traced sphere-on-cube** (the classic POV-Ray artifact) but *alive*: the ball bobs up and down with a shadow that tracks it. Subtle physics loop, not static decoration. This is the "cool web of back in the day" aesthetic done right.
- **Desktop-OS metaphor chrome**: draggable window with min/max/close controls, desktop icons down the sides, "switch to website mode" toggle. Same instinct as our IDE shell (Phase 2) — chrome with personality.
- **Custom media player** with its own styled controls (not the default `<video>` UI).
- **Devtools easter egg**: a mascot appears when you open browser devtools.
- **Mascot / color customizer**: an illustrated character you can recolor and roam with WASD/arrow keys.
The throughline (matches our core design law): every flourish is theme-native and additive, never floating decoration. Pull these in as targets when the feel/craft agent runs this pass.

### Content-area set pieces (user brief 2026-06-22 — bigger ambition, stage after the basics)

For the **reading surface specifically** (where the user reads/writes actual content — the blog/content routes from Phase 4), the user has "so much plans." Narrative, integrated set pieces, theme-matched so they feel native, not bolted on:

- **Content that "rips apart" with something poking out** — a tear/reveal interaction in the prose flow (scroll- or hover-triggered), revealing a layer beneath.
- **A rendered 3D Mac** (and similar objects) **for the tools the user uses** — e.g. a small 3D machine/device that showcases a tool in the stack, in-line with the writing.
- Other tool-showcase 3D objects in the same spirit.

These 3D pieces **share Phase 5's lazy-3D infrastructure** (R3F/drei, off the initial bundle, IntersectionObserver-mounted, reduced-motion / no-WebGL fallback, separate size-limit entry). Treat them as a Phase 5 extension scoped to the content routes, not first-paint cost. Build the plain readable content first (Phase 4); layer these on top once the reading experience and the 3D infra both exist.

### Success Criteria

#### Automated Verification
- [ ] `pnpm lint`, `pnpm build`, `pnpm test` pass
- [ ] `pnpm e2e` passes (mute control is keyboard-reachable; reduced-motion path renders)
- [ ] Perf gate green: INP < 100ms during interactions; bundle ≤ 243 kB (audio + fonts + cursor not blowing the initial budget — verify via `pnpm analyze`)

#### Manual Verification
- [ ] Button feels tactile, not tacky (side-by-side vs old `.btn-tactile`)
- [ ] Folder/tab/hover springs feel right, no overshoot jank
- [ ] Sounds are subtle, fire on the right events, mute works and persists
- [ ] No sound on page load; reduced-motion disables motion+sound
- [ ] No audio-init jank on first click (decode is async)

**After this phase passes automated verification, pause for manual confirmation before the next phase.**

---

## Phase 4: Blog reclaim (lean, comments-free) + search

### Overview
Reclaim the MDX blog from `backup/pre-strip-bare-bones` without Supabase, add client-side search, wire it into terminal `grep` + ⌘K.

### Changes Required

#### 1. Posts + content
**Files**: `lib/posts.ts`, `content/blog/*.mdx`
**Changes**: Reclaim `lib/posts.ts` (gray-matter, frontmatter `title/date/summary/tags`, slug-from-filename). Bring sample post; add `generateStaticParams`.

#### 2. Routes
**Files**: `app/writing/page.tsx`, `app/writing/[slug]/page.tsx`, `app/writing/tag/[tag]/page.tsx`
**Changes**: Reclaim index + `[slug]` (MDX via `next-mdx-remote/rsc` `compileMDX`, `generateMetadata`, prev/next, `ReadingProgress`). **Fix tag route to async `params`** (`params: Promise<{tag}>` + `await`). Tags clickable. `transpilePackages: ['next-mdx-remote']` in `next.config.ts` (the Turbopack React-instance fix).

#### 3. MDX components
**Files**: `components/mdx/{MDXComponents,Callout,Mark,CodeBlock,CopyButton}.tsx`
**Changes**: Reclaim as-is; throttle `ReadingProgress` scroll handler with rAF (perf nit). `CodeBlock` via `prism-react-renderer`.

#### 4. Search
**Files**: `lib/search.ts`, `components/ide/CommandPalette.tsx`, `components/ide/Terminal.tsx`
**Changes**: Build a client index (Fuse.js or FlexSearch — pick lighter at impl, measure) over post frontmatter+body. **Lazy-load the index** (dynamic import on palette/terminal open). Terminal `grep` and ⌘K query it.

#### 5. RSS
**Files**: `lib/rss.ts`, `app/rss.xml/route.ts`
**Changes**: Reclaim; replace hardcoded `eddyb.dev` with env base URL (`NEXT_PUBLIC_SITE_URL`).

#### Deps to add
`next-mdx-remote@^5`, `gray-matter@^4.0.3`, `prism-react-renderer@^2.4.1`, `lucide-react`, `@fontsource/caveat`, plus the chosen search lib. **No Supabase, no `auth-ui-*`.**

### Success Criteria

#### Automated Verification
- [ ] `pnpm lint`, `pnpm build` (writing routes prerendered/SSG), `pnpm test`
- [ ] `pnpm e2e` passes (tag route returns content on Next 16; a11y green)
- [ ] Perf gate green: search index NOT in initial bundle (`pnpm analyze`); bundle ≤ 243 kB; LCP held

#### Manual Verification
- [ ] `/writing`, a post, and `/writing/tag/<tag>` all render
- [ ] Terminal `grep <term>` and ⌘K find post content
- [ ] `/rss.xml` valid, correct domain
- [ ] MDX components (Callout/Mark/CodeBlock/Copy) render; reading progress smooth

**After this phase passes automated verification, pause for manual confirmation before the next phase.**

---

## Phase 5: Lazy 3D cert badges

### Overview
3D rotatable cert badges that cost zero first paint. CSS/SVG fallback first, then lazy R3F.

### Changes Required

#### 1. Fallback badge (also the skeleton)
**File**: `components/certs/BadgeFallback.tsx`
**Changes**: CSS `rotateY` + perspective + sheen, pointer-drag to spin. This is the loading state, the reduced-motion floor, and the no-WebGL fallback. Build first.

#### 2. Lazy R3F badge
**Files**: `components/certs/BadgeLazy.tsx`, `components/certs/BadgeScene.tsx`, `app/certs/page.tsx` (or a section)
**Changes**: `BadgeScene` = procedural geometry (drei `RoundedBox` / extruded `Shape`) + cert artwork texture (`useTexture`/`Decal`) + `PresentationControls`; one directional + ambient light (**no `Environment`/`Stage`**); `frameloop="demand"`, `dpr={[1,1.5]}`. `BadgeLazy` = `dynamic(() => import('./BadgeScene'), { ssr:false, loading: BadgeFallback })` gated on `IntersectionObserver` (`rootMargin:'200px'`). `'use client'` on the canvas file.

#### 3. Config + budget isolation
**Files**: `next.config.ts`, `.size-limit.js`
**Changes**: `transpilePackages: ['three', ...]`. Add a **separate size-limit entry** for the three.js async chunk so it's measured independently of the 243 kB route budget. React Compiler: only if a 3D component miscompiles on `useFrame` mutation, add per-component `"use no memo"` (don't pre-scatter).

#### Deps to add
`three@0.184.0`, `@react-three/fiber@9.6.1`, `@react-three/drei@10.7.7`, `@types/three` (dev). Confirm React stays `>=19 <19.3` for fiber's peer range.

### Success Criteria

#### Automated Verification
- [ ] `pnpm lint`, `pnpm build`, `pnpm test`
- [ ] `pnpm e2e` passes (certs section usable with fallback; a11y green)
- [ ] `pnpm analyze` confirms `three`/`fiber`/`drei` appear ONLY in an async chunk, not the initial route JS
- [ ] Perf gate green: **initial** bundle ≤ 243 kB unchanged by 3D; LCP held

#### Manual Verification
- [ ] Badge fallback shows immediately; 3D mounts only when scrolled near
- [ ] Drag-rotate works on desktop + touch; idle is calm (`demand` frameloop)
- [ ] reduced-motion / no-WebGL → fallback, no errors
- [ ] No scroll jank when the badge is on screen

**After this phase passes automated verification, pause for manual confirmation before the next phase.**

---

## Phase 6: Real content, palette pick, ship

### Overview
Replace placeholders with Edmond's real material, pick the palette, drive to the excellent bar.

### Changes Required
- Real projects/experience/skills/certs/writing in the data layer + `content/blog/`.
- Resume download; contact links; per-project `demo` slot wired where a demo exists (Appetize/Snack decided per project).
- **Palette pick** (Cream/Latte/Frappé) set as the server default; confirm a11y contrast holds for the chosen one.
- Final `perf-loop` pass (invoke the skill) to ratchet toward targets (LCP→1000, bundle→170).

### Success Criteria

#### Automated Verification
- [ ] Full gate: `pnpm perf` green
- [ ] `pnpm e2e` + `pnpm lint` + `pnpm test` green
- [ ] CI `.github/workflows/perf.yml` green on PR

#### Manual Verification
- [ ] Real content reads well; no placeholder text remains
- [ ] Resume downloads; all external links correct
- [ ] Chosen palette looks right and passes contrast
- [ ] Recruiter path: land on `/` → best work → resume/contact in ~1 click

---

## Testing Strategy
- **Unit / render-count** (`pnpm test`, vitest): tree grouping, terminal command parser, search index queries; render-count gates on the shell to confirm the React Compiler eliminates re-renders.
- **Invariants** (`pnpm e2e`, Playwright + axe): every route reachable and a11y-clean; JS-off content present; tag route returns content.
- **Perf** (`pnpm e2e:perf` + `pnpm perf:check`): LCP/CLS/TBT/INP/bundle vs `budgets.json` each phase.
- **Manual**: JS-off check, phone view, feel/sound, 3D drag + lazy-mount, reduced-motion across the site.
- Red-before-green for any new behavior test (per author-bias discipline).

## Performance Considerations
- The whole thesis: SSR'd static routes replace the ~2.4s SPA-blob LCP. Keep content server-rendered; the shell, palette switch, search index, audio, and three.js are all client/lazy.
- three.js async chunk measured separately or it blows the route budget on paper.
- Search index + audio decoder lazy-loaded on first use, never initial.
- Watch INP when the client shell mounts (Phase 2) and during micro-interactions (Phase 3).
- Ratchet budgets toward targets only via `pnpm perf:calibrate` (the loop cannot hand-edit `budgets.json`).

## Migration Notes
- Blog reclaimed read-only from `backup/pre-strip-bare-bones` via `git show` (no checkout). Drop the entire Supabase surface + root `middleware.ts` + `auth-ui-*` dead deps.
- Prototype files (`app/page.tsx` blob, `app/ide-files.tsx`) retired after content migration; salvage logic noted in Current State.

## References
- **Feel/craft reference bar: PostHog.com** (user-supplied 2026-06-22) — floating-shadow sphere physics, desktop-OS window chrome, custom media player, devtools mascot easter egg, recolorable roaming mascot. The target level of niceties + vibe for Phase 3. Alongside Comeau (craft) and Jason Cameron (structure).
- Vision/brief: `specs/vision/2026-06-21-portfolio-vision.md`
- Perf harness design: `specs/plans/2026-06-22-groundwork-perf-harness.md`; usage: `PERF.md`; budgets: `budgets.json`
- 3D research (cached): `.agents/docs/3d/{r3f,drei,three}-llms-full.txt`
- Prior handoff: `specs/handoffs/2026-06-22_1547-portfolio-ide-rebuild.md`
- Memory: `portfolio-architecture-decision`, `portfolio-design-craft`, `portfolio-rebuild-vision`, `perf-bar-and-harness`
- Salvage refs: `app/page.tsx:12` (buildTree), `app/page.tsx:401` (terminal parser), `app/lib/data.ts:9` (palettes)
- Skills: `frontend-design`, `animation-vocabulary` (Phase 3); `perf-loop` (Phase 6 / any red gate); `tdd` (tests)
