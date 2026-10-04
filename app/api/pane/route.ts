/* On-demand content for split panes. Serializes a blog post or project story's
   MDX on the server (next-mdx-remote/serialize, no react-dom/server) so a client
   pane can render it with <MDXRemote> and the real MDX components. Node runtime
   (serialize + fs-based loaders need it). */

import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import type { PostMetadata } from "@/app/lib/posts";
import { getPost } from "@/app/lib/posts";
import { getProject } from "@/data/projects";
import { getProjectStory } from "@/app/lib/project-story";

export const runtime = "nodejs";

/* What a split pane needs to render the same document as the route: the post's
   metadata (its header) or the project's id (the client has project data), plus
   the serialized body; a project without a story renders its `detail` text. */
export type PaneDocument =
  | { kind: "post"; post: PostMetadata; mdx: MDXRemoteSerializeResult }
  | { kind: "project"; id: string; mdx: MDXRemoteSerializeResult | null };

// Match the routes' compileMDX call (parseFrontmatter: false); content is already
// frontmatter-stripped by the fs loaders.
function mdx(source: string) {
  return serialize(source, { parseFrontmatter: false });
}

export async function GET(req: Request) {
  const href = new URL(req.url).searchParams.get("href") ?? "";
  const blog = href.match(/^\/blog\/([^/]+)$/);
  const proj = href.match(/^\/projects\/([^/]+)$/);

  try {
    if (blog) {
      const post = getPost(blog[1]);
      if (!post) return Response.json({ error: "not found" }, { status: 404 });
      const { title, date, summary, slug, tags, image } = post;
      const doc: PaneDocument = {
        kind: "post",
        post: { title, date, summary, slug, tags, image },
        mdx: await mdx(post.content),
      };
      return Response.json(doc);
    }
    if (proj) {
      const project = getProject(proj[1]);
      if (!project) return Response.json({ error: "not found" }, { status: 404 });
      const story = getProjectStory(project.id);
      const doc: PaneDocument = { kind: "project", id: project.id, mdx: story ? await mdx(story) : null };
      return Response.json(doc);
    }
    return Response.json({ error: "unsupported href" }, { status: 400 });
  } catch {
    return Response.json({ error: "render failed" }, { status: 500 });
  }
}
