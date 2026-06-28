import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { PROJECTS, getProject } from "@/data/projects";
import { getProjectStory } from "@/app/lib/project-story";
import { MDXComponents } from "@/components/mdx/MDXComponents";
import { PageShell } from "@/components/site/PageShell";
import { TagRow, ActionLink } from "@/components/content/ui";
import { GitHubIcon, AppStoreIcon } from "@/components/content/tagIcons";
import { MorphImage } from "@/components/content/MorphImage";
import { ArticleTocMount } from "@/components/content/ArticleTocMount";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} - Edmond Ndanji`,
    description: project.blurb,
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const storySource = getProjectStory(project.id);
  const { content } = storySource
    ? await compileMDX({
        source: storySource,
        options: { parseFrontmatter: false },
        components: MDXComponents,
      })
    : { content: null };

  return (
    <PageShell>
      <Link
        href="/projects"
        prefetch={false}
        className="mono text-sm no-underline transition-opacity hover:opacity-70"
        style={{ color: "var(--muted)" }}
      >
        ← projects/
      </Link>

      {/* Banner image up top (Twitter-article style). Carries the shared
          view-transition name so it can morph from the card on navigation. */}
      {project.image ? (
        <div className="project-banner mt-4">
          <MorphImage
            morphKey={`project-img-${project.id}`}
            src={project.image}
            sizes="(min-width: 768px) 720px, 100vw"
            priority
            kind="banner"
          />
        </div>
      ) : null}

      <div className={project.image ? "mt-6" : "mt-4"}>
        <span
          className="mono text-xs px-2 py-0.5 rounded-full"
          style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          {project.kind}
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

      {content ? (
        <>
          <ArticleTocMount />
          <div className="prose-content mt-10">{content}</div>
        </>
      ) : (
        <p className="mt-8 text-lg leading-relaxed" style={{ color: "var(--text)" }}>
          {project.detail}
        </p>
      )}
    </PageShell>
  );
}
