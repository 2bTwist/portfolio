"use client";

/* Lazy mount for a cert badge. The CSS BadgeFallback renders immediately (and
   stays the whole story under reduced-motion or when WebGL is unavailable). The
   R3F chunk (three/fiber/drei) is dynamic ssr:false and only imported once the
   badge scrolls within 200px of the viewport, then overlays the fallback the
   moment its GL context is ready — so there's no empty flash and no layout
   shift (both layers fill the same aspect-ratio box). */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Cert } from "@/data/certs";
import { BadgeFallback } from "./BadgeFallback";

const BadgeScene = dynamic(() => import("./BadgeScene"), { ssr: false });

function canUpgrade(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function BadgeLazy({ cert, faceSvg }: { cert: Cert; faceSvg: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mount3D, setMount3D] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canUpgrade()) return; // keep the fallback forever
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMount3D(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="badge-mount">
      {mount3D ? (
        <BadgeScene cert={cert} faceSvg={faceSvg} onReady={() => setReady(true)} />
      ) : null}
      {!ready ? (
        <div className="badge-fallback-layer">
          <BadgeFallback cert={cert} faceSvg={faceSvg} />
        </div>
      ) : null}
    </div>
  );
}
