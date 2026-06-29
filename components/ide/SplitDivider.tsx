"use client";

/* Draggable divider between the two editor panes. Mirrors the Explorer's resize
   idiom (components/ide/Explorer.tsx): native pointer listeners + imperative DOM
   writes so the drag tracks the pointer with zero React-event lag. React state
   (the persisted fraction in splitStore) is only touched on pointerup.

   During a drag we write a single CSS custom property (--lf) on the container;
   the left pane's flex-basis is `calc(var(--lf) * 100%)` (md+ only), so the right
   pane fills the rest and mobile is unaffected. Pointer capture shields iframes
   (e.g. the resume PDF pane) from swallowing the drag. */

import { useEffect, useRef, type RefObject } from "react";
import { MIN_FRACTION, MAX_FRACTION } from "./splitStore";

const clamp = (f: number) => Math.min(MAX_FRACTION, Math.max(MIN_FRACTION, f));
const KEY_STEP = 0.02;

export function SplitDivider({
  containerRef,
  fraction,
  onCommit,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  fraction: number;
  onCommit: (f: number) => void;
}) {
  const handleRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const currentRef = useRef(fraction);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    function write(f: number) {
      currentRef.current = f;
      containerRef.current?.style.setProperty("--lf", String(f));
    }
    function onDown(e: PointerEvent) {
      e.preventDefault();
      draggingRef.current = true;
      handle!.setPointerCapture?.(e.pointerId);
      document.body.dataset.dragging = "true";
      document.body.style.cursor = "col-resize";
    }
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      write(clamp((e.clientX - rect.left) / rect.width));
    }
    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      delete document.body.dataset.dragging;
      document.body.style.cursor = "";
      onCommit(currentRef.current);
    }

    handle.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      handle.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      delete document.body.dataset.dragging;
      document.body.style.cursor = "";
    };
  }, [containerRef, onCommit]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onCommit(clamp(fraction - KEY_STEP));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onCommit(clamp(fraction + KEY_STEP));
    }
  }

  return (
    <div
      ref={handleRef}
      className="ide-split-divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize split editor"
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={Math.round(MIN_FRACTION * 100)}
      aria-valuemax={Math.round(MAX_FRACTION * 100)}
      tabIndex={0}
      onKeyDown={onKeyDown}
    />
  );
}
