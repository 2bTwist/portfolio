import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPERIENCE } from "@/data/experience";
import { PageShell } from "@/components/site/PageShell";

/* Blog-style "read more" story for a single experience. This is the scaffold:
   the org header + the prose I already have. The fuller illustrated write-up
   (drawings, what actually happened) gets layered in here next. */

function entryForSlug(slug: string) {
  return EXPERIENCE.find((e) => e.story === `/experience/${slug}`);
}

export function generateStaticParams() {
  return EXPERIENCE.filter((e) => e.story).map((e) => ({
    slug: e.story!.replace("/experience/", ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = entryForSlug(slug);
  if (!entry) return { title: "Experience - Edmond Ndanji" };
  return {
    title: `${entry.org} - Edmond Ndanji`,
    description: `What I worked on at ${entry.org}.`,
  };
}

export default async function ExperienceStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = entryForSlug(slug);
  if (!entry) notFound();

  return (
    <PageShell>
      <Link href="/experience" prefetch={false} className="xp-back mono">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="M11 18l-6-6 6-6" />
        </svg>
        Experience
      </Link>

      <header className="xp-story-head">
        {entry.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- inline brand mark, sized by CSS
          <img className={`xp-story-logo ${entry.logoClass ?? ""}`} src={entry.logo} alt={entry.org} />
        ) : null}
        <div>
          <h1 className="display text-3xl sm:text-4xl font-bold" style={{ color: "var(--text)" }}>
            {entry.org}
          </h1>
          {entry.location ? <p className="mono xp-loc mt-1">{entry.location}</p> : null}
        </div>
      </header>

      {entry.roles.map((role) => (
        <section key={role.period} className="xp-story-role">
          <div className="xp-role-head">
            <span className="xp-title">{role.title}</span>
            <span className="xp-period mono">{role.period}</span>
          </div>
          <p className="xp-summary">{role.summary}</p>
        </section>
      ))}

      <p className="xp-story-note mono">The fuller story, with drawings, is on its way.</p>
    </PageShell>
  );
}
