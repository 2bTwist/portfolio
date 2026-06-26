---
date: 2026-06-26
topic: "BeSeen story interview pile + facts"
tags: [content, projects, beseen, story, fragments]
type: content
---

# BeSeen — interview fragments

Source: Edmond, voice interview 2026-06-26. SOLO build, shipped to App Store.

## Raw account (paraphrased)
- Origin: long-distance relationships. He'd been in one; hardest part is keeping up
  with each other without texting all day. Idea: see your partner's "very private
  status" without having to text. Why not social media? Those are for
  friends/followers, public, noisy, no private room for two people to be honest
  without an audience. BeSeen = a private space for just the two of you.
- Offline-first by design: journaling shouldn't need the internet. Sharing with a
  partner does need sync, so shared notes are ENCRYPTED — what you show your
  partner doesn't sit readable on the server it's uploaded to.
- Stack: Expo + React Native; offline-first over on-device SQLite + Supabase
  (Postgres) real-time partner sync; auth + push. Home-screen WIDGETS in native
  Swift (Expo's widget support was beta at the time; Swift was better; Expo lets
  you plug the native module in).
- HARDEST PART = marketing/growth, never done it. Got an Apple Search Ads
  certification; learned App Store Optimization (ASO) — a whole different world
  from web SEO, all Apple's rules. Posted on LinkedIn about it. Ran a little
  marketing but mostly let it grow ORGANICALLY / word of mouth (how he wanted it).
  Scaling hard = money/time/effort he hasn't chosen to spend.
- Day-to-day: feature requests; analytics via PostHog, errors via Sentry. Morning
  ritual: skim Supabase logs (weird behavior, functions firing, slowness) ->
  PostHog (onboarding completion, most-used features) -> Sentry (errors). Rates
  PostHog + Sentry among the best products he's used (wants to build a "best
  products" site someday).
- First time handling a live bug. Initially had NO over-the-air updates -> any fix
  meant a whole new build + review wait. Learned to ship OTA updates (fix, users
  refresh).
- Biggest lesson: designing for YOURSELF counts for nothing. (He said it more
  bluntly: "design doesn't mean shit." Softened in the published story.) Good
  design = someone who's never seen it just knows what to do. Litmus test: hand
  the app to his sister, say "create a journal entry," watch silently for friction
  / wrong-placed buttons. If she did it unaided, the design was good.
- Product dev is extremely hard but the most fun he's had in a long time. Motto:
  build things that make people's lives better.
- Now: more features, responsiveness, CLEANUP. "Most of the work is cleanup, not
  building." Refactored the whole app (first version was "slop") after validating
  the idea. Working on a new release ("maybe by the time you're reading this it's
  out").

## Verified / kept from existing data [established]
- 200+ active users, 40 connected partnerships (Edmond's own figures, in
  data/projects.ts). Apple Search Ads cert is real (see data/certs.ts).
- Live on the App Store (apps.apple.com/app/id6760330166).

## Editorial choices
- Softened "design doesn't mean shit" -> "designing for yourself counts for
  nothing" for the public portfolio. User can revert to the raw line if desired.
- Encryption claim added per his account (existing `detail` blurb didn't mention
  it).
