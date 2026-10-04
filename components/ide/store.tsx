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
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCatalogue } from "./CatalogueProvider";
import { restoreSavedPalette, setPaletteIndex } from "./palette-store";
import { claimModal, releaseModal, type ReleaseReason } from "./modal-owner";
import { pushRoute } from "./navPending";

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
  /* Pass "navigation" when the palette closes to leave the page. */
  closeCmdk: (reason?: ReleaseReason) => void;
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

function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Any page gets a tab, labelled from the catalogue; a 404 gets none.
  const catalogue = useCatalogue();
  const tabFor = (href: string): Tab | null => {
    const entry = catalogue.find(href);
    return entry ? { href: entry.href, name: entry.label } : null;
  };

  // Tabs follow the route: the page on screen always has a tab, however it was
  // reached (explorer, card, inline link, back/forward). Seed the landing route
  // (lazy init = same on server + first client render, so no hydration
  // mismatch), then add the tab for each new route during render, React's
  // pattern for adjusting state to a changed input.
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const t = tabFor(pathname);
    return t ? [t] : [];
  });
  const [tabbedPath, setTabbedPath] = useState(pathname);
  if (pathname !== tabbedPath) {
    setTabbedPath(pathname);
    const t = tabFor(pathname);
    if (t && !tabs.some((x) => x.href === t.href)) setTabs([...tabs, t]);
  }

  // Before the first paint React makes: see restoreSavedPalette.
  useLayoutEffect(() => restoreSavedPalette(), []);

  // `withTab` keeps the invariant when a close navigates: the destination's tab
  // is present before the route changes.
  const withTab = (list: Tab[], href: string): Tab[] => {
    const t = tabFor(href);
    return t && !list.some((x) => x.href === t.href) ? [...list, t] : list;
  };

  // React Compiler memoizes these handlers and the context values below.
  // Opening ahead of navigation shows the tab on the click, not after the route.
  const openTab = (href: string) => setTabs((prev) => withTab(prev, href));

  // Closing the current page's tab moves to its neighbour, or to README when it
  // was the last one, which then keeps its tab: an empty strip never sits over a
  // page.
  const closeTab = (href: string) => {
    const idx = tabs.findIndex((t) => t.href === href);
    if (idx === -1) return;
    const rest = tabs.filter((t) => t.href !== href);
    if (href !== pathname) {
      setTabs(rest);
      return;
    }
    const destination = (rest[idx] ?? rest[idx - 1])?.href ?? "/";
    setTabs(withTab(rest, destination));
    if (destination !== pathname) pushRoute(router, destination);
  };

  // Keep only `href`, dropping every other tab; navigate to it if it isn't the
  // current route (it's about to be the only thing open).
  const closeOthers = (href: string) => {
    const keep = tabs.find((t) => t.href === href);
    if (!keep) return;
    setTabs([keep]);
    if (href !== pathname) pushRoute(router, href);
  };

  // Close every tab and return to README, which keeps its own tab.
  const closeAll = () => {
    setTabs(withTab([], "/"));
    if (pathname !== "/") pushRoute(router, "/");
  };

  const session = { tabs, openTab, closeTab, closeOthers, closeAll, setPaletteIndex };

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

function OverlayProvider({ children }: { children: ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [termMounted, setTermMounted] = useState(false);

  // The palette is a modal: it opens only when no other modal owns input.
  const openCmdk = () => {
    if (claimModal("palette")) setCmdkOpen(true);
  };
  const closeCmdk = (reason?: ReleaseReason) => {
    setCmdkOpen(false);
    releaseModal("palette", reason);
  };
  const toggleCmdk = () => (cmdkOpen ? closeCmdk() : openCmdk());

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
