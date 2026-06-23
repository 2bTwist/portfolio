"use client";

import { useEffect } from "react";

/* Module-scope helpers: kept out of the component body so the React Compiler
   doesn't try to lower the dynamic import() (it bails on import expressions).
   ClientBoot renders null with no state, so there's nothing to memoize anyway —
   this just keeps the compiler from flagging the whole component. */

function killStaleServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if (typeof caches !== "undefined") {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

function loadDevReactScan() {
  if (process.env.NODE_ENV !== "development") return;
  import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

function loadDevReactGrab() {
  if (process.env.NODE_ENV !== "development") return;
  // Side-effect import auto-activates the hover + ⌘C "grab element context"
  // overlay (file + component + source → clipboard for the agent). Dev only.
  import("react-grab");
}

/* Two dev/runtime concerns kept out of the server tree:
   1. Kill any stale service worker from the old portfolio (it 404s on /sw.js
      and forces reload loops). public/sw.js is the robust network-level fix;
      this is the in-page belt-and-suspenders.
   2. React Scan render overlay (dev only) — verifies the React Compiler is
      eliminating re-renders. Never ships. */
export function ClientBoot() {
  useEffect(() => {
    killStaleServiceWorker();
  }, []);

  useEffect(() => {
    loadDevReactScan();
  }, []);

  useEffect(() => {
    loadDevReactGrab();
  }, []);

  return null;
}
