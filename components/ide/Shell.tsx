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
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { navLabel, type TreeFile } from "@/app/lib/nav";
import { Explorer } from "./Explorer";
import { EditorArea } from "./EditorArea";
import { DragGhost } from "./DragGhost";
import { Tabs } from "./Tabs";
import { StatusBar } from "./StatusBar";
import { useOverlay } from "./store";
import type { GitInfo } from "@/app/lib/git";

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });

// Warm the lazy palette/terminal chunks. Module scope + "use no memo" so the
// React Compiler doesn't try to lower the dynamic import() and bail.
function warmOverlays() {
  "use no memo";
  void import("./CommandPalette");
  void import("./Terminal");
}

/* Keyed wrapper: remounting on pathname change replays the CSS enter animation. */
function EditorPane({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="ide-enter">
      {children}
    </div>
  );
}

export function Shell({
  children,
  git,
  blogFiles = [],
}: {
  children: ReactNode;
  git: GitInfo;
  blogFiles?: TreeFile[];
}) {
  const pathname = usePathname();
  const router = useRouter();
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

  // Warm the lazy palette/terminal chunks during idle time so the first open is
  // instant. They stay off the initial critical path + size budget — loaded
  // after first paint, never referenced by the prerendered HTML. (Measured: this
  // adds no meaningful TBT — the chunks are small and requestIdleCallback runs
  // after the blocking load work.)
  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(warmOverlays, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(warmOverlays, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      {/* Mobile / no-JS fallback navigation */}
      <div className="md:hidden">
        <SiteNav />
      </div>

      <div className="flex flex-col min-h-[100dvh] md:h-[100dvh] md:min-h-0 md:overflow-hidden">
        <div className="ide-titlebar hidden md:flex">
          {/* macOS window controls: the glyphs (✕ / − / fullscreen arrows) fade
              in when you approach the cluster, exactly like the real traffic
              lights. Decorative only. */}
          <div className="ide-traffic" aria-hidden="true">
            <span className="ide-dot ide-dot--close">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M4 4l4 4M8 4l-4 4" />
              </svg>
            </span>
            <span className="ide-dot ide-dot--min">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M3.5 6h5" />
              </svg>
            </span>
            <span className="ide-dot ide-dot--max">
              <svg viewBox="0 0 12 12" fill="currentColor">
                <path d="M4 4h3.2L4 7.2z" />
                <path d="M8 8H4.8L8 4.8z" />
              </svg>
            </span>
          </div>
          <div className="ide-titlebar-center">
            <button
              type="button"
              className="ide-nav-btn"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="ide-nav-btn"
              onClick={() => router.forward()}
              aria-label="Go forward"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              className="ide-command-center"
              onClick={toggleCmdk}
              aria-label={`${navLabel(pathname)}, search files and posts`}
              aria-keyshortcuts="Meta+K Control+K"
            >
              <span className="ide-command-center-icon" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <line x1="11" y1="11" x2="14.5" y2="14.5" />
                </svg>
              </span>
              <span className="ide-command-center-label">{navLabel(pathname)}</span>
              <kbd className="ide-command-center-kbd" aria-hidden="true">⌘K</kbd>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <Explorer className="ide-explorer hidden md:flex" blogFiles={blogFiles} />

          <div className="flex flex-1 min-w-0 flex-col min-h-0">
            <Tabs className="ide-tabs hidden md:flex" />
            {/* The editor pane is the only scroll region on desktop, so the
                chrome (titlebar/explorer/tabs/status bar) stays fixed. On mobile
                there's no height cap, so the document scrolls normally. EditorArea
                turns this into two panes when a file is dropped into a split. */}
            <EditorArea>
              <EditorPane>{children}</EditorPane>
            </EditorArea>
            {termMounted ? (
              <div className={termOpen ? "hidden shrink-0 md:block" : "hidden"}>
                <Terminal />
              </div>
            ) : null}
          </div>
        </div>

        <StatusBar className="ide-statusbar hidden md:flex" git={git} />
      </div>

      {cmdkOpen ? <CommandPalette /> : null}
      <DragGhost />
    </>
  );
}
