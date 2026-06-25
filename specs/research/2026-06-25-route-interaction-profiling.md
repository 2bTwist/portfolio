---
date: 2026-06-25
topic: "Full route + interaction profiling pass (request count, CWV, hydration, errors)"
tags: [perf, profiling, prefetch, hydration, cls, lcp, lighthouse]
status: complete
type: research
method: "Anonymous headless Chromium (mcp/playwright container) against the local production build (next start), plus Lighthouse mobile. Real-visitor conditions, no Vercel toolbar."
---

# Route + interaction profiling

User saw "49 requests" in the network panel and asked to profile every route and interaction and explain what happens. This documents what IS, the root causes, and the fixes applied.

## How it was measured
- Built with `pnpm build`, served with `pnpm start`, driven by an **anonymous** headless Chromium (no Vercel login), so the counts are what a real visitor gets. Confirmed live eddyb.dev shows the same counts (52 for an anonymous visitor), so the high count was real, not the owner-only Vercel toolbar.
- Per route: total requests, ~transfer, by-type, failed responses, duplicate URLs, console errors, page errors.
- Interactions driven with real input events; console/page/request-fail listeners attached.

## What the "49 requests" actually were
Not page weight. The page itself is ~436KB transfer / load ~444ms. The bulk of the count was **Next.js RSC route prefetches**:
- The **IDE-shell file tree** forced `prefetch` on every row; the whole tree is in-viewport, so every route's RSC payload was fetched on load (~20+ requests).
- **In-content links** (hero CTAs, tag pills, prev/next, project cards) defaulted to auto-prefetch, AND the shell re-renders after load (localStorage hydration for tabs/theme, overlay warming at 1.2s) **re-fired** those prefetches with a new router-state hash each time. Net effect: the same route prefetched 4-7 times (e.g. home prefetched `/about` 5×, `/resume` 4×; a blog post prefetched its 3 tag routes 15× combined).

Prefetch duplication is pure waste: once a route is in the router cache, re-prefetching adds nothing.

## Fixes applied
1. **Hover-prefetch instead of eager prefetch** on the file tree, breadcrumb, open tabs, and all in-content nav links (`prefetch={false}`). Next still prefetches on hover/touchstart, so navigation stays instant on intent; the upfront request storm is gone.
2. **Breadcrumb current crumb is no longer a link** (you're already there) — also stopped it from prefetching its own route.

### Request-count results (anonymous, prod build)
| Route | Before | After |
|---|---|---|
| `/` | 52 (36 local) | **26** |
| `/writing/my-first-post` | 43 | **22** |
| `/projects` | 35 | **21** |
| `/writing` | 31 | **20** |
| 404 | hung (60s) | **19, settles** |

Remaining ~14-15 scripts/route are the app + IDE-shell JS chunks (expected for an interactive shell). Fonts (4), CSS (1), HTML (1).

## Other findings

### CLS — TWO sources, both fixed
1. **Map fallback collapse (0.064 → 0.058):** the minimap rendered the Stadia tile as an `<img>` with an `onError` fallback that **collapsed the card** from a fixed 300×187 box to an auto-width pill. Where the tile fails (no key / un-allowlisted domain, e.g. CI), `onError` fired and the collapse shifted layout. Fix: render the tile as a **`background-image` on a fixed box**; dimensions are identical whether it loads or not.
2. **Font-swap rewrap (the remaining 0.058):** CI still failed CLS. The culprit (from the CI report) was `div.hero-blurb` with the **font woff2 files** as sub-items. `adjustFontFallback` (default "Arial") matches the fallback's vertical box but **not glyph widths**, so the multi-line hero blurb **rewrapped to a different line count** when Satoshi/Clash swapped in → height change → CLS. Only visible on the slow CI runner (Lantern can't simulate this; local gather loads fonts before paint, so it's unreproducible locally even with `--throttling-method=devtools`).
   - First tried `display: "optional"` — passed CI but showed the system font on slow loads, which kills the brand look (rejected by the user).
   - **Final fix: `preload: true` + `display: "swap"`.** Preloading the tiny subset woff2 (~20KB each, same-origin) at high priority in `<head>` makes the brand font ready before the hero paints, so text renders directly in the brand face (no flash) and there is no swap to rewrap. `swap` guarantees the brand font always wins. Brand-first is the priority; preload makes "brand at first paint" the common case.

### Mobile LCP — element fixed, simulation caveat
On mobile (stacked hero) the minimap was the largest in-viewport element, so the slow third-party tile was the LCP. Fixed by sizing the mascot (240px) above the minimap (260px) so the **mascot — first-party, `priority`, ~32KB webp — is the LCP element**. This removes the third party from the LCP path.
- **Caveat:** Lighthouse's *simulated* (Lantern) mobile LCP still reports ~3.8s even though the observed resource load is 30ms and render delay 401ms (real-world load is ~444ms; real LCP ~1s). The 3.8s is the Slow-4G + 4×CPU **simulation**, not an observed time. `budgets.json` documents `network: "Fast4G"` but `lighthouserc.js` uses lighthouse's default **Slow 4G**, so the gate measures slower conditions than the budget specifies. See "Open decision" below.

### 404 hydration error (React #418) — FIXED
The not-found page was statically prerendered with pathname `/_not-found`, but the client read the real URL, so the IDE shell's pathname-derived text (command-center label, breadcrumb) mismatched → hydration error on **every 404**, plus a hanging self-prefetch that never let the page settle. Fix: `export const dynamic = "force-dynamic"` on `not-found.tsx` (server now renders the real attempted path) + the breadcrumb current-crumb fix. 404 now hydrates cleanly and settles.

### `/resume` 663KB — NOT our code
`resume.pdf` is only 62.5KB. The 663KB / 24 scripts / 5 stylesheets / 2× PDF fetch is **Chromium's native PDF viewer** (its own UI chrome + a range re-request), loaded by the browser and cached across every PDF the user ever opens. Inherent to embedding a PDF via `<iframe>`. Left as-is (the resume page is intentionally "the page IS the PDF").

### Interactions — all clean
Theme switch, command palette (Meta+K, type/arrow/Escape), terminal (toggle + command), folder toggle, and file-row click → navigate: **0 console errors, 0 page errors, 0 failed requests**. First command-palette open is ~1.2s because the palette is a lazy dynamic import (chunk fetch), then instant.

## Resolution: lab-cwv LCP gate
After the fixes, `lab-cwv` passed **CLS** (now 0) and **uses-responsive-images** (mascot `sizes` fix) but still reported **LCP ~3.5s** (Lantern mobile Slow-4G simulation) vs the 2740 budget, plus **unused-javascript** (preset `maxLength:0` on Next framework chunks). The site's real LCP is ~1s.

Finding: lighthouse ships only `mobileSlow4G` / `mobileRegular3G` / `desktopDense4G` — there is **no "Fast 4G" profile**, so budgets.json's documented `Fast4G` never matched what the gate measures (Slow 4G). They were never aligned. Inventing Fast-4G numbers to pass would be tuning-to-green.

Decision (user): make **LCP advisory** (`warn`) in `lighthouserc.js` while keeping **CLS + TBT as hard errors**, and turn off the non-budget error-level preset audit **unused-javascript** (same rationale already applied to the insight audits). `budgets.json` untouched; the LCP budget stays documented as the target; INP stays hard-gated by `e2e/perf.spec.ts`. `uses-responsive-images` is kept as a hard check (it caught the mascot and now passes). Result: `pnpm lh` exits 0.
