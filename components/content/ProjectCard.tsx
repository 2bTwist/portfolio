/* Project preview card (Twitter/article style) linking to /projects/[slug]:
   an on-brand image on top, then title, a one-line description, and tags. Server
   component. Until a project's `image` is set, a tinted placeholder stands in. */

import Link from "next/link";
import type { Project } from "@/data/projects";
import { MorphImage } from "./MorphImage";
import { TagIcon } from "./tagIcons";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} prefetch={false} className="proj-card">
      {/* The lift-on-hover lives on this inner wrapper, not the <a>, so the
          hover hit-area never moves — otherwise the edge slips out from under
          the cursor and flickers up/down. */}
      <div className="proj-card-inner">
        <div className="proj-card-media">
          {project.image ? (
            <MorphImage
              morphKey={`project-img-${project.id}`}
              className="proj-card-img"
              src={project.image}
              sizes="(min-width: 640px) 50vw, 100vw"
              role="card"
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
          {/* Tags pinned to the bottom (margin-top:auto) so the row sits at the
              same height across cards regardless of description length. */}
          <div className="proj-tags">
            {project.tags.map((t) => (
              <span key={t} className="proj-tag mono">
                <TagIcon name={t} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
