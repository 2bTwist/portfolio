"use client";

/* The persistent "now playing" dock (bottom-left). Renders nothing until the
   user starts a track from /music, then follows them across the whole site,
   driving the same single <audio> in the store. The mini cover spins while
   playing and freezes when paused; dismissing it stops playback. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TRACKS } from "@/app/lib/music";
import { useMusic, toggle, next, prev, stop } from "./store";
import { PlayGlyph, PauseGlyph, NextGlyph, PrevGlyph, CloseGlyph } from "./icons";

export function NowPlayingWidget() {
  const { current, playing, started } = useMusic();
  const pathname = usePathname();
  // The /music page is the full player; the mini-widget is redundant there
  // (and would overlap the transport controls), so hide it on that route.
  if (pathname === "/music") return null;
  if (!started || current < 0) return null;

  const track = TRACKS[current];

  return (
    <div className="np-dock" role="region" aria-label="Now playing">
      <Link href="/music" prefetch={false} className="np-cover" aria-label={`Open the player — ${track.title} by ${track.artist}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote Apple art, plain <img> avoids next/image remote config */}
        <img
          src={track.artwork}
          alt=""
          width={44}
          height={44}
          className={`np-disc${playing ? " is-spinning" : ""}`}
          loading="lazy"
          decoding="async"
        />
        <span className="np-spindle" aria-hidden="true" />
      </Link>

      <div className="np-meta">
        <span className="np-title" title={track.title}>{track.title}</span>
        <span className="np-artist" title={track.artist}>{track.artist}</span>
      </div>

      <div className="np-controls">
        <button type="button" className="np-btn" onClick={prev} aria-label="Previous track">
          <PrevGlyph className="np-glyph" />
        </button>
        <button type="button" className="np-btn np-btn--primary" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <PauseGlyph className="np-glyph" /> : <PlayGlyph className="np-glyph" />}
        </button>
        <button type="button" className="np-btn" onClick={next} aria-label="Next track">
          <NextGlyph className="np-glyph" />
        </button>
      </div>

      <button type="button" className="np-close" onClick={stop} aria-label="Close player and stop music">
        <CloseGlyph className="np-glyph-sm" />
      </button>
    </div>
  );
}
