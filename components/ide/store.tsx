"use client";

/* IDE shell state, split so an overlay toggle never re-renders the
   explorer/tabs (proven by perf/shell-render.test.tsx):

   - SessionContext: open tabs, plus the setter of the palette, which is an
     external store (palette-store.ts). Changes when you navigate.
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
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/app/lib/nav";
import { setPaletteIndex, storedPaletteIndex } from "./palette-store";

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
    const stored = storedPaletteIndex();
    if (stored === null) return;
    const raf = requestAnimationFrame(() => setPaletteIndex(stored));
    return () => cancelAnimationFrame(raf);
  }, []);

  // React Compiler memoizes these handlers and the context values below.
  const openTab = (href: string) => {
    const t = tabFor(href);
    if (!t) return;
    setTabs((prev) => (prev.some((x) => x.href === href) ? prev : [...prev, t]));
  };

  const closeTab = (href: string) => {
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
  };

  // Keep only `href`, dropping every other tab; navigate to it if it isn't the
  // current route (it's about to be the only thing open).
  const closeOthers = (href: string) => {
    setTabs((prev) => {
      const keep = prev.find((t) => t.href === href);
      return keep ? [keep] : prev;
    });
    if (href !== pathname) router.push(href);
  };

  // Close every tab and return to the README home (mirrors closeTab's "/"
  // fallback when no tab is left to focus).
  const closeAll = () => {
    setTabs([]);
    router.push("/");
  };

  const session = { tabs, openTab, closeTab, closeOthers, closeAll, setPaletteIndex };

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

function OverlayProvider({ children }: { children: ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [termMounted, setTermMounted] = useState(false);

  const openCmdk = () => setCmdkOpen(true);
  const closeCmdk = () => setCmdkOpen(false);
  const toggleCmdk = () => setCmdkOpen((o) => !o);

  const openTerm = () => {
    setTermMounted(true);
    setTermOpen(true);
  };
  const closeTerm = () => setTermOpen(false);
  const toggleTerm = () => {
    setTermMounted(true);
    setTermOpen((o) => !o);
  };

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
