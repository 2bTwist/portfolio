"use client";

/* File-tree explorer. Rows are real prefetched <Link>s mapping file -> route, so
   it works with JS off (folders render expanded; links navigate). Folder collapse
   is the only client state. Active row = current pathname. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TREE, type TreeNode } from "@/app/lib/nav";
import { useMounted } from "@/components/hooks/useMounted";
import { FileIcon, FolderIcon } from "./FileIcon";
import { useSession } from "./store";

export function Explorer({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  // Icons render client-only (after mount) so they stay off the SSR / first-paint
  // critical path — rendering them server-side regressed Lighthouse LCP ~840ms.
  const mounted = useMounted();
  return (
    <aside className={className} aria-label="File explorer">
      <div className="ide-explorer-title">~/edmond</div>
      <nav aria-label="Site files">
        {TREE.map((node) => (
          <Node key={node.href} node={node} pathname={pathname} depth={0} mounted={mounted} />
        ))}
      </nav>
    </aside>
  );
}

function Node({
  node,
  pathname,
  depth,
  mounted,
}: {
  node: TreeNode;
  pathname: string;
  depth: number;
  mounted: boolean;
}) {
  const [open, setOpen] = useState(true);
  const { openTab } = useSession();
  const pad = { paddingLeft: `${0.4 + depth * 0.8}rem` };

  if (node.type === "file") {
    const active = pathname === node.href;
    return (
      <Link
        href={node.href}
        prefetch
        className="ide-row"
        style={pad}
        aria-current={active ? "page" : undefined}
        onClick={() => openTab(node.href)}
      >
        {mounted ? <FileIcon name={node.name} className="ide-file-icon" /> : null}
        {node.name}
      </Link>
    );
  }

  const childActive = pathname.startsWith(node.href);
  return (
    <div>
      <div className="flex items-center" style={pad}>
        <button
          type="button"
          className="ide-chevron"
          data-open={open}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`}
          onClick={() => setOpen((o) => !o)}
        >
          ▾
        </button>
        <Link
          href={node.href}
          prefetch
          className="ide-row flex-1"
          aria-current={pathname === node.href ? "page" : undefined}
          style={childActive && pathname !== node.href ? { color: "var(--accent)" } : undefined}
          onClick={() => openTab(node.href)}
        >
          {mounted ? <FolderIcon open={open} /> : null}
          {node.name}/
        </Link>
      </div>
      <div className="ide-folder" data-open={open}>
        <div className="ide-folder-inner">
          {node.children.map((child) => (
            <Node key={child.href} node={child} pathname={pathname} depth={depth + 1} mounted={mounted} />
          ))}
        </div>
      </div>
    </div>
  );
}
