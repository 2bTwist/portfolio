import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, getProject } from "@/data/projects";
import { PageShell } from "@/components/site/PageShell";
import { TagRow, ActionLink } from "@/components/content/ui";

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

  return (
    <PageShell>
      <div className="mb-3">
        <span
          className="mono text-xs px-2 py-0.5 rounded-full"
          style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          {project.kind}
        </span>
      </div>

      <h1 className="mono text-3xl sm:text-4xl font-bold" style={{ color: "var(--text)" }}>
        {project.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text)" }}>
        {project.detail}
      </p>

      <div className="mt-6">
        <TagRow tags={project.tags} />
      </div>

      {(project.links?.live || project.links?.repo) && (
        <div className="mt-7 flex flex-wrap gap-4">
          {project.links?.live ? <ActionLink href={project.links.live}>View live</ActionLink> : null}
          {project.links?.repo ? (
            <ActionLink href={project.links.repo} variant="ghost">
              Source
            </ActionLink>
          ) : null}
        </div>
      )}

      {/* Per-project interactive demo slot (Appetize / Expo Snack), filled
          project by project. Reserved layout region so it drops in cleanly. */}
      {project.demo ? (
        <section
          className="mt-10 rounded-xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          aria-label="Interactive demo"
        >
          <p className="mono text-sm" style={{ color: "var(--muted)" }}>
            Demo loads here.
          </p>
        </section>
      ) : null}
    </PageShell>
  );
}
