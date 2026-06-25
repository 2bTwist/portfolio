"use client";

/* Bottom status bar: current path, terminal + sound + RSS actions, and the
   palette swatches (the additive client theme switcher persisted in store.tsx).

   Icons are compact hand-drawn line SVGs (same style + viewBox idiom as the
   title-bar search glyph). Phosphor's full 256-unit paths read nicely but cost
   ~1.7 kB gzipped on the always-loaded bundle and push it past budget, so these
   stroke glyphs keep the perf gate green. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { PALETTES } from "@/app/lib/palette";
import { useSession, useOverlay } from "./store";
import { useSound } from "@/components/feel/SoundProvider";
import type { GitInfo } from "@/app/lib/git";

const LINE_PX = 24; // approx reading line height — maps scroll depth → "line"

const SVG = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function StatusBar({ className = "", git }: { className?: string; git: GitInfo }) {
  const { paletteIndex, setPaletteIndex } = useSession();
  const { openTerm } = useOverlay();
  const { muted, toggleMuted } = useSound();

  // Editor-position readout (VS Code-style). No literal text caret on a rendered
  // page, so Ln/Col follow the real text selection/caret inside the content
  // (click or select to move it), falling back to scroll depth; `(N selected)`
  // is the actual selection length. All real, nothing faked.
  const [pos, setPos] = useState({ ln: 1, col: 1 });
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const pane = document.querySelector<HTMLElement>("[data-editor-scroll]");
    const fromScroll = () =>
      setPos((p) => ({ ...p, ln: Math.floor((pane?.scrollTop ?? 0) / LINE_PX) + 1 }));
    function fromSelection() {
      const sel = window.getSelection();
      setSelected(sel?.toString().length ?? 0);
      if (!sel || sel.rangeCount === 0 || !pane) return;
      const range = sel.getRangeAt(0);
      if (!pane.contains(range.commonAncestorContainer)) return; // ignore chrome clicks
      const rect = range.getBoundingClientRect();
      const relTop = rect.top - pane.getBoundingClientRect().top + pane.scrollTop;
      setPos({ ln: Math.max(1, Math.round(relTop / LINE_PX) + 1), col: (sel.anchorOffset ?? 0) + 1 });
    }
    fromScroll();
    pane?.addEventListener("scroll", fromScroll, { passive: true });
    document.addEventListener("selectionchange", fromSelection);
    return () => {
      pane?.removeEventListener("scroll", fromScroll);
      document.removeEventListener("selectionchange", fromSelection);
    };
  }, []);

  return (
    <footer className={className} aria-label="Status bar">
      {/* Git branch + short hash, linked to the actual commit on GitHub. */}
      <a
        className="ide-git"
        href={git.commitUrl}
        target="_blank"
        rel="noreferrer noopener"
        title={`${git.branch}${git.dirty ? " (uncommitted changes)" : ""} @ ${git.shortSha} — open commit on GitHub`}
      >
        {/* git-branch glyph */}
        <svg {...SVG} aria-hidden="true">
          <circle cx="7" cy="6" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="7" cy="18" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="17" cy="6" r="2.4" fill="currentColor" stroke="none" />
          <path d="M7 8.4v7.2" />
          <path d="M17 8.4c0 5-4.5 5.5-9 7.2" />
        </svg>
        <span className="ide-git-branch">
          {git.branch}
          {git.dirty ? "*" : ""}
        </span>
        {git.shortSha ? <span className="ide-git-sha">{git.shortSha}</span> : null}
      </a>
      <nav className="ide-legal" aria-label="Legal">
        <Link href="/terms" prefetch={false}>
          Terms
        </Link>
        <Link href="/privacy" prefetch={false}>
          Privacy
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <span className="ide-editor-status">
          <span>
            Ln {pos.ln}, Col {pos.col}
            {selected ? ` (${selected} selected)` : ""}
          </span>
          <span>Spaces: 2</span>
        </span>
        <button
          type="button"
          className="ide-pill ide-pill--icon"
          onClick={() => openTerm()}
          aria-label="Open terminal"
        >
          {/* >_ prompt */}
          <svg {...SVG} aria-hidden="true">
            <path d="M5 8l4 4-4 4" />
            <path d="M13 16h6" />
          </svg>
        </button>
        <button
          type="button"
          className="ide-pill ide-pill--icon"
          aria-pressed={!muted}
          aria-label={muted ? "Unmute UI sounds" : "Mute UI sounds"}
          onClick={() => toggleMuted()}
        >
          <svg {...SVG} aria-hidden="true">
            <path d="M4 9h3l5-4v14l-5-4H4z" />
            {muted ? (
              <path d="M16 9l5 6M21 9l-5 6" />
            ) : (
              <path d="M15.5 9.5a4 4 0 010 5" />
            )}
          </svg>
        </button>
        <Link
          href="/rss.xml"
          className="ide-pill ide-pill--icon"
          aria-label="RSS feed"
          prefetch={false}
        >
          {/* RSS: dot at the bottom-left corner with two nested arcs (both
              concentric on that corner) radiating toward the top-right. The art
              is corner-anchored, so shift the group to center it in the box. */}
          <svg {...SVG} aria-hidden="true">
            <g transform="translate(2.3 -2.3)">
              <path d="M4 13a7 7 0 017 7" />
              <path d="M4 8a12 12 0 0112 12" />
              <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
            </g>
          </svg>
        </Link>
        <div className="flex items-center gap-2 ml-1" role="group" aria-label="Theme">
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
