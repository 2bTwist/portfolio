export type ProjectStatus = "private" | "in-progress" | "shipped";

export interface ProjectItem {
  title: string;
  summary: string;
  tech: string[];
  status: ProjectStatus;
  externalUrl?: string;
  githubUrl?: string;
  thumbnail?: string;
}

export const projects: ProjectItem[] = [
  {
    title: "Chally",
    summary: "Challenge-based habit tracker where friends compete.",
    tech: [],
    status: "in-progress",
  },
  {
    title: "MCP Server Dashboard",
    summary: "FastAPI backend with Vue.js dashboard for internal tools.",
    tech: ["FastAPI", "Vue.js", "CI/CD"],
    status: "shipped",
    externalUrl: "#",
  },
];
