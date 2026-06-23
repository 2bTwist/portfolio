import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { SKILLS } from "@/data/skills";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Prose, Body } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "About — Edmond Ndanji",
  description: profile.blurb,
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader filename="about.md" title="About" />
      <Prose>
        <Body>{profile.blurb}</Body>
        <Body>
          When I am not coding I am usually pulling apart a new tool, or thinking about product and
          the small interaction details that make software feel good to touch.
        </Body>
      </Prose>

      <section className="mt-10">
        <h2 className="mono text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
          Skills
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {SKILLS.map((group) => (
            <div key={group.label}>
              <p className="mono text-sm mb-2" style={{ color: "var(--muted)" }}>
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="mono text-xs px-2 py-1 rounded-md"
                    style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
