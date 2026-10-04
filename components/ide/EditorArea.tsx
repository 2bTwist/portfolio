"use client";

/* The editor surface. Normally one pane (the active route, passed as children).
   When the user drags an Explorer file onto it (pointer drag, see rowDrag.ts), a
   second pane opens beside it. The primary pane is the same element in both
   layouts, so opening or closing a split never remounts the route: its scroll,
   focus and local state carry through. Only the divider and second pane are
   added, from a lazily imported chunk: the SSR snapshot is always single-pane
   (splitStore.rightHref starts null), so the split code — divider, split chrome,
   registry render — is never referenced by prerendered HTML and stays out of the
   initial-load bundle.

   [data-editor-root] marks the drop hit-test region; the actual openRight happens
   in rowDrag on pointerup. Here we only render the drop hint while a draggable
   file is hovering. */

import dynamic from "next/dynamic";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useSplit } from "./splitStore";
import { useDrag } from "./dragStore";
import { paneFor } from "./paneRegistry";

const SplitView = dynamic(() => import("./SplitView").then((m) => ({ default: m.SplitView })), {
  ssr: false,
});

export function EditorArea({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rightHref, leftFraction } = useSplit();
  const drag = useDrag();
  const showDrop = drag.active && drag.over;
  // openRight is only called for splittable hrefs; a body that ever resolves to
  // null stays a single pane rather than a broken split.
  const split = rightHref !== null && paneFor(rightHref) !== null;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-1 min-h-0 flex-col${split ? " md:flex-row" : ""}`}
      style={split ? ({ "--lf": leftFraction } as CSSProperties) : undefined}
      data-editor-root
    >
      <div
        id="ide-split-left"
        className={`${split ? "ide-split-left " : ""}flex-1 md:min-h-0 md:overflow-y-auto`}
        data-editor-scroll
      >
        {children}
      </div>
      {split ? <SplitView rightHref={rightHref} leftFraction={leftFraction} container={containerRef} /> : null}
      <div className={`ide-drop-overlay${showDrop ? " is-active" : ""}`} aria-hidden="true">
        <div className="ide-drop-card">Drop to open in split &rarr;</div>
      </div>
    </div>
  );
}
