import type { Metadata } from "next";
import { getAllPosts } from "@/app/lib/posts";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader } from "@/components/content/ui";
import { PostCard } from "@/components/content/PostCard";

export const metadata: Metadata = {
  title: "Blog - Edmond Ndanji",
  description: "Notes on software engineering, product, and building in public.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <PageShell>
      <PageHeader title="Blog" lead="Notes from building things, in public." />
      {posts.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No posts yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
