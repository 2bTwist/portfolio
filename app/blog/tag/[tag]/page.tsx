import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function TagPage({ params }: { params: { tag: string } }) {
  const posts = getAllPosts().filter((p) => p.tags?.includes(params.tag));

  return (
    <div className="max-w-4xl mx-auto">
      <h1
        className="text-5xl mb-16"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        Posts tagged: #{params.tag}
      </h1>

      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No posts found with this tag.
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

              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-zinc-400">{post.date}</p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
