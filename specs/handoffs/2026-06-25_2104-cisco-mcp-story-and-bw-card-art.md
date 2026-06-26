---
date: 2026-06-25T21:04:00Z
git_commit: 044209b
branch: main
repository: portfolio
topic: "Granular content sweep: Cisco MCP web project + full story, B&W card art, content cleanups; next = home copy sweep + blog design"
tags: [handoff, content, projects, cisco-mcp, mdx, view-transitions, images, copy]
status: in-progress
last_updated: 2026-06-25
type: handoff
---

# Handoff: Cisco MCP story + B&W card art shipped (local); next = home copy sweep + blog design

## Task(s)
Phase: **granular per-page content sweep** (plan: `specs/plans/2026-06-25-granular-content-sweep.md`).
Axis chosen by user: content + copy + blog design are the substance; design craft is light-touch.

- **DONE (committed `044209b`, NOT pushed) — Group A cleanups:** dropped placeholder `x` link, deleted dead `data/skills.ts` + stray `public/images/first-image.png`, removed org-less "Restaurant Manager" leadership entry, added a `draft` frontmatter flag to posts + unpublished the demo blog post, cut the inert project demo stub, linked TactileLens repo.
- **DONE — Cisco MCP web project + full story.** New `web` project; `/projects` now has a Web section. Full two-part story (build + return) consolidated onto ONE page `/projects/cisco-mcp` via `content/projects/cisco-mcp.mdx`.
- **DONE — B&W transparent card art** for all 3 projects; card + detail-banner media frames stripped (no gradient bg; card keeps a divider line, banner frameless).
- **DONE — native View Transitions** image morph (card -> detail banner).
- **NEXT (planned):** push to deploy (user must ask), home copy sweep (Group C), blog design track (Group D), small `/projects` metadata copy fix.

## Critical References
- `specs/plans/2026-06-25-granular-content-sweep.md` — the phase plan + all decisions table (read first).
- `specs/content/cisco-mcp-story-fragments.md` — the interview "pile" (raw material + VERIFIED tech notes for MCP/FastMCP).
- Prior handoff: `specs/handoffs/2026-06-25_1516-route-profiling-and-next-granular-pass.md`.

## Recent changes (file:line)
- `data/projects.ts` — added `cisco-mcp` (kind web, featured, image `cisco-mcp-bw.webp`); TactileLens `links.repo` + image; BeSeen image; removed `ProjectDemo`/`demo`/`storyNext` types. Blurb/detail say "An internal MCP marketplace at Cisco" (NOT "first" — see Learnings).
- `content/projects/cisco-mcp.mdx` — the full consolidated story (10 `##` sections: build chapters then "Coming back to a platform that broke" ... "What it taught me").
- `app/projects/[slug]/page.tsx` — renders banner image (shared `view-transition-name`) + MDX story via `compileMDX`; falls back to `project.detail` when no story.
- `app/lib/project-story.ts:9` — `getProjectStory(id)` reads `content/projects/<id>.mdx`.
- `app/lib/posts.ts:20,55,61` — `draft` flag: hidden from listing/tags/sitemap/RSS/search + 404s its URL.
- `app/experience/page.tsx:51` — "Read the story" now uses `entry.storyHref` (-> `/projects/cisco-mcp`); `/experience/[slug]` route DELETED.
- `data/experience.ts` — Cisco `storyHref: "/projects/cisco-mcp"`; removed `story/storyTitle/storyPrev`; removed Restaurant Manager.
- `app/lib/nav.ts` — experience is now a leaf file (`experience.md`) in the IDE tree (no sub-pages).
- `app/sitemap.ts` — dropped the experience `stories` loop (projects loop already covers cisco-mcp).
- `next.config.ts:8` — `experimental.viewTransition: true`.
- `app/globals.css` — `.proj-card-media` (no bg, keeps `border-bottom`), `.proj-card-img`/`.project-banner img` `object-fit: contain`, `.project-banner` frameless; View Transitions block suppresses root cross-fade + disables under reduced-motion. Removed dead `.project-continue`/`.story-prev`.
- `components/content/ProjectCard.tsx:24`, project banner — `style={{ viewTransitionName: 'project-img-'+id }}` on both (paired).
- `data/profile.ts`, `components/site/SocialLinks.tsx` — X dropped.

## Learnings (state of mind / dead ends)
- **NEVER invent facts.** User furious that I wrote "Cisco's *first* internal MCP" — they never said first. Removed. Re-verify any superlative/quantifier against the fragments pile.
- **Story structure: ONE page, not cross-section.** First attempt split build=project page / return=experience page; user found the click-to-another-section-and-back confusing ("feels very odd"). Consolidated to one project page. Don't re-split across sections.
- **next/image caches by URL.** Swapping a file in place (same name) keeps serving the STALE optimized variant even after clearing `.next/cache/images` (browser also caches with long headers). FIX that actually works: **rename the file** (new URL) -> `*-bw.webp`. This is why all art is `-bw.webp`.
- **All 3 card images are B&W transparent PNG->webp** (`cwebp -q 85 -resize 1400 0`, alpha preserved). User strongly prefers B&W over the earlier color versions (color versions deleted; tactilelens color backup in scratchpad only).
- **Card media:** user wants NO background, NO box, but KEEP the divider line; art on the card's `--surface`. Banner: fully frameless.
- **MCP tech (VERIFIED, sub-agent against modelcontextprotocol.io + gofastmcp.com):** host spins up ONE client PER server (never "the client"); server exposes tools/resources/prompts; `FastMCP.from_openapi`/`from_fastapi` are real; "decoupled" = clean module/deploy boundary (FastMCP can mount in FastAPI), not "can't co-locate".
- **Image workflow:** I write on-brand ChatGPT prompts (`specs/content/2026-06-25-project-image-prompts.md`), user generates, drops into `public/images/projects/`. Brand = pixel-art mascot style + Cream palette (memory [[brand-art-pixel-cream]]).
- **Always use the AskUserQuestion box** for decisions (memory [[use-question-box-always]]) — user flagged repeatedly.
- **Dev server:** killed/restarted several times; only the portfolio `next dev` is ours, user's separate Beseen-Web dev server also runs and can squat :3000. Kill LISTEN pid only.

## Artifacts
- `content/projects/cisco-mcp.mdx` (the live story).
- `public/images/projects/{tactilelens-bw,beseen-bw,cisco-mcp-bw}.webp` (live card art).
- `specs/content/cisco-mcp-story-fragments.md` (interview pile + verified tech).
- `specs/content/2026-06-25-project-image-prompts.md` (image prompts + brand brief).
- `specs/plans/2026-06-25-granular-content-sweep.md` (phase plan).
- Scratchpad: `.../scratchpad/tactilelens-color.webp.bak` (color TactileLens, if reverting).

## Action Items & Next Steps
1. **Push to deploy** when user asks (commit `044209b` is local only; Vercel auto-deploys on push to main).
2. **Verify visually** (browser MCP was DOWN this session): the B&W cards, the frameless banner, and the View Transitions image morph (card -> detail). Dev server: `pnpm dev` then `localhost:3000` (or LAN `192.168.1.185:3000`). New filenames mean a normal refresh shows the art.
3. **Home copy sweep (Group C):** hero "2x Software Engineering Intern" phrasing + 3 paragraphs; propose before/after, user approves. No em-dashes, no jargon.
4. **Blog design track (Group D):** 2-3 layout directions; each post opens with a banner image (Twitter-article style) in the pixel/cream language, one banner prompt per post; real first post.
5. **Small fix:** `/projects` page `<head>` description still says "live demo and source" (stale; demos cut).
6. Continue the in-order sweep: about, certs, resume.

## Other Notes
- Constraints (persist): NO Claude/Anthropic attribution anywhere; NO em dashes; pnpm only (ignore-scripts on); commit/push only when asked; be objective.
- Gates: `pnpm build` (green), `pnpm lint` (0 errors, 3 pre-existing warnings), `pnpm exec tsc --noEmit` (clean). Pre-commit "React Doctor found staged regressions" is NON-blocking.
- Perf: `pnpm lh` not run this session (content/data changes mostly). View Transitions add no client JS to cards (server components). Worth an `pnpm lh` before/after if perf-sensitive.
- `experimental.viewTransition` default cross-fades the whole page; root fade is suppressed in globals.css so only the named image morphs (the persistent IDE shell must not flash).
