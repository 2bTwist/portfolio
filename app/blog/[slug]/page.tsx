import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { MDXComponents } from "@/components/MDXComponents";
import { BlogStats } from "@/components/BlogStats";
import { ReadingProgress } from "@/components/ReadingProgress";
import { getAllPosts } from "@/lib/posts";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { CommentForm } from "@/components/CommentForm";
import { CommentsList } from "@/components/CommentsList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content/blog", `${slug}.mdx`);
  const source = fs.readFileSync(filePath, "utf8");
  const { data } = matter(source);

  return {
    title: data.title,
    description: data.summary,
    openGraph: {
      title: data.title,
      description: data.summary,
      url: `https://eddyb.dev/blog/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.summary,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filePath = path.join(process.cwd(), "content/blog", `${slug}.mdx`);
  const source = fs.readFileSync(filePath, "utf8");

  const { content, data } = matter(source);

  const { content: MDXContent } = await compileMDX({
    source: content,
    options: { parseFrontmatter: false },
    components: MDXComponents,
  });

  // Get prev/next posts
  const posts = getAllPosts();
  const currentIndex = posts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null;

  return (
    <>
      <ReadingProgress />
      <article className="max-w-4xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
        >
          ← Back to Blog
        </Link>

        <h1
          className="text-5xl mb-4 text-center"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          {data.title as string}
        </h1>

        <div className="flex items-center justify-center gap-4 mb-10">
          <p className="text-zinc-500 text-sm">{data.date as string}</p>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <BlogStats slug={slug} />
        </div>

        {/* Tags */}
        {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
          <div className="flex justify-center gap-2 mb-10">
            {data.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/blog/tag/${tag}`}
                className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          {MDXContent}
        </div>

        {/* Prev/Next Navigation */}
        <div className="flex justify-between mt-20 pt-10 border-t border-zinc-200 dark:border-zinc-800 text-sm">
          <div className="flex-1">
            {prevPost && (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <div className="text-xs uppercase tracking-wide mb-1">
                  Previous
                </div>
                <div className="font-medium">← {prevPost.title}</div>
              </Link>
            )}
          </div>

          <div className="flex-1 text-right">
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <div className="text-xs uppercase tracking-wide mb-1">
                  Next
                </div>
                <div className="font-medium">{nextPost.title} →</div>
              </Link>
            )}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="max-w-4xl mx-auto mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-caveat)" }}>
          Comments
        </h2>
        <AuthButton />
        <CommentForm slug={slug} />
        <CommentsList slug={slug} />
      </div>
    </>
  );
}
