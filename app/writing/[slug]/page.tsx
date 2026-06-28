import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { getAllPosts, getPost } from "@/app/lib/posts";
import { MDXComponents } from "@/components/mdx/MDXComponents";
import { ReadingProgress } from "@/components/mdx/ReadingProgress";
import { ArticleTocMount } from "@/components/content/ArticleTocMount";
import { MorphImage } from "@/components/content/MorphImage";
import { JsonLd } from "@/components/site/JsonLd";
import { PageShell } from "@/components/site/PageShell";
import { SITE_URL } from "@/app/lib/site";
import { profile } from "@/data/profile";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.title} - Edmond Ndanji`,
    description: post.summary,
    alternates: { canonical: `/writing/${slug}` },
    openGraph: { title: post.title, description: post.summary, type: "article" },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary },
  };
}

export default async function WritingPost({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { content } = await compileMDX({
    source: post.content,
    options: { parseFrontmatter: false },
    components: MDXComponents,
  });

  const posts = getAllPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  const prev = i < posts.length - 1 ? posts[i + 1] : null; // older
  const next = i > 0 ? posts[i - 1] : null; // newer

  const url = `${SITE_URL}/writing/${slug}`;
  const published = new Date(post.date).toISOString();
  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: published,
    dateModified: published,
    author: { "@type": "Person", name: profile.name, url: SITE_URL },
    image: post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/opengraph-image`,
    url,
    mainEntityOfPage: url,
    keywords: post.tags.join(", "),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Writing", item: `${SITE_URL}/writing` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={blogPosting} />
      <JsonLd data={breadcrumb} />
      <ReadingProgress />
      <PageShell>
        <Link
          href="/writing"
          prefetch={false}
          className="mono text-sm no-underline transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          ← writing/
        </Link>

        {/* Banner up top (Twitter-article style). Carries the shared
            view-transition name so it morphs from the index card on nav. */}
        {post.image ? (
          <div className="project-banner mt-4">
            <MorphImage
              morphKey={`post-img-${post.slug}`}
              src={post.image}
              sizes="(min-width: 768px) 720px, 100vw"
              priority
              kind="banner"
            />
          </div>
        ) : null}

        <h1
          className={`display text-3xl sm:text-4xl font-bold ${post.image ? "mt-6" : "mt-4"}`}
          style={{ color: "var(--text)" }}
        >
          {post.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="mono text-xs" style={{ color: "var(--muted)" }}>
            {post.date}
          </span>
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/writing/tag/${tag}`}
              prefetch={false}
              className="mono text-xs no-underline transition-opacity hover:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              #{tag}
            </Link>
          ))}
        </div>

        <ArticleTocMount />
        <div className="prose-content mt-10">{content}</div>

        <nav className="mt-16 pt-8 flex flex-col gap-4 sm:flex-row sm:justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="sm:flex-1">
            {prev ? (
              <Link href={`/writing/${prev.slug}`} prefetch={false} className="no-underline transition-opacity hover:opacity-70">
                <div className="mono text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                  Previous
                </div>
                <div className="font-medium" style={{ color: "var(--text)" }}>
                  ← {prev.title}
                </div>
              </Link>
            ) : null}
          </div>
          <div className="sm:flex-1 sm:text-right">
            {next ? (
              <Link href={`/writing/${next.slug}`} prefetch={false} className="no-underline transition-opacity hover:opacity-70">
                <div className="mono text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                  Next
                </div>
                <div className="font-medium" style={{ color: "var(--text)" }}>
                  {next.title} →
                </div>
              </Link>
            ) : null}
          </div>
        </nav>
      </PageShell>
    </>
  );
}
