import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { profile } from "@/data/profile";
import { PROJECTS } from "@/data/projects";
import { PageShell } from "@/components/site/PageShell";
import { ActionLink } from "@/components/content/ui";
import { ProjectCard } from "@/components/content/ProjectCard";
import { SocialLinks } from "@/components/site/SocialLinks";
import { LocationCard } from "@/components/site/LocationCard";
import { TechStack } from "@/components/site/TechStack";
import { CompanyLink } from "@/components/site/CompanyLink";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Edmond Ndanji - Full-stack & mobile engineer",
  description: profile.tagline,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: SITE_URL,
  jobTitle: "Full-stack & mobile engineer",
  description: profile.tagline,
  sameAs: [profile.links.github, profile.links.linkedin],
};

export default function HomePage() {
  const featured = PROJECTS.filter((p) => p.featured);
  return (
    <PageShell width="wide">
      <script
        type="application/ld+json"
        // Escape `<` so the serialized JSON can never break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }}
      />
      <header className="hero">
        <div className="hero-copy">
          <h1 className="display text-5xl sm:text-6xl font-bold" style={{ color: "var(--text)" }}>
            {profile.name}
          </h1>
          <p className="mono mt-2" style={{ color: "var(--accent)" }}>
            {profile.role}
          </p>

          <div className="hero-blurb mt-6 leading-relaxed" style={{ color: "var(--text)" }}>
            <p>
              Hi, my name is Edmond, and I&apos;m a full-stack &amp; mobile engineer who loves to
              build and talk about great products.
            </p>
            <p className="mt-3">
              I worked as a 2x Software Engineering Intern at{" "}
              <CompanyLink
                name="Cisco"
                href="https://www.cisco.com"
                logo={
                  // eslint-disable-next-line @next/next/no-img-element -- inline brand SVG
                  <img className="company-logo" src="/images/cisco.svg" alt="Cisco" width={88} height={44} />
                }
              />
              , where I built an MCP server that developers on the Finance IT team use for internal
              tooling. I also solo-built{" "}
              <CompanyLink
                name="BeSeen"
                href="https://apps.apple.com/app/id6760330166"
                logo={
                  // eslint-disable-next-line @next/next/no-img-element -- app icon
                  <img className="company-logo company-logo--app" src="/images/beseen.webp" alt="BeSeen" width={56} height={56} />
                }
              />
              , a consumer app for connecting couples, now sitting at 200+ users.
            </p>
            <p className="mt-3">
              Right now I&apos;m balancing finishing my studies with learning the fundamentals and
              philosophy behind building non-invasive, carefully crafted software that{" "}
              <span className="hl-marker">just works</span>.
            </p>
          </div>

          {/* Socials on their own left-aligned line; "more about me" sits in the
              same row, just after the LinkedIn button, then the Resume action. */}
          <SocialLinks className="mt-6">
            <Link href="/about" prefetch={false} className="hero-more mono">
              more about me
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </SocialLinks>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ActionLink href={profile.links.resume}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6M9 17h6" />
              </svg>
              Resume
            </ActionLink>
          </div>
        </div>

        {/* Mascot + location minimap are direct grid children (see `.hero`):
            desktop tucks the map under the mascot in the right column; mobile
            drops the map to the bottom, below the Resume button, so it never
            wedges between the mascot and the name. */}
        <div className="hero-mascot-wrap">
          <Image
            className="hero-mascot"
            src="/images/mascot.webp"
            alt="Edmond's pixel-art mascot: a cheerful developer holding a glowing laptop and phone"
            width={380}
            height={380}
            // Displayed at 240px (mobile) / 330px (desktop) via CSS. Without
            // this, next/image assumed full-width and served an 828w candidate
            // for the LCP image; sizes trims it to the real display width.
            sizes="(min-width: 640px) 330px, 240px"
            priority
          />
        </div>

        <LocationCard className="hero-minimap" />
      </header>

      <section className="mt-14">
        <h2 className="mono text-xl font-semibold mb-5" style={{ color: "var(--text)" }}>
          Tech I reach for
        </h2>
        <TechStack />
      </section>

      <section className="mt-14">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="mono text-xl font-semibold" style={{ color: "var(--text)" }}>
            Featured work
          </h2>
          <Link href="/projects" prefetch={false} className="mono text-sm no-underline hover:opacity-80" style={{ color: "var(--muted)" }}>
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
