/* Content container — the "editor pane" look (one rendered file at a time).
   Server component. In Phase 2 the IDE shell wraps this; standalone it's just
   a clean, centered column. `width`: "prose" for reading pages (narrow measure),
   "wide" for layout-y pages like home/projects. Class names are full literals so
   Tailwind's JIT keeps them.

   A route's page is the document's <main>. Rendered in a split pane, a page gets
   `paneLabel` and becomes a region named after its file instead, so the route
   in the primary pane keeps the only main landmark. */

import type { ReactNode } from "react";

/* Props every split-pane body takes (see paneRegistry.ts) and passes on to its
   PageShell or Landmark. Routes render bodies without it. */
export type PaneProps = { paneLabel?: string };

export function Landmark({
  paneLabel,
  className,
  children,
}: PaneProps & { className: string; children: ReactNode }) {
  return paneLabel === undefined ? (
    <main className={className}>{children}</main>
  ) : (
    <section className={className} aria-label={paneLabel}>
      {children}
    </section>
  );
}

const WIDTHS = {
  prose: "max-w-2xl",
  wide: "max-w-5xl",
} as const;

export function PageShell({
  children,
  width = "prose",
  paneLabel,
}: PaneProps & {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
}) {
  return (
    <Landmark className="page-shell flex-1 min-w-0" paneLabel={paneLabel}>
      <div className={`page-content mx-auto ${WIDTHS[width]} font-sans`}>
        {children}
      </div>
    </Landmark>
  );
}
