import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/app/lib/posts";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "Writing - Edmond Ndanji",
  description: "Notes on software engineering, product, and building in public.",
};

function PostList({ posts }: { posts: ReturnType<typeof getAllPosts> }) {
  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <Link key={post.slug} href={`/writing/${post.slug}`} prefetch={false} className="block group no-underline">
          <h2 className="display text-2xl font-semibold transition-opacity group-hover:opacity-70" style={{ color: "var(--text)" }}>
            {post.title}
          </h2>
          <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
            {post.summary}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="mono text-xs" style={{ color: "var(--muted)" }}>
              {post.date}
            </span>
            {post.tags.map((tag) => (
              <span key={tag} className="mono text-xs" style={{ color: "var(--accent)" }}>
                #{tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function WritingPage() {
  const posts = getAllPosts();
  return (
    <PageShell>
      <PageHeader title="Writing" lead="Notes from building things, in public." />
      {posts.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No posts yet. Check back soon.</p>
      ) : (
        <PostList posts={posts} />
      )}
    </PageShell>
  );
}
