import { experience } from "@/data/experience";

export function ExperienceSection() {
  return (
    <section className="mt-32">
      <h2
        className="text-2xl sm:text-3xl mb-10"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        EXPERIENCE
      </h2>

      {experience.map((item) => (
        <div key={item.company} className="mb-12">
          {item.roles.map((role) => (
            <div
              key={role.title}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-zinc-700 dark:text-zinc-300"
            >
              {/* Left side */}
              <div className="md:col-span-2 space-y-2">
                <p className="font-semibold text-base sm:text-lg">
                  {role.title}, {item.company}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {role.description}
                </p>
              </div>

              {/* Date */}
              <div className="flex md:justify-end text-base sm:text-lg">
                {role.dateRange}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
