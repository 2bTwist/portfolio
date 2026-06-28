/* Blog preview card (Twitter/article style) linking to /writing/[slug]: an
   on-brand banner on top, then title, summary, date, and tags. Shares the
   project-card styling so the two surfaces read as one language. Server
   component. The banner carries a `view-transition-name` so it morphs into the
   post-page banner on navigation. Until a post's `image` is set, a tinted
   placeholder stands in. */

import Link from "next/link";
import type { PostMetadata } from "@/app/lib/posts";
import { MorphImage } from "./MorphImage";

export function PostCard({ post }: { post: PostMetadata }) {
  return (
    <Link href={`/writing/${post.slug}`} prefetch={false} className="proj-card">
      <div className="proj-card-inner">
        <div className="proj-card-media">
          {post.image ? (
            <MorphImage
              morphKey={`post-img-${post.slug}`}
              className="proj-card-img"
              src={post.image}
              sizes="(min-width: 640px) 50vw, 100vw"
              kind="card"
            />
          ) : (
            <span className="proj-card-ph mono" aria-hidden="true">
              {post.title.toLowerCase()}
            </span>
          )}
        </div>
        <div className="proj-card-body">
          <div className="proj-card-top">
            <h2 className="proj-card-title">{post.title}</h2>
            <span className="proj-card-kind mono">{post.date}</span>
          </div>
          <p className="proj-card-desc">{post.summary}</p>
          {/* Tags pinned to the bottom so the row aligns across cards. Plain
              accent hashes (lighter than the project tech-stack pills). */}
          <div className="proj-tags">
            {post.tags.map((t) => (
              <span key={t} className="mono text-xs" style={{ color: "var(--accent)" }}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
