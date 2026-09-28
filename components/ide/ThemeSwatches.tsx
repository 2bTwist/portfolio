"use client";

/* Palette swatches: the client theme switcher persisted in palette-store.ts. Shared by
   the desktop status bar and the compact site header so both drive one state.
   Only one of the two is displayed at any width, so role-based lookups stay
   unambiguous; each caller passes its own swatch class for sizing. */

import { PALETTES } from "@/app/lib/palette";
import { setPaletteIndex, usePaletteIndex } from "./palette-store";

export function ThemeSwatches({
  className = "",
  swatchClassName,
  ...data
}: {
  className?: string;
  swatchClassName: string;
  /* Passed through to the group, such as a tour anchor. */
  [attribute: `data-${string}`]: string;
}) {
  const paletteIndex = usePaletteIndex();

  return (
    <div className={className} role="group" aria-label="Theme" {...data}>
      {PALETTES.map((p, i) => (
        <button
          key={p.name}
          type="button"
          className={swatchClassName}
          data-sound="switch"
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
