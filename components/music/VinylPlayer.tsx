"use client";

/* The /music turntable. A spinning record whose center label is the current
   cover, a tonearm that drops when playing, transport + shuffle controls, and a
   clickable tracklist. All of it just drives the shared module store, so the
   bottom-left widget stays in sync and playback continues as you navigate away. */

import { TRACKS, albumLabel } from "@/app/lib/music";
import { useMusic, play, toggle, next, prev, toggleShuffle, toggleRepeat } from "./store";
import { PlayGlyph, PauseGlyph, NextGlyph, PrevGlyph } from "./icons";

function fmt(ms: number | null): string {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ShuffleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" />
    </svg>
  );
}

function RepeatGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function VinylPlayer() {
  const { current, playing, shuffle, repeatOne } = useMusic();
  const cued = current >= 0 ? TRACKS[current] : null;

  return (
    <div className="vinyl">
      <div className="vinyl-stage">
        <button
          type="button"
          className="vinyl-platter"
          onClick={() => (current < 0 ? play(0) : toggle())}
          aria-label={playing ? "Pause" : cued ? `Play ${cued.title}` : "Play the playlist"}
          title={playing ? "Stop the record" : "Drop the needle"}
        >
          <div className={`vinyl-disc${playing ? " is-spinning" : ""}`}>
            <div className="vinyl-label">
              {cued ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Apple art
                <img src={cued.artwork} alt="" width={150} height={150} decoding="async" />
              ) : (
                <span className="vinyl-label-empty" aria-hidden="true">⊙</span>
              )}
            </div>
            <span className="vinyl-hole" aria-hidden="true" />
          </div>
          <span className={`vinyl-arm${playing ? " is-down" : ""}`} aria-hidden="true" />
        </button>

        <div className="vinyl-readout" aria-live="polite">
          <p className="vinyl-now-title">{cued ? cued.title : "Pick a track"}</p>
          <p className="vinyl-now-sub">
            {cued ? `${cued.artist} · ${albumLabel(cued.album)}` : "What I've had on repeat lately"}
          </p>
        </div>

        <div className="vinyl-controls">
          <button
            type="button"
            className={`vinyl-ctl${shuffle ? " is-active" : ""}`}
            onClick={toggleShuffle}
            aria-pressed={shuffle}
            aria-label="Shuffle"
          >
            <ShuffleGlyph className="vinyl-glyph-sm" />
          </button>
          <button type="button" className="vinyl-ctl" onClick={prev} aria-label="Previous track">
            <PrevGlyph className="vinyl-glyph" />
          </button>
          <button
            type="button"
            className="vinyl-ctl vinyl-ctl--play"
            onClick={() => (current < 0 ? play(0) : toggle())}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <PauseGlyph className="vinyl-glyph" /> : <PlayGlyph className="vinyl-glyph" />}
          </button>
          <button type="button" className="vinyl-ctl" onClick={next} aria-label="Next track">
            <NextGlyph className="vinyl-glyph" />
          </button>
          <button
            type="button"
            className={`vinyl-ctl${repeatOne ? " is-active" : ""}`}
            onClick={toggleRepeat}
            aria-pressed={repeatOne}
            aria-label="Repeat current track"
          >
            <RepeatGlyph className="vinyl-glyph-sm" />
          </button>
        </div>
      </div>

      <ol className="vinyl-list">
        {TRACKS.map((t, i) => {
          const active = i === current;
          return (
            <li key={t.id}>
              <button
                type="button"
                className={`vinyl-row${active ? " is-active" : ""}`}
                onClick={() => play(i)}
                aria-current={active ? "true" : undefined}
              >
                <span className="vinyl-row-num" aria-hidden="true">
                  {active && playing ? <PlayGlyph className="vinyl-glyph-xs" /> : i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote Apple art */}
                <img className="vinyl-row-art" src={t.artwork} alt="" width={36} height={36} loading="lazy" decoding="async" />
                <span className="vinyl-row-meta">
                  <span className="vinyl-row-title">{t.title}</span>
                  <span className="vinyl-row-artist">{t.artist}</span>
                </span>
                <span className="vinyl-row-time">{fmt(t.durationMs)}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="vinyl-foot">
        30-second previews via Apple Music. The list loops, so it never really ends.
      </p>
    </div>
  );
}
