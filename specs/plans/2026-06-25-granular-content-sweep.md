---
date: 2026-06-25
topic: "Granular per-page sweep — content, copy, and blog design"
tags: [plan, content, copy, projects, experience, blog, cisco-mcp]
status: approved-pending-execution
type: plan
---

# Granular per-page content + copy sweep

New phase after the route/interaction profiling pass (perf shipped + green). Axis chosen by the
user: **content + copy + blog design** is the substance; design craft is a light-touch polish only
(buttons are fine, don't over-rotate). Full sweep in page order. All facts collected up front (the
user's chosen mode) via a grilling session; decisions below are final.

## Decisions (from the grill — final)

| # | Item | Decision |
|---|---|---|
| 1 | X/Twitter link (`profile.links.x = "#"`) | **Drop X entirely** from `profile.links`. |
| 2 | `data/skills.ts` (dead/unused placeholder) | **Delete the file.** TechStack is the real source. |
| 3 | `public/images/first-image.png` (stray) | **Delete.** |
| 4 | "Restaurant Manager" leadership entry (no org) | **Remove the entry** from `data/experience.ts`. |
| 5 | `content/blog/my-first-post.mdx` (self-described demo) | **Unpublish** until real posts exist (verify draft mechanism). |
| 6 | Project detail interactive demo stub | **Cut the stub block** in `app/projects/[slug]/page.tsx`. |
| 7 | TactileLens link | **Link the team repo** `chisomogugu/TactileLens---Vision-to-Haptics-AI-Application`; frame Edmond as major contributor (most code his). |
| 8 | Web projects gap | **Add the Cisco MCP as a real `web` project** so /projects isn't mobile-only. |
| 9 | Cisco MCP story homes | **Two different angles** — project page = technical artifact; experience page = personal journey. Distinct content, no repetition. |
| 10 | Project card art | **2 prompts now** (TactileLens, BeSeen) + 1 MCP-diagram for the Cisco web card. I write on-brand ChatGPT prompts; user generates. |
| 11 | Location (Baltimore, MD + coords) | **Correct** — drop the TODO. |
| 12 | resume.pdf + cert dates | **Both correct** — no change. |
| 13 | Blog design | **Separate track** — its own frontend-design exploration. Each post opens with a banner image (Twitter-article style) in the site's ASCII/visual language; I write a banner prompt per post. |
| 14 | Copy mandate | **Propose rewrites for approval** per page (no jargon, no em-dashes). Nothing ships unseen. |

## Group A — safe edits, no content owed (can execute now)
1. `data/profile.ts`: remove the `x` link entry; strip the X TODO + "confirm exact city" TODO + the
   "placeholders finalized in Phase 6" comment (now resolved).
2. Delete `data/skills.ts` (confirm zero imports first).
3. Delete `public/images/first-image.png` (confirm zero references first).
4. `data/experience.ts`: remove the "Restaurant Manager" `LEADERSHIP` entry.
5. `app/projects/[slug]/page.tsx`: cut the inert demo stub block (verify line range).
6. `data/projects.ts`: add TactileLens `links.repo` (team repo above), framed as lead/major contributor.
7. `content/blog/my-first-post.mdx`: unpublish (verify the content lib's draft/published mechanism;
   must also fall out of sitemap + RSS, not just the listing).

## Group B — content-blocked (needs user input + image prompts I write)
8. **Cisco MCP web project** (`data/projects.ts`, `kind: "web"`):
   - Card art: MCP-explainer **diagram** — I write a ChatGPT prompt; user generates.
   - Detail page (technical-artifact angle): what MCP is, how it was built. **User supplies** the MCP
     explanation + technical details; I shape into the project detail.
9. **Cisco experience story** (`/experience/cisco`, personal-journey angle): knew nothing going in,
   what it was actually like, problem/challenge/solution at a high level, issues, lessons, conclusion.
   **User supplies** the narrative beats; plus "drawings" — I write image prompts. Replaces the scaffold.
10. **Project card art** for TactileLens + BeSeen — I write 2 on-brand prompts; user generates; I wire
    `project.image` + create `public/images/projects/`.

## Group C — copy-rewrite sweep (propose → approve, per page)
Page order: home → about → projects(+slug) → experience(+cisco) → writing(+post) → certs → resume.
Per page I draft before/after copy in the user's voice and show the diff; nothing ships without a yes.
Known first candidates: home hero "2x Software Engineering Intern" phrasing + the 3 hero paragraphs.

## Group D — blog design track (separate frontend-design session)
2-3 concrete blog layout directions for the user to pick. Banner image at top + title overlay
(Twitter-article style), banner generated in the site's ASCII/visual language (prompt-per-post).
Decide the post card/typography system here so it stays consistent with project cards. This track
also produces the real first post(s) (content owed by user).

## Still needed from the user before Group B/C/D complete
- Cisco MCP: the "what is MCP" explanation + technical build details (project page).
- Cisco journey: the personal-story beats (experience page).
- Generated images: 2 project cards + 1 MCP diagram + blog banners (from my prompts).
- Real blog post topic(s)/content for the blog track.

## Constraints (persist)
No Claude/Anthropic attribution anywhere; no em dashes in authored text; pnpm only; commit to main
only when asked (auto-deploys); be objective, lead with substance.
