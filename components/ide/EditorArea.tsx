"use client";

/* The editor surface. Normally one pane (the active route, passed as children).
   When the user drags an Explorer file onto it (pointer drag, see rowDrag.ts), it
   becomes two panes: the route on the left and the dropped file's body (from the
   client registry) on the right, with a draggable divider. Split is desktop-only
   (md+). The left pane stays the real SSR'd route, so SEO and the focused
   document are unchanged.

   [data-editor-root] marks the drop hit-test region; the actual openRight happens
   in rowDrag on pointerup. Here we only render the drop hint while a draggable
   file is hovering. */

import { createElement, Suspense, useRef, type ReactNode, type CSSProperties } from "react";
import { FileIcon } from "./FileIcon";
import { navLabel } from "@/app/lib/nav";
import { useSplit, closeRight, setLeftFraction } from "./splitStore";
import { paneFor } from "./paneRegistry";
import { useDrag } from "./dragStore";
import { SplitDivider } from "./SplitDivider";

function DropOverlay({ active }: { active: boolean }) {
  return (
    <div className={`ide-drop-overlay${active ? " is-active" : ""}`} aria-hidden="true">
      <div className="ide-drop-card">Drop to open in split &rarr;</div>
    </div>
  );
}

export function EditorArea({ children }: { children: ReactNode }) {
  const { rightHref, leftFraction } = useSplit();
  const drag = useDrag();
  const containerRef = useRef<HTMLDivElement>(null);
  const showDrop = drag.active && drag.over;

  // A stable module-level lazy component from the registry; rendered via
  // createElement so it isn't flagged as a component derived during render.
  const rightBody = rightHref ? paneFor(rightHref) : null;

  // Single pane (default).
  if (!rightHref || !rightBody) {
    return (
      <div className="relative flex flex-1 min-h-0 flex-col" data-editor-root>
        <div className="flex-1 md:min-h-0 md:overflow-y-auto" data-editor-scroll>
          {children}
        </div>
        <DropOverlay active={showDrop} />
      </div>
    );
  }

  const label = navLabel(rightHref);
  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 min-h-0 flex-col md:flex-row"
      style={{ "--lf": leftFraction } as CSSProperties}
      data-editor-root
    >
      <div className="ide-split-left flex-1 md:min-h-0 md:overflow-y-auto" data-editor-scroll>
        {children}
      </div>

      <SplitDivider containerRef={containerRef} fraction={leftFraction} onCommit={setLeftFraction} />

      <div className="ide-split-right hidden min-w-0 flex-1 md:flex md:min-h-0 md:flex-col">
        <div className="ide-split-pane-header">
          <span className="ide-split-pane-name">
            <FileIcon name={label} className="ide-file-icon" />
            {label}
          </span>
          <button
            type="button"
            className="ide-split-pane-close"
            onClick={closeRight}
            aria-label="Close split pane"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M6.4 5A1 1 0 0 0 5 6.4L10.6 12 5 17.6A1 1 0 0 0 6.4 19L12 13.4 17.6 19A1 1 0 0 0 19 17.6L13.4 12 19 6.4A1 1 0 0 0 17.6 5L12 10.6Z" />
            </svg>
          </button>
        </div>
        <div key={rightHref} className="ide-enter flex-1 md:min-h-0 md:overflow-y-auto">
          <Suspense fallback={<div className="ide-split-loading">Loading&hellip;</div>}>
            {createElement(rightBody)}
          </Suspense>
        </div>
      </div>

      <DropOverlay active={showDrop} />
    </div>
  );
}
