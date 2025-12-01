export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["JavaScript/TypeScript", "Python", "Go"],
  },
  {
    label: "Backend",
    items: ["Node.js", "Express", "FastAPI"],
  },
  {
    label: "Frontend",
    items: ["React", "Vue", "Next.js"],
  },
  {
    label: "Databases",
    items: ["PostgreSQL", "Redis", "MongoDB"],
  },
  {
    label: "Tools",
    items: ["Docker", "AWS", "Linux"],
  },
];
