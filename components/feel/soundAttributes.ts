/* Interface sounds (see CONTEXT.md): a control declares the sound a pointer press on
   it plays with a data-sound attribute, typed below, and SoundProvider plays the
   innermost declared one. Class names stay styling hooks; nothing reads them for sound. */

import type { sfx } from "./sound";

type Sound = keyof typeof sfx;

/* A press sound; "toggle" opens or closes by the control's aria-expanded; "none" marks
   a silent area inside a sounding one (the palette panel inside its backdrop). */
export type PressSound = Extract<Sound, "press" | "view" | "open" | "close" | "switch" | "pop"> | "toggle" | "none";
/* Plays once as the pointer comes onto the element. */
export type HoverSound = Extract<Sound, "slide" | "flip">;

// Typed on every element, so a misspelt sound fails the type check, and the
// attributes cost no code at the call site.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match React's declaration to merge
  interface HTMLAttributes<T> {
    "data-sound"?: PressSound;
    "data-sound-hover"?: HoverSound;
  }
}

// The sound a press on `target` plays, if any.
export function pressSound(target: Element): Sound | null {
  const control = target.closest("[data-sound]");
  const declared = control?.getAttribute("data-sound") as PressSound | null | undefined;
  if (!control || !declared || declared === "none") return null;
  if (declared === "toggle") return control.getAttribute("aria-expanded") === "true" ? "close" : "open";
  return declared;
}

// The element with a hover sound under `target`, so it plays once per element.
export function hoverOwner(target: Element): Element | null {
  return target.closest("[data-sound-hover]");
}

export function hoverSound(owner: Element): HoverSound {
  return owner.getAttribute("data-sound-hover") as HoverSound;
}
