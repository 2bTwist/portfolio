"use client";

/* The Claude tile is a small easter egg: the burst logo stays, but on hover the
   label stops saying "Claude" and instead cycles playful "AI thinking" status
   words (the SimCity "reticulating splines" lineage) with animated dots. State
   lives in event handlers + an interval (not an effect), matching the repo's
   react-compiler discipline; the effect here only clears the timer on unmount. */

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { STACK_LOGOS } from "./stackLogos";

const THINKING = [
  "Reticulating",
  "Synthesizing",
  "Ruminating",
  "Cogitating",
  "Pondering",
  "Percolating",
  "Hallucinating",
  "Conjuring",
  "Marinating",
  "Noodling",
  "Manifesting",
  "Untangling",
  "Spelunking",
  "Vibing",
];

export function ClaudeTile() {
  const { color, svg, name } = STACK_LOGOS.claude;
  const [word, setWord] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const idx = useRef(0);

  const start = () => {
    idx.current = Math.floor(Math.random() * THINKING.length);
    setWord(THINKING[idx.current]);
    timer.current = setInterval(() => {
      idx.current = (idx.current + 1) % THINKING.length;
      setWord(THINKING[idx.current]);
    }, 1100);
  };
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setWord(null);
  };

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  return (
    <li className="stack-item" onPointerEnter={start} onPointerLeave={stop}>
      <span className="stack-tile" style={{ "--logo": color } as CSSProperties}>
        <svg viewBox="0 0 24 24" className="stack-tile-logo stack-tile-logo--claude" fill={color} aria-hidden="true">
          {svg}
        </svg>
      </span>
      <span className={`stack-name mono ${word ? "stack-name--thinking" : ""}`} aria-label={name}>
        {word ? (
          <>
            {word}
            <span className="stack-think-dots" aria-hidden="true" />
          </>
        ) : (
          name
        )}
      </span>
    </li>
  );
}
