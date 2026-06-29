/* Platform-aware keyboard-shortcut labels. The handlers themselves are already
   cross-platform (metaKey || ctrlKey for the palette, altKey + e.code for tabs);
   this only formats the on-screen hint so Windows/Linux users see "Ctrl+K" /
   "Alt+Shift+W" instead of the macOS glyphs ⌘ / ⌥ / ⇧.

   "mod" is the primary accelerator: Cmd on macOS, Ctrl elsewhere. "alt" is the
   same physical key on both (Option on a Mac) but renders as ⌥ vs "Alt". */

import { useSyncExternalStore } from "react";

export type Mod = "mod" | "alt" | "shift" | "ctrl";

const MAC_GLYPH: Record<Mod, string> = { mod: "⌘", alt: "⌥", shift: "⇧", ctrl: "⌃" };
const PC_NAME: Record<Mod, string> = { mod: "Ctrl", alt: "Alt", shift: "Shift", ctrl: "Ctrl" };

function detectMac(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    "";
  return /mac|iphone|ipad|ipod/i.test(ua);
}

const noopSubscribe = () => () => {};

/* Reports true on the server and during hydration (the shell is Mac-styled), then
   resolves the real platform on the client. useSyncExternalStore keeps the server
   and first client render identical, so there's no hydration mismatch — only a
   one-frame label swap on non-Apple platforms. The value never changes at runtime,
   so the subscription is a no-op. */
export function useIsMac(): boolean {
  return useSyncExternalStore(noopSubscribe, detectMac, () => true);
}

/** Format a chord for display: macOS concatenates glyphs ("⌘K", "⌥⇧W"); other
 *  platforms join names with "+" ("Ctrl+K", "Alt+Shift+W"). */
export function chord(isMac: boolean, mods: Mod[], key: string): string {
  if (isMac) return mods.map((m) => MAC_GLYPH[m]).join("") + key;
  return [...mods.map((m) => PC_NAME[m]), key].join("+");
}
