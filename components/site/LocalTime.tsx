"use client";

/* Edmond's location + live local time (his timezone, not the visitor's). Read
   via useSyncExternalStore so there's no setState-in-effect (matches the repo's
   react-compiler discipline) and no hydration mismatch: the server snapshot is
   null, so the clock fills in on the client after mount. Ticks once a minute. */

import { useSyncExternalStore } from "react";
import { profile } from "@/data/profile";

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

export function LocalTime({ className = "" }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, fmt, serverSnapshot);

  return (
    <span className={`ide-localtime ${className}`} aria-label="Location and local time">
      <span className="ide-localtime-dot" aria-hidden="true" />
      {profile.location}
      <span className="ide-localtime-sep" aria-hidden="true">
        ·
      </span>
      <time suppressHydrationWarning>{time ?? "--:--"}</time>
      <span className="ide-localtime-zone">local</span>
    </span>
  );
}
