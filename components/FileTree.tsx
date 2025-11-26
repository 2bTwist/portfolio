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
    <div className="text-sm">
      {tree.map((node) => (
        <Item key={node.path} node={node} level={0} />
      ))}
    </div>
  );
}

function Item({ node, level }: { node: TreeNode; level: number }) {
  const [open, setOpen] = useState(true); // Default open for better UX
  const pathname = usePathname();
  const isFolder = node.type === "folder";
  const isActive = pathname === `/${node.path}`;

  const content = (
    <div
      className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        isActive ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""
      }`}
      onClick={() => isFolder && setOpen(prev => !prev)}
    >
      <span className="ml-[calc(12px*var(--level))]" style={{ "--level": level } as React.CSSProperties} />

      {isFolder ? (
        open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
      ) : (
        <File size={14} />
      )}

      {isFolder ? (
        open ? <FolderOpen size={16} /> : <Folder size={16} />
      ) : null}

      <span className="truncate">{node.name}</span>
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
        <div>
          {node.children.map(child => (
            <Item key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
