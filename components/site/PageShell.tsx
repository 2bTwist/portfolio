/* Content container — the "editor pane" look (one rendered file at a time).
   Server component. In Phase 2 the IDE shell wraps this; standalone it's just
   a clean, centered column. `width`: "prose" for reading pages (narrow measure),
   "wide" for layout-y pages like home/projects. Class names are full literals so
   Tailwind's JIT keeps them. */

import type { ReactNode } from "react";

const WIDTHS = {
  prose: "max-w-2xl",
  wide: "max-w-5xl",
} as const;

export function PageShell({
  children,
  width = "prose",
}: {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
}) {
  return (
    <main className="page-shell flex-1 min-w-0">
      <div className={`page-content mx-auto ${WIDTHS[width]} font-sans`}>
        {children}
      </div>
    </main>
  );
}
