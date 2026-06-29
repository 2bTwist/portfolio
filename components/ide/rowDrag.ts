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
/** True once if the last interaction was a drag, so the row's onClick can cancel
 *  its navigation. Self-clearing. */
export function consumeSuppressClick(): boolean {
  const s = suppressClick;
  suppressClick = false;
  return s;
}

function overEditor(x: number, y: number): boolean {
  const el = document.elementFromPoint(x, y) as Element | null;
  return !!el?.closest?.("[data-editor-root]");
}

export function beginRowDrag(e: ReactPointerEvent, href: string, name: string) {
  if (e.button !== 0) return; // left button only
  const startX = e.clientX;
  const startY = e.clientY;
  const splittable = !!paneFor(href);
  let started = false;

  function move(ev: PointerEvent) {
    if (!started) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < THRESHOLD) return;
      started = true;
      startDrag(href, name, ev.clientX, ev.clientY);
      document.documentElement.style.cursor = "grabbing";
    }
    moveChip(ev.clientX, ev.clientY);
    if (splittable) setOver(overEditor(ev.clientX, ev.clientY));
  }

  function up(ev: PointerEvent) {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    if (!started) return;
    document.documentElement.style.cursor = "";
    if (splittable && overEditor(ev.clientX, ev.clientY)) openRight(href);
    endDrag();
    // Cancel the click that follows this release so the row doesn't also navigate.
    suppressClick = true;
    setTimeout(() => {
      suppressClick = false;
    }, 60);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}
