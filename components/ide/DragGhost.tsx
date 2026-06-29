"use client";

/* The little chip that follows the cursor while dragging an Explorer file toward
   a split. Position is written imperatively by the drag loop (dragStore.moveChip)
   so it tracks the pointer with no React re-renders; this component only toggles
   visibility and shows the file name. */

import { useEffect, useRef } from "react";
import { useDrag, registerChip } from "./dragStore";
import { FileIcon } from "./FileIcon";

export function DragGhost() {
  const { active, name } = useDrag();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerChip(ref.current);
    return () => registerChip(null);
  }, []);

  return (
    <div ref={ref} className={`ide-drag-ghost${active ? " is-active" : ""}`} aria-hidden="true">
      {name ? (
        <>
          <FileIcon name={name} className="ide-file-icon" />
          <span>{name}</span>
        </>
      ) : null}
    </div>
  );
}
