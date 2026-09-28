/* Preferences (see CONTEXT.md): the browser-local settings the site saves. Each is
   declared once here: its key, how a stored string decodes (or is rejected), how a
   value encodes, and the fallback. Storage belongs to the host, so a missing,
   invalid, or unreadable value means the fallback, and a failed write is ignored.
   Keys and formats are fixed: there is no migration (AGENTS.md).

   Client- and server-importable. React state over these lives in
   components/hooks/usePreference.ts; app/lib/pre-paint.ts applies two of them
   before the first paint. */

import { DEFAULT_PALETTE_INDEX, PALETTES } from "./palette";

export type Preference<T> = {
  key: string;
  fallback: T;
  /* The value a stored string holds, or undefined when it holds none. */
  decode: (stored: string) => T | undefined;
  encode: (value: T) => string;
  /* For numbers: the inclusive range every loaded value stays within. */
  range?: readonly [number, number];
};

type Store = Pick<Storage, "getItem" | "setItem">;

// A stored number: the whole string, finite ("" and "Infinity" hold none), and
// never -0, so a loaded value saves back to the same string.
function storedNumber(stored: string): number | undefined {
  const n = Number(stored);
  return stored.trim() !== "" && Number.isFinite(n) ? n + 0 : undefined;
}

const SPLIT_RANGE = [0.2, 0.8] as const;
export const EXPLORER_RANGE = [170, 460] as const;
const TERMINAL_MIN = 90;

export const PREFERENCES = {
  /* An index into PALETTES. */
  palette: {
    key: "ide.palette",
    fallback: DEFAULT_PALETTE_INDEX,
    range: [0, PALETTES.length - 1],
    decode: (stored) => {
      const i = storedNumber(stored);
      return i !== undefined && Number.isInteger(i) && i >= 0 && i < PALETTES.length ? i : undefined;
    },
    encode: String,
  } satisfies Preference<number>,
  /* The left pane's share of a split editor, clamped into range. */
  splitRatio: {
    key: "ide-split-ratio",
    fallback: 0.5,
    range: SPLIT_RANGE,
    decode: (stored) => {
      const f = storedNumber(stored);
      return f !== undefined && f > 0 ? Math.min(SPLIT_RANGE[1], Math.max(SPLIT_RANGE[0], f)) : undefined;
    },
    encode: String,
  } satisfies Preference<number>,
  /* Explorer width in base px (at a 16px root). Past 300 only after beating the
     bouncer, so a saved width there restores that win (Explorer.tsx). */
  explorerWidth: {
    key: "ide:explorer-width",
    fallback: 220,
    range: EXPLORER_RANGE,
    decode: (stored) => {
      const n = storedNumber(stored);
      const w = n === undefined ? undefined : Math.round(n);
      return w !== undefined && w >= EXPLORER_RANGE[0] && w <= EXPLORER_RANGE[1] ? w : undefined;
    },
    encode: (w) => String(Math.round(w)),
  } satisfies Preference<number>,
  /* Terminal output height in px, or null for its natural height. Its upper limit
     is the rendered one, applied by the terminal. */
  terminalHeight: {
    key: "ide.terminal-height",
    fallback: null,
    range: [TERMINAL_MIN, Number.MAX_SAFE_INTEGER],
    decode: (stored) => {
      const n = storedNumber(stored);
      const h = n === undefined ? undefined : Math.round(n);
      return h !== undefined && h >= TERMINAL_MIN && h <= Number.MAX_SAFE_INTEGER ? h : undefined;
    },
    encode: (h) => String(Math.round(h ?? 0)),
  } satisfies Preference<number | null>,
  soundMuted: {
    key: "sound-muted",
    fallback: false,
    decode: (stored) => (stored === "1" ? true : stored === "0" ? false : undefined),
    encode: (muted) => (muted ? "1" : "0"),
  } satisfies Preference<boolean>,
  /* Set once the data reveal has been dismissed, so it shows once per browser. */
  dataRevealSeen: {
    key: "data-reveal-seen",
    fallback: false,
    decode: (stored) => (stored === "1" ? true : undefined),
    encode: (seen) => (seen ? "1" : "0"),
  } satisfies Preference<boolean>,
};

// The page's localStorage, or null on the server or where even reaching it throws.
function browserStorage(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadPreference<T>(preference: Preference<T>, storage: Store | null = browserStorage()): T {
  try {
    const stored = storage?.getItem(preference.key);
    const value = stored == null ? undefined : preference.decode(stored);
    return value === undefined ? preference.fallback : value;
  } catch {
    return preference.fallback;
  }
}

export function savePreference<T>(preference: Preference<T>, value: T, storage: Store | null = browserStorage()) {
  try {
    storage?.setItem(preference.key, preference.encode(value));
  } catch {
    // Storage is the host's; the setting still holds for this session.
  }
}
