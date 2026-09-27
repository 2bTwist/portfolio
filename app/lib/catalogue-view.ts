/* The catalogue view (see CONTEXT.md): what the browser knows of the page
   catalogue. Pages and projects are client-importable, so they are always
   here; posts and tags are read on the server (app/lib/catalogue.ts) and
   added through the root layout. Explorer, tabs, labels, palette and terminal
   read this instead of keeping their own lists. */

import { PAGES, projectLabel } from "@/data/pages";
import { PROJECTS } from "@/data/projects";

export type CatalogueEntry = {
  href: string;
  /* File-style name shown by tabs, the palette, and labels. */
  label: string;
  kind: "page" | "project" | "post" | "tag";
  /* Listed by the palette and terminal search. Posts are found by the full-text index instead. */
  listed: boolean;
  /* In the sitemap. */
  indexable: boolean;
  /* Publish date, for posts. */
  date?: string;
};

export const STATIC_ENTRIES: CatalogueEntry[] = [
  ...PAGES.map((p) => ({
    href: p.href,
    label: p.label,
    kind: "page" as const,
    listed: p.listed,
    indexable: !("noindex" in p && p.noindex),
  })),
  ...PROJECTS.map((p) => ({
    href: `/projects/${p.id}`,
    label: projectLabel(p),
    kind: "project" as const,
    listed: true,
    indexable: true,
  })),
];

export type TreeFile = { type: "file"; name: string; href: string };
export type TreeFolder = { type: "folder"; name: string; href: string; children: TreeFile[] };
export type TreeNode = TreeFile | TreeFolder;

export type CatalogueView = {
  /* The explorer tree; folders hold the entries one path segment below them. */
  tree: TreeNode[];
  /* Every page, for tabs and labels. A 404 has no entry. */
  find: (href: string) => CatalogueEntry | undefined;
  /* The page's label, or the href itself when it is not a page. */
  label: (href: string) => string;
};

const parentOf = (href: string) => href.slice(0, href.lastIndexOf("/"));

export function catalogueView(entries: CatalogueEntry[]): CatalogueView {
  const byHref = new Map(entries.map((e) => [e.href, e]));
  const childrenOf = (href: string): TreeFile[] =>
    entries.filter((e) => parentOf(e.href) === href).map((e) => ({ type: "file", name: e.label, href: e.href }));
  const tree = PAGES.flatMap((p): TreeNode[] => {
    if (p.tree === "folder") return [{ type: "folder", name: p.label.replace(/\/$/, ""), href: p.href, children: childrenOf(p.href) }];
    return p.tree === "file" ? [{ type: "file", name: p.label, href: p.href }] : [];
  });
  return { tree, find: (href) => byHref.get(href), label: (href) => byHref.get(href)?.label ?? href };
}

/* Listed entries in explorer order: each page, then what expands under it. */
export function listedEntries(entries: CatalogueEntry[]): CatalogueEntry[] {
  return PAGES.flatMap((p) => entries.filter((e) => e.href === p.href || parentOf(e.href) === p.href)).filter(
    (e) => e.listed,
  );
}
