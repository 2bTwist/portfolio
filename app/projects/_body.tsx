import { PROJECTS } from "@/data/projects";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader } from "@/components/content/ui";
import { ProjectCard } from "@/components/content/ProjectCard";

export function ProjectsBody() {
  const web = PROJECTS.filter((p) => p.kind === "web");
  const mobile = PROJECTS.filter((p) => p.kind === "mobile");
  return (
    <PageShell>
      <PageHeader
        title="Projects"
        lead="Things I have built, split by where they run."
      />
      {[
        { label: "Web", items: web },
        { label: "Mobile", items: mobile },
      ]
        .filter((group) => group.items.length > 0)
        .map((group) => (
        <section key={group.label} className="mt-8">
          <h2 className="mono text-sm uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
            {group.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
