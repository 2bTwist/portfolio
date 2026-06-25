"use client";

/* Where Edmond is, as a small static minimap card with his live local time.

   The map is a single Stadia "alidade_smooth" PNG (one <img>, no JS map engine,
   no iframe — keeps the perf bar). It's center-locked on Baltimore, gently
   warm-tinted toward the cream palette, with an accent pin at center and the
   location + live clock overlaid on a scrim.

   The clock reads via useSyncExternalStore so there's no setState-in-effect and
   no hydration mismatch (server snapshot is null; it fills in after mount).

   Auth: Stadia uses domain-based auth in production (allowlist the deployed
   domain in the dashboard — no key in the URL). For localhost/LAN dev set
   NEXT_PUBLIC_STADIA_API_KEY in .env.local. If the tile can't load (no key,
   offline) we fall back to a plain text badge so the hero never breaks. */

import { useState, useSyncExternalStore } from "react";
import { profile } from "@/data/profile";

const STADIA_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY;
// Retina @2x; CSS sizes the card, this is the pixel buffer we request.
const W = 320;
const H = 200;
const ZOOM = 12;

function mapSrc(): string {
  const { lat, lon } = profile.coords;
  const key = STADIA_KEY ? `&api_key=${STADIA_KEY}` : "";
  return `https://tiles.stadiamaps.com/static/alidade_smooth.png?center=${lat},${lon}&zoom=${ZOOM}&size=${W}x${H}@2x${key}`;
}

function fmt(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: profile.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function subscribe(cb: () => void) {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
}
const serverSnapshot = () => null;

export function LocationCard({ className = "" }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, fmt, serverSnapshot);
  const [failed, setFailed] = useState(false);

  const label = (
    <figcaption className="ide-minimap-label">
      <span className="ide-minimap-dot" aria-hidden="true" />
      {profile.location}
      <span className="ide-minimap-sep" aria-hidden="true">
        ·
      </span>
      <time suppressHydrationWarning>{time ?? "--:--"}</time>
      <span className="ide-minimap-zone">local</span>
    </figcaption>
  );

  if (failed) {
    return (
      <figure className={`ide-minimap is-fallback ${className}`} aria-label="Location and local time">
        {label}
      </figure>
    );
  }

  return (
    <figure className={`ide-minimap ${className}`} aria-label="Map of Baltimore, MD with local time">
      <img
        className="ide-minimap-img"
        src={mapSrc()}
        alt=""
        width={W}
        height={H}
        decoding="async"
        fetchPriority="low"
        onError={() => setFailed(true)}
      />
      <span className="ide-minimap-tint" aria-hidden="true" />
      <span className="ide-minimap-pin" aria-hidden="true" />
      {label}
    </figure>
  );
}
