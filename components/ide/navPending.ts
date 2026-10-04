/* Pending client navigation. Links are mostly unprefetched, so a click waits on
   the server while the old page stays on screen; this store holds the path being
   opened so the shell can say so (NavigationStatus).

   A navigation starts from the shared Link wrapper (Next's onNavigate fires only
   when a client navigation actually begins) or from pushRoute; it ends when the
   route changes, whichever navigation won. A same-path navigation never starts
   one, since no route change would end it. */

import { useSyncExternalStore } from "react";

type Router = { push: (href: string) => void };

let target: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function beginNavigation(href: string) {
  const path = new URL(href, window.location.href).pathname;
  if (path === window.location.pathname || path === target) return;
  target = path;
  emit();
}

export function endNavigation() {
  if (target === null) return;
  target = null;
  emit();
}

/** router.push that the shell reports as pending until the route changes. */
export function pushRoute(router: Router, href: string) {
  beginNavigation(href);
  router.push(href);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The path being navigated to, or null when no navigation is pending. */
export function usePendingNavigation() {
  return useSyncExternalStore(
    subscribe,
    () => target,
    () => null,
  );
}
