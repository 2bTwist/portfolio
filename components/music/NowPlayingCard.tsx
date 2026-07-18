"use client";

/* Desktop now-playing: an art-filled square pinned at the bottom of the
   explorer sidebar (the floating dock covers < md, where there's no sidebar).
   Renders nothing until a track starts; both surfaces drive the same store
   singleton, so play state, track index and the single <audio> stay in sync.

   At rest the card is just artwork + a scrim with the track meta and a status
   dot (pulsing = playing, still = paused). The transport and close controls
   fade in on hover/focus-within so the art stays uncovered until you reach
   for it. Unlike the dock this stays visible on /music — it's sidebar chrome
   like the tree, and hiding it there would reflow pinned chrome on nav. */

import Link from "next/link";
import { TRACKS } from "@/app/lib/music";
import { useMusic, toggle, next, prev, stop } from "./store";
import { PlayGlyph, PauseGlyph, NextGlyph, PrevGlyph, CloseGlyph } from "./icons";

export function NowPlayingCard() {
  const { current, playing, started } = useMusic();
  if (!started || current < 0) return null;

  const track = TRACKS[current];

  return (
    <section className="npc" aria-label="Now playing">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote Apple art, plain <img> avoids next/image remote config */}
      <img src={track.artwork} alt="" className="npc-art" loading="lazy" decoding="async" />
      <span className="npc-veil" aria-hidden="true" />

      <button type="button" className="npc-close" onClick={stop} aria-label="Close player and stop music">
        <CloseGlyph className="np-glyph-sm" />
      </button>

      <div className="npc-controls">
        <button type="button" className="npc-btn" onClick={prev} aria-label="Previous track">
          <PrevGlyph className="np-glyph" />
        </button>
        <button type="button" className="npc-btn npc-btn--primary" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <PauseGlyph className="np-glyph" /> : <PlayGlyph className="np-glyph" />}
        </button>
        <button type="button" className="npc-btn" onClick={next} aria-label="Next track">
          <NextGlyph className="np-glyph" />
        </button>
      </div>

      <Link
        href="/music"
        prefetch={false}
        className="npc-meta"
        aria-label={`Open the player — ${track.title} by ${track.artist}`}
      >
        <span className={`npc-dot${playing ? " is-playing" : ""}`} aria-hidden="true" />
        <span className="npc-lines">
          <span className="npc-title" title={track.title}>{track.title}</span>
          <span className="npc-artist" title={track.artist}>{track.artist}</span>
        </span>
      </Link>
    </section>
  );
}
