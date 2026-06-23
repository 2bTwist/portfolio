/* Work history timeline. Placeholder until Phase 6. */

export type ExperienceEntry = {
  role: string;
  org?: string;
  period: string;
  summary: string;
  highlights?: string[];
};

export const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "Software Engineer",
    period: "Now",
    summary: "Building full-stack and mobile products end to end.",
    highlights: [
      "Ship features across web, backend services, and native apps.",
      "Own the path from interaction detail to deployed system.",
    ],
  },
  {
    role: "Software Engineer",
    period: "Earlier",
    summary: "Shipping features across web, backend services, and native apps.",
  },
];
