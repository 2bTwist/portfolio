import type { Metadata } from "next";
import { EXPERIENCE } from "@/data/experience";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "Experience — Edmond Ndanji",
  description: "Work history: full-stack and mobile engineering.",
};

export default function ExperiencePage() {
  return (
    <PageShell>
      <PageHeader filename="experience.md" title="Experience" />
      <ol className="space-y-8">
        {EXPERIENCE.map((entry, i) => (
          <li key={i} className="relative pl-5" style={{ borderLeft: "2px solid var(--border)" }}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="mono text-lg font-semibold" style={{ color: "var(--text)" }}>
                {entry.role}
                {entry.org ? <span style={{ color: "var(--muted)" }}> · {entry.org}</span> : null}
              </h2>
              <span className="mono text-sm shrink-0" style={{ color: "var(--muted)" }}>
                {entry.period}
              </span>
            </div>
            <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
              {entry.summary}
            </p>
            {entry.highlights ? (
              <ul className="mt-2 space-y-1 list-disc list-inside" style={{ color: "var(--muted)" }}>
                {entry.highlights.map((h) => (
                  <li key={h} className="leading-relaxed">
                    {h}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
