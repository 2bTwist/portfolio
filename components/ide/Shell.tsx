"use client";

/* The IDE shell — an additive client layout over the real, server-rendered
   routes. {children} is server content passed through this client boundary, so
   it stays SSR'd and crawlable; the shell only adds chrome.

   Responsive split is pure CSS (md: utilities), so it works with JS off:
   - desktop (md+): title bar, explorer, tabs, status bar, terminal drawer
   - mobile / no-JS: the plain stacked site with <SiteNav>

   The route-enter animation is a transform-only CSS keyframe (no motion dep):
   it paints immediately so LCP is unaffected, doesn't shift layout (CLS-safe),
   and is reduced-motion gated. The palette and terminal are lazy-loaded. */

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { navLabel } from "@/app/lib/nav";
import { Explorer } from "./Explorer";
import { Tabs } from "./Tabs";
import { StatusBar } from "./StatusBar";
import { useOverlay } from "./store";

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });

/* Keyed wrapper: remounting on pathname change replays the CSS enter animation. */
function EditorPane({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="ide-enter">
      {children}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { cmdkOpen, toggleCmdk, closeCmdk, termOpen, termMounted, toggleTerm, closeTerm } =
    useOverlay();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCmdk();
      } else if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        toggleTerm();
      } else if (e.key === "Escape") {
        closeCmdk();
        closeTerm();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCmdk, closeCmdk, toggleTerm, closeTerm]);

  return (
    <>
      {/* Mobile / no-JS fallback navigation */}
      <div className="md:hidden">
        <SiteNav />
      </div>

      <div className="flex flex-col min-h-[100dvh] md:h-[100dvh] md:min-h-0 md:overflow-hidden">
        <div className="ide-titlebar hidden md:flex">
          <div className="ide-traffic" aria-hidden="true">
            <span className="ide-dot ide-dot--close" />
            <span className="ide-dot ide-dot--min" />
            <span className="ide-dot ide-dot--max" />
          </div>
          <button
            type="button"
            className="ide-command-center"
            onClick={toggleCmdk}
            aria-label="Search files and posts"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <span className="ide-command-center-icon" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="7" cy="7" r="4.5" />
                <line x1="11" y1="11" x2="14.5" y2="14.5" />
              </svg>
            </span>
            <span className="ide-command-center-label">{navLabel(pathname)}</span>
            <kbd className="ide-command-center-kbd">⌘K</kbd>
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <Explorer className="ide-explorer hidden md:flex" />

          <div className="flex flex-1 min-w-0 flex-col min-h-0">
            <Tabs className="ide-tabs hidden md:flex" />
            {/* The editor pane is the only scroll region on desktop, so the
                chrome (titlebar/explorer/tabs/status bar) stays fixed. On mobile
                there's no height cap, so the document scrolls normally. */}
            <div className="flex-1 md:min-h-0 md:overflow-y-auto">
              <EditorPane>{children}</EditorPane>
            </div>
            {termMounted ? (
              <div className={termOpen ? "hidden shrink-0 md:block" : "hidden"}>
                <Terminal />
              </div>
            ) : null}
          </div>
        </div>

        <StatusBar className="ide-statusbar hidden md:flex" />
      </div>

      {cmdkOpen ? <CommandPalette /> : null}
    </>
  );
}
