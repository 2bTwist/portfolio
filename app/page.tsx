import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/data/profile";
import { PROJECTS } from "@/data/projects";
import { PageShell } from "@/components/site/PageShell";
import { ActionLink } from "@/components/content/ui";
import { ProjectCard } from "@/components/content/ProjectCard";

export const metadata: Metadata = {
  title: "Edmond Ndanji — Full-stack & mobile engineer",
  description: profile.tagline,
};

export default function HomePage() {
  const featured = PROJECTS.filter((p) => p.featured);
  return (
    <PageShell>
      <p className="mono text-sm mb-2" style={{ color: "var(--muted)" }}>
        README.md
      </p>
      <h1 className="mono text-4xl sm:text-5xl font-bold" style={{ color: "var(--text)" }}>
        {profile.name}
      </h1>
      <p className="mono mt-2" style={{ color: "var(--accent)" }}>
        {profile.role}
      </p>
      <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--text)" }}>
        {profile.tagline}
      </p>
      <p className="mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>
        This site is a filesystem. Browse from the explorer, or read it as a plain page — every
        section is a real link.
      </p>

      <div className="mt-7 flex flex-wrap gap-4">
        <ActionLink href={profile.links.resume}>Resume</ActionLink>
        <ActionLink href={profile.links.github} variant="ghost">
          GitHub
        </ActionLink>
      </div>

      <section className="mt-14">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="mono text-xl font-semibold" style={{ color: "var(--text)" }}>
            Featured work
          </h2>
          <Link href="/projects" className="mono text-sm no-underline hover:opacity-80" style={{ color: "var(--muted)" }}>
            all projects →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
