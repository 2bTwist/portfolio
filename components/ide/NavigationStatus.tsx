"use client";

/* Says which page is opening while a client navigation waits on the server
   (see navPending.ts). It appears only after a short delay, so a fast route
   change shows nothing, and it ends when the route changes. One polite live
   region serves both the desktop shell and compact layouts. */

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCatalogue } from "./CatalogueProvider";
import { endNavigation, usePendingNavigation } from "./navPending";

const SHOW_AFTER_MS = 200;

export function NavigationStatus() {
  const pathname = usePathname();
  const target = usePendingNavigation();
  const { label } = useCatalogue();
  const [shownFor, setShownFor] = useState<string | null>(null);

  useEffect(() => {
    endNavigation();
  }, [pathname]);

  useEffect(() => {
    if (!target) return;
    const t = window.setTimeout(() => setShownFor(target), SHOW_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [target]);

  const shown = target !== null && shownFor === target;
  return (
    <p className="nav-pending mono" role="status" data-shown={shown || undefined}>
      {shown ? (
        <>
          <span className="braille-loader" aria-hidden="true" />
          <span>Opening {label(target)}</span>
        </>
      ) : null}
    </p>
  );
}
