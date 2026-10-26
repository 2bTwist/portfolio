import { getAllPosts, getPost } from "@/app/lib/posts";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/app/lib/og";

/* Per-post social card (1200x630). Prerendered at build for every post. */

/* Next takes only a static alt here; a per-post one needs generateImageMetadata,
   which moves the card to a new URL. */
export const alt = "Edmond Ndanji blog post card: the post's title and summary in an editor tab";
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
      tab: "blog/",
      eyebrow: "BLOG",
      title: "Edmond Ndanji",
      summary: "Notes on building software.",
    });
  }
  return renderOgCard({
    tab: `${slug}.mdx`,
    eyebrow: "BLOG",
    title: post.title,
    summary: post.summary,
    art: post.image,
  });
}
