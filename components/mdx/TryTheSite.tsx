"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { useMounted } from "@/components/hooks/useMounted";

/* In-post disclosure that points the reader at a piece of the site's own taste.
   A native <details>, so it opens and reads fine with JS off; CSS picks the copy
   for the current layout (sidebar at md+, compact header below), so crossing
   the breakpoint needs no JS either.

   With JS, opening it lights up the matching target through one attribute on
   <html>: the explorer's resize edge (drag it past its limit to meet the
   bouncer) or the compact header's theme swatches, which stay in view because
   that header is sticky. The hint clears as soon as the reader touches either
   target, closes the disclosure, or leaves the page. */

const TARGETS = ".ide-resize-handle, .site-theme-swatch";

export function TryTheSite() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [found, setFound] = useState(false);
  const hinting = mounted && open && !found;

  useEffect(() => {
    if (!hinting) return;
    const root = document.documentElement;
    root.dataset.siteHint = "";
    function onInteract(e: Event) {
      if ((e.target as Element | null)?.closest?.(TARGETS)) setFound(true);
    }
    // pointerdown catches the drag the moment it starts; click covers keyboard
    // activation of a swatch.
    document.addEventListener("pointerdown", onInteract, true);
    document.addEventListener("click", onInteract, true);
    return () => {
      delete root.dataset.siteHint;
      document.removeEventListener("pointerdown", onInteract, true);
      document.removeEventListener("click", onInteract, true);
    };
  }, [hinting]);

  function onToggle(e: SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = e.currentTarget.open;
    setOpen(isOpen);
    if (isOpen) setFound(false);
  }

  return (
    <details className="try-site" onToggle={onToggle}>
      <summary>Want to see one?</summary>
      <p className="try-site-wide">
        Grab the right edge of the sidebar on the left and drag it. When it stops, keep going.
      </p>
      <p className="try-site-compact">
        Tap one of the coloured squares at the top. The whole theme changes, and nothing on the
        page flashes while it does.
      </p>
    </details>
  );
}
