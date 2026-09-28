/* Palette (theme) store. The palette lives outside React (inline vars on
   <body>, a saved preference), so it is a module store read with
   useSyncExternalStore: a switch is a plain DOM write plus a re-render of the
   usePaletteIndex() subscribers, not a context update.

   The client starts from the saved palette, which the pre-paint script has
   already applied (app/lib/preferences.ts); the server and hydration see the
   default, so the swatches catch up one render after the colours. */

import { useSyncExternalStore } from "react";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";
import { PREFERENCES, loadPreference, savePreference } from "@/app/lib/preferences";

let paletteIndex = loadPreference(PREFERENCES.palette);
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
      savePreference(PREFERENCES.palette, paletteIndex);
    }, 0),
  );
}

// Puts the saved palette back after React has rendered <body> on the client (an
// error page, or a root that failed to hydrate), which drops the variables the
// pre-paint script set. After a normal hydration they are in place: a no-op.
export function restoreSavedPalette() {
  applyPalette(paletteIndex);
}

export function setPaletteIndex(i: number) {
  if (!Number.isInteger(i) || !PALETTES[i]) return;
  if (i !== paletteIndex) {
    paletteIndex = i;
    listeners.forEach((listener) => listener());
  }
  applyPalette(i);
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
