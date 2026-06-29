/* Global music player state, as a module-singleton external store read through
   useSyncExternalStore (same idiom as SoundProvider's `muted`). Living at module
   scope, NOT in a React provider, is deliberate: the App Router root layout never
   remounts on navigation, but neither does this — so playback survives route
   changes and the bottom-left widget can drive the same single <audio> element
   from any page, with zero render coupling to the IDE shell.

   The <audio> element is created lazily on the first play() (a user gesture), so
   mounting the widget costs nothing and there's no autoplay-policy fight. We only
   ever play 30s preview clips; the queue loops, so the list never "ends". */

import { useSyncExternalStore } from "react";
import { TRACKS } from "@/app/lib/music";

export type PlayerState = {
  /** Index into TRACKS of the loaded song, or -1 before anything starts. */
  current: number;
  playing: boolean;
  /** True once the user has started a session; gates the now-playing widget. */
  started: boolean;
  shuffle: boolean;
  /** When true, the current track repeats instead of advancing on end. */
  repeatOne: boolean;
};

const N = TRACKS.length;

let state: PlayerState = { current: -1, playing: false, started: false, shuffle: false, repeatOne: false };
const SERVER_STATE: PlayerState = state;

const listeners = new Set<() => void>();

function setState(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/* --- play order (sequential, or a shuffled permutation) --------------------- */
let queue: number[] = Array.from({ length: N }, (_, i) => i);
let pos = 0; // index into `queue`

function shuffled(keepFirst: number): number[] {
  const rest = Array.from({ length: N }, (_, i) => i).filter((i) => i !== keepFirst);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return keepFirst >= 0 ? [keepFirst, ...rest] : rest;
}

/* --- the single <audio> element (lazily created on first play) -------------- */
let audio: HTMLAudioElement | null = null;

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;
  const el = new Audio();
  el.preload = "none";
  el.addEventListener("play", () => setState({ playing: true }));
  el.addEventListener("pause", () => setState({ playing: false }));
  el.addEventListener("ended", () => {
    if (state.repeatOne) {
      el.currentTime = 0;
      el.play().catch(() => setState({ playing: false }));
    } else {
      step(1);
    }
  });
  // A dead or undecodable preview just stops on the current track. We do NOT
  // auto-skip: that silently jumps past the song the user picked, and a run of
  // failures (e.g. a browser with no AAC codec) would cascade through the list.
  el.addEventListener("error", () => setState({ playing: false }));
  audio = el;
  return el;
}

function loadAndPlay(trackIndex: number) {
  const el = ensureAudio();
  const track = TRACKS[trackIndex];
  el.src = track.preview;
  setState({ current: trackIndex, started: true });
  el.play().catch(() => setState({ playing: false }));
}

function step(delta: number) {
  if (N === 0) return;
  pos = (pos + delta + queue.length) % queue.length;
  loadAndPlay(queue[pos]);
}

/* --- public actions --------------------------------------------------------- */

/** Play a specific track (by TRACKS index). With no argument, resumes the
 *  current track or starts the queue from the top. */
export function play(trackIndex?: number) {
  if (typeof trackIndex === "number") {
    pos = queue.indexOf(trackIndex);
    if (pos < 0) pos = 0;
    loadAndPlay(trackIndex);
    return;
  }
  if (state.current >= 0) {
    ensureAudio().play().catch(() => setState({ playing: false }));
  } else {
    loadAndPlay(queue[pos] ?? 0);
  }
}

export function pause() {
  audio?.pause();
}

export function toggle() {
  if (state.playing) pause();
  else play();
}

export function next() {
  step(1);
}

export function prev() {
  // Restart the current track if we're past its intro, else go back one.
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  step(-1);
}

export function toggleRepeat() {
  setState({ repeatOne: !state.repeatOne });
}

export function toggleShuffle() {
  const nextShuffle = !state.shuffle;
  const keep = state.current;
  queue = nextShuffle
    ? shuffled(keep)
    : Array.from({ length: N }, (_, i) => i);
  pos = keep >= 0 ? Math.max(0, queue.indexOf(keep)) : 0;
  setState({ shuffle: nextShuffle });
}

/** Stop playback and dismiss the widget. */
export function stop() {
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  setState({ current: -1, playing: false, started: false });
}

/* --- React binding ---------------------------------------------------------- */
export function useMusic() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
