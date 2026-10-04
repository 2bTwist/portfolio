/* Unified palette/terminal search (Phase 4 + editor-chrome pass).

   Two indexes, one ranked result shape:
   - STATIC (sync): the catalogue's listed pages + project content
     (title/blurb/tags). Available immediately because both are client-importable.
   - POSTS (async): full-text over the blog, fetched lazily on first use so post
     bodies live in neither the initial bundle nor any JS chunk.

   Fuse is imported statically here, but this module is only reached through the
   lazy CommandPalette / Terminal chunks, so it never lands in the initial bundle
   (the size gate measures initial-load chunks only). Both indexes expose a Fuse
   `score` (lower = better) so results merge into one intuitive ranked list. */

import Fuse from "fuse.js";
import { PAGES } from "@/data/pages";
import { PROJECTS } from "@/data/projects";
import { STATIC_ENTRIES, listedEntries } from "./catalogue-view";
import type { SearchDoc } from "@/app/search-index.json/route";

export type SearchKind = "file" | "folder" | "project" | "post";
export type SearchResult = {
  kind: SearchKind;
  name: string;
  sub: string;
  href: string;
  score: number;
};

// ---- Static index: listed catalogue pages + project content (no fetch) ----
type StaticDoc = { kind: "file" | "folder" | "project"; name: string; href: string; sub: string; haystack: string };

// The explorer's folders, so the palette marks the same pages as directories.
const FOLDER_HREFS = new Set<string>(PAGES.flatMap((p) => (p.tree === "folder" ? [p.href] : [])));

const projectByHref = new Map<string, (typeof PROJECTS)[number]>(
  PROJECTS.map((p) => [`/projects/${p.id}`, p]),
);

const STATIC_DOCS: StaticDoc[] = listedEntries(STATIC_ENTRIES).map((e) => {
  const proj = projectByHref.get(e.href);
  if (proj) {
    return {
      kind: "project",
      name: e.label,
      href: e.href,
      sub: proj.title,
      haystack: `${e.label} ${proj.title} ${proj.blurb} ${proj.tags.join(" ")}`,
    };
  }
  const kind = FOLDER_HREFS.has(e.href) ? "folder" : "file";
  return { kind, name: e.label, href: e.href, sub: e.href, haystack: e.label };
});

const staticFuse = new Fuse(STATIC_DOCS, {
  includeScore: true,
  threshold: 0.2,
  ignoreLocation: true,
  minMatchCharLength: 1,
  keys: [
    { name: "name", weight: 3 },
    { name: "haystack", weight: 1 },
  ],
});

export function searchStatic(query: string): SearchResult[] {
  const q = query.trim();
  // Empty query = the full file listing (quick-open default), in tree order.
  if (!q) {
    return STATIC_DOCS.map((d) => ({ kind: d.kind, name: d.name, sub: d.sub, href: d.href, score: 0 }));
  }
  return staticFuse.search(q).map((r) => ({
    kind: r.item.kind,
    name: r.item.name,
    sub: r.item.sub,
    href: r.item.href,
    score: r.score ?? 1,
  }));
}

// ---- Post index: lazily fetched JSON, then Fuse ----
// searchPosts rejects when the index cannot be loaded; callers show that and
// keep the static results.
let postFusePromise: Promise<Fuse<SearchDoc>> | null = null;

function postFuse() {
  if (!postFusePromise) {
    postFusePromise = fetch("/search-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`search index: HTTP ${r.status}`);
        return r.json();
      })
      .then(
        (docs: SearchDoc[]) =>
          new Fuse(docs, {
            includeScore: true,
            threshold: 0.2,
            ignoreLocation: true,
            minMatchCharLength: 3,
            keys: [
              { name: "title", weight: 3 },
              { name: "tags", weight: 2 },
              { name: "summary", weight: 2 },
              { name: "body", weight: 1 },
            ],
          }),
      );
    // Cache only a loaded index: after a failure the next search fetches again,
    // so post results come back once the network does.
    postFusePromise.catch(() => {
      postFusePromise = null;
    });
  }
  return postFusePromise;
}

export async function searchPosts(query: string, limit = 6): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const fuse = await postFuse();
  return fuse.search(q, { limit }).map((r) => ({
    kind: "post" as const,
    name: r.item.title,
    sub: r.item.summary,
    href: `/blog/${r.item.slug}`,
    score: r.score ?? 1,
  }));
}
