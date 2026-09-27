/* The page catalogue (see CONTEXT.md): every public page, from the declared
   top-level pages plus the projects, posts and tags they expand into. Every
   route list is a view of this. Server-only: posts are read from the
   filesystem, so importing this from a client module fails the build. */

import { postLabel, tagLabel } from "@/data/pages";
import { getAllPosts, getAllTags } from "@/app/lib/posts";
import { STATIC_ENTRIES, type CatalogueEntry } from "@/app/lib/catalogue-view";

export type { CatalogueEntry };

/* Posts and tags: the entries only the server can read. The root layout hands
   these to the browser's catalogue view. */
export function getContentEntries(): CatalogueEntry[] {
  return [
    ...getAllPosts().map((p) => ({
      href: `/blog/${p.slug}`,
      label: postLabel(p.slug),
      kind: "post" as const,
      listed: false,
      indexable: true,
      date: p.date,
    })),
    ...getAllTags().map((t) => ({
      href: `/blog/tag/${t}`,
      label: tagLabel(t),
      kind: "tag" as const,
      listed: false,
      indexable: false,
    })),
  ];
}

export function getCatalogue(): CatalogueEntry[] {
  return [...STATIC_ENTRIES, ...getContentEntries()];
}
