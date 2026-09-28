import { afterEach, describe, expect, it, vi } from "vitest";
import { PREFERENCES, loadPreference, savePreference, type Preference } from "@/app/lib/preferences";
import { PRE_PAINT_SCRIPT } from "@/app/lib/pre-paint";
import { DEFAULT_PALETTE_INDEX, PALETTES } from "@/app/lib/palette";

/* The preference definitions are the contract for browser-local state
   (specs/decisions/2026-09-27-preferences.md). Every check here runs over every
   definition, so a new key is covered the moment it is declared. */

type Store = Pick<Storage, "getItem" | "setItem">;

function memory(entries: Record<string, string> = {}): Store {
  const saved = new Map(Object.entries(entries));
  return { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => void saved.set(key, value) };
}
const blocked: Store = {
  getItem: () => {
    throw new DOMException("storage denied", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("storage full", "QuotaExceededError");
  },
};

// Strings a browser could hold under any key: hand edits, other versions, noise.
const STORED = [
  "", " ", "banana", "NaN", "Infinity", "-Infinity", "-1", "0", "1", "2", "3", " 1 ", "1.5",
  "0.1", "0.5", "0.95", "89", "90", "150", "170", "220", "300", "420", "460", "461", "1e9",
  "null", "true", "false", "{}", "-0", "0x2", "0x12C", "2.0", "\t2\n", "300.4",
];

const definitions = Object.entries(PREFERENCES) as [string, Preference<unknown>][];

describe.each(definitions)("%s", (name, preference) => {
  it("falls back when nothing is saved", () => {
    expect(loadPreference(preference, memory())).toEqual(preference.fallback);
  });

  it("falls back, and saving does not throw, when storage is blocked", () => {
    expect(loadPreference(preference, blocked)).toEqual(preference.fallback);
    expect(() => savePreference(preference, preference.fallback, blocked)).not.toThrow();
  });

  it("loads any stored string as the fallback or a value that saves and loads back unchanged", () => {
    for (const stored of STORED) {
      const value = loadPreference(preference, memory({ [preference.key]: stored }));
      if (Object.is(value, preference.fallback)) continue;
      const store = memory();
      savePreference(preference, value, store);
      expect(loadPreference(preference, store), `${name} from ${JSON.stringify(stored)}`).toEqual(value);
    }
  });

  it("keeps a loaded number finite and inside its declared range", () => {
    for (const stored of STORED) {
      const value = loadPreference(preference, memory({ [preference.key]: stored }));
      if (typeof value !== "number") continue;
      expect(preference.range, `${name} loads numbers, so it declares a range`).toBeDefined();
      const [min, max] = preference.range!;
      expect(Number.isFinite(value), `${name} from ${JSON.stringify(stored)}`).toBe(true);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  });
});

describe("the pre-paint script", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.removeAttribute("style");
  });

  it.each(STORED)("applies what the definitions load, for %j", (stored) => {
    localStorage.setItem(PREFERENCES.palette.key, stored);
    localStorage.setItem(PREFERENCES.explorerWidth.key, stored);
    new Function(PRE_PAINT_SCRIPT)();

    const palette = loadPreference(PREFERENCES.palette, localStorage);
    for (const [name, value] of Object.entries(PALETTES[palette].vars)) {
      const applied = document.body.style.getPropertyValue(name);
      // The default palette is already server-rendered, so the script leaves it alone.
      expect(palette === DEFAULT_PALETTE_INDEX ? applied === "" || applied === value : applied === value).toBe(true);
    }
    const width = loadPreference(PREFERENCES.explorerWidth, localStorage);
    const applied = document.body.style.getPropertyValue("--explorer-width");
    expect(applied || `${PREFERENCES.explorerWidth.fallback / 16}rem`).toBe(`${width / 16}rem`);
  });

  it("does nothing, and does not throw, when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("storage denied", "SecurityError");
    });
    expect(() => new Function(PRE_PAINT_SCRIPT)()).not.toThrow();
    expect(document.body.getAttribute("style")).toBeNull();
  });
});
