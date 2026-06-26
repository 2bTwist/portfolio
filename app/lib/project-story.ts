/* Optional long-form story body for a project, mirroring the blog's MDX setup.
   A project with content/projects/<id>.mdx gets a full story page; one without
   falls back to its short `detail` paragraph. Server-only (uses fs) — never
   import from a client module. */

import fs from "node:fs";
import path from "node:path";

export function getProjectStory(id: string): string | null {
  const file = path.join(process.cwd(), "content/projects", `${id}.mdx`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}
