import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-5xl mb-16"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        BLOG
      </h1>

      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No blog posts yet. Check back soon!
        </p>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <h2 className="text-3xl font-semibold group-hover:opacity-70">
                {post.title}
              </h2>

              <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                {post.summary}
              </p>

              <p className="text-sm text-zinc-400 mt-1">
                {post.date}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
