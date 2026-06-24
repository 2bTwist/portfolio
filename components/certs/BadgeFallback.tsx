"use client";

/* CSS/SVG cert badge — the lazy R3F badge's loading state, the reduced-motion
   floor, and the no-WebGL fallback, all in one. A two-faced card on a
   perspective stage; drag to spin. Rotation is written straight to the DOM
   (imperative, no React state) so the drag is 1:1 with zero re-renders, per the
   project's instant-drag rule. The cert text is real DOM (screen-reader
   readable) and the resting tilt is static, so it's calm with motion reduced. */

import { useEffect, useRef } from "react";
import type { Cert } from "@/data/certs";

const REST_Y = -22;
const REST_X = 8;

export function BadgeFallback({ cert }: { cert: Cert }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let rotY = REST_Y;
    let rotX = REST_X;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      // Drive the sheen position from the Y rotation so the highlight sweeps as
      // the card turns (cheap, CSS var consumed by the sheen layer).
      card.style.setProperty("--sheen", `${50 + rotY / 2}%`);
    };
    apply();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      card.style.transition = "none";
      card.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.55;
      rotX -= (e.clientY - lastY) * 0.35;
      rotX = Math.max(-38, Math.min(38, rotX));
      lastX = e.clientX;
      lastY = e.clientY;
      apply();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      card.style.transition = ""; // re-enable the ease-back transition (CSS)
    };

    card.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      card.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="badge-stage">
      <div
        ref={cardRef}
        className="badge-card"
        style={{ ["--badge-accent" as string]: cert.accent ?? "var(--accent)" }}
      >
        <div className="badge-face badge-face--front">
          <span className="badge-ribbon" aria-hidden="true" />
          <span className="badge-name">{cert.name}</span>
          <span className="badge-issuer">{cert.issuer}</span>
          {cert.year ? <span className="badge-year">{cert.year}</span> : null}
          <span className="badge-sheen" aria-hidden="true" />
        </div>
        <div className="badge-face badge-face--back" aria-hidden="true">
          <span className="badge-monogram">{cert.issuer.charAt(0)}</span>
        </div>
      </div>
    </div>
  );
}
