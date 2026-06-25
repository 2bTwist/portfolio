---
date: 2026-06-25T17:05:00Z
git_commit: f14c6b1
branch: main
repository: portfolio
topic: "Ship portfolio to prod (eddyb.dev): deploy fixes, SEO/RSS, security, a11y, easter eggs, load perf"
tags: [handoff, deploy, vercel, seo, rss, security, a11y, perf, lighthouse, ci]
status: in-progress
last_updated: 2026-06-25
type: handoff
---

# Handoff: Portfolio deployed to eddyb.dev + hardening pass

## Task(s)
The site is **live on https://eddyb.dev** (Vercel, GitHub-connected, auto-deploys on push to `main`). This session took it from "feature-built on `perf-harness` branch" to deployed + polished.

- **Deploy to prod** — DONE. `perf-harness` fast-forward-merged to `main`; Vercel auto-deploys.
- **CI green-ish** — react-doctor PASSES, bundle PASSES (budget bumped). `lab-cwv` (Lighthouse) still RED — see Next Steps (the one open decision).
- **SEO + RSS** — DONE (metadata, branded OG, sitemap, robots, JSON-LD, RSS wired, GitHub repo metadata).
- **Security headers + fixes** — DONE.
- **A11y** — command palette → proper combobox dialog; DONE (real gaps).
- **Easter eggs** — DONE (robots.txt, console, view-source, 404, terminal `emacs`).
- **Load perf deep-dive** — DONE (favicon, fonts, mascot, webp). Stadia-webp ruled out.
- **Repo made public** — DONE; agent scaffolding untracked.

## Critical References
- `budgets.json` — single source of truth for perf gates. **User-owned; the agent may only edit it with explicit say-so** (user authorized the bundle bump 218→245). bundleKB.budget=245, target=200.
- `lighthouserc.js` — the `lab-cwv` gate. Uses `lighthouse:no-pwa` preset (very strict) + budget-derived LCP/CLS/TBT error gates. Insight audits already turned off (`lighthouserc.js:18-40`).
- Memory: `~/.claude/projects/-Users-edmond-Projects-portfolio/memory/` — perf bar, dev-server-kill rules, browser-MCP-dev-testing, etc.

## Recent changes (this session, all pushed to main)
- Deploy unblock chain (each was a separate Vercel build failure): `package.json` packageManager pin → `pnpm-workspace.yaml` `allowBuilds: {esbuild/sharp/unrs-resolver: true}` (THE fix for `ERR_PNPM_IGNORED_BUILDS`) → `next-mdx-remote` 5→6 (Vercel security-blocked the vulnerable 5.x).
- SEO: `app/lib/site.ts` (SITE_URL, eddyb.dev fallback), `app/sitemap.ts`, `app/robots.txt/route.ts` (custom, has a pun), `app/opengraph-image.tsx` (branded editor-window card; reads fonts+mascot from `app/og-assets/` via `fs`), `app/layout.tsx:14-50` (metadata/OG/twitter/RSS-alternate), `app/page.tsx` (Person JSON-LD, escaped).
- Security: `next.config.ts` headers() block; `app/page.tsx` JSON-LD `<` escaped. Resume iframe deliberately NOT sandboxed (Chromium blocks PDF viewer in sandboxed iframes).
- A11y: `components/ide/CommandPalette.tsx` (combobox: aria-activedescendant, focus trap, Escape, focus return, options tabIndex=-1). `components/ide/Shell.tsx` + `components/ClientBoot.tsx` use `"use no memo"` on dynamic-import helpers (react-doctor compiler-error fix).
- Easter eggs: `components/ide/Terminal.tsx` (~line 396, `emacs`/`vim`/`sudo` cases), `app/not-found.tsx`, `app/robots.txt/route.ts`, `components/ClientBoot.tsx` (console greeting), `app/layout.tsx` (view-source comment).
- Perf: mascot/logos/cert-badges → webp (`data/certs.ts`, `data/experience.ts`, `app/page.tsx`, `app/about/page.tsx` updated to `.webp`). `app/icon.png` quantized 68→14KB. `app/fonts/*.woff2` subset 116→64KB. `components/site/SiteNav.tsx` Links `prefetch={false}`.
- About portrait: `app/about/page.tsx` static-imports `@/public/images/portrait.jpg` with `placeholder="blur"`.
- Nav: `app/lib/nav.ts` — `experience`/`writing` are folders; order README, about, projects, experience, writing, certs. Writing folder children threaded from `app/layout.tsx` (getAllPosts) → Shell → Explorer.
- README rewritten plainly (user hated jargon). Contact page removed earlier (by user).

## Learnings
- **Vercel deploy chain gotchas (in order they bit):** (1) CI/Vercel pnpm needs `packageManager` in package.json; (2) `ERR_PNPM_IGNORED_BUILDS` is fixed ONLY by `pnpm-workspace.yaml` `allowBuilds:` MAP with boolean `true` — NOT `onlyBuiltDependencies` list, NOT the package.json `pnpm` field (Vercel ignored those). The user's original stub had `allowBuilds:` with literal "set this to true or false" strings = invalid YAML booleans → the error. (3) Vercel's supply-chain check hard-blocks deploys on vulnerable deps (next-mdx-remote 5.x).
- **Verify Vercel build failures with** `npx vercel inspect <dpl_id> --logs` (works without auth in this env). dpl id is in the GitHub commit status description.
- **lab-cwv is failing on the CI runner, not the site.** Measured real prod (throttled 4xCPU/Fast4G via CDP): CLS **0.003**, LCP **1.7s** — both pass. GitHub 2-core runner reports CLS 0.064, LCP 4.6s (un-meetable hardware). `e2e-perf` (calibrated conditions) PASSES. So the site meets budgets; lab-cwv is a pessimistic second measurement.
- **next/image already serves WebP** for mascot/portrait (browser never gets the PNG). Only the plain-`<img>` assets (logos, cert badges) needed manual webp.
- **Stadia Maps does NOT support `.webp`** (tested from authed origin: png→640x400 ok, webp→onerror). Leave the 45KB png tile. Don't switch or the map breaks.
- **Font subset ranges that cover the site:** `U+0020-00FF,U+2000-206F,U+2190-21FF,U+2122` (Latin+Latin-1, punctuation, arrows, TM). Verified `·` `↗` and accents render. Emoji/⌘ come from system/mono fonts, not these.
- **The "duplicate" route requests are a cache-disabled artifact** (Next router prefetch-cache dedupes with cache on) + HTML-doc-vs-RSC conflation. Not real-user waste.
- **Browser MCP (`mcp__MCP_DOCKER__browser_*`) was flaky/down most of the session** — drive the `mcp/playwright` container directly instead: `docker run --rm -v /tmp/x:/work -v /tmp/x:/out --entrypoint node mcp/playwright@sha256:43e3be2da74d869cf08487149bdc40c33a2e51eeb13f9f6dc8ac9f1ad7a817ae /work/script.js` using `/app/node_modules/playwright-core` + chromium at `/ms-playwright/chromium-*/chrome-linux/chrome --no-sandbox`. Reach the dev/prod app at the LAN IP `192.168.1.185:3000` (localhost unreachable from container) or `https://eddyb.dev`.
- **Turbopack dev CSS HMR is flaky** — new CSS classes in globals.css need `rm -rf .next` + dev restart to appear.
- User's writing voice: hates jargon and em dashes; wants plain, human copy. Repeatedly flagged.

## Artifacts
- Live site: https://eddyb.dev (+ /robots.txt, /sitemap.xml, /rss.xml, /opengraph-image all 200).
- GitHub: https://github.com/2bTwist/portfolio (public; description/homepage/topics set).
- This handoff. No open scratch files needed.

## Action Items & Next Steps
1. **DECIDE: lab-cwv CI gate** (the one open thread; user interrupted the question). Real CLS/LCP are fine; CI runner is the problem; `e2e-perf` already enforces real budgets. Options: (a) make lab-cwv CLS/LCP/TBT + framework audits `"warn"` in `lighthouserc.js` so CI goes green, keeping budgets.json unchanged [recommended]; (b) raise lab-only thresholds to CI-realistic; (c) leave red. **Don't touch `budgets.json` without user say-so.**
2. **User dashboard items (optional, non-blocking):** set `NEXT_PUBLIC_SITE_URL=https://eddyb.dev` in Vercel (cleaner preview URLs; code already falls back to eddyb.dev). Stadia allowlist already done by user.
3. **Real content still pending:** projects are TactileLens + BeSeen but need on-brand card images (`public/images/projects/<id>.png`, set `project.image`); the Cisco "Read the story" page (`app/experience/[slug]`) is a scaffold ("fuller story with drawings on its way"); blog has one placeholder post; profile.links.x is still "#".

## Other Notes
- Every push to `main` auto-deploys to Vercel prod (~60-80s). Verify via the commit's `Vercel` status (`gh api repos/2bTwist/portfolio/commits/<sha>/status`).
- Commit style: NO Claude/Anthropic attribution, NO em dashes (user global rules).
- Pre-commit hook prints a non-blocking "React Doctor found staged regressions" note (warnings only; CI blocks on errors only) — safe to ignore.
- `app/og-assets/` holds OG-only fonts (Clash/Satoshi TTF) + mascot.png read at build by the OG route; kept as PNG/TTF (build-time only, not served).
