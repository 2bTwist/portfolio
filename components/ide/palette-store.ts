/* Palette (theme) store. The palette lives outside React (inline vars on
   <body>, localStorage), so it is a module store read with
   useSyncExternalStore: a switch is a plain DOM write plus a re-render of the
   usePaletteIndex() subscribers, not a context update. */

import { useSyncExternalStore } from "react";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";

const PALETTE_KEY = "ide.palette";

let paletteIndex = DEFAULT_PALETTE_INDEX;
const listeners = new Set<() => void>();
let writes = 0;

// Write the palette vars onto <body> (overriding the server default inline
// vars). The recolour is one page-wide restyle, so it stays out of the click:
// the frame that paints it also restyles it, with palette transitions held off
// until that frame is done. Persisting waits too; it is not needed to paint.
function applyPalette(i: number) {
  const entries = Object.entries(PALETTES[i].vars);
  if (entries.every(([key, value]) => document.body.style.getPropertyValue(key) === value)) return;

  // Only palette-sensitive transition declarations opt into this guard.
  // Avoid injecting a universal stylesheet, which invalidates every selector.
  document.body.style.setProperty("--palette-transition", "none");
  for (const [key, value] of entries) {
    document.body.style.setProperty(key, value);
  }
  // A timeout queued from a frame callback runs after that frame's style and
  // paint. A newer switch owns the guard until its own frame has painted.
  const write = ++writes;
  requestAnimationFrame(() =>
    setTimeout(() => {
      if (write !== writes) return;
      document.body.style.removeProperty("--palette-transition");
      try {
        localStorage.setItem(PALETTE_KEY, String(paletteIndex));
      } catch {
        /* private mode / disabled storage — non-fatal */
      }
    }, 0),
  );
}

export function setPaletteIndex(i: number) {
  if (!Number.isInteger(i) || !PALETTES[i]) return;
  if (i !== paletteIndex) {
    paletteIndex = i;
    listeners.forEach((listener) => listener());
  }
  applyPalette(i);
}

// The stored choice, when it is a valid palette other than the server default.
export function storedPaletteIndex(): number | null {
  let stored: number;
  try {
    stored = Number(localStorage.getItem(PALETTE_KEY));
  } catch {
    return null;
  }
  return Number.isInteger(stored) && PALETTES[stored] && stored !== DEFAULT_PALETTE_INDEX
    ? stored
    : null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePaletteIndex(): number {
  return useSyncExternalStore(subscribe, () => paletteIndex, () => DEFAULT_PALETTE_INDEX);
}
