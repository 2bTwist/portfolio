/* Who Edmond is. */

export const profile = {
  name: "Edmond Ndanji",
  role: "Full-stack & Mobile engineer",
  tagline:
    "I build systems that feel seamless and intuitive on the surface and are honest, well-factored machines underneath.",
  blurb:
    "I like going down the rabbit hole to understand how seamless systems are actually built out of intricate parts working together, on web and on mobile.",
  email: "ndanjiedmond@gmail.com",
  // Shown in the hero's minimap widget.
  location: "Baltimore, MD",
  timezone: "America/New_York", // IANA zone for the live clock
  coords: { lat: 39.2904, lon: -76.6122 }, // Baltimore — center of the static minimap
  links: {
    github: "https://github.com/2bTwist",
    linkedin: "https://www.linkedin.com/in/edmond-batch",
    chess: "https://www.chess.com/member/Anhilated",
    resume: "/resume", // the HTML "paper" page; it has a Download PDF button
  },
} as const;

export type Profile = typeof profile;
