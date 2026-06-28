import { getAllPosts, getPost } from "@/app/lib/posts";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/lib/og";

/* Per-post social card (1200x630). Prerendered at build for every post. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return renderOgCard({
      tab: "writing/",
      eyebrow: "WRITING",
      title: "Edmond Ndanji",
      summary: "Notes on building software.",
    });
  }
  return renderOgCard({
    tab: `${slug}.mdx`,
    eyebrow: "WRITING",
    title: post.title,
    summary: post.summary,
  });
}
