/* Shared content index for the IDE shell (Phase 2). One source of truth that
   the Explorer tree, the ⌘K palette, and the terminal all read, so file->route
   mapping never drifts. Derived from the data layer (projects) — server-
   importable, no client code. */

import { PROJECTS } from "@/data/projects";
import { EXPERIENCE } from "@/data/experience";

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

/* Experience entries that have a "read more" story become files under the
   experience/ folder. */
const experienceFiles: TreeFile[] = EXPERIENCE.filter((e) => e.story).map((e) => ({
  type: "file",
  name: `${e.story!.replace("/experience/", "")}.md`,
  href: e.story!,
}));

/* Hierarchical view for the Explorer. (Individual posts aren't listed here:
   nav.ts is imported by client components, so it can't pull the fs-based posts
   module. Posts are reachable via the writing/ index, ⌘K, and terminal grep.) */
export const TREE: TreeNode[] = [
  { type: "file", name: "README.md", href: "/" },
  { type: "folder", name: "projects", href: "/projects", children: projectFiles },
  { type: "file", name: "about.md", href: "/about" },
  { type: "folder", name: "experience", href: "/experience", children: experienceFiles },
  { type: "file", name: "certs.pdf", href: "/certs" },
  { type: "file", name: "writing.md", href: "/writing" },
];

export type NavItem = { name: string; href: string };

/* Flat view for the palette / terminal / tabs. */
export const NAV: NavItem[] = [
  { name: "README.md", href: "/" },
  { name: "projects/", href: "/projects" },
  ...projectFiles.map((f) => ({ name: f.name, href: f.href })),
  { name: "about.md", href: "/about" },
  { name: "experience/", href: "/experience" },
  ...experienceFiles.map((f) => ({ name: f.name, href: f.href })),
  { name: "certs.pdf", href: "/certs" },
  { name: "writing.md", href: "/writing" },
  // Not in the explorer TREE (would get the cert/medal .pdf icon); listed here
  // so it opens a real "resume.pdf" tab + label and is ⌘K-searchable.
  { name: "resume.pdf", href: "/resume" },
];

export function navLabel(href: string): string {
  return NAV.find((n) => n.href === href)?.name ?? href;
}
