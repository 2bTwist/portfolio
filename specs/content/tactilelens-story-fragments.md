---
date: 2026-06-26
topic: "TactileLens story interview pile + verified facts"
tags: [content, projects, tactilelens, story, fragments]
type: content
---

# TactileLens — interview fragments (raw material for the story)

Source: Edmond, voice interview 2026-06-26. Team hackathon project. Edmond's
role = architect / integrator (NOT solo). Repo lives under a teammate's account
(github.com/chisomogugu/...), confirming it was a team build.

## Raw account (paraphrased)
- Flew from Maryland to the Bay Area (he said "San Francisco") for the Qualcomm x
  Google hackathon. ~24 hours to build an on-device AI idea.
- Each team handed a Snapdragon-powered Galaxy phone. He thinks an S24 but isn't
  sure ("look at the description"). Treat the exact model as UNCONFIRMED.
- Premise: Qualcomm's AI chip + Google's models (Gemma had just come out, lots of
  buzz); challenge was local inference on the phone, no cloud.
- Idea (a teammate's): make AI an *experience*, not a chatbot. Point the camera at
  a surface and turn what it sees into audio + haptics so you can feel the
  material. Sounded simple/fun; "did not go as planned at all."
- His role: the architect/integrator. Team had strong-ML folks and strong-UI
  folks; he'd built apps, so he bridged both, owned design schematics, split the
  work, assigned roles, integrated the whole experience. Also did the pitch.
- His personal piece: the Android haptics. Knew iOS haptics well, never Android.
  Goal = understand Android's haptics library and map a material read to feel.
- Hard parts (basically everything):
  - Nobody had shipped Android before; nobody had done on-device ML before.
  - Finding data to identify a material (datasets didn't conform to what they
    needed) — ML-side struggle.
  - Mapping model output -> Android haptics: the library exposes ~4 tunable
    parameters; they tried to get the model to emit those numbers, then tuned.
  - Audio: tried model-generated sound, it was "horrible" -> pre-recorded a few
    sounds instead.
  - Relatively easy part: running the model on-device, handled by Qualcomm AI Hub
    (plug-and-play).
  - They trained on photos taken in the room, so it only knew their environment's
    materials -> had to scope down hard.
- A Qualcomm staffer made a LinkedIn post about how ambitious their attempt was.
- Submitted ~1 minute before the deadline; things breaking to the end.
- Outcome: FINALIST. Did not win. Working demo.
- Lessons: (1) scope is brutally hard to boil down — should have shipped ~4
  textures for more time; (2) AI can run on your phone, but it needs a very good
  phone; (3) discovered haptography is a real, years-old research field — they
  tried it in 24h.

## Verified [established]
- **Qualcomm AI Hub** (aihub.qualcomm.com): library of Snapdragon-optimized models
  + upload/compile/quantize your own (AIMET) to run on the NPU. This is the
  "find a model + upload to quantize" platform he described.
- **Qualcomm x Google Developer Hackathon** — "model to mobile application,"
  Google Bay Area campus, ~24h. Matches.
- **haptography** — real research field (turning camera/measured surface data into
  touch feedback), studied for years.

## Unconfirmed / hedged in the published story
- Exact phone model (S24?) — left general as "a Snapdragon-powered Galaxy."
- Gemma version — left as "Gemma had just come out," no number.
- Exact date — not stated.
- Deep ML specifics (U2Net, zero-copy ByteBuffer, <20ms) live in data/projects.ts
  `detail`; the story keeps them light since the ML was teammates' work, not his.
