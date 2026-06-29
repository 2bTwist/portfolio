"use client";

/* The editor surface. Normally one pane (the active route, passed as children).
   When the user drags an Explorer file onto it (pointer drag, see rowDrag.ts), it
   becomes two panes via SplitView. The split layout is dynamically imported: the
   SSR snapshot is always single-pane (splitStore.rightHref starts null), so the
   SplitView chunk — divider, split chrome, registry render — is never referenced
   by prerendered HTML and stays out of the initial-load bundle.

   [data-editor-root] marks the drop hit-test region; the actual openRight happens
   in rowDrag on pointerup. Here we only render the drop hint while a draggable
   file is hovering. */

import dynamic from "next/dynamic";
import { type ReactNode } from "react";
import { useSplit } from "./splitStore";
import { useDrag } from "./dragStore";

const SplitView = dynamic(() => import("./SplitView").then((m) => ({ default: m.SplitView })), {
  ssr: false,
});

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
  const showDrop = drag.active && drag.over;

  // Single pane (default, and the only state the server ever renders).
  if (!rightHref) {
    return (
      <div className="relative flex flex-1 min-h-0 flex-col" data-editor-root>
        <div className="flex-1 md:min-h-0 md:overflow-y-auto" data-editor-scroll>
          {children}
        </div>
        <DropOverlay active={showDrop} />
      </div>
    );
  }

  return (
    <SplitView rightHref={rightHref} leftFraction={leftFraction} showDrop={showDrop}>
      {children}
    </SplitView>
  );
}
