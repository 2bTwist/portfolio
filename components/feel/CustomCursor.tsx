"use client";

/* Arrow cursor that tracks the pointer 1:1. The tip sits exactly on the real
   pointer position, so what you aim is where the click lands (a positional lag
   made the visual trail the real pointer, so clicks missed small targets).
   Desktop pointers only (pointer:fine). Hides when the pointer leaves the
   window / the tab blurs. Written straight to the DOM (no React state). The
   "feel" comes from the hover/press scale, not from positional drag. */

import { useEffect, useRef } from "react";
import { useMounted } from "@/components/hooks/useMounted";

// Phosphor Hand / HandGrabbing (fill weight) path data, inlined so the cursor
// gets the professionally-drawn hand without pulling the icon component runtime
// into the always-loaded bundle. viewBox 0 0 256 256.
const HAND_OPEN =
  "M216,64v90.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,72.6,215.4C50.79,192.33,26.15,136,26.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,88,151.74V48a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V120a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V64.45c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,216,64Z";
const HAND_GRABBING =
  "M216,104v48a88,88,0,0,1-176,0V136a16,16,0,0,1,32,0v8a8,8,0,0,0,16,0V88a16,16,0,0,1,32,0v16a8,8,0,0,0,16,0V88a16,16,0,0,1,32,0v16a8,8,0,0,0,16,0,16,16,0,0,1,32,0Z";
// Index-finger-up hand: shown over clickable elements (links/buttons/rows) as
// the click affordance, the way the native pointer hand signals "clickable".
const HAND_POINTING =
  "M224,104v50.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,80.6,215.4C58.79,192.33,34.15,136,34.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,96,151.74V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V104a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V88a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25v-7.28c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,224,104Z";

const INTERACTIVE = "a, button, [role='button'], input, .ide-row, .ide-swatch, .ide-pill, .btn";

export function CustomCursor() {
  const elRef = useRef<HTMLDivElement>(null);
  // Render client-only (after mount) so the markup stays off the SSR/first-paint
  // critical path (it's hidden until the first pointer move anyway).
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("cursor-custom");
    root.dataset.cursorHidden = "true"; // hidden until the first move
    const el = elRef.current!;

    const onMove = (e: PointerEvent) => {
      // Re-arm after a blur/screenshot dropped the class (see `hide`), so the
      // native cursor and the custom one are never drawn at the same time.
      root.classList.add("cursor-custom");
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      root.dataset.cursorHidden = "false";
      // While actively resizing, the drag owns the grab/axis flags (the pointer
      // leaves the thin handle mid-drag), so don't fight it here.
      if (root.dataset.cursorGrabbing === "true") return;
      const target = e.target as Element | null;
      root.dataset.cursorHover = target?.closest?.(INTERACTIVE) ? "true" : "false";
      // Over a resize handle, swap the arrow for the grab hand. The explorer
      // handle grabs horizontally (hand faces left); the terminal handle grabs
      // vertically (hand faces down) — set the axis so the CSS can orient it.
      const xHandle = target?.closest?.(".ide-resize-handle") as HTMLElement | null;
      const yHandle = target?.closest?.(".ide-terminal-resize") as HTMLElement | null;
      const overX = !!xHandle && xHandle.dataset.locked !== "true";
      root.dataset.cursorGrab = overX || yHandle ? "true" : "false";
      root.dataset.cursorAxis = yHandle ? "y" : "x";
    };
    const onDown = () => (root.dataset.cursorActive = "true");
    const onUp = () => (root.dataset.cursorActive = "false");
    // Drop the class entirely so `cursor: none` is lifted and the OS cursor is
    // the ONLY one shown while the window is unfocused / a screenshot is taken.
    // onMove re-adds it the instant the pointer moves back in.
    const hide = () => {
      root.dataset.cursorHidden = "true";
      root.classList.remove("cursor-custom");
    };
    const onVisibility = () => {
      if (document.hidden) hide();
    };
    // Cancel native HTML drag (links/images/text). Otherwise press-dragging an
    // <a> (tab, explorer row, link-button) starts a browser drag: it shows a
    // ghost that snaps back AND suppresses pointermove, which freezes this
    // cursor mid-drag. The app has no native drag-and-drop, so cancelling is
    // safe and keeps the cursor tracking 1:1 throughout any drag.
    const onDragStart = (e: DragEvent) => e.preventDefault();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("dragstart", onDragStart);
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("dragstart", onDragStart);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      root.classList.remove("cursor-custom");
      delete root.dataset.cursorHidden;
      delete root.dataset.cursorHover;
      delete root.dataset.cursorActive;
      delete root.dataset.cursorGrab;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div ref={elRef} className="cursor-arrow" aria-hidden="true">
      {/* tail-less send arrow; the (0,0) vertex is the tip and sits on the real
          pointer. Thin stroke so the visual tip barely overhangs the hotspot. */}
      <svg className="cursor-arrow-svg" width="18" height="22" viewBox="-2 -2 18 22" fill="none">
        <path
          d="M0 0 L0 17 L5.5 13.2 L12 12 Z"
          fill="var(--accent)"
          stroke="#fff"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke"
        />
      </svg>
      {/* Grab hands over the resize handle (Phosphor paths, rotated to the
          horizontal grab orientation): open hand on hover, closed while dragging. */}
      <svg className="cursor-hand cursor-hand--grab" width="26" height="26" viewBox="0 0 256 256" aria-hidden="true">
        <path d={HAND_OPEN} fill="currentColor" />
      </svg>
      <svg className="cursor-hand cursor-hand--grabbing" width="26" height="26" viewBox="0 0 256 256" aria-hidden="true">
        <path d={HAND_GRABBING} fill="currentColor" />
      </svg>
      {/* pointing hand over clickable elements; white outline matches the arrow. */}
      <svg className="cursor-hand cursor-hand--point" width="26" height="26" viewBox="0 0 256 256" aria-hidden="true">
        <path d={HAND_POINTING} fill="currentColor" stroke="#fff" strokeWidth="10" strokeLinejoin="round" paintOrder="stroke" />
      </svg>
    </div>
  );
}
