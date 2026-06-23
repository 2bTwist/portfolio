"use client";

/* Bottom status bar: current path, ⌘K / terminal triggers, and the palette
   swatches (the additive client theme switcher persisted in store.tsx). */

import { usePathname } from "next/navigation";
import { PALETTES } from "@/app/lib/palette";
import { useSession, useOverlay } from "./store";
import { useSound } from "@/components/feel/SoundProvider";

export function StatusBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { paletteIndex, setPaletteIndex } = useSession();
  const { openCmdk, openTerm } = useOverlay();
  const { muted, toggleMuted } = useSound();

  return (
    <footer className={className} aria-label="Status bar">
      <span className="mono text-xs" style={{ color: "var(--muted)" }}>
        {pathname}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="ide-pill" onClick={() => openCmdk()}>
          ⌘K
        </button>
        <button type="button" className="ide-pill" onClick={() => openTerm()}>
          terminal
        </button>
        <button
          type="button"
          className="ide-pill"
          aria-pressed={!muted}
          aria-label={muted ? "Unmute UI sounds" : "Mute UI sounds"}
          onClick={() => toggleMuted()}
        >
          {muted ? "♪̸" : "♪"}
        </button>
        <div className="flex items-center gap-1 ml-1" role="group" aria-label="Theme">
          {PALETTES.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className="ide-swatch"
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
      </div>
    </footer>
  );
}
