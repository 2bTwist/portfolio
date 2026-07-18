"use client";

/* Floating back-to-top for long pages. Fixed bottom-right above the status bar,
   invisible until you've scrolled ~a viewport deep, then fades in.

   One capture-phase scroll listener on the document covers both scroll models
   (the desktop [data-editor-scroll] pane and mobile window scroll) and keeps
   working when a split remounts the pane element, since we re-query on every
   event instead of binding to one node. Clicking scrolls whichever surface is
   scrolled (see scrollEditorTop) with the `rise` swoop; reduced motion gets an
   instant jump and no entrance transition (CSS). */

import { useEffect, useState } from "react";
import { useSound } from "@/components/feel/SoundProvider";
import { scrollEditorTop } from "./scroll";

export function BackToTop({ hidden = false }: { hidden?: boolean }) {
  const { play } = useSound();
  const [deep, setDeep] = useState(false);

  useEffect(() => {
    function onScroll() {
      const pane = document.querySelector("[data-editor-scroll]");
      const depth = Math.max(pane?.scrollTop ?? 0, window.scrollY);
      setDeep(depth > window.innerHeight * 0.9);
    }
    onScroll();
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return (
    <button
      type="button"
      className="ide-backtop"
      data-visible={deep && !hidden}
      tabIndex={deep && !hidden ? 0 : -1}
      aria-hidden={!(deep && !hidden)}
      aria-label="Scroll back to top"
      onClick={() => {
        play("rise");
        scrollEditorTop();
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
