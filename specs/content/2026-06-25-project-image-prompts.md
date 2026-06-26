---
date: 2026-06-25
topic: "On-brand ChatGPT image prompts — project card art + MCP diagram"
tags: [content, images, projects, prompts, brand]
type: content
---

# Project card image prompts

Generate each in ChatGPT (image gen). Export **PNG, 16:9, ~1600x900**, drop into
`public/images/projects/` as the filename noted, then I wire `project.image`.

## Shared brand brief (paste once / keep in mind for all three)
- **Medium:** chunky retro **pixel art** (16-bit / SNES-era), same family as the site's cheerful
  round brown developer mascot. Visible pixel edges, soft warm glow, handcrafted.
- **Exact palette:** cream background `#f3ecdd` (base) / `#fbf6ea` (lighter); warm dark-brown
  linework `#463f33` and deep brown `#26211c`; primary accent terracotta-rust `#a04c39`; warm gold
  glow/highlights `#d9a441`; muted brown `#726552`; light borders `#e3d8c2`.
- **Mood:** warm, cozy, paper-like, friendly, optimistic. NOT corporate, neon, cyberpunk, or flat
  modern vector.
- **Composition:** 16:9 landscape ~1600x900, subject centered with breathing room, **filled cream
  background edge to edge (no transparency)**, subtle pixel drop shadow.
- **Avoid:** real company logos, garbled text/letterforms (keep iconographic, labels added in code),
  photorealism, heavy gradients.

---

## 1. TactileLens -> save as `tactilelens.png`
> A chunky retro pixel-art illustration, 16:9 landscape ~1600x900, filled warm cream background
> (#f3ecdd). Scene: a smartphone held up with its camera pointed at a richly textured surface (tree
> bark / woven fabric / brick) on the left; from the phone, stylized pixel feedback radiates to the
> right as concentric vibration rings and little sound-wave arcs, plus a simple pixel fingertip
> touching the texture, conveying "turning what the camera sees into touch." Warm dark-brown linework
> (#463f33), terracotta-rust accent (#a04c39) for the rings and highlights, soft gold glow (#d9a441).
> Cozy, friendly, handcrafted 16-bit feel matching a cheerful pixel mascot art style. Subtle pixel
> drop shadow. No text, no logos, no photorealism.

## 2. BeSeen -> save as `beseen.png`
> A chunky retro pixel-art illustration, 16:9 landscape ~1600x900, filled warm cream background
> (#fbf6ea). Scene: two smartphones side by side connected by a gentle pixel heartbeat/link line,
> each showing a tiny habit-tracker UI (checkmarks and a streak flame); above them two small cute
> pixel hearts (or two friendly characters facing each other), conveying a wellness app that keeps a
> couple in sync. Include a little sync-arrow loop and a pixel flame for streaks. Warm dark-brown
> linework (#463f33), terracotta-rust accent (#a04c39), soft gold/amber glow (#d9a441) on the streak
> flame. Cozy, warm, wholesome, 16-bit handcrafted feel matching a cheerful pixel mascot. Subtle
> pixel drop shadow. No text, no logos, no photorealism.

## 3. Cisco MCP (the new web project) -> save as `cisco-mcp.png`
> A chunky retro pixel-art conceptual diagram, 16:9 landscape ~1600x900, filled warm cream background
> (#f3ecdd). Show how an AI agent uses an MCP server: on the LEFT a friendly pixel "AI agent" (a cute
> little robot or a glowing brain node); in the CENTER a hub/server box marked with a simple
> plug/socket icon (the MCP connector that links things); on the RIGHT a vertical stack of 3-4 small
> tool icons (a wrench, a database cylinder, a gear, a document). Clean pixel arrows flow agent ->
> hub -> tools and back, showing the agent discovering and calling internal tools through one
> connector. Warm dark-brown linework (#463f33), terracotta-rust accent (#a04c39) for arrows and the
> hub, soft gold glow (#d9a441) on the active connections, muted brown (#726552) supporting elements,
> light borders (#e3d8c2) on boxes. Diagrammatic but warm and handcrafted, matching a cozy 16-bit
> pixel mascot art style. Subtle pixel drop shadow. Keep it iconographic with NO text/letters
> (labels added separately in code). No real company logos, no photorealism.

---

### Generation tips
- Image models love to inject garbled text; if any appears, re-roll with "absolutely no text or
  letters" appended.
- If the cream background comes out white, append "background must be solid cream #f3ecdd, not white."
- For #3 (the MCP diagram), generate it text-free; crisp labels (Agent / MCP / Tools) can be overlaid
  as real DOM/SVG in code so they stay sharp and theme-aware.
