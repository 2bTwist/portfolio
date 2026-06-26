---
date: 2026-06-25
topic: "On-brand image prompts — blog post banners (Twitter-article style)"
tags: [content, images, blog, prompts, brand]
type: content
---

# Blog post banner prompts

Each published post opens with a banner image, same visual language as the
project card art: **black-and-white transparent pixel art** (the live cards are
`*-bw.webp`, transparent, no filled background — they sit on the card/banner
surface). One prompt per post.

Workflow: generate in ChatGPT (PNG, 16:9, transparent background), then convert
to the card/banner format:

```
cwebp -q 85 -resize 1400 0 <name>.png -o public/images/blog/<name>-bw.webp
```

Then the post's `image:` frontmatter already points at
`/images/blog/<slug>-bw.webp`, so dropping the file in lights it up. Flip
`draft: false` to publish.

## Shared brand brief
- **Medium:** chunky retro **pixel art** (16-bit / SNES-era), same family as the
  site's round developer mascot. Visible pixel edges, handcrafted.
- **Treatment:** **black and white / grayscale only, transparent background** (no
  cream fill, no color) — it must read cleanly sitting on the cream card surface.
- **Mood:** warm, friendly, optimistic, handcrafted. NOT corporate, neon, or
  flat modern vector.
- **Composition:** 16:9 landscape, subject centered with breathing room.
- **Avoid:** real company logos, garbled text/letterforms (keep iconographic),
  photorealism, heavy gradients.

---

## 1. card-to-hero-view-transitions -> save as `card-to-hero-view-transitions-bw.webp`
> A chunky retro black-and-white pixel-art illustration, 16:9 landscape,
> transparent background, grayscale only. Scene: on the LEFT a small pixel
> "card" (a little framed thumbnail tile showing a tiny picture), and a curved
> pixel motion arc sweeping to the RIGHT where the same picture has grown into a
> large "hero" banner frame — conveying one image morphing and growing from a
> small card into a big header. Add a few pixel speed/ease lines along the arc to
> show smooth movement, and a faint duplicate outline mid-arc to imply the tween
> between the two sizes. Visible chunky pixel edges, handcrafted 16-bit feel
> matching a cheerful pixel mascot art style, subtle pixel drop shadow. Black and
> white / grayscale only, fully transparent background. No text, no letters, no
> logos, no photorealism.

---

### Generation tips
- If color sneaks in, append "strictly grayscale, black and white only."
- If the background fills, append "background must be fully transparent (alpha),
  no fill."
- Image models love to inject garbled text; if any appears, re-roll with
  "absolutely no text or letters" appended.
