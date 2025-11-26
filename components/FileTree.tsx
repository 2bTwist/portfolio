"use client";

import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TreeNode } from "@/lib/buildFileTree";

interface Props {
  tree: TreeNode[];
}

export default function FileTree({ tree }: Props) {
  return (
    <div className="text-sm space-y-0.5">
      {tree.map((node) => (
        <Item key={node.path} node={node} level={0} />
      ))}
    </div>
  );
}

function Item({ node, level }: { node: TreeNode; level: number }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const isFolder = node.type === "folder";
  const isActive = pathname === `/${node.path}`;

  const content = (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
        isActive
          ? "bg-accent/10 text-accent-strong"
          : "text-text hover:bg-surface-hover"
      }`}
      onClick={() => isFolder && setOpen(prev => !prev)}
      style={{ paddingLeft: `calc(0.5rem + ${level * 12}px)` }}
    >
      {isFolder ? (
        open ? (
          <ChevronDown size={14} className="text-text-subtle shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-text-subtle shrink-0" />
        )
      ) : (
        <File size={14} className="text-text-subtle shrink-0" />
      )}

      {isFolder ? (
        open ? (
          <FolderOpen size={16} className="text-text-subtle shrink-0" />
        ) : (
          <Folder size={16} className="text-text-subtle shrink-0" />
        )
      ) : null}

      <span className="truncate text-sm">{node.name}</span>
    </div>
  );

  return (
    <div>
      {isFolder ? (
        content
      ) : (
        <Link href={`/${node.path}`} className="block">
          {content}
        </Link>
      )}

      {isFolder && open && node.children && (
        <div className="mt-0.5">
          {node.children.map(child => (
            <Item key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
