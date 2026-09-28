/* Interface sounds (see CONTEXT.md): a control declares the sound a pointer press on
   it plays, and SoundProvider plays the innermost declared one. Class names stay
   styling hooks; nothing reads them for sound. Server- and client-importable. */

import type { sfx } from "./sound";

type Sound = keyof typeof sfx;

/* A press sound; "toggle" opens or closes by the control's aria-expanded; null marks a
   silent area inside a sounding one (the palette panel inside its backdrop). */
export type PressSound = Extract<Sound, "press" | "view" | "open" | "close" | "switch" | "pop"> | "toggle" | null;
/* Plays once as the pointer comes onto the element. */
export type HoverSound = Extract<Sound, "slide" | "flip">;

const PRESS = "data-sound";
const HOVER = "data-sound-hover";

export function soundProps(press: PressSound, hover?: HoverSound) {
  return { [PRESS]: press ?? "none", ...(hover && { [HOVER]: hover }) };
}

// The sound a press on `target` plays, if any.
export function pressSound(target: Element): Sound | null {
  const control = target.closest(`[${PRESS}]`);
  const declared = control?.getAttribute(PRESS);
  if (!control || !declared || declared === "none") return null;
  if (declared === "toggle") return control.getAttribute("aria-expanded") === "true" ? "close" : "open";
  return declared as Sound;
}

// The element with a hover sound under `target`, so it plays once per element.
export function hoverOwner(target: Element): Element | null {
  return target.closest(`[${HOVER}]`);
}

export function hoverSound(owner: Element): HoverSound {
  return owner.getAttribute(HOVER) as HoverSound;
}
