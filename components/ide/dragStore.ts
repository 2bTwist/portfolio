/* In-flight drag state for the pointer-based "drag a file into a split pane"
   interaction (we don't use HTML5 drag-and-drop: it can't be driven on touch
   and is impossible to verify in automation). React state only flips on
   active/over changes; the chip follows the cursor via an imperative transform
   so dragging never re-renders. */

import { useSyncExternalStore } from "react";

type DragState = { active: boolean; href: string | null; name: string | null; over: boolean };

let state: DragState = { active: false, href: null, name: null, over: false };
const SERVER: DragState = state;
const listeners = new Set<() => void>();

function emit(next: Partial<DragState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/* The floating drag chip registers its element here so the pointer loop can move
   it imperatively (no React state per pointermove). */
let chipEl: HTMLElement | null = null;
export function registerChip(el: HTMLElement | null) {
  chipEl = el;
}
export function moveChip(x: number, y: number) {
  if (chipEl) chipEl.style.transform = `translate(${x + 14}px, ${y + 18}px)`;
}

export function startDrag(href: string, name: string, x: number, y: number) {
  moveChip(x, y);
  emit({ active: true, href, name });
}
export function setOver(over: boolean) {
  if (state.over !== over) emit({ over });
}
export function endDrag() {
  emit({ active: false, href: null, name: null, over: false });
}

export function useDrag(): DragState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}
