"use client";

/* Subtle UI sound layer. A single delegated listener plays the synthesized click
   each control declares with a data-sound attribute (soundAttributes.ts), so server-rendered
   components (the tactile button, the tiles) need no client wiring. Default ON, but the AudioContext
   only unlocks on the first user gesture, so nothing ever plays on page load.
   Muting persists; reduced-motion and reduced-data disable it entirely.

   Mute is a preference (app/lib/preferences.ts) and the media gates are external
   state, both read via useSyncExternalStore so there's no setState-in-effect and no
   hydration mismatch (server snapshot = sound on, not muted). */

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { sfx, warmupSound } from "./sound";
import { hoverOwner, hoverSound, pressSound } from "./soundAttributes";
import { PREFERENCES } from "@/app/lib/preferences";
import { getPreference, setPreference, usePreference } from "@/components/hooks/usePreference";

type SoundCtx = {
  muted: boolean;
  toggleMuted: () => void;
  play: (kind: keyof typeof sfx) => void;
  /* False when muted, or when reduced motion or reduced data is requested (the
     same gate as every interface sound). Audio played outside `play` (the
     terminal's piano and applause) checks this so one policy silences all. */
  soundAllowed: boolean;
};
const Ctx = createContext<SoundCtx | null>(null);

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

// Every sound goes through here. The mark lets tests see which sound played
// without audio; it writes nothing to the DOM. Only the latest mark per sound
// is kept, so a long session does not accumulate one entry per press.
function emit(kind: keyof typeof sfx) {
  performance.clearMarks(`sound:${kind}`);
  performance.mark(`sound:${kind}`);
  sfx[kind]();
}

function toggleMuted() {
  setPreference(PREFERENCES.soundMuted, !getPreference(PREFERENCES.soundMuted));
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const muted = usePreference(PREFERENCES.soundMuted);
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, serverFalse);
  const allowed = !muted && !reduced;

  useEffect(() => {
    if (!allowed) return;

    // Warm the AudioContext on the FIRST real gesture, not on mount. Creating it
    // at mount cost ~200ms TBT under throttle (new AudioContext() does hardware
    // audio init) and consumed the entire page-load blocking budget. The first
    // pointermove precedes the first click, so warming there still has the ctx
    // ready before any sound plays — while staying off the load critical path.
    // pointerdown/keydown are belt-and-suspenders for keyboard-first users.
    let warmed = false;
    const warmEvents = ["pointermove", "pointerdown", "keydown"] as const;
    const warm = () => {
      if (warmed) return;
      warmed = true;
      warmupSound();
      for (const ev of warmEvents) window.removeEventListener(ev, warm);
    };
    for (const ev of warmEvents) window.addEventListener(ev, warm, { passive: true });

    // Controls declare their sounds (soundAttributes.ts); the innermost one plays.
    function onPointerDown(e: PointerEvent) {
      if (!(e.target instanceof Element)) return;
      const sound = pressSound(e.target);
      if (sound) emit(sound);
    }

    // Hover sounds play once per element: moving within it (a tile's logo) is
    // silent, and leaving to the gap resets, so re-entering plays again.
    let lastOwner: Element | null = null;
    function onPointerOver(e: PointerEvent) {
      const owner = e.target instanceof Element ? hoverOwner(e.target) : null;
      if (owner === lastOwner) return;
      lastOwner = owner;
      if (owner) emit(hoverSound(owner));
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerover", onPointerOver);
    return () => {
      for (const ev of warmEvents) window.removeEventListener(ev, warm);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerover", onPointerOver);
    };
  }, [allowed]);

  // React Compiler memoizes this; no useCallback needed.
  // Imperative one-shot for sounds not tied to a delegated click (e.g. the
  // sidebar limit bonk). Respects the same mute / reduced gates.
  const play = (kind: keyof typeof sfx) => {
    if (allowed) emit(kind);
  };

  return <Ctx.Provider value={{ muted, toggleMuted, play, soundAllowed: allowed }}>{children}</Ctx.Provider>;
}

export function useSound() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSound must be used within SoundProvider");
  return c;
}
