/* Who Edmond is. Real values where known; placeholders (#) finalized in Phase 6. */

export const profile = {
  name: "Edmond Ndanji",
  role: "Full-stack & mobile engineer",
  tagline:
    "I build systems that feel seamless and intuitive on the surface and are honest, well-factored machines underneath.",
  blurb:
    "I like going down the rabbit hole to understand how seamless systems are actually built out of intricate parts working together, on web and on mobile.",
  email: "ndanjiedmond@gmail.com",
  // Shown in the hero's local-time widget. TODO(Phase 6): confirm exact city.
  location: "Baltimore, MD",
  timezone: "America/New_York", // IANA zone for the live clock
  links: {
    github: "https://github.com/2bTwist",
    linkedin: "https://www.linkedin.com/in/edmond-batch",
    x: "#", // TODO(Phase 6): real URL (still needed)
    resume: "/resume", // the HTML "paper" page; it has a Download PDF button
  },
} as const;

export type Profile = typeof profile;
