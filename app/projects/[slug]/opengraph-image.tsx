import { PROJECTS, getProject } from "@/data/projects";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/lib/og";

/* Per-project social card (1200x630). Prerendered at build for every project. */

/* Next takes only a static alt here; a per-project one needs generateImageMetadata,
   which moves the card to a new URL. */
export const alt = "Edmond Ndanji project card: the project's title and summary in an editor tab";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }));
}

export default async function ProjectOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) {
    return renderOgCard({
      tab: "projects/",
      eyebrow: "PROJECT",
      title: "Edmond Ndanji",
      summary: "Things I have built.",
    });
  }
  return renderOgCard({
    tab: slug,
    eyebrow: `${project.kind.toUpperCase()} PROJECT`,
    title: project.title,
    summary: project.blurb,
  });
}
