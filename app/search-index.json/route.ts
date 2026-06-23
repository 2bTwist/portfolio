/* Static search index (Phase 4). Built once at build time and fetched lazily by
   the client (CommandPalette / Terminal) on first search, so post bodies live in
   neither the initial bundle nor any JS chunk — only fetched on demand. */

import { getAllPostsWithContent } from "@/app/lib/posts";

export const dynamic = "force-static";

export type SearchDoc = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  body: string;
};

// Strip MDX/markdown markup so search matches readable text, not syntax.
function toPlainText(mdx: string): string {
  return mdx
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/<[^>]+>/g, " ") // JSX/HTML tags
    .replace(/[#>*_`~|-]+/g, " ") // markdown punctuation
    .replace(/\s+/g, " ")
    .trim();
}

export function GET() {
  const docs: SearchDoc[] = getAllPostsWithContent().map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    tags: p.tags,
    body: toPlainText(p.content),
  }));
  return Response.json(docs);
}
