import type { Metadata } from "next";
import Link from "next/link";
import { EXPERIENCE, LEADERSHIP } from "@/data/experience";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Experience - Edmond Ndanji",
  description: "Software engineering at Cisco, a CS degree at UMBC, and community roles.",
};

export default function ExperiencePage() {
  return (
    <PageShell>
      <h1 className="display text-4xl sm:text-5xl font-bold mb-8" style={{ color: "var(--text)" }}>
        Experience
      </h1>

      <ol className="xp-timeline">
        {EXPERIENCE.map((entry) => (
          <li key={entry.org} className="xp-entry">
            <div className="xp-node">
              {entry.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- inline brand mark, sized by CSS
                <img className={`xp-logo ${entry.logoClass ?? ""}`} src={entry.logo} alt={entry.org} loading="lazy" decoding="async" />
              ) : (
                <span className="xp-monogram mono" aria-hidden="true">
                  {entry.org.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="xp-content">
              <div className="xp-org-row">
                {entry.url ? (
                  <a className="xp-org" href={entry.url} target="_blank" rel="noreferrer noopener">
                    {entry.org}
                  </a>
                ) : (
                  <span className="xp-org">{entry.org}</span>
                )}
                {entry.location ? <span className="xp-loc mono">{entry.location}</span> : null}
              </div>
              {entry.roles.map((role) => (
                <div key={role.period} className="xp-role">
                  <div className="xp-role-head">
                    <span className="xp-title">{role.title}</span>
                    <span className="xp-period mono">{role.period}</span>
                  </div>
                  <p className="xp-summary">{role.summary}</p>
                </div>
              ))}
              {entry.storyHref ? (
                <Link href={entry.storyHref} prefetch={false} className="xp-readmore mono">
                  Read the story
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : null}
            </div>
          </li>
        ))}

      </ol>

      <section className="xp-community">
        <h2 className="xp-community-h mono">Leadership &amp; community</h2>
        <ul className="xp-activities">
          {LEADERSHIP.map((a) => (
            <li key={a.role + (a.org ?? "")} className="xp-activity">
              <span className="xp-activity-icon" aria-hidden="true">
                {a.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- inline brand mark, sized by CSS
                  <img className="xp-activity-logo" src={a.logo} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="xp-activity-mono mono">{(a.org ?? a.role).slice(0, 1)}</span>
                )}
              </span>
              <span className="xp-activity-text">
                <span className="xp-activity-role">{a.role}</span>
                {a.org ? (
                  <span className="xp-activity-org">
                    {" · "}
                    {a.url ? (
                      <a className="xp-activity-link" href={a.url} target="_blank" rel="noreferrer noopener">
                        {a.org}
                      </a>
                    ) : (
                      a.org
                    )}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
