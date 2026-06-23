"use client";

/* Minimalist arrow cursor with physics. A solid, rounded navigation-style arrow
   replaces the native pointer and trails the real pointer with light friction,
   so you feel a bit of drag without it feeling sluggish. Desktop pointers only
   (pointer:fine). Hides when the pointer leaves the window / the tab blurs.
   Movement is written straight to the DOM via rAF (no React state); the loop
   self-suspends once the arrow catches up. Under reduced-motion it snaps 1:1. */

import { useEffect, useRef } from "react";
import { useMounted } from "@/components/hooks/useMounted";

const INTERACTIVE = "a, button, [role='button'], input, .ide-row, .ide-swatch, .ide-pill, .btn";

export function CustomCursor() {
  const elRef = useRef<HTMLDivElement>(null);
  // Render client-only (after mount) so the cursor markup stays off the SSR /
  // first-paint critical path (it's hidden until the first pointer move anyway).
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // friction: lower = heavier drag. 0.45 feels responsive with a touch of lag.
    const ease = reduced ? 1 : 0.45;

    const root = document.documentElement;
    root.classList.add("cursor-custom");
    root.dataset.cursorHidden = "true"; // hidden until the first move
    const el = elRef.current!;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let raf = 0;
    let running = false;

    const loop = () => {
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) < 0.3 && Math.abs(ty - y) < 0.3) {
        x = tx;
        y = ty;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      root.dataset.cursorHidden = "false";
      root.dataset.cursorHover = (e.target as Element | null)?.closest?.(INTERACTIVE) ? "true" : "false";
      start();
    };
    const onDown = () => (root.dataset.cursorActive = "true");
    const onUp = () => (root.dataset.cursorActive = "false");
    const hide = () => (root.dataset.cursorHidden = "true");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    // leaving the window / blurring the tab hides the arrow (so it doesn't
    // freeze at the last position)
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      cancelAnimationFrame(raf);
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
      {/* symmetric arrow pointing STRAIGHT UP (no tilt); tip at (10,0).
          The svg is offset in CSS so the tip sits on the real pointer. */}
      <svg className="cursor-arrow-svg" width="26" height="27" viewBox="-3 -3 26 27" fill="none">
        <path
          d="M10 0 L18 18 L10 13.5 L2 18 Z"
          fill="var(--accent)"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
