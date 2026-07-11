---
date: 2026-06-28T21:19:00Z
git_commit: fb2a9a6
branch: main
repository: portfolio
topic: "Privacy feature + FLIP morph + SEO pass; everything pushed/green; next = per-page OG images + squirrelscan audit"
tags: [handoff, seo, og-images, morph, privacy, data-reveal, lighthouse, bundle-budget]
status: in-progress
last_updated: 2026-06-28
type: handoff
---

# Handoff: SEO batch 1 shipped + green; next = OG images + squirrelscan + GSC

## Task(s)
Long session. Everything below is **committed and pushed to `main`; working tree clean; CI green** (react-doctor + perf both pass on `fb2a9a6`). Vercel auto-deploys on push.

- **DONE — Card↔banner morph.** Hand-rolled FLIP (no Next/React View Transitions). See [[Learnings]].
- **DONE — Blog as article cards + side TOC + readability pass on all 3 project stories** (Cisco/TactileLens/BeSeen).
- **DONE — Privacy feature.** Honest privacy/terms rewrite, first-visit data-reveal popup + `/api/whoami` edge route, the privacy post.
- **DONE — CI fixes.** react-doctor (`role`→`kind`) + perf bundle budget (lazy-loaded popup+TOC, budget 245→252kB).
- **DONE — SEO batch 1.** Per-page canonical, BlogPosting/BreadcrumbList JSON-LD, Lighthouse SEO gated at 100.
- **NEXT (planned, lean-path SEO):** per-post/project **OG images** (`next/og`), **squirrelscan** deep audit, user sets up **Google Search Console**.

## Critical References
- `specs/content/privacy-post-fragments.md` — privacy interview pile + **two future blog ideas** (anti-ad rant; Tailscale+AdGuard home-setup).
- Memory `blog-posts-seo-friendly` (~/.claude/.../memory/) — standing rule: ALL blog posts SEO-friendly; broader SEO pass planned.
- Memory `view-transitions-react-component` — why the morph is hand-rolled FLIP, not Next VT.
- SEO research summary lives only in this session's context; key verdicts in Learnings below.

## Recent changes (file:line)
- `components/content/MorphImage.tsx` — the FLIP morph engine. Records each image's rect+`kind`(card|banner)+`from`(path) on unmount; on mount flies a fixed `<body>` clone from twin→self. Morphs only when: cross-page AND `prev.from === lastLeftPath` (module var) AND opposite `kind`. `centerOnArrive` via `kind==="card"`. Strict-Mode-safe (rAF survives cleanup; `el.isConnected` guard). Prop is `kind` not `role` (role="card" failed react-doctor ARIA).
- `components/content/DataReveal.tsx` + `components/site/DataRevealMount.tsx` (dynamic ssr:false loader) — first-visit popup; `components/content/ArticleToc.tsx` + `components/content/ArticleTocMount.tsx` (dynamic loader). Both lazied to stay out of the initial bundle.
- `app/api/whoami/route.ts` — edge route, Vercel geo headers (IP/city/region/country). Returns nulls locally.
- `app/globals.css` — `.morph-img-wrap`, `.data-reveal-*`, `.article-toc*`, `.ide-terminal{z-index:30}` (covers the viewport-fixed TOC). View-transition CSS removed.
- `app/writing/[slug]/page.tsx`, `app/projects/[slug]/page.tsx` — canonical + JSON-LD (JsonLd helper at `components/site/JsonLd.tsx`).
- canonical added to all static pages + `app/writing/tag/[tag]/page.tsx`.
- `lighthouserc.js:8` — `categories:seo` error minScore 1.
- `budgets.json:36` — `bundleKB.budget` 245→**252** (justified: morph is above-fold, can't lazy).
- `content/blog/privacy-basics.mdx` — the privacy post (slug `privacy-basics`, title "How to protect your privacy online, without the tinfoil hat"); links to `https://ublockorigin.com`.

## Learnings (state of mind / dead ends)
- **Next/React View Transitions can't morph on the browser back button** (React skips popstate VTs for sync scroll restoration; vercel/next.js#94369). Confirmed empirically (svtCalls=0 on popstate). That's WHY the morph is hand-rolled FLIP. `react@19.2.7` doesn't export ViewTransition; Next's bundled React does, but it was a dead end anyway. Don't reintroduce Next VT.
- **Morph scoping took 3 iterations:** (1) all cards morphed on back → added `from !== here`; (2) home↔projects morphed all (same cards both grids) → added `kind` card/banner discriminator; (3) collapsing projects folder after visiting many details morphed all → added `lastLeftPath` (only the just-left page's twin morphs). All three guards are load-bearing — don't remove.
- **globals.css HMR is flaky** (known) — the `.ide-terminal` z-index didn't apply until `rm -rf .next` + dev restart. When a CSS change "doesn't take", wipe `.next`.
- **`.next` mixing:** alternating `pnpm build` (prod) and `pnpm dev` corrupts `.next` and breaks the user's tab (missing icons/chunks). After any prod build, `rm -rf .next` before restarting `pnpm dev`. (This caused a "whole site broken" scare.)
- **Bundle budget gate** (`pnpm size` via `.size-limit.js`) measures INITIAL-LOAD JS only (chunks referenced by prerendered HTML); `dynamic(ssr:false)` chunks are excluded — that's the lever for trimming. Don't lazy MorphImage (above-fold images would pop in late → worse LCP/CLS).
- **SEO research verdicts:** skip `claude-seo` skill (overkill, needs Google API key, 3rd-party agent code); `squirrelscan` is the better agent-usable audit (free single binary, nothing leaves machine for local audits, catches headings/alt/link-text Lighthouse misses). **Skip `llms.txt`** (no evidence anything uses it; Google says AEO/GEO == SEO). sitemap.ts is ALREADY complete (enumerates posts+projects+lastmod) — not a gap.
- **react-doctor pre-commit notice is non-blocking** (warnings); CI gate is `--blocking error` (errors only). Verify with `pnpm exec react-doctor --no-telemetry --scope changed --blocking error` (exit 0 = ok).
- Encryption claim in the privacy post softened to "encrypted before it leaves your phone" (user never confirmed it's true E2E) — re-verify before strengthening.

## Artifacts
- New posts: `content/blog/privacy-basics.mdx` (live), `content/blog/card-to-hero-view-transitions.mdx` (draft, no banner), `content/blog/my-first-post.mdx` (draft demo).
- Project stories: `content/projects/{cisco-mcp,tactilelens,beseen}.mdx` (all live).
- Fragments: `specs/content/{tactilelens,beseen,privacy-post}-story-fragments.md`; image prompts `specs/content/2026-06-25-blog-banner-prompts.md` (B&W transparent pixel-art workflow + the privacy/uBlock banner prompt).
- Components: MorphImage, DataReveal(+Mount), ArticleToc(+Mount), JsonLd; tagIcons has GitHubIcon + AppStoreIcon.

## Action Items & Next Steps
1. **Per-post/project OG images** — `app/writing/[slug]/opengraph-image.tsx` + `app/projects/[slug]/opengraph-image.tsx` via `next/og` ImageResponse (1200x630, cream `#f3ecdd` + terracotta `#a04c39`, title + name). NOTE: Satori/ImageResponse supports ttf/otf/woff, NOT woff2 — the brand fonts may be woff2, so either find a usable font file or use a clean system sans. Then update BlogPosting `image` in `app/writing/[slug]/page.tsx:` to point at the per-post OG route. All server/edge → no client JS, perf-safe.
2. **squirrelscan deep audit** — install the single binary (check install method; avoid curl|sh per security defaults), run `squirrelscan audit <url>` locally, fix headings/alt/link-text/internal-linking gaps it finds.
3. **Google Search Console** (user action) — submit sitemap, URL-inspect a few posts.
4. **Banner art** still needed: privacy post + card-to-hero post are bannerless (prompts ready). User generates B&W transparent pixel-art, drops in `public/images/blog/<slug>-bw.webp`, then wire `image:` frontmatter.
5. Optional future posts logged in privacy-post-fragments.

## Other Notes
- Constraints (persist): NO Claude/Anthropic attribution; NO em dashes; pnpm (ignore-scripts on); commit/push only when asked; use AskUserQuestion for decisions; objective tone.
- CI = two GitHub Actions jobs per push: `react-doctor` (~35s, blocking errors) + `perf` (~2min, runs `pnpm lh` Lighthouse incl. the SEO=100 gate, + `pnpm size` bundle budget). Both must stay green.
- Dev workflow: `pnpm dev` on `:3000`; container browser reaches it via LAN `192.168.1.191:3000` (IP changed from .185; allowedDevOrigins has both + Tailscale `100.98.111.54`). localhost unreachable from container browser.
- Data-reveal popup is one-time per browser (localStorage `data-reveal-seen`); clear it / use incognito to re-trigger. Shows real IP+city only on Vercel (prod), nulls locally.
- The pre-commit hook prints "React Doctor found staged regressions" every commit — non-blocking, ignore.
