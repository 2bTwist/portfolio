/* Tiny Web Audio "click" synth. Every sound is synthesized from oscillators,
   so there are NO audio assets to download — nothing touches the network or the
   bundle. The AudioContext is created lazily on the first user gesture (autoplay
   policy), which is exactly the "audible after first interaction" behaviour. */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
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

export const sfx = {
  press: () => blip({ freq: 220, dur: 0.07, type: "sine", gain: 0.07, sweep: -70 }),
  soft: () => blip({ freq: 340, dur: 0.045, type: "triangle", gain: 0.04 }),
  toggle: () => blip({ freq: 420, dur: 0.05, type: "square", gain: 0.035, sweep: 110 }),
  key: () => blip({ freq: 170 + Math.random() * 50, dur: 0.022, type: "square", gain: 0.022 }),
};
