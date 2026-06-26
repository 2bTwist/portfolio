---
date: 2026-06-25T15:16:00
git_commit: 81b0412
branch: main
repository: portfolio
topic: "Full route+interaction profiling pass (shipped); next: go granular per-page"
tags: [handoff, perf, profiling, prefetch, cls, fonts, favicon, lab-cwv, pages]
status: phase-complete-ready-for-next
last_updated: 2026-06-25
type: handoff
---

# Handoff: route/interaction profiling shipped — next, granular per-page work

## Task(s)
Site is **live on https://eddyb.dev** (Vercel auto-deploys on push to `main`). This session did a full profiling pass the user requested ("profile every route and click, investigate what happens"), shipped fixes, and resolved the lab-cwv gate. Working tree is **clean**, HEAD `81b0412`, perf CI **green**.

- **DONE — lab-cwv gate decision** (the originally-open item): LCP is now advisory (`warn`); CLS+TBT stay hard errors; `unused-javascript` preset audit turned off. budgets.json untouched.
- **DONE — profile every route** (home, about, projects, projects/[slug], experience, experience/cisco, writing, writing/[slug], writing/tag/[tag], certs, resume, terms, privacy, 404).
- **DONE — profile every interaction** (theme, command palette, terminal, folder toggle, nav click) — all 0 errors.
- **DONE — fixes shipped** (prefetch storm, CLS×2, mobile LCP element, 404 hydration, mascot sizes, favicon refetch).
- **NEXT (user's `/compact` arg): "prepare to go more granular on the pages."** No spec yet — see Next Steps. This is a NEW phase: deep per-page review (content, design craft, copy, responsive, a11y, micro-interactions), page by page.

## Recent commits this session (all on main, all deployed)
- `81b0412` favicon: replaced `app/icon.png` convention with `public/favicon.ico` (no `<link>`) — stops per-nav refetch.
- `5622867` fonts: `preload:true` + `display:"swap"` — brand font at first paint, no flash, CLS still green.
- `7cdef0e` fonts: tried `display:"optional"` (REVERTED by 5622867 — user hated the system-font flash).
- `ae18f6d` perf(routes): hover-prefetch everywhere, CLS fix (map), mascot LCP, 404 hydration, lighthouserc LCP-advisory.

## Critical references
- **Profiling findings doc:** `specs/research/2026-06-25-route-interaction-profiling.md` (per-route request tables, CLS root causes, LCP caveat, gate resolution). READ THIS before the granular pass.
- `budgets.json` — perf gate source of truth, **off-limits to the agent** ("loop CANNOT edit this file"). Only `lighthouserc.js` is agent-editable.
- `lighthouserc.js` — LCP is `gate("lcp", "...", "warn")`; CLS/TBT `error`; `OPPORTUNITY_AUDITS_OFF = ["unused-javascript"]`; insight audits off.
- Prior handoff: `specs/handoffs/2026-06-25_1305-deploy-hardening-seo-perf.md` (deploy/SEO/security/easter-eggs context).

## Per-route state after this pass (anonymous prod build, requests)
home 26, about 25, projects 21, projects/[slug] 18-19, experience 25, experience/cisco 21, writing 20, writing/my-first-post 22, writing/tag 20, certs 22, resume 39 (Chromium PDF viewer, not our code), terms/privacy 19, 404 19 (settles clean). ~14-15 scripts/route = app+IDE-shell JS (expected).

## Learnings (state of mind / dead ends)
- **Prefetch storm root cause:** eager `prefetch` on shell+content links re-fires 4-7x/route because the IDE shell re-renders after load (localStorage tabs/theme hydration, overlay warming @1.2s, terminal mount) → router prefetch-cache invalidated → re-prefetch with new `_rsc` hash. Fix everywhere = `prefetch={false}` (hover-prefetch). Memory: [[prefetch-storm-hover-prefetch]].
- **CLS had TWO sources:** (1) minimap `onError` fallback collapsing the box (fixed: background-image on fixed box, LocationCard.tsx); (2) hero-blurb **rewrapping on font swap** — `adjustFontFallback` (default Arial) matches vertical box but NOT glyph widths, so multi-line text rewraps to a different line count. **Only reproduces on the slow CI runner** — UNREPRODUCIBLE locally even with `--throttling-method=devtools` (localhost serves fonts before paint). Fixed via `preload:true`+`swap`.
- **Fonts: NEVER use `display:optional`** — user reacted strongly to the system-font flash. Must be `preload:true`+`swap` (brand at first paint). Memory: [[fonts-preload-swap-never-optional]].
- **lab-cwv LCP is intentionally advisory** — Lantern Slow-4G sim projects ~3.5s vs real ~1s; lighthouse has NO Fast-4G profile so budgets.json's documented Fast4G never matched. Don't make LCP a hard error again. Memory: [[lab-cwv-lcp-advisory]].
- **404 #418 hydration:** static not-found prerenders `/_not-found` while client reads real URL → shell pathname-text mismatch. Fixed: `force-dynamic` on `app/not-found.tsx` + breadcrumb current-crumb is now a non-linking span (Explorer.tsx).
- **Favicon refetch:** `app/icon.png` convention's `<link rel=icon>` is re-hoisted by React 19 on every soft nav → refetch. Manually rendering the `<link>` in layout did NOT fix it (re-hoisted same way). Only fix that gives 0 per-nav requests = `public/favicon.ico` + NO `<link>` (browser auto-probes once). Do NOT add `apple-touch-icon` (reintroduces a managed link → refetch).
- **`/resume` 663KB is Chromium's native PDF viewer**, not our code (resume.pdf is 62KB). Leave it.

## Tooling notes (reuse these)
- **Drive headless Chromium via the container** (browser MCP was down): `docker run --rm [--network host] -v /tmp:/work --entrypoint node mcp/playwright@sha256:43e3be2da74d869cf08487149bdc40c33a2e51eeb13f9f6dc8ac9f1ad7a817ae /work/<script>.js`. chromium path `/ms-playwright/chromium-1219/chrome-linux/chrome --no-sandbox`, playwright-core at `/app/node_modules/playwright-core`. Reach local build at `http://192.168.1.185:3000` (use `--network host`), or live `https://eddyb.dev`. Desktop nav = click `.ide-row` (the SiteNav is hidden behind the IDE shell on desktop).
- **CLS/LCP culprits:** `npx lighthouse <url> --output=json` then read `audits["layout-shifts"].details.items` (NOT `layout-shift-elements`) and `audits["lcp-discovery-insight"]` for the LCP node. CI lab report URL is in the `gh run view <id> --log` output (storage.googleapis.com), embeds `window.__LIGHTHOUSE_JSON__`.
- **Verify a perf-gate change before pushing** with `pnpm lh` (manages its own server on :3000 — free the port first). Gates: `pnpm lint` (0 errors ok, 3 pre-existing warnings), `pnpm test` (3), `pnpm e2e` (a11y 3/3), `pnpm size` (239.58/245), `pnpm doctor` (exit 0; "79 issues" = pre-existing baseline; pre-commit "React Doctor found staged regressions" = non-blocking).
- **Dev-server kill:** only the LISTEN pid; `pkill -9 -f "next start"`/`"next-server"`/`"next dev"`. Never `lsof -ti :3000 | kill`.

## Next Steps — "go more granular on the pages"
No spec yet; this is a fresh phase the user flagged. Suggested approach:
1. **Pick the granularity axis with the user** (likely AskUserQuestion): content/copy accuracy, design craft & micro-interactions (the "Comeau-grade" workstream — see memory [[portfolio-design-craft]]), responsive/mobile, a11y depth, or per-page perf. Probably page-by-page, full review each.
2. **Known still-pending real content** (from prior handoff, not yet done): project cards need on-brand images (`public/images/projects/<id>.png`, set `project.image` in data/projects.ts — currently tinted placeholder); Cisco read-more (`app/experience/[slug]`) is a scaffold ("fuller story w/ drawings"); blog has ONE placeholder post (`content/blog/my-first-post.mdx`); `profile.links.x` still "#".
3. **Suggested page order:** home → about → projects(+[slug]) → experience(+cisco) → writing(+post) → certs → resume. Review each for: copy voice (user hates jargon/em-dashes), visual craft, responsive breakpoints, a11y, interactions.
4. Re-read the profiling findings doc first; per-route request/CWV baselines are there.

## Constraints (persist — user global rules)
- NO Claude/Anthropic attribution anywhere (commits/PRs/docs/comments); strip any "Generated with" footer.
- NO em dashes in any authored/user-facing text (periods/commas).
- pnpm only; ignore-scripts=true (use approve-builds). Never paste secrets.
- Be objective, no sycophancy, lead with substance/tradeoffs. Never tell the user to rest.
- Commit/push only when asked; auto-deploys from main. User prefers committing straight to main here (confirmed this session).
