/* Lazy client search (Phase 4). Both Fuse and the post index are loaded only on
   first use (dynamic import + fetch), so nothing here lands in the initial
   bundle. The built Fuse instance is cached behind a single promise. */

import type FuseType from "fuse.js";
import type { SearchDoc } from "@/app/search-index.json/route";

export type PostHit = { slug: string; title: string; summary: string };

let indexPromise: Promise<FuseType<SearchDoc>> | null = null;

async function buildIndex() {
  const [{ default: Fuse }, res] = await Promise.all([
    import("fuse.js"),
    fetch("/search-index.json"),
  ]);
  const docs: SearchDoc[] = await res.json();
  return new Fuse(docs, {
    keys: [
      { name: "title", weight: 3 },
      { name: "tags", weight: 2 },
      { name: "summary", weight: 2 },
      { name: "body", weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

function getIndex() {
  if (!indexPromise) indexPromise = buildIndex();
  return indexPromise;
}

export async function searchPosts(query: string, limit = 6): Promise<PostHit[]> {
  const q = query.trim();
  if (!q) return [];
  const fuse = await getIndex();
  return fuse
    .search(q, { limit })
    .map(({ item }) => ({ slug: item.slug, title: item.title, summary: item.summary }));
}
