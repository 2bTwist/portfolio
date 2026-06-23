import { useSyncExternalStore } from "react";

/* True only after the client has mounted (server snapshot = false), with no
   hydration mismatch and no setState-in-effect. Used to render decorative
   client-only enhancements off the SSR / first-paint critical path. */
const subscribe = () => () => {};
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
