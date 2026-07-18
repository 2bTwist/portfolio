"use client";

/* Where Edmond is, as a small static minimap card with his live local time.

   The map is a first-party WebP committed to /public (CARTO "light_all"
   basemap tiles composited at author time, centered on profile.coords —
   regenerate with `pnpm map:generate`). It used to be a
   Stadia static-map URL, but their static API moved behind a paid plan and
   started serving an "Upgrade for Access" placeholder; a committed asset can't
   rot like that, needs no key, and costs no third-party request.

   It's painted as a CSS background-image (not an <img>) on a fixed-size box:
     - A background image is never an LCP candidate, so the tile can't become
       the hero's Largest Contentful Paint on mobile (the mascot, which is
       priority-loaded, stays the LCP).
     - The box keeps its dimensions regardless, so the layout never shifts.

   The clock reads via useSyncExternalStore so there's no setState-in-effect and
   no hydration mismatch (server snapshot is null; it fills in after mount). */

import { useSyncExternalStore } from "react";
import { profile } from "@/data/profile";

const MAP_SRC = "/map-laurel.webp";

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
    <figure className={`ide-minimap ${className}`} aria-label={`Map of ${profile.location} with local time`}>
      <span
        className="ide-minimap-img"
        style={{ backgroundImage: `url("${MAP_SRC}")` }}
        aria-hidden="true"
      />
      <span className="ide-minimap-tint" aria-hidden="true" />
      <span className="ide-minimap-pin" aria-hidden="true" />
      {/* Basemap data/style attribution (ODbL / CARTO terms). */}
      <span className="ide-minimap-credit">© OpenStreetMap © CARTO</span>
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
