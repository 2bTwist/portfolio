"use client";

/* Where Edmond is, as a small static minimap card with his live local time.

   The map is a single Stadia "alidade_smooth" PNG painted as a CSS
   background-image (not an <img>) on a fixed-size box. Two reasons:
     - A background image is never an LCP candidate, so the slow third-party
       tile can't become the hero's Largest Contentful Paint on mobile (the
       mascot, which is first-party and priority-loaded, stays the LCP).
     - The box keeps its dimensions whether or not the tile loads, so a failed
       fetch (e.g. an un-allowlisted domain or no dev key) leaves a clean,
       same-sized accent card instead of collapsing the layout (zero CLS).

   The clock reads via useSyncExternalStore so there's no setState-in-effect and
   no hydration mismatch (server snapshot is null; it fills in after mount).

   Auth: Stadia uses domain-based auth in production (allowlist the deployed
   domain in the dashboard — no key in the URL). For localhost/LAN dev set
   NEXT_PUBLIC_STADIA_API_KEY in .env.local. If the tile can't load the card
   simply shows the warm-tinted surface with the pin and label. */

import { useSyncExternalStore } from "react";
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

  return (
    <figure className={`ide-minimap ${className}`} aria-label="Map of Baltimore, MD with local time">
      <span
        className="ide-minimap-img"
        style={{ backgroundImage: `url("${mapSrc()}")` }}
        aria-hidden="true"
      />
      <span className="ide-minimap-tint" aria-hidden="true" />
      <span className="ide-minimap-pin" aria-hidden="true" />
      <figcaption className="ide-minimap-label">
        <span className="ide-minimap-dot" aria-hidden="true" />
        {profile.location}
        <span className="ide-minimap-sep" aria-hidden="true">
          ·
        </span>
        <time suppressHydrationWarning>{time ?? "--:--"}</time>
        <span className="ide-minimap-zone">local</span>
      </figcaption>
    </figure>
  );
}
