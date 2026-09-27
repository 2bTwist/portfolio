"use client";

/* A resize handle (see CONTEXT.md): the separator that sizes the explorer, the
   terminal, or the split editor. It owns the whole drag: pointer capture, the
   page-wide drag flags, and every way a drag can end. Only a release commits;
   pointercancel, lost capture, window blur, Escape, unmount, and the handle being
   hidden mid-drag roll back to the value the drag started from and save nothing.
   One resize runs at a time.

   Keys follow the WAI-ARIA window splitter: arrows step, Home and End jump to the
   limits, and each key commits. Moves go through `preview` as imperative writes,
   so a drag never renders React; `value` is the committed value, which is what the
   ARIA attributes report. */

import { useEffect, useEffectEvent, useRef, type KeyboardEvent } from "react";

type Point = { x: number; y: number };

export type ResizeHandleProps = {
  label: string;
  className: string;
  /* The id of the pane it sizes (aria-controls). */
  controls: string;
  /* "vertical" sits between side-by-side panes, "horizontal" between stacked ones. */
  orientation: "vertical" | "horizontal";
  /* Which side of the handle the sized pane is on; moving away from it grows it. */
  pane: "before" | "after";
  /* The committed size, in the caller's units. ARIA reports it rounded. */
  value: number;
  min: number;
  max: number;
  /* One arrow key's change, in the same units. */
  step: number;
  /* Units per CSS pixel of pointer travel, read when a drag starts. */
  unitsPerPx: () => number;
  /* Writes a size to the layout without saving it: every move, and the rollback. */
  preview: (value: number) => void;
  /* Saves a size: once per release or key. */
  commit: (value: number) => void;
  /* Sees every move's unclamped size; returning true ends the drag as a release. */
  onOvershoot?: (raw: number, at: Point) => boolean | void;
  /* A locked handle ignores the pointer (keys still work); onLockedPress hears the attempt. */
  locked?: boolean;
  onLockedPress?: (at: Point) => void;
};

// One resize at a time across every handle: each drag restores the page state
// it found, so overlapping drags (mouse plus touch) would restore each other's flags.
let resizing = false;

// Restores a dataset entry to what it was before the drag, absent included.
function restore(map: DOMStringMap, key: string, previous: string | undefined) {
  if (previous === undefined) delete map[key];
  else map[key] = previous;
}

export function ResizeHandle(props: ResizeHandleProps) {
  const { label, className, controls, orientation, pane, value, min, max, step, preview, commit, locked = false } = props;
  const ref = useRef<HTMLDivElement>(null);
  const axis = orientation === "vertical" ? "x" : "y";
  // Listeners live for the whole mount; this reads the current render's props.
  const latest = useEffectEvent(() => props);

  useEffect(() => {
    const handle = ref.current!;
    let drag: {
      pointerId: number;
      from: Point;
      start: number;
      current: number;
      unitsPerPx: number;
      previous: { dragging?: string; grabbing?: string; axis?: string; cursor: string };
    } | null = null;

    function finish(save: boolean) {
      if (!drag) return;
      const { pointerId, start, current, previous } = drag;
      drag = null;
      resizing = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKey, true);
      handle.removeEventListener("lostpointercapture", onCancel);
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      delete handle.dataset.dragging;
      const root = document.documentElement;
      restore(document.body.dataset, "dragging", previous.dragging);
      restore(root.dataset, "cursorGrabbing", previous.grabbing);
      restore(root.dataset, "cursorAxis", previous.axis);
      document.body.style.cursor = previous.cursor;
      if (save) latest().commit(current);
      else latest().preview(start);
    }
    function onDown(e: PointerEvent) {
      if (e.button !== 0 || !e.isPrimary || resizing) return;
      e.preventDefault();
      const p = latest();
      const from = { x: e.clientX, y: e.clientY };
      if (p.locked) {
        p.onLockedPress?.(from);
        return;
      }
      // Capture keeps the drag when the pointer crosses an <iframe> (the resume
      // PDF); body[data-dragging] also turns iframe pointer events off in CSS.
      // It comes first: if it throws, no drag has begun.
      handle.setPointerCapture(e.pointerId);
      resizing = true;
      const root = document.documentElement;
      drag = {
        pointerId: e.pointerId,
        from,
        start: p.value,
        current: p.value,
        unitsPerPx: p.unitsPerPx(),
        previous: {
          dragging: document.body.dataset.dragging,
          grabbing: root.dataset.cursorGrabbing,
          axis: root.dataset.cursorAxis,
          cursor: document.body.style.cursor,
        },
      };
      handle.dataset.dragging = "true";
      document.body.dataset.dragging = "true";
      // The native cursor for when the custom cursor is off; it hides this one.
      document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
      root.dataset.cursorGrabbing = "true";
      root.dataset.cursorAxis = axis;
      handle.addEventListener("lostpointercapture", onCancel);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("blur", onBlur);
      window.addEventListener("keydown", onKey, true);
    }
    function onMove(e: PointerEvent) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const p = latest();
      const travel = axis === "x" ? e.clientX - drag.from.x : e.clientY - drag.from.y;
      const raw = drag.start + (p.pane === "before" ? travel : -travel) * drag.unitsPerPx;
      drag.current = Math.min(p.max, Math.max(p.min, raw));
      p.preview(drag.current);
      if (p.onOvershoot?.(raw, { x: e.clientX, y: e.clientY }) === true) finish(true);
    }
    function onUp(e: PointerEvent) {
      // A handle hidden mid-drag (the terminal closed) leaves nothing on screen to keep.
      if (drag && e.pointerId === drag.pointerId) finish(handle.getClientRects().length > 0);
    }
    function onCancel(e: PointerEvent) {
      if (drag && e.pointerId === drag.pointerId) finish(false);
    }
    function onBlur() {
      finish(false);
    }
    // Escape belongs to the drag: without this the shell's Escape would also
    // close the terminal being resized.
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }

    handle.addEventListener("pointerdown", onDown);
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      finish(false);
    };
  }, [axis]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Modified arrows belong to the browser (Alt+Arrow is Back and Forward).
    if (e.currentTarget.dataset.dragging === "true" || e.altKey || e.ctrlKey || e.metaKey) return;
    // Which way each arrow moves the handle; the pane grows when it moves away from it.
    const moves: Record<string, number> = axis === "x" ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 };
    let next: number;
    if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    else if (e.key in moves) {
      const direction = moves[e.key] * (pane === "before" ? 1 : -1);
      next = Math.min(max, Math.max(min, value + direction * step));
    } else return;
    e.preventDefault();
    if (next === value) return;
    preview(next);
    commit(next);
  }

  return (
    <div
      ref={ref}
      className={className}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-controls={controls}
      aria-orientation={orientation}
      aria-valuenow={Math.round(value)}
      aria-valuemin={Math.round(min)}
      aria-valuemax={Math.round(max)}
      data-resize-axis={axis}
      data-locked={locked}
      onKeyDown={onKeyDown}
    />
  );
}
