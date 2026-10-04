/* The header of a blog post and of a project page, shared by the route and by
   its split pane so both show the same document. The banner is a slot, called
   only when the document has an image: the route passes its shared-element
   image (MorphImage / Cogito), a split pane a plain image, since one morph
   target per key must stay on screen. Server-safe (no "use client"), so the
   routes stay server-rendered. */

import type { ReactNode } from "react";
import Link from "@/components/site/Link";
import type { PostMetadata } from "@/app/lib/posts";
import type { Project } from "@/data/projects";
import { TagRow, ActionLink } from "./ui";
import { GitHubIcon, AppStoreIcon, TagIcon } from "./tagIcons";

export function PostHeader({ post, banner }: { post: PostMetadata; banner: (src: string) => ReactNode }) {
  return (
    <>
      <Link
        href="/blog"
        prefetch={false}
        className="mono text-sm no-underline transition-opacity hover:opacity-70"
        style={{ color: "var(--muted)" }}
      >
        ← blog/
      </Link>
      {post.image ? <div className="project-banner mt-4">{banner(post.image)}</div> : null}
      <h1
        className={`display text-3xl sm:text-4xl font-bold ${post.image ? "mt-6" : "mt-4"}`}
        style={{ color: "var(--text)" }}
      >
        {post.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="mono text-xs" style={{ color: "var(--muted)" }}>
          {post.date}
        </span>
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/blog/tag/${tag}`}
            prefetch={false}
            className="mono text-xs no-underline transition-opacity hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            #{tag}
          </Link>
        ))}
      </div>
    </>
  );
}

export function ProjectHeader({ project, banner }: { project: Project; banner: (src: string) => ReactNode }) {
  return (
    <>
      <Link
        href="/projects"
        prefetch={false}
        className="mono text-sm no-underline transition-opacity hover:opacity-70"
        style={{ color: "var(--muted)" }}
      >
        ← projects/
      </Link>
      {project.image ? <div className="project-banner mt-4">{banner(project.image)}</div> : null}
      <div className={project.image ? "mt-6" : "mt-4"}>
        <span
          className="mono text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
          style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <TagIcon name={project.kind} />
          {project.status ? `${project.kind} · ${project.status}` : project.kind}
        </span>
      </div>
      <h1 className="display text-3xl sm:text-4xl font-bold mt-3" style={{ color: "var(--text)" }}>
        {project.title}
      </h1>
      <p className="mt-3 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
        {project.blurb}
      </p>
      <div className="mt-5">
        <TagRow tags={project.tags} />
      </div>
      {(project.links?.live || project.links?.repo) && (
        <div className="mt-6 flex flex-wrap gap-4">
          {project.links?.live ? (
            <ActionLink
              href={project.links.live}
              icon={project.links.live.includes("apps.apple.com") ? <AppStoreIcon /> : undefined}
            >
              View live
            </ActionLink>
          ) : null}
          {project.links?.repo ? (
            <ActionLink href={project.links.repo} variant="ghost" icon={<GitHubIcon />}>
              Source
            </ActionLink>
          ) : null}
        </div>
      )}
    </>
  );
}
