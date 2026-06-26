"use client";

/* Shared-element "hero" morph, hand-rolled with the Web Animations API.

   Why not Next/React View Transitions: they morph on <Link> clicks but NOT on
   the browser/hardware back button — React deliberately skips view-transition
   animations for popstate so scroll restoration stays synchronous (see
   facebook/react ViewTransition docs + vercel/next.js#94369). This works on
   EVERY navigation, including back/swipe, because it doesn't depend on the
   router at all.

   How it works (FLIP): every MorphImage records its on-screen rect (and the
   exact loaded image URL) into a shared store when it unmounts. When its twin
   — the element with the same `morphKey` on the next page — mounts, it reads
   that rect and flies a fixed-position clone from the old rect to its own rect,
   then reveals itself. The clone lives at the top of <body>, so it is never
   clipped by the card's `overflow:hidden` (the reason an in-place transform
   fails for the card<-banner direction).

   Pure client animation, no server round-trip, no router coupling. */

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";

// Run before paint on the client (so we can hide the element + start the clone
// with no flash), but fall back to useEffect during SSR to avoid React's
// "useLayoutEffect does nothing on the server" warning.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Entry {
  rect: DOMRect;
  src: string;
  t: number;
}
// Last on-screen rect per morph key. A module singleton: the leaving page
// writes, the arriving page reads. Survives client navigation (same document).
const store = new Map<string, Entry>();
const MAX_AGE = 1500; // ms — only morph across a *recent* navigation
const DURATION = 360;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function MorphImage({
  morphKey,
  src,
  alt = "",
  className,
  sizes,
  priority,
}: {
  morphKey: string;
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prev = store.get(morphKey);
    store.delete(morphKey);

    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Arrive: if our twin recorded a recent rect, fly a clone from there to here.
    if (prev && Date.now() - prev.t < MAX_AGE && !reduce) {
      const last = el.getBoundingClientRect();
      const first = prev.rect;
      if (last.width > 0 && last.height > 0 && first.width > 0) {
        const clone = document.createElement("img");
        clone.src = prev.src;
        clone.setAttribute("aria-hidden", "true");
        clone.alt = "";
        Object.assign(clone.style, {
          position: "fixed",
          left: `${last.left}px`,
          top: `${last.top}px`,
          width: `${last.width}px`,
          height: `${last.height}px`,
          objectFit: "contain",
          margin: "0",
          zIndex: "2147483646",
          pointerEvents: "none",
          willChange: "transform",
        } as CSSStyleDeclaration);
        document.body.appendChild(clone);

        // Hide the real element until the clone lands, so there is one image.
        el.style.visibility = "hidden";

        const dx = first.left - last.left;
        const dy = first.top - last.top;
        const sx = first.width / last.width;
        const sy = first.height / last.height;

        const anim = clone.animate(
          [
            {
              transformOrigin: "top left",
              transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            },
            { transformOrigin: "top left", transform: "translate(0px, 0px) scale(1, 1)" },
          ],
          { duration: DURATION, easing: EASING },
        );
        const done = () => {
          clone.remove();
          if (ref.current) ref.current.style.visibility = "";
        };
        anim.addEventListener("finish", done);
        anim.addEventListener("cancel", done);
      }
    }

    // Leave: record where we are (and the exact image the browser loaded, so the
    // clone uses the already-cached bytes) for our twin on the next page.
    return () => {
      const rect = el.getBoundingClientRect();
      const img = el.querySelector("img");
      const loaded = img?.currentSrc || img?.src || src;
      if (rect.width > 0 && rect.height > 0) {
        store.set(morphKey, { rect, src: loaded, t: Date.now() });
      }
    };
  }, [morphKey, src]);

  return (
    <span ref={ref} className="morph-img-wrap">
      <Image src={src} alt={alt} fill className={className} sizes={sizes} priority={priority} />
    </span>
  );
}
