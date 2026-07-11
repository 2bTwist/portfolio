---
date: 2026-06-29T03:29:40Z
git_commit: 3f9a655
branch: main
repository: portfolio
topic: "SEO batch 2 (OG images + squirrelscan audit fixes) + privacy popup/banner/title fixes; all shipped + CI green"
tags: [handoff, seo, og-images, squirrelscan, data-reveal, privacy, og-transparency]
status: in-progress
last_updated: 2026-06-28
type: handoff
---

# Handoff: OG images + squirrelscan fixes + privacy popup/banner/title — all pushed, CI green

## Task(s)
Everything below is **committed + pushed to `main`; CI green on `3f9a655`** (react-doctor + perf/Lighthouse-SEO=100 + bundle budget all pass). Vercel auto-deploys. Working tree is clean except two untracked handoff docs in `specs/handoffs/`.

- **DONE — Per-post/project OG images** (`next/og`). Commit `0f0ab39`.
- **DONE — squirrelscan deep audit + fixes.** Commit `0f0ab39`.
- **DONE — Privacy popup scoped to /privacy + transparent banner + shorter title.** Commits `715ed1f` (fixes) + `3f9a655` (copy reword).
- **NEXT (user actions, not code):** Google Search Console (submit sitemap); `card-to-hero` post still bannerless (its frontmatter `image:` points at a missing file).

## Critical References
- Memory `squirrelscan-local-audit` (~/.claude/.../memory/) — how to run the audit + which findings are localhost false positives. READ before re-auditing.
- Memory `brand-art-pixel-cream` — CORRECTED this session: banners MUST be transparent (alpha), never flattened to white. 1400x788 webp, TrueColorAlpha.
- `specs/handoffs/2026-06-28_1719-seo-pass-og-images-and-squirrelscan-next.md` — the prior handoff this session continued from.

## Recent changes (file:line)
- `app/lib/og.tsx` (NEW) — shared `renderOgCard({tab,eyebrow,title,summary})` editor-window OG renderer. ttf fonts from `app/og-assets/` (NOT woff2 — Satori limitation). `titleSize()` steps down for long titles; `clamp()` trims summary to ~118 chars so it never collides with the brand footer.
- `app/writing/[slug]/opengraph-image.tsx` + `app/projects/[slug]/opengraph-image.tsx` (NEW) — per-page static OG routes (prerendered, zero client JS).
- `app/writing/[slug]/page.tsx` — BlogPosting JSON-LD `image` → `${SITE_URL}/writing/${slug}/opengraph-image`; added `publisher` Organization (was the schema ERROR squirrel caught); banner MorphImage now `alt={post.title}`.
- `app/projects/[slug]/page.tsx` — added openGraph/twitter metadata; banner MorphImage `alt={project.title}`.
- `components/content/PostCard.tsx:33` — card title h3→**h2** (fixed /writing H1→H3 skip). `components/certs/CertBadge.tsx:30` — h3→**h2** (fixed /certs skip). ProjectCard stays h3 (projects page has h2 section headers, so h1→h2→h3 is correct — do NOT change it).
- `app/resume/page.tsx` — added `<h1 className="sr-only">` (page is a PDF iframe, had no H1).
- `app/layout.tsx` — added `icons: { icon: "/favicon.ico" }` to metadata (Next doesn't emit `<link rel=icon>` for a bare public/favicon.ico). ALSO removed the global `<DataRevealMount/>` (import + usage).
- `components/ide/Tabs.tsx:101` — wrapped the `×` close glyph in `<span aria-hidden="true">` (fixed label-content-name-mismatch).
- `app/privacy/page.tsx` — now renders `<DataRevealMount/>` (the ONLY mount point); reworded the card reference to "the card that popped up a moment ago" (was "on your first visit").
- `components/site/DataReveal.tsx:108` — delay 1100ms → **3500ms**. `components/site/DataRevealMount.tsx` — comment updated (no longer global).
- `content/blog/privacy-basics.mdx` — title → **"My little take on privacy"** (slug stays `privacy-basics`); `image:` frontmatter set.
- `public/images/blog/privacy-basics-bw.webp` — re-exported TRANSPARENT (see Learnings).

## Learnings (state of mind / dead ends)
- **OG-image white-bg mistake (root cause):** my first `magick` convert used `-background white -alpha remove`, baking white into a source that was actually transparent. The real project banners ARE transparent (TrueColorAlpha, corner `srgba(0,0,0,0)`). Fix: `magick src.png -resize 1400x788 -background none -quality 82 out.webp` (NO -alpha remove/-flatten). Verify: `magick <f> -format "%[pixel:p{0,0}]" info:` → `srgba(0,0,0,0)`.
- **`curl` lies about Next/Image transparency:** `/_next/image?...` returns `image/jpeg` (no alpha) to curl because curl sends no `Accept: image/webp`. A real browser (`Accept: image/avif,image/webp`) gets webp WITH alpha. Test image optimization with the browser Accept header, not bare curl.
- **I broke the user's dev server (lesson, again):** ran prod `pnpm build` + `rm -rf .next` repeatedly while their `pnpm dev` was live on :3000 → Internal Server Error (the documented `.next` mixing scare). Recovery: kill ONLY the LISTEN-owning PID (`lsof -nP -iTCP:3000 -sTCP:LISTEN -t`, confirm it's `next-server`, then `kill <pid>` — never a bare port-kill), `rm -rf .next`, restart `pnpm dev`. **For rest of session I promised: no prod builds, leave .next + their dev server alone, verify only against their :3000.**
- **squirrelscan localhost false positives** (do NOT "fix"): HTTPS (16x), HTTP/2, cache-headers, og:url-mismatch, sitemap-domain (ERROR) — all artifacts of auditing local HTTP on a non-`eddyb.dev` host. Remaining empty-alt images are intentionally decorative (card-banner images whose title is the adjacent link text; logos under `aria-hidden` parents). Audit went 64→71 overall; a11y/structured-data/url/mobile all 100.
- **Data-reveal verified empirically in-browser** (container browser via LAN `192.168.1.191:3000`, localhost unreachable from container): `/terms` with seen=null after 6s → absent; `/privacy` 1st visit → present; after dismiss seen=1; `/privacy` 2nd visit → absent. Only-on-/privacy + once-per-browser both confirmed.
- **squirrelscan binary** at `~/bin/squirrel` v0.0.60 (GitHub-release binary, SHA-256 verified, user installed via `!` because the auto-mode classifier blocks executing tool-fetched binaries). Run: `squirrel audit <url> --offline --http --coverage full --refresh -f markdown -o <file>`.

## Artifacts
- Commits: `0f0ab39` (OG + squirrelscan), `715ed1f` (privacy fixes), `3f9a655` (copy reword).
- New memory: `squirrelscan-local-audit.md`. Updated memory: `brand-art-pixel-cream.md` (transparency rule).
- Audit reports were in scratchpad (ephemeral): `audit.md` (before) / `audit2.md` (after fixes).

## Action Items & Next Steps
1. **Google Search Console** (user action) — submit sitemap, URL-inspect a few posts.
2. **card-to-hero banner** — `content/blog/card-to-hero-view-transitions.mdx` is a draft whose `image:` points at `public/images/blog/card-to-hero-view-transitions-bw.webp` which does NOT exist. Either generate a transparent B&W pixel-art banner (see brand-art memory + `specs/content/2026-06-25-blog-banner-prompts.md`) or drop the frontmatter line.
3. Optional future posts logged in `specs/content/privacy-post-fragments.md` (anti-ad rant; Tailscale+AdGuard home setup).
4. Consider deleting/refreshing the two stale handoff docs in `specs/handoffs/` (this one supersedes the 1719 one).

## Other Notes
- Constraints (persist): NO Claude/Anthropic attribution; NO em dashes; pnpm (ignore-scripts on); commit/push only when asked; use AskUserQuestion for decisions; objective tone.
- The pre-commit hook prints "React Doctor found staged regressions" every commit — NON-BLOCKING (warnings); CI gate is `--blocking error` only. Ignore it.
- Data-reveal is one-time per browser (localStorage `data-reveal-seen`); clear it / incognito to re-trigger. Shows real IP+city only on Vercel (prod); over LAN it shows the LAN IP; nulls over pure localhost.
- Their dev server (`next-server` v16.2.9) is currently running on :3000 — leave it alone.
