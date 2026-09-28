/* Split-editor state as a module-singleton external store (useSyncExternalStore,
   the same idiom as SoundProvider's `muted` and the music player). It lives
   OUTSIDE the Overlay/Session contexts on purpose: toggling overlays or changing
   the pathname must not re-render pane content, and the split layout has to
   survive navigation of the primary pane.

   - rightHref: the Explorer href shown in the second (right) pane, or null when
     not split. SSR snapshot is null, so the server renders a single pane and the
     primary route stays the crawlable document.
   - leftFraction: width share of the left pane (0..1), persisted across reloads.
     The divider writes the DOM imperatively while dragging and only commits here
     on release, so dragging never re-renders the panes. */

import { useSyncExternalStore } from "react";
import { PREFERENCES, loadPreference, savePreference } from "@/app/lib/preferences";

export type SplitState = { rightHref: string | null; leftFraction: number };

const DEFAULT_FRACTION = PREFERENCES.splitRatio.fallback;
export const [MIN_FRACTION, MAX_FRACTION] = PREFERENCES.splitRatio.range;

const clampFraction = (f: number) => Math.min(MAX_FRACTION, Math.max(MIN_FRACTION, f));

let state: SplitState = { rightHref: null, leftFraction: DEFAULT_FRACTION };
const SERVER_STATE: SplitState = state;
const listeners = new Set<() => void>();

let hydratedFraction = false;
function setState(patch: Partial<SplitState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  // Pull the persisted fraction in on the first client subscription.
  if (!hydratedFraction) {
    hydratedFraction = true;
    const stored = loadPreference(PREFERENCES.splitRatio);
    if (stored !== state.leftFraction) state = { ...state, leftFraction: stored };
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Open (or replace) the right pane with the given Explorer href. */
export function openRight(href: string) {
  setState({ rightHref: href });
}

export function closeRight() {
  setState({ rightHref: null });
}

/** Persist + broadcast the final left/right ratio (called by the divider on
 *  pointerup; mid-drag is imperative and does not touch the store). */
export function setLeftFraction(f: number) {
  const next = clampFraction(f);
  savePreference(PREFERENCES.splitRatio, next);
  setState({ leftFraction: next });
}

export function useSplit(): SplitState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
