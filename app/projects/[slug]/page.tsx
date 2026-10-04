import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { PROJECTS, getProject } from "@/data/projects";
import { getProjectStory } from "@/app/lib/project-story";
import { MDXComponents } from "@/components/mdx/MDXComponents";
import { PageShell } from "@/components/site/PageShell";
import { ProjectHeader } from "@/components/content/ArticleHeaders";
import { CogitoPreview } from "@/components/content/CogitoPreview";
import { MorphImage } from "@/components/content/MorphImage";
import { ArticleTocMount } from "@/components/content/ArticleTocMount";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/app/lib/site";

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
    alternates: { canonical: `/projects/${project.id}` },
    openGraph: { title: project.title, description: project.blurb, type: "article" },
    twitter: { card: "summary_large_image", title: project.title, description: project.blurb },
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

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` },
      { "@type": "ListItem", position: 3, name: project.title, item: `${SITE_URL}/projects/${project.id}` },
    ],
  };

  return (
    <PageShell>
      <JsonLd data={breadcrumb} />
      <ProjectHeader
        project={project}
        banner={(src) =>
          project.preview === "cogito" ? (
            <CogitoPreview replayControl />
          ) : (
            <MorphImage
              morphKey={`project-img-${project.id}`}
              src={src}
              alt={project.title}
              sizes="(min-width: 768px) 720px, 100vw"
              priority
              kind="banner"
            />
          )
        }
      />

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
