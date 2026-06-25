/* Project card linking to the real /projects/[slug] route. Server component. */

import Link from "next/link";
import type { Project } from "@/data/projects";
import { TagRow } from "./ui";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl p-5 no-underline transition-opacity hover:opacity-90"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="mono text-lg font-semibold" style={{ color: "var(--text)" }}>
          {project.title}
        </h3>
        <span
          className="mono text-xs capitalize px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          {project.kind}
        </span>
      </div>
      <p className="leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
        {project.blurb}
      </p>
      <TagRow tags={project.tags} />
    </Link>
  );
}
