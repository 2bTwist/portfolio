import { projects } from "@/data/projects";
import { ExternalLink } from "lucide-react";

export function ProjectsSection() {
  return (
    <section id="projects" className="mt-32 mb-32">
      <h2
        className="text-3xl sm:text-4xl mb-16"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        PROJECTS
      </h2>

      {projects.map((project) => (
        <div key={project.title} className="mb-20">
          <div className="flex items-center justify-between">
            <h3
              className="text-2xl sm:text-3xl"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              {project.title}
            </h3>

            {project.externalUrl && (
              <a
                href={project.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:opacity-70"
                aria-label="External Link"
              >
                <ExternalLink size={22} />
              </a>
            )}
          </div>

          <p className="mt-2 text-zinc-700 dark:text-zinc-300 text-base sm:text-lg">
            {project.summary}
          </p>

          {/* Extra info or tech stack */}
          {project.tech.length > 0 && (
            <p className="mt-1 text-zinc-400 dark:text-zinc-500 text-sm">
              {project.tech.join(", ")}
            </p>
          )}

          {/* Status (Private/Shipped/In-progress) */}
          {project.status === "private" && (
            <p className="mt-1 text-zinc-400 dark:text-zinc-500 text-sm">
              Private project
            </p>
          )}
          {project.status === "in-progress" && (
            <p className="mt-1 text-zinc-400 dark:text-zinc-500 text-sm">
              Currently building…
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
