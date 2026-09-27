"use client";

/* Palette swatches: the client theme switcher persisted in store.tsx. Shared by
   the desktop status bar and the compact site header so both drive one state.
   Only one of the two is displayed at any width, so role-based lookups stay
   unambiguous; each caller passes its own swatch class for sizing. */

import { PALETTES } from "@/app/lib/palette";
import { setPaletteIndex, usePaletteIndex } from "./store";

export function ThemeSwatches({
  className = "",
  swatchClassName,
}: {
  className?: string;
  swatchClassName: string;
}) {
  const paletteIndex = usePaletteIndex();

  return (
    <div className={className} role="group" aria-label="Theme">
      {PALETTES.map((p, i) => (
        <button
          key={p.name}
          type="button"
          className={swatchClassName}
          aria-label={`Theme: ${p.name}`}
          aria-pressed={i === paletteIndex}
          onClick={() => setPaletteIndex(i)}
          style={{
            background: p.vars["--accent"],
            outline: i === paletteIndex ? "2px solid var(--text)" : undefined,
            outlineOffset: "1px",
          }}
        />
      ))}
    </div>
  );
}
