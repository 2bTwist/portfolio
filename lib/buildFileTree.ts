import fs from "fs";
import path from "path";

export interface TreeNode {
  name: string;
  path: string; // slug path like "blog/scalable-apis"
  type: "file" | "folder";
  children?: TreeNode[];
}

export function buildFileTree(dir = "content"): TreeNode[] {
  const rootPath = path.join(process.cwd(), dir);
  return readDir(rootPath, dir);
}

function readDir(fullPath: string, basePath: string): TreeNode[] {
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  return entries.map(entry => {
    const entryFullPath = path.join(fullPath, entry.name);
    const relativePath = entryFullPath
      .replace(process.cwd() + "/content/", "")
      .replace(/\.mdx?$/, "");

    if (entry.isDirectory()) {
      return {
        name: entry.name,
        path: relativePath,
        type: "folder" as const,
        children: readDir(entryFullPath, basePath),
      };
    }

    return {
      name: entry.name,
      path: relativePath,
      type: "file" as const,
    };
  });
}
