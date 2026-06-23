"use client";

/* Subtle UI sound layer. A single delegated listener plays synthesized clicks
   for interactive targets, so server-rendered components (the tactile button,
   explorer rows) need no per-element wiring. Default ON, but the AudioContext
   only unlocks on the first user gesture, so nothing ever plays on page load.
   Muting persists; reduced-motion and reduced-data disable it entirely.

   Mute + the media gates are external state, read via useSyncExternalStore so
   there's no setState-in-effect (matches the codebase's react-compiler
   discipline) and no hydration mismatch (server snapshot = sound on, not muted). */

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { sfx } from "./sound";

type SoundCtx = { muted: boolean; toggleMuted: () => void };
const Ctx = createContext<SoundCtx | null>(null);

const STORAGE_KEY = "sound-muted";

/* --- muted: persisted, locally mutable external store --- */
let mutedValue: boolean | null = null;
const mutedListeners = new Set<() => void>();

function readMuted(): boolean {
  if (mutedValue === null) {
    mutedValue = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
  }
  return mutedValue;
}
function writeMuted(next: boolean) {
  mutedValue = next;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  mutedListeners.forEach((l) => l());
}
function subscribeMuted(cb: () => void) {
  mutedListeners.add(cb);
  return () => {
    mutedListeners.delete(cb);
  };
}

/* --- reduced motion / data external store --- */
function subscribeReduced(cb: () => void) {
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rd = window.matchMedia("(prefers-reduced-data: reduce)");
  rm.addEventListener("change", cb);
  rd.addEventListener("change", cb);
  return () => {
    rm.removeEventListener("change", cb);
    rd.removeEventListener("change", cb);
  };
}
function readReduced(): boolean {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches
  );
}
const serverFalse = () => false;

export function SoundProvider({ children }: { children: ReactNode }) {
  const muted = useSyncExternalStore(subscribeMuted, readMuted, serverFalse);
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, serverFalse);
  const allowed = !muted && !reduced;

  useEffect(() => {
    if (!allowed) return;

    function onPointerDown(e: PointerEvent) {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      const chevron = t.closest<HTMLElement>(".ide-chevron");
      if (t.closest(".btn")) {
        sfx.press();
      } else if (chevron) {
        // state-aware: an open folder is about to collapse, and vice-versa
        if (chevron.dataset.open === "true") sfx.close();
        else sfx.open();
      } else if (t.closest(".ide-tab-close")) {
        sfx.close();
      } else if (t.closest(".ide-swatch")) {
        sfx.switch();
      } else if (t.closest(".ide-row, .ide-tab, .ide-palette-item")) {
        sfx.view();
      } else if (t.closest(".ide-overlay")) {
        // clicking the backdrop dismisses the palette
        sfx.close();
      } else if (t.closest<HTMLElement>(".ide-pill")) {
        const pill = t.closest<HTMLElement>(".ide-pill")!;
        // ⌘K / terminal pills open overlays; the mute pill is a switch
        if (/mute|sound/i.test(pill.getAttribute("aria-label") || "")) sfx.switch();
        else sfx.open();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as Element | null;
      if (t?.closest?.(".ide-terminal-input") && e.key.length === 1) sfx.key();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [allowed]);

  // React Compiler memoizes this; no useCallback needed.
  const toggleMuted = () => writeMuted(!readMuted());

  return <Ctx.Provider value={{ muted, toggleMuted }}>{children}</Ctx.Provider>;
}

export function useSound() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSound must be used within SoundProvider");
  return c;
}
