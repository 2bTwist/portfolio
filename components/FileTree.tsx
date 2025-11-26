"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/buildFileTree";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FileTree({ tree }: { tree: TreeNode[] }) {
  return (
    <div className="text-sm font-medium space-y-1">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} level={0} />
      ))}
    </div>
  );
}

function TreeItem({ node, level }: { node: TreeNode; level: number }) {
  const isFolder = node.type === "folder";
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const active = pathname.includes(node.path);

  // Indent width
  const indent = { paddingLeft: `${level * 12}px` };

  return (
    <div>
      {/* FOLDER */}
      {isFolder && (
        <button
          className={cn(
            "w-full flex items-center gap-2 py-1.5 px-2 rounded-md",
            "hover:bg-surface-hover transition-colors",
            active && "bg-surface-hover"
          )}
          style={indent}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDown size={14} className="text-text-subtle" />
          ) : (
            <ChevronRight size={14} className="text-text-subtle" />
          )}

          {open ? (
            <FolderOpen size={16} className="text-text-subtle" />
          ) : (
            <Folder size={16} className="text-text-subtle" />
          )}

          <span className="truncate text-text">{node.name}</span>
        </button>
      )}

      {/* FILE */}
      {!isFolder && (
        <Link
          href={`/${node.path}`}
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md",
            "hover:bg-surface-hover transition-colors",
            active &&
              "bg-accent/10 border border-accent/20 text-accent font-semibold",
            "text-text"
          )}
          style={indent}
        >
          <File size={14} className="text-text-subtle" />
          <span className="truncate">{node.name.replace(".mdx", "")}</span>
        </Link>
      )}

      {/* CHILDREN */}
      {isFolder && open && (
        <div className="mt-0.5 space-y-0.5">
          {node.children?.map((child) => (
            <TreeItem key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
