/* Pointer-based drag from an Explorer row into the editor to open a split pane.
   Begins only after the pointer moves past a small threshold, so a plain click
   still navigates. On release over the editor, a split opens (for registry-backed
   files); otherwise it's a no-op. The row's click is suppressed when a drag
   actually happened so it doesn't also navigate. */

import type { PointerEvent as ReactPointerEvent } from "react";
import { startDrag, moveChip, setOver, endDrag } from "./dragStore";
import { paneFor } from "./paneRegistry";
import { openRight } from "./splitStore";

const THRESHOLD = 6; // px before a press becomes a drag

let suppressClick = false;
let cancelActiveDrag: (() => void) | null = null;
/** True once if the last interaction was a drag, so the row's onClick can cancel
 *  its navigation. Self-clearing. */
function clearClickSuppression() {
  suppressClick = false;
  window.removeEventListener("pointerdown", clearClickSuppression, true);
}
export function consumeSuppressClick(event: { detail: number }): boolean {
  // Keyboard activation is never part of a pointer drag.
  if (event.detail === 0) return false;
  const suppressed = suppressClick;
  clearClickSuppression();
  return suppressed;
}

function overEditor(x: number, y: number): boolean {
  const el = document.elementFromPoint(x, y) as Element | null;
  return !!el?.closest?.("[data-editor-root]");
}

export function beginRowDrag(e: ReactPointerEvent, href: string, name: string) {
  if (e.button !== 0 || !e.isPrimary) return;
  cancelActiveDrag?.();
  const source = e.currentTarget;
  const pointerId = e.pointerId;
  const startX = e.clientX;
  const startY = e.clientY;
  const splittable = !!paneFor(href);
  const previousCursor = document.documentElement.style.cursor;
  let started = false;
  let finished = false;

  function finish(drop?: PointerEvent) {
    if (finished) return;
    finished = true;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancelPointer);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("blur", cancel);
    document.removeEventListener("visibilitychange", onVisibility);
    source.removeEventListener("lostpointercapture", cancelPointer);
    source.removeEventListener("dragstart", preventNativeDrag);
    if (source.hasPointerCapture(pointerId)) source.releasePointerCapture(pointerId);
    if (cancelActiveDrag === cancel) cancelActiveDrag = null;
    if (!started) return;
    document.documentElement.style.cursor = previousCursor;
    if (drop && splittable && overEditor(drop.clientX, drop.clientY)) openRight(href);
    endDrag();
    // A captured pointer can click its original link after a drop or Escape.
    suppressClick = true;
    window.addEventListener("pointerdown", clearClickSuppression, { capture: true, once: true });
  }
  function cancel() { finish(); }
  function cancelPointer(event: Event) {
    if ((event as PointerEvent).pointerId === pointerId) cancel();
  }
  function preventNativeDrag(event: Event) { event.preventDefault(); }
  function onVisibility() { if (document.hidden) cancel(); }
  function onKey(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    cancel();
  }
  function move(ev: PointerEvent) {
    if (ev.pointerId !== pointerId) return;
    if (!started) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < THRESHOLD) return;
      started = true;
      source.setPointerCapture(pointerId);
      startDrag(href, name, ev.clientX, ev.clientY);
      document.documentElement.style.cursor = "grabbing";
    }
    moveChip(ev.clientX, ev.clientY);
    if (splittable) setOver(overEditor(ev.clientX, ev.clientY));
  }
  function up(ev: PointerEvent) {
    if (ev.pointerId === pointerId) finish(ev);
  }

  cancelActiveDrag = cancel;
  source.addEventListener("dragstart", preventNativeDrag);
  source.addEventListener("lostpointercapture", cancelPointer);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancelPointer);
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("blur", cancel);
  document.addEventListener("visibilitychange", onVisibility);
}
