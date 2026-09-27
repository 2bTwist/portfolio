/* The page catalogue (see CONTEXT.md): every public page, from the declared
   top-level pages plus the projects, posts and tags they expand into. Every
   route list is a view of this. Server-only: posts are read from the
   filesystem, so importing this from a client module fails the build. */

import { PAGES, postLabel, projectLabel, tagLabel } from "@/data/pages";
import { PROJECTS } from "@/data/projects";
import { getAllPosts, getAllTags } from "@/app/lib/posts";

export type CatalogueEntry = {
  href: string;
  label: string;
  kind: "page" | "project" | "post" | "tag";
  indexable: boolean;
  /* Publish date, for posts. */
  date?: string;
};

export function getCatalogue(): CatalogueEntry[] {
  const posts = getAllPosts();
  return [
    ...PAGES.map((p) => ({ href: p.href, label: p.label, kind: "page" as const, indexable: !("noindex" in p) })),
    ...PROJECTS.map((p) => ({ href: `/projects/${p.id}`, label: projectLabel(p), kind: "project" as const, indexable: true })),
    ...posts.map((p) => ({ href: `/blog/${p.slug}`, label: postLabel(p.slug), kind: "post" as const, indexable: true, date: p.date })),
    ...getAllTags().map((t) => ({ href: `/blog/tag/${t}`, label: tagLabel(t), kind: "tag" as const, indexable: false })),
  ];
}
