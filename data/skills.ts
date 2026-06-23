/* Skills grouped by area (not a flat logo wall). Placeholder until Phase 6. */

export type SkillGroup = {
  label: string;
  items: string[];
};

export const SKILLS: SkillGroup[] = [
  { label: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind"] },
  { label: "Mobile", items: ["React Native", "Expo", "Reanimated", "Swift"] },
  { label: "Backend", items: ["Node", "Go", "Postgres", "ClickHouse"] },
  { label: "Infra & tools", items: ["Vercel", "Docker", "Edge", "Git"] },
];
