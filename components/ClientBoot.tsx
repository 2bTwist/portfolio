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

function loadDevReactGrab() {
  // Opt out of the React Compiler: it bails on the dynamic import() expression,
  // and this side-effect helper has nothing to memoize anyway.
  "use no memo";
  if (process.env.NODE_ENV !== "development") return;
  // Side-effect import auto-activates the hover + ⌘C "grab element context"
  // overlay (file + component + source → clipboard for the agent). Dev only.
  import("react-grab");
}

// A small hello for anyone who opens devtools (prod only, so dev stays quiet).
function printConsoleGreeting() {
  if (process.env.NODE_ENV !== "production") return;
  const head = "color:#a04c39;font-size:14px;font-weight:700";
  const dim = "color:#726552;font-size:12px";
  console.log("%cHey, you opened the console 👋", head);
  console.log("%cThe whole site is open source → https://github.com/2bTwist/portfolio", dim);
  console.log("%cLike what you see? Let's talk → ndanjiedmond@gmail.com", dim);
}

/* Dev/runtime concerns kept out of the server tree:
   1. Kill any stale service worker from the old portfolio (it 404s on /sw.js
      and forces reload loops). public/sw.js is the robust network-level fix;
      this is the in-page belt-and-suspenders.
   2. react-grab (dev only) — hover + ⌘C to grab element context for the agent.
   react-scan was removed: its render overlay janked scroll in dev. */
export function ClientBoot() {
  useEffect(() => {
    killStaleServiceWorker();
  }, []);

  useEffect(() => {
    loadDevReactGrab();
  }, []);

  useEffect(() => {
    printConsoleGreeting();
  }, []);

  return null;
}
