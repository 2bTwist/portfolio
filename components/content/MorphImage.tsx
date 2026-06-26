"use client";

/* Shared-element "hero" morph, hand-rolled with the Web Animations API.

   Why not Next/React View Transitions: they morph on <Link> clicks but NOT on
   the browser/hardware back button — React deliberately skips view-transition
   animations for popstate so scroll restoration stays synchronous (see
   facebook/react ViewTransition docs + vercel/next.js#94369). This works on
   EVERY navigation, including back/swipe, because it doesn't depend on the
   router at all.

   How it works (FLIP): a MorphImage records its on-screen rect (and the exact
   loaded image URL) plus the PAGE it was on when it unmounts. When its twin —
   the element with the same `morphKey` — mounts on a DIFFERENT page, it reads
   that rect and flies a fixed-position clone from the old rect to its own rect,
   then reveals itself. The clone lives at the top of <body>, so it is never
   clipped by the card's `overflow:hidden`.

   Two rules keep it honest as a *shared* transition (not a free-for-all):
   - We only morph when the recorded twin was on a DIFFERENT page (`from`). That
     stops every card on a grid from animating on back: each grid card recorded
     its own rect on the way out, but those records share the grid's path, so
     they're skipped. Only the one card whose twin (the detail banner) lived on
     another page actually morphs.
   - `centerOnArrive` (cards) scrolls the arriving card to the viewport center
     before measuring, so going back focuses the exact card you clicked and the
     morph lands on it.

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
  from: string; // pathname the element was on when it recorded
}
// Last on-screen rect per morph key. A module singleton: the leaving page
// writes, the arriving page reads. Survives client navigation (same document).
const store = new Map<string, Entry>();
const MAX_AGE = 300_000; // ms — generous (reading a detail page takes a while)
const DURATION = 380;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export function MorphImage({
  morphKey,
  src,
  alt = "",
  className,
  sizes,
  priority,
  centerOnArrive = false,
}: {
  morphKey: string;
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /* When this element arrives as the shared target (e.g. a grid card on back),
     scroll it to the viewport center before the morph lands. */
  centerOnArrive?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The page this element lives on, captured at mount (closure-stable, so the
    // unmount cleanup records the *origin* page even after the URL has changed).
    const here = window.location.pathname;

    const prev = store.get(morphKey);
    store.delete(morphKey); // consume

    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Only a genuine cross-page twin morphs (see header). Same-page records
    // (e.g. the other grid cards) are consumed above but never animated.
    const crossPage = !!prev && prev.from !== here && Date.now() - prev.t < MAX_AGE;

    let raf = 0;
    if (crossPage && !reduce && prev) {
      // Hide the destination from the very first paint so there's never a
      // double image (real + clone). The clone is the only thing on screen
      // until it lands.
      el.style.visibility = "hidden";

      // Defer the rest one frame: the router restores scroll for a back
      // navigation SYNCHRONOUSLY during commit (that's why popstate can't use
      // native view transitions). Running after that frame lets our centering
      // win and, crucially, lets us measure the card's FINAL position so the
      // clone lands exactly on it instead of detaching.
      raf = requestAnimationFrame(() => {
        // Strict Mode (dev) double-invokes effects (mount, cleanup, mount); the
        // element stays connected across that, but a real unmount detaches it.
        // Bail only on a genuine detach so the morph still runs in dev.
        if (!el.isConnected) {
          el.style.visibility = "";
          return;
        }
        if (centerOnArrive) {
          (el.closest(".proj-card") ?? el).scrollIntoView({
            block: "center",
            behavior: "instant" as ScrollBehavior,
          });
        }
        const last = el.getBoundingClientRect();
        const first = prev.rect;
        if (last.width === 0 || last.height === 0 || first.width === 0) {
          el.style.visibility = "";
          return;
        }
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
      });
    }

    // Leave: record where we are (and the exact image the browser loaded, so the
    // clone uses the already-cached bytes) for our twin on the next page.
    return () => {
      // Deliberately do NOT cancel `raf` here: under Strict Mode this cleanup
      // fires between the two mounts, and cancelling would kill the morph. The
      // rAF guards itself with el.isConnected for real unmounts.
      void raf;
      const rect = el.getBoundingClientRect();
      const img = el.querySelector("img");
      const loaded = img?.currentSrc || img?.src || src;
      if (rect.width > 0 && rect.height > 0) {
        store.set(morphKey, { rect, src: loaded, t: Date.now(), from: here });
      }
    };
  }, [morphKey, src, centerOnArrive]);

  return (
    <span ref={ref} className="morph-img-wrap">
      <Image src={src} alt={alt} fill className={className} sizes={sizes} priority={priority} />
    </span>
  );
}
