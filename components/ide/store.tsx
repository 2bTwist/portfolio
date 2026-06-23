"use client";

/* IDE shell state, split into two contexts so an overlay toggle never re-renders
   the explorer/tabs (proven by perf/shell-render.test.tsx):

   - SessionContext: palette (theme) + open tabs. Changes when you navigate or
     switch theme.
   - OverlayContext: the ⌘K palette / terminal open flags. Changes constantly as
     you open/close them.

   They're separate provider COMPONENTS with children pass-through, so each one
   only re-renders its own consumers; toggling an overlay leaves session
   consumers untouched and vice-versa.

   State updates happen in event handlers, never synchronously inside effects —
   that keeps the React Compiler hooks lint happy. The only effects update
   external systems (the <body> CSS vars) or read storage once on mount. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";
import { NAV } from "@/app/lib/nav";

type Tab = { href: string; name: string };

type Session = {
  paletteIndex: number;
  setPaletteIndex: (i: number) => void;
  tabs: Tab[];
  openTab: (href: string) => void;
  closeTab: (href: string) => void;
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

export function useOverlay(): Overlay {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within <IdeProvider>");
  return ctx;
}

const PALETTE_KEY = "ide.palette";

function tabFor(href: string): Tab | null {
  const item = NAV.find((n) => n.href === href);
  return item ? { href: item.href, name: item.name } : null;
}

function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [paletteIndex, setPaletteIndexState] = useState(DEFAULT_PALETTE_INDEX);
  // Seed a tab for the route we land on (lazy init = same on server + first
  // client render, so no hydration mismatch). Further tabs open on navigation.
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const t = tabFor(pathname);
    return t ? [t] : [];
  });

  // One-time palette hydration. The default is already server-rendered on
  // <body>; if the user picked another, apply it after mount (rAF defers the
  // setState out of the effect body and avoids a hydration mismatch).
  useEffect(() => {
    const stored = Number(localStorage.getItem(PALETTE_KEY));
    if (!Number.isInteger(stored) || !PALETTES[stored] || stored === DEFAULT_PALETTE_INDEX) {
      return;
    }
    const raf = requestAnimationFrame(() => setPaletteIndexState(stored));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Apply palette vars onto <body> (external-system update — overrides the
  // server default inline vars).
  useEffect(() => {
    const vars = PALETTES[paletteIndex]?.vars;
    if (!vars) return;
    for (const [k, v] of Object.entries(vars)) {
      document.body.style.setProperty(k, v);
    }
  }, [paletteIndex]);

  const setPaletteIndex = useCallback((i: number) => {
    setPaletteIndexState(i);
    try {
      localStorage.setItem(PALETTE_KEY, String(i));
    } catch {
      /* private mode / disabled storage — non-fatal */
    }
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

  return (
    <SessionContext.Provider value={{ paletteIndex, setPaletteIndex, tabs, openTab, closeTab }}>
      {children}
    </SessionContext.Provider>
  );
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
