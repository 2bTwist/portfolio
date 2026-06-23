/* Content container — the "editor pane" look (one rendered file at a time).
   Server component. In Phase 2 the IDE shell wraps this; standalone it's just
   a clean, centered reading column. */

import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-5 sm:px-8 py-10 sm:py-14 font-sans">{children}</div>
    </main>
  );
}
