/* Who Edmond is. Real values where known; placeholders (#) finalized in Phase 6. */

export const profile = {
  name: "Edmond Ndanji",
  role: "Full-stack & mobile engineer",
  tagline:
    "I build systems that feel seamless and intuitive on the surface and are honest, well-factored machines underneath.",
  blurb:
    "I like going down the rabbit hole to understand how seamless systems are actually built out of intricate parts working together, on web and on mobile.",
  email: "ndanjiedmond@gmail.com",
  links: {
    github: "https://github.com/2bTwist",
    linkedin: "#", // TODO(Phase 6): real URL
    resume: "#", // TODO(Phase 6): /resume.pdf
  },
} as const;

export type Profile = typeof profile;
