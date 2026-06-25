/* Tiny Web Audio "click" synth. Every sound is synthesized from oscillators,
   so there are NO audio assets to download — nothing touches the network or the
   bundle. The AudioContext is created lazily on the first user gesture (autoplay
   policy), which is exactly the "audible after first interaction" behaviour. */

let ctx: AudioContext | null = null;
let creating = false;

// Warm up the AudioContext OFF the interaction's critical path. `new
// AudioContext()` costs ~20-60ms (hardware audio init); doing it inline in the
// first click would land entirely in that click's INP. Instead the first
// gesture schedules creation in a separate task — the first sound or two are
// skipped while it warms up, then every later click plays for ~free.
function ensureCtx() {
  if (ctx || creating || typeof window === "undefined") return;
  const AC =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  creating = true;
  setTimeout(() => {
    try {
      ctx = new AC();
    } catch {
      // no Web Audio available
    }
    creating = false;
  }, 0);
}

function getCtx(): AudioContext | null {
  if (!ctx) {
    ensureCtx();
    return null;
  }
  // resume() runs inside the pointer gesture, satisfying the autoplay policy
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Warm the AudioContext up at mount (off any click's critical path) so it
// already exists by the first interaction — otherwise the very first sound is
// dropped while the context is still being created. Still costs nothing on the
// click itself; creation runs in the deferred task scheduled here.
export function warmupSound() {
  ensureCtx();
}

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  sweep?: number; // Hz offset ramped to over the duration (negative = down)
};

function blip({ freq, dur, type = "triangle", gain = 0.05, sweep }: Tone) {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (sweep) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), now + dur);
  }
  // quick attack, exponential decay — a soft tactile "tock", deliberately quiet
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/* Für Elise (Beethoven) — each terminal keystroke plays the next note, so typing
   performs the tune. The A theme + B section (then it loops). After a long pause
   it restarts from the top, so each "session" of typing begins the melody. */
const HZ: Record<string, number> = {
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23,
  "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0, "A#4": 466.16, B4: 493.88,
  C5: 523.25, "C#5": 554.37, D5: 587.33, "D#5": 622.25, E5: 659.25, F5: 698.46,
  "F#5": 739.99, G5: 783.99, "G#5": 830.61, A5: 880.0,
};
const FUR_ELISE = (
  // A section
  "E5 D#5 E5 D#5 E5 B4 D5 C5 A4 C4 E4 A4 B4 E4 G#4 B4 C5 E4 " +
  "E5 D#5 E5 D#5 E5 B4 D5 C5 A4 C4 E4 A4 B4 E4 C5 B4 A4 " +
  // B section
  "B4 C5 D5 E5 G4 F5 E5 D5 F4 E5 D5 C5 E4 D5 C5 B4 E4 E5 E5 E5 " +
  "E5 D#5 E5 D#5 E5 B4 D5 C5 A4 C4 E4 A4 B4 E4 C5 B4 A4"
)
  .split(" ")
  .map((n) => HZ[n]);
let furIdx = 0;
let furLast = 0;
const FUR_RESET_MS = 2200; // pause longer than this restarts the melody

// A soft "music box" note: a triangle fundamental + a quiet octave shimmer, with
// a gentle pluck envelope. Used for the melodic terminal typing.
function note(freq: number) {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const o1 = ac.createOscillator();
  o1.type = "triangle";
  o1.frequency.setValueAtTime(freq, now);
  const o2 = ac.createOscillator();
  o2.type = "sine";
  o2.frequency.setValueAtTime(freq * 2, now);
  const oct = ac.createGain();
  oct.gain.value = 0.4; // octave shimmer, quieter
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.055, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
  o1.connect(g);
  o2.connect(oct).connect(g);
  g.connect(ac.destination);
  o1.start(now);
  o2.start(now);
  o1.stop(now + 0.4);
  o2.stop(now + 0.4);
}

/* Distinct sounds per interaction kind. Open/reveal rise; close/dismiss fall;
   view is a clean select blip; switch is a dry tick; press is the tactile tock.
   Tune freely — these are deliberately subtle. */
export const sfx = {
  press: () => blip({ freq: 220, dur: 0.07, type: "sine", gain: 0.07, sweep: -70 }),
  open: () => blip({ freq: 330, dur: 0.085, type: "triangle", gain: 0.05, sweep: 210 }),
  close: () => blip({ freq: 480, dur: 0.085, type: "triangle", gain: 0.05, sweep: -200 }),
  view: () => blip({ freq: 440, dur: 0.04, type: "sine", gain: 0.045 }),
  switch: () => blip({ freq: 620, dur: 0.035, type: "square", gain: 0.03, sweep: 80 }),
  // Terminal typing performs Für Elise — each keystroke is the next note; a long
  // pause restarts from the top.
  key: () => {
    const t = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (t - furLast > FUR_RESET_MS) furIdx = 0;
    furLast = t;
    note(FUR_ELISE[furIdx]);
    furIdx = (furIdx + 1) % FUR_ELISE.length;
  },
  // a low "nope" thud for hitting a limit (e.g. shoving the sidebar past its range)
  bonk: () => blip({ freq: 150, dur: 0.12, type: "square", gain: 0.06, sweep: -55 }),
  // a cute two-note "boop" (rising fifth, C5 -> G5) for the social buttons
  pop: () => {
    blip({ freq: 523, dur: 0.06, type: "sine", gain: 0.05, sweep: 40 });
    setTimeout(() => blip({ freq: 784, dur: 0.07, type: "sine", gain: 0.045, sweep: 70 }), 60);
  },
};
