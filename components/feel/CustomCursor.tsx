"use client";

/* Arrow cursor that tracks the pointer 1:1. The tip sits exactly on the real
   pointer position, so what you aim is where the click lands (a positional lag
   made the visual trail the real pointer, so clicks missed small targets).
   Desktop pointers only (pointer:fine). Hides when the pointer leaves the
   window / the tab blurs. Written straight to the DOM (no React state). The
   "feel" comes from the hover/press scale, not from positional drag. */

import { useEffect, useRef } from "react";
import { useMounted } from "@/components/hooks/useMounted";

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
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      root.dataset.cursorHidden = "false";
      root.dataset.cursorHover = (e.target as Element | null)?.closest?.(INTERACTIVE) ? "true" : "false";
    };
    const onDown = () => (root.dataset.cursorActive = "true");
    const onUp = () => (root.dataset.cursorActive = "false");
    const hide = () => (root.dataset.cursorHidden = "true");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      root.classList.remove("cursor-custom");
      delete root.dataset.cursorHidden;
      delete root.dataset.cursorHover;
      delete root.dataset.cursorActive;
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
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
