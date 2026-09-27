"use client";

/* IDE shell state, split so an overlay toggle never re-renders the
   explorer/tabs (proven by perf/shell-render.test.tsx):

   - Palette (theme): an external store, not context. The palette lives outside
     React (inline vars on <body>, localStorage), so a switch is a plain DOM
     write plus a re-render of the usePaletteIndex() subscribers.
   - SessionContext: open tabs (plus the stable palette setter). Changes when
     you navigate.
   - OverlayContext: the ⌘K palette / terminal open flags. Changes constantly as
     you open/close them.

   They're separate provider COMPONENTS with children pass-through, so each one
   only re-renders its own consumers; toggling an overlay leaves session
   consumers untouched and vice-versa.

   State updates happen in event handlers, never synchronously inside effects —
   that keeps the React Compiler hooks lint happy. The only effect reads the
   stored palette once on mount. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";
import { NAV } from "@/app/lib/nav";

type Tab = { href: string; name: string };

type Session = {
  setPaletteIndex: (i: number) => void;
  tabs: Tab[];
  openTab: (href: string) => void;
  closeTab: (href: string) => void;
  closeOthers: (href: string) => void;
  closeAll: () => void;
};

type Overlay = {
  cmdkOpen: boolean;
  openCmdk: () => void;
  closeCmdk: () => void;
  toggleCmdk: () => void;
  termOpen: boolean;
  termMounted: boolean;
  openTerm: () => void;
  closeTerm: () => void;
  toggleTerm: () => void;
};

const SessionContext = createContext<Session | null>(null);
const OverlayContext = createContext<Overlay | null>(null);

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <IdeProvider>");
  return ctx;
}

// The tab API alone, for readers that never touch the palette.
export function useTabSession(): Omit<Session, "setPaletteIndex"> {
  return useSession();
}

export function useOverlay(): Overlay {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within <IdeProvider>");
  return ctx;
}

const PALETTE_KEY = "ide.palette";

/* --- palette: module store (see header) --- */
let paletteIndex = DEFAULT_PALETTE_INDEX;
const paletteListeners = new Set<() => void>();
let paletteWrites = 0;

// Write the palette vars onto <body> (overriding the server default inline
// vars). The recolour is one page-wide restyle, so it stays out of the click:
// the frame that paints it also restyles it, with palette transitions held off
// until that frame is done. Persisting waits too; it is not needed to paint.
function applyPalette(i: number) {
  const entries = Object.entries(PALETTES[i].vars);
  if (entries.every(([key, value]) => document.body.style.getPropertyValue(key) === value)) return;

  // Only palette-sensitive transition declarations opt into this guard.
  // Avoid injecting a universal stylesheet, which invalidates every selector.
  document.body.style.setProperty("--palette-transition", "none");
  for (const [key, value] of entries) {
    document.body.style.setProperty(key, value);
  }
  // A timeout queued from a frame callback runs after that frame's style and
  // paint. A newer switch owns the guard until its own frame has painted.
  const write = ++paletteWrites;
  requestAnimationFrame(() =>
    setTimeout(() => {
      if (write !== paletteWrites) return;
      document.body.style.removeProperty("--palette-transition");
      try {
        localStorage.setItem(PALETTE_KEY, String(paletteIndex));
      } catch {
        /* private mode / disabled storage — non-fatal */
      }
    }, 0),
  );
}

export function setPaletteIndex(i: number) {
  if (!Number.isInteger(i) || !PALETTES[i]) return;
  if (i !== paletteIndex) {
    paletteIndex = i;
    paletteListeners.forEach((listener) => listener());
  }
  applyPalette(i);
}

function subscribePalette(listener: () => void) {
  paletteListeners.add(listener);
  return () => {
    paletteListeners.delete(listener);
  };
}

export function usePaletteIndex(): number {
  return useSyncExternalStore(subscribePalette, () => paletteIndex, () => DEFAULT_PALETTE_INDEX);
}

function tabFor(href: string): Tab | null {
  const item = NAV.find((n) => n.href === href);
  return item ? { href: item.href, name: item.name } : null;
}

function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Seed a tab for the route we land on (lazy init = same on server + first
  // client render, so no hydration mismatch). Further tabs open on navigation.
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const t = tabFor(pathname);
    return t ? [t] : [];
  });

  // One-time palette hydration. The default is already server-rendered on
  // <body>; if the user picked another, apply it after mount (rAF keeps the
  // subscriber update out of the effect body and avoids a hydration mismatch).
  useEffect(() => {
    let stored: number;
    try {
      stored = Number(localStorage.getItem(PALETTE_KEY));
    } catch {
      return;
    }
    if (!Number.isInteger(stored) || !PALETTES[stored] || stored === DEFAULT_PALETTE_INDEX) {
      return;
    }
    const raf = requestAnimationFrame(() => setPaletteIndex(stored));
    return () => cancelAnimationFrame(raf);
  }, []);

  const openTab = useCallback((href: string) => {
    const t = tabFor(href);
    if (!t) return;
    setTabs((prev) => (prev.some((x) => x.href === href) ? prev : [...prev, t]));
  }, []);

  const closeTab = useCallback(
    (href: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.href === href);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.href !== href);
        if (href === pathname) {
          const neighbour = next[idx] ?? next[idx - 1];
          router.push(neighbour ? neighbour.href : "/");
        }
        return next;
      });
    },
    [pathname, router],
  );

  // Keep only `href`, dropping every other tab; navigate to it if it isn't the
  // current route (it's about to be the only thing open).
  const closeOthers = useCallback(
    (href: string) => {
      setTabs((prev) => {
        const keep = prev.find((t) => t.href === href);
        return keep ? [keep] : prev;
      });
      if (href !== pathname) router.push(href);
    },
    [pathname, router],
  );

  // Close every tab and return to the README home (mirrors closeTab's "/"
  // fallback when no tab is left to focus).
  const closeAll = useCallback(() => {
    setTabs([]);
    router.push("/");
  }, [router]);

  const session = useMemo(
    () => ({ tabs, openTab, closeTab, closeOthers, closeAll, setPaletteIndex }),
    [tabs, openTab, closeTab, closeOthers, closeAll],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

function OverlayProvider({ children }: { children: ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [termMounted, setTermMounted] = useState(false);

  const openCmdk = useCallback(() => setCmdkOpen(true), []);
  const closeCmdk = useCallback(() => setCmdkOpen(false), []);
  const toggleCmdk = useCallback(() => setCmdkOpen((o) => !o), []);

  const openTerm = useCallback(() => {
    setTermMounted(true);
    setTermOpen(true);
  }, []);
  const closeTerm = useCallback(() => setTermOpen(false), []);
  const toggleTerm = useCallback(() => {
    setTermMounted(true);
    setTermOpen((o) => !o);
  }, []);

  return (
    <OverlayContext.Provider
      value={{
        cmdkOpen,
        openCmdk,
        closeCmdk,
        toggleCmdk,
        termOpen,
        termMounted,
        openTerm,
        closeTerm,
        toggleTerm,
      }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

export function IdeProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <OverlayProvider>{children}</OverlayProvider>
    </SessionProvider>
  );
}
