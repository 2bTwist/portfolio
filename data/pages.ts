/* Top-level pages: the declared part of the page catalogue (see CONTEXT.md).
   Projects and posts expand into the projects/ and blog/ folders from their own
   data, so only routes of their own are listed here. Array order is the
   explorer and palette order. Client-importable: no server code. */

import type { Project } from "./projects";

export type Page = {
  href: string;
  /* File-style name shown by tabs, the palette, and labels. */
  label: string;
  /* Explorer placement. Folders expand; null pages still get tabs and labels. */
  tree: "file" | "folder" | null;
  /* Listed by the ⌘K palette and terminal search. */
  listed: boolean;
  /* The phone and no-JS header nav: its label and position, or null to stay off it. */
  compact: { label: string; order: number } | null;
  /* Has a split-pane body (components/ide/paneRegistry.ts). */
  splittable: boolean;
  /* Pages are in the sitemap unless they opt out. */
  noindex?: true;
};

export const PAGES = [
  { href: "/", label: "README.md", tree: "file", listed: true, compact: { label: "README", order: 1 }, splittable: true },
  { href: "/about", label: "about.md", tree: "file", listed: true, compact: { label: "about", order: 3 }, splittable: true },
  { href: "/projects", label: "projects/", tree: "folder", listed: true, compact: { label: "projects", order: 2 }, splittable: true },
  { href: "/experience", label: "experience.md", tree: "file", listed: true, compact: { label: "experience", order: 4 }, splittable: true },
  { href: "/blog", label: "blog/", tree: "folder", listed: true, compact: { label: "blog", order: 5 }, splittable: false },
  { href: "/certs", label: "certs.pdf", tree: "file", listed: true, compact: null, splittable: true },
  { href: "/music", label: "music.mp3", tree: "file", listed: true, compact: null, splittable: true },
  { href: "/resume", label: "resume.pdf", tree: null, listed: true, compact: null, splittable: true },
  { href: "/privacy", label: "privacy.md", tree: null, listed: false, compact: null, splittable: true, noindex: true },
  { href: "/terms", label: "terms.md", tree: null, listed: false, compact: null, splittable: false, noindex: true },
] as const satisfies readonly Page[];

/* The top-level pages with a split-pane body; paneRegistry.ts must cover exactly these. */
export type SplittableHref = Extract<(typeof PAGES)[number], { splittable: true }>["href"];

/* Labels for the pages that expand from other data. */
export const projectLabel = (p: Pick<Project, "id" | "kind">) => `${p.id}.${p.kind === "mobile" ? "tsx" : "ts"}`;
export const postLabel = (slug: string) => `${slug}.md`;
export const tagLabel = (tag: string) => `#${tag}`;
