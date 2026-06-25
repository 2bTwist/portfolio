/* Project preview card (Twitter/article style) linking to /projects/[slug]:
   an on-brand image on top, then title, a one-line description, and tags. Server
   component. Until a project's `image` is set, a tinted placeholder stands in. */

import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/data/projects";
import { TagRow } from "./ui";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="proj-card">
      <div className="proj-card-media">
        {project.image ? (
          <Image
            className="proj-card-img"
            src={project.image}
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <span className="proj-card-ph mono" aria-hidden="true">
            {project.title.toLowerCase()}
          </span>
        )}
      </div>
      <div className="proj-card-body">
        <div className="proj-card-top">
          <h3 className="proj-card-title">{project.title}</h3>
          <span className="proj-card-kind mono">{project.kind}</span>
        </div>
        <p className="proj-card-desc">{project.blurb}</p>
        <TagRow tags={project.tags} />
      </div>
    </Link>
  );
}
