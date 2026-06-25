import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { profile } from "@/data/profile";
import { PROJECTS } from "@/data/projects";
import { PageShell } from "@/components/site/PageShell";
import { ActionLink } from "@/components/content/ui";
import { ProjectCard } from "@/components/content/ProjectCard";
import { SocialLinks } from "@/components/site/SocialLinks";
import { LocalTime } from "@/components/site/LocalTime";
import { MoreAboutMe } from "@/components/site/MoreAboutMe";

export const metadata: Metadata = {
  title: "Edmond Ndanji - Full-stack & mobile engineer",
  description: profile.tagline,
};

export default function HomePage() {
  const featured = PROJECTS.filter((p) => p.featured);
  return (
    <PageShell width="wide">
      <header className="hero">
        <div className="hero-copy">
          <h1 className="display text-5xl sm:text-6xl font-bold" style={{ color: "var(--text)" }}>
            {profile.name}
          </h1>
          <p className="mono mt-2" style={{ color: "var(--accent)" }}>
            {profile.role}
          </p>
          <LocalTime className="mt-3" />

          <p className="hero-blurb mt-6 leading-relaxed" style={{ color: "var(--text)" }}>
            {profile.blurb}
          </p>

          {/* Socials on their own left-aligned line so they never push the
              primary action; fixed-size tactile buttons. */}
          <SocialLinks className="mt-6" />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ActionLink href={profile.links.resume}>Resume</ActionLink>
          </div>

          <MoreAboutMe />
        </div>

        <div className="hero-mascot-wrap">
          <Image
            className="hero-mascot"
            src="/images/mascot.png"
            alt="Edmond's pixel-art mascot: a cheerful developer holding a glowing laptop and phone"
            width={380}
            height={380}
            priority
          />
        </div>
      </header>

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
