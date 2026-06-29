import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getAllTags } from "@/app/lib/posts";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader } from "@/components/content/ui";

type Params = { params: Promise<{ tag: string }> };

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} - Writing`,
    description: `Posts tagged #${tag}.`,
    alternates: { canonical: `/writing/tag/${tag}` },
  };
}

export default async function TagPage({ params }: Params) {
  const { tag } = await params;
  const posts = getAllPosts().filter((p) => p.tags.includes(tag));

  return (
    <PageShell>
      <PageHeader title={`#${tag}`} />
      {posts.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No posts with this tag.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/writing/${post.slug}`} prefetch={false} className="block group no-underline">
              <h2 className="display text-2xl font-semibold transition-opacity group-hover:opacity-70" style={{ color: "var(--text)" }}>
                {post.title}
              </h2>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
                {post.summary}
              </p>
              <span className="mono text-xs mt-2 inline-block" style={{ color: "var(--muted)" }}>
                {post.date}
              </span>
            </Link>
          ))}
        </div>
      )}
      <Link href="/writing" prefetch={false} className="mono text-sm no-underline mt-12 inline-block transition-opacity hover:opacity-70" style={{ color: "var(--accent)" }}>
        ← all writing
      </Link>
    </PageShell>
  );
}
