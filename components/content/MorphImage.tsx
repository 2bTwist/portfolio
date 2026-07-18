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
   the element with the same `morphKey` — mounts, it reads that rect and flies a
   fixed-position clone from the old rect to its own rect, then reveals itself.
   The clone lives at the top of <body>, so it is never clipped by the card's
   `overflow:hidden`.

   Three rules keep it honest as a *shared* transition (not a free-for-all):
   - Different page (`from`): only morph when the twin was on another page.
   - Different `role`: only morph a `card` against a `banner` (the detail hero),
     never card-to-card. Without this, the same project cards on the home grid
     and the /projects grid would all morph just from navigating between them.
   - `role === "card"` arrivals scroll the card to center first, so going back
     focuses the exact card you clicked and the morph lands on it.

   Pure client animation, no server round-trip, no router coupling. */

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useInsertionEffect, useLayoutEffect, useRef } from "react";

// Run before paint on the client (so we can hide the element + start the clone
// with no flash), but fall back to useEffect during SSR to avoid React's
// "useLayoutEffect does nothing on the server" warning.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Kind = "card" | "banner";

interface Entry {
  rect: DOMRect;
  src: string;
  t: number;
  from: string; // pathname the element was on when it recorded
  kind: Kind;
}
// Last on-screen rect per morph key. A module singleton: the leaving page
// writes, the arriving page reads. Survives client navigation (same document).
const store = new Map<string, Entry>();
// The path of the page we most recently left. Only entries recorded on THAT
// page may morph, so old banner entries from detail pages visited earlier
// (still in `store`) don't all fire when you return to the grid.
//
// Written ONLY by <MorphRouteSync/> (mounted once in the Shell), which sees
// every route change. It used to be written from MorphImage unmounts, but pages
// with no morph elements then never counted as "left": README → project →
// about → README replayed the project's stale banner morph because about.md
// never advanced the pointer.
let lastLeftPath = "";
let currentPath = "";
const MAX_AGE = 300_000; // ms — generous (reading a detail page takes a while)
const DURATION = 380;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/* Advances the previous/current page pointers on EVERY route change, whether or
   not the page contains a MorphImage. useInsertionEffect so it runs before the
   arriving twins' layout effects consume their entries in the same commit. */
export function MorphRouteSync() {
  const pathname = usePathname();
  useInsertionEffect(() => {
    if (pathname !== currentPath) {
      lastLeftPath = currentPath;
      currentPath = pathname;
    }
  }, [pathname]);
  return null;
}

export function MorphImage({
  morphKey,
  src,
  alt = "",
  className,
  sizes,
  priority,
  kind = "card",
}: {
  morphKey: string;
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /* "card" in a list/grid, "banner" on a detail page. The morph only fires
     between a card and a banner, never card-to-card. (Named `kind`, not `role`,
     so it doesn't shadow the ARIA `role` attribute.) */
  kind?: Kind;
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

    // Morph only a genuine cross-page card<->banner pair, AND only when the twin
    // was on the page we just left (not a detail page visited earlier whose
    // banner entry is still lingering in the store).
    const shouldMorph =
      !!prev &&
      prev.from !== here &&
      prev.from === lastLeftPath &&
      prev.kind !== kind &&
      Date.now() - prev.t < MAX_AGE;

    let raf = 0;
    if (shouldMorph && reduce && prev) {
      // Reduced motion: positioning isn't motion. Still center the card a back
      // navigation returns to (so the reader resumes where they were), just
      // without the flying clone.
      raf = requestAnimationFrame(() => {
        if (!el.isConnected) return;
        if (kind === "card") {
          (el.closest(".proj-card") ?? el).scrollIntoView({
            block: "center",
            behavior: "instant" as ScrollBehavior,
          });
        }
      });
    } else if (shouldMorph && !reduce && prev) {
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
        if (kind === "card") {
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
        // (lastLeftPath is owned by MorphRouteSync, not written here.)
        store.set(morphKey, { rect, src: loaded, t: Date.now(), from: here, kind });
      }
    };
  }, [morphKey, src, kind]);

  return (
    <span ref={ref} className="morph-img-wrap">
      <Image src={src} alt={alt} fill className={className} sizes={sizes} priority={priority} />
    </span>
  );
}
