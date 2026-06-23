/* Blog data layer (Phase 4). Reads MDX files from content/blog at build time
   (server-only: uses fs). Lives alongside nav.ts / palette.ts. NOTE: never
   import this from a client module — fs is server-only. The client search index
   gets post data over the wire via /search-index.json instead. */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content/blog");

export interface PostMetadata {
  title: string;
  date: string;
  summary: string;
  slug: string;
  tags: string[];
}

export interface Post extends PostMetadata {
  content: string;
}

function readPost(filename: string): Post {
  const slug = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    title: data.title,
    date: data.date,
    summary: data.summary,
    slug,
    tags: data.tags ?? [],
    content,
  };
}

function postFiles(): string[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

export function getAllPosts(): PostMetadata[] {
  return getAllPostsWithContent().map((p) => ({
    title: p.title,
    date: p.date,
    summary: p.summary,
    slug: p.slug,
    tags: p.tags,
  }));
}

/* Full posts incl. body — used by the search-index route and RSS, never shipped
   to the client directly. */
export function getAllPostsWithContent(): Post[] {
  return postFiles()
    .map(readPost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | null {
  const filename = postFiles().find((f) => f.replace(/\.mdx?$/, "") === slug);
  return filename ? readPost(filename) : null;
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) post.tags.forEach((t) => tags.add(t));
  return [...tags].sort();
}
