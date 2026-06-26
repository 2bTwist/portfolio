/* Shared content index for the IDE shell (Phase 2). One source of truth that
   the Explorer tree, the ⌘K palette, and the terminal all read, so file->route
   mapping never drifts. Derived from the data layer (projects) — server-
   importable, no client code. */

import { PROJECTS } from "@/data/projects";

export type TreeFile = { type: "file"; name: string; href: string };
export type TreeFolder = {
  type: "folder";
  name: string;
  href: string;
  children: TreeFile[];
};
export type TreeNode = TreeFile | TreeFolder;

function projectFileName(id: string, kind: "web" | "mobile"): string {
  return `${id}.${kind === "mobile" ? "tsx" : "ts"}`;
}

const projectFiles: TreeFile[] = PROJECTS.map((p) => ({
  type: "file",
  name: projectFileName(p.id, p.kind),
  href: `/projects/${p.id}`,
}));

/* Hierarchical view for the Explorer. The writing/ folder's children (the blog
   posts) are filled in at runtime by the Explorer from server-provided data,
   because nav.ts is imported by client components and can't read the fs-based
   posts module itself. */
export const TREE: TreeNode[] = [
  { type: "file", name: "README.md", href: "/" },
  { type: "file", name: "about.md", href: "/about" },
  { type: "folder", name: "projects", href: "/projects", children: projectFiles },
  { type: "file", name: "experience.md", href: "/experience" },
  { type: "folder", name: "writing", href: "/writing", children: [] },
  { type: "file", name: "certs.pdf", href: "/certs" },
];

export type NavItem = { name: string; href: string };

/* Flat view for the palette / terminal / tabs. */
export const NAV: NavItem[] = [
  { name: "README.md", href: "/" },
  { name: "about.md", href: "/about" },
  { name: "projects/", href: "/projects" },
  ...projectFiles.map((f) => ({ name: f.name, href: f.href })),
  { name: "experience.md", href: "/experience" },
  { name: "writing/", href: "/writing" },
  { name: "certs.pdf", href: "/certs" },
  // Not in the explorer TREE (would get the cert/medal .pdf icon); listed here
  // so it opens a real "resume.pdf" tab + label and is ⌘K-searchable.
  { name: "resume.pdf", href: "/resume" },
];

export function navLabel(href: string): string {
  return NAV.find((n) => n.href === href)?.name ?? href;
}
