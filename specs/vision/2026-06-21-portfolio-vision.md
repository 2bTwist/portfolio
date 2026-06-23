# Portfolio Vision, living draft

Status: ideation. This captures the direction so nothing gets lost. It is a brief, not a build plan. We will prototype heavily before committing.

---

## 1. One-line concept

A portfolio that wears an IDE/terminal *aesthetic* but reads like a normal, fast, slick website. Technical visitors can opt into deeper toys (file-tree navigation, a real terminal); everyone else just scrolls a clean site. Novel and refreshing, never a navigation tax.

## 2. Core design law (the thing we must not break)

**Every novel interaction is additive, never the only path to content.** The file tree and terminal are shortcuts layered on top of a portfolio that is fully usable as a plain website. Ignore every gimmick and you still find best work / resume / contact in ~1 click.

Why this is law: documented failure mode of IDE-style portfolios is that clever navigation buries the CTA and recruiters bounce (Hick's Law). User's stated north star is **low cognitive load**. These reinforce each other. Jason Cameron's site proves the model: terminal aesthetic on the homepage, the *real* terminal lives at a separate subdomain.

## 3. Content inventory (the substance under the skin)

Priority order:

1. **Hero / who you are**, name, one-line value prop, current role/status, location. Inline links to credible orgs/employers as social proof (Jason does this well: "software trusted by X, Y, Z").
2. **Projects**, 6 to 10 strong. Each: problem, role, tech tags, live demo + repo, visual. The heart of the site.
   - Split or tag by **web** vs **mobile**, since Edmond builds both.
3. **Skills / tools**, grouped (frontend / backend / mobile / infra / tools). Not a flat logo wall.
4. **Experience**, timeline with context.
5. **Certifications / badges**, interactive, see §6.
6. **Contact / CTA**, reachable in ~1 click from anywhere. Resume downloadable.
7. **Live dashboard widgets** (bento), see §5.
8. **Writing / blog**, see §5.5.
9. Optional credibility: open source, testimonials.

## 4. The IDE metaphor (scoped per Edmond)

- The file tree represents the **website's own routes**, not any project's repo. Example: `projects/`, `about/`, `experience/`, `writing/`.
- **Collapsed by default.** Technical visitors expand it to navigate. Non-technical visitors never need it.
- Clicking a "file" opens that route in the main pane (the "editor"), like a rendered Markdown file.
- Candidate engine: **`@pierre/trees`** (`trees.software`), open-source React file-tree lib with virtualization, git-status badges (the "M"/"A" markers), and built-in search. Evaluate vs. building a small custom tree (we only need ~10 nodes, so the lib may be overkill, decide during prototyping).

## 5. The terminal (easter egg) + live dashboard

- **Terminal**: slides up from the bottom, sticky. Navigate and learn-about-me via commands. Allowed verbs (v1): `cd`, `ls`, `cat`/`open`, `grep` (replaces Cmd+F across "files"), `help`, maybe `whoami`, `theme`. Could live inline (drawer) and/or at a `terminal.` subdomain like Jason.
- **Live dashboard / bento grid** (from Jason's reference, Image #3), small cards full of life, low cognitive load:
  - Local-time clock with day/night icon.
  - "Currently based in" map (location toy Edmond asked for).
  - Global click-counter toy (pure delight, social proof of traffic).
  - Live GitHub commit feed + language-distribution bar.
  - Latest writing.
  - "Book a chat" CTA.

## 5.5. Writing / blog

- Blog posts about experiences, projects, learnings. **Tagged**, and **searchable by text**.
- Fits the file-tree metaphor perfectly: `writing/` is a folder of "files"; tags are like labels; the terminal `grep` becomes real full-text search across posts.
- We already had this: the stripped portfolio shipped an MDX blog (`gray-matter` frontmatter, `next-mdx-remote`), tag routes (`/blog/tag/[tag]`), an RSS feed, and Supabase-backed comments. **Reclaim that architecture leaner** rather than building from scratch, recoverable on branch `backup/pre-strip-bare-bones`.
- Search: client-side index (e.g. small Fuse.js / FlexSearch over post frontmatter + body) is plenty at this scale; no backend needed. Tag filtering is just route/state.
- Decide later: keep Supabase comments, or drop comments for v1 to stay lean.

## 6. Feel & motion

- **Motion** (`motion.dev`, npm `motion`, successor to Framer Motion) is the animation engine.
  - "Click an image, it expands to full page" = `layoutId` shared-layout animation. This is how project cards open into project pages.
  - `layout` prop, real spring physics, `AnimatePresence` for exits.
- **Tactile / skeuomorphic buttons**, the "press into the page" feel, in the spirit of **Josh W. Comeau's** micro-interactions. Custom press layer (shadow + translate on `:active`) over a base component, not an off-the-shelf lib.
- **Apple-style rotatable 3D badges** for certifications, `react-three-fiber` + `drei` (Vercel's Ship badge is the canonical pattern). Heavy: lazy-load, gate to the certs view so it never costs first paint.

## 7. Live mobile-app demo (Edmond builds mobile)

Goal: a recruiter can play with a real, shallow walkthrough of an app for ~60s, in-browser, no install.

- **Primary candidate: Appetize.io**, streams a real iOS/Android build in the browser. Most realistic.
  - Open risk: free tier has a monthly minute quota; recruiters playing 60s each can exhaust it. Need to check current pricing/quota before committing. Possibly gate behind a click so idle visitors don't burn minutes.
- **Lighter alt: Expo Snack** embed (live React Native, free) or an **Expo web** build, cheaper, but shows code / is less "real device."
- Decision deferred until we price Appetize and decide how prominent this is.

## 8. Color & theme

- **Single palette, no light/dark flip.** Soft, creamy, low-contrast-but-accessible, "won't blind your eyes" in any context.
- Strong starting point: **Catppuccin** family (what Jason uses). `Latte` = warm cream/light; the muted, low-saturation accents are exactly the target. We pick ONE variant as the default.
- Optional delight (not required): expose a small theme picker like Jason's as a toy, while still shipping one default. Decide later; default-one comes first.
- **We will prototype several palettes before locking.** Edmond wants a lot of prototyping here.

## 9. Reference sites studied

- **jasoncameron.dev**, the closest north star. Terminal/mono aesthetic, normal scrollable site, bento dashboard of live widgets, theme picker, separate real terminal at `terminal.jasoncameron.dev`, footer with status dot / live clock / view counter / deploy commit hash / webring. Studied for *what he lists and how he structures it*, not to copy the look.
- **trees.software** (`@pierre/trees`), the file-tree rendering library and the IDE-window look.
- **Josh W. Comeau**, tactile button / micro-interaction craft.

## 10. Tech stack (current thinking)

- Next.js 16 (App Router) + Tailwind 4, already scaffolded (bare shell).
- `motion`, animation / shared-element transitions.
- `@pierre/trees`, file tree (evaluate vs. custom).
- `shadcn/ui` (Radix primitives), base components; tactile layer is custom.
- `react-three-fiber` + `drei`, 3D badges, lazy-loaded.
- Appetize.io or Expo Snack, live mobile demo (TBD).

## 11. Open decisions (resolve during prototyping)

1. Default palette (prototype several Catppuccin / warm options).
2. `@pierre/trees` vs. small custom tree.
3. Terminal: inline drawer, subdomain, or both. Command set for v1.
4. Live mobile demo: Appetize (cost) vs. Expo Snack vs. skip for v1.
5. Theme picker as optional toy: in or out for v1.
6. Mobile (phone) experience: the IDE/terminal metaphor mostly dies on phones, what is the graceful fallback?
7. How dense vs. minimal the homepage is.

## 12. Suggested next steps

- Prototype 2-3 palettes + the hero + one tactile button + one shared-element card-to-page transition. Get a feel before architecting.
- Then `/groundwork` → `/grill-me` → `/plan` to turn this into a phased build.
