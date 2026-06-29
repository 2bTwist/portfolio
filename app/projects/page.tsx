import type { Metadata } from "next";
import { ProjectsBody } from "./_body";

export const metadata: Metadata = {
  title: "Projects - Edmond Ndanji",
  description: "Web and mobile projects: the problem, my role, the tech, and the full build story.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <ProjectsBody />;
}
