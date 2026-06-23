"use client";

/* Minimalist arrow cursor with physics. A single rounded pointer replaces the
   native arrow and trails the real pointer with spring-like friction, so you
   feel weight/drag as it moves and catches up. Desktop pointers only
   (pointer:fine). Under reduced-motion it still shows but snaps 1:1 (no
   friction). Movement is written straight to the DOM via rAF (no React state),
   and the loop self-suspends once the arrow has caught up. */

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, [role='button'], input, .ide-row, .ide-swatch, .ide-pill, .btn";

export function CustomCursor() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // friction: lower = heavier/more drag. 1 = instant (reduced-motion).
    const ease = reduced ? 1 : 0.2;

    const root = document.documentElement;
    root.classList.add("cursor-custom");
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
      const hovering = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
      root.dataset.cursorHover = hovering ? "true" : "false";
      start();
    };
    const onDown = () => (root.dataset.cursorActive = "true");
    const onUp = () => (root.dataset.cursorActive = "false");
    const onLeave = () => (root.dataset.cursorHidden = "true");
    const onEnter = () => (root.dataset.cursorHidden = "false");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      root.classList.remove("cursor-custom");
      delete root.dataset.cursorHover;
      delete root.dataset.cursorActive;
      delete root.dataset.cursorHidden;
    };
  }, []);

  return (
    <div ref={elRef} className="cursor-arrow" aria-hidden="true">
      <svg className="cursor-arrow-svg" width="22" height="29" viewBox="0 0 22 29" fill="none">
        {/* rounded pointer, tip anchored at (0,0) = the real pointer position */}
        <path
          d="M1.2 1.2 L1.2 22.2 L6.9 16.9 L10.7 24.6 L14.1 23 L10.3 15.4 L17.8 15.4 Z"
          fill="var(--accent)"
          stroke="var(--on-accent)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
