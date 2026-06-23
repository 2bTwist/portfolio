"use client";

/* Minimal custom cursor: a small accent dot that snaps to the pointer plus a
   ring that lags slightly behind and grows over interactive targets. Desktop
   pointers only (pointer:fine) and never under reduced-motion — in those cases
   it renders nothing and the native cursor is untouched. Movement is written
   straight to the DOM via rAF (no React state), so it never costs an INP render. */

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, [role='button'], input, .ide-row, .ide-swatch, .ide-pill, .btn";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    enabledRef.current = true;
    const root = document.documentElement;
    root.classList.add("cursor-custom");

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let raf = 0;
    let running = false;

    // The ring eases toward the pointer; the loop self-suspends once it has
    // caught up, so there's no idle rAF burning CPU (and the page isn't held in
    // perpetual animation). onMove restarts it.
    const loop = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (Math.abs(tx - rx) < 0.3 && Math.abs(ty - ry) < 0.3) {
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
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
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
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
