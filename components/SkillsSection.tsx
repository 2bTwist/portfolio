import { skillGroups } from "@/data/skills";

export function SkillsSection() {
  return (
    <section className="mt-32">
      <h2
        className="text-2xl sm:text-3xl mb-10"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        SKILLS
      </h2>

      <div className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 space-y-6">
        {skillGroups.map((group) => (
          <p key={group.label}>
            <strong>{group.label}:</strong> {group.items.join(", ")}
          </p>
        ))}
      </div>
    </section>
  );
}
