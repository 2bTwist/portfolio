import { useSyncExternalStore } from "react";
import { loadPreference, savePreference, type Preference } from "@/app/lib/preferences";

/* A preference as React state. The client reads it from storage once and then keeps
   it in memory; the server and hydration see the fallback. Setting it saves it and
   re-renders its readers in this tab only: tabs do not sync. */

// Keyed by the definition object itself.
const values = new Map<object, unknown>();
const listeners = new Map<object, Set<() => void>>();
const subscribers = new Map<object, (listener: () => void) => () => void>();

export function getPreference<T>(preference: Preference<T>): T {
  if (!values.has(preference)) values.set(preference, loadPreference(preference));
  return values.get(preference) as T;
}

export function setPreference<T>(preference: Preference<T>, value: T) {
  values.set(preference, value);
  savePreference(preference, value);
  listeners.get(preference)?.forEach((listener) => listener());
}

// One stable subscribe function per preference, so React never resubscribes.
function subscriberFor(preference: object) {
  let subscribe = subscribers.get(preference);
  if (!subscribe) {
    subscribe = (listener) => {
      let set = listeners.get(preference);
      if (!set) listeners.set(preference, (set = new Set()));
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    };
    subscribers.set(preference, subscribe);
  }
  return subscribe;
}

export function usePreference<T>(preference: Preference<T>): T {
  return useSyncExternalStore(
    subscriberFor(preference),
    () => getPreference(preference),
    () => preference.fallback,
  );
}
