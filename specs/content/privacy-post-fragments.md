---
date: 2026-06-28
topic: "Privacy blog interview pile (grilling) + verified facts + future post ideas"
tags: [content, blog, privacy, fragments]
type: content
---

# Privacy post — interview fragments

Source: Edmond, grilling interview 2026-06-28. Drove the rewrite of
`content/blog/privacy-basics.mdx` ("How to protect your privacy online, without
the tinfoil hat"). Lead engine chosen: **(B) consent/transparency**, with the
breach as concrete proof.

## Raw account (paraphrased)
- ORIGIN / hook: used AT&T for mobile. AT&T required his SSN tied to the phone
  number. AT&T got breached; his SSN leaked. He runs breach-monitoring engines
  that pinged him: "your SSN was found in this leak." That made it real.
- Realization: they already had his name + ID, so why did a phone line ever need
  his SSN? It wasn't required for the service. Sent him down the rabbit hole:
  data brokers, companies selling data for profit, "way worse than I thought."
- CORE conviction (he picked B): the problem isn't data (data is necessary in
  tech; his own apps must collect + sync between partners). The wrong is it
  happens TO you, not WITH you: no consent, no transparency, you never knew or
  agreed. Data is used for AND against you; bad actors after a breach = unknown
  harm. He wants, at minimum, that you KNOW and have a real choice.
- BUILDER philosophy + proof: take only what the service truly needs, be clear
  about it. If you collect data you owe a responsibility: access controls, who
  can see it, secure storage. Proof = this site (no analytics, names the Stadia
  IP leak in the policy, the reveal card shows you your data). Also BeSeen
  (collects only what's needed, syncs, locked down).
- PRACTICAL (his list): #1 install an ad blocker (uBlock Origin) — "the best
  thing." Lock down social media privacy settings (most are opt-IN, not
  opt-out). Give the least data needed; skip optional fields. VPN on public wifi
  (but it's NOT privacy — moving trust, not removing it).
- Tone: "not too tinfoil-headed, very modest" — cares enough to set up a few
  things; that's the right bar for most people.

## Verified [established]
- AT&T suffered major 2024 breaches; the ~73M-record breach exposed SSNs. His
  personal "SSN in the leak" alert is his own account (treated as true).
- uBlock Origin (ublockorigin.com): free, open-source content/tracker blocker.
- VPN nuance (hides IP from sites + ISP, useful on public wifi/geo, does NOT stop
  fingerprinting/logins, shifts trust to the VPN provider) — accurate.

## New requirement (now a standing rule)
- ALL blog posts must be SEO-friendly so searchers find the site. See memory
  [[blog-posts-seo-friendly]]. Broader site SEO pass planned after the push.

## Future blog ideas he teased (write later)
1. **"Why I hate ads"** — an anti-ad rant, with the honest irony that he now
    builds apps and has to advertise them; not anti-ad, but the way it's done is
    "too aggressive and obnoxious."
2. **Home network privacy setup** — his Tailscale + AdGuard Home rig at home that
    filters ads/trackers, plus a VPN for public wifi. A "how I actually run it"
    post.
