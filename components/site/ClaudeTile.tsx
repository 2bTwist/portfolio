"use client";

/* The Claude tile is a small easter egg: the burst logo stays, but on hover the
   label stops saying "Claude" and instead cycles playful "AI thinking" status
   words (the SimCity "reticulating splines" lineage) with animated dots. State
   lives in event handlers + an interval (not an effect), matching the repo's
   react-compiler discipline; the effect here only clears the timer on unmount. */

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ClaudeBurst } from "./ClaudeBurst";

// Inlined so this client tile doesn't pull the whole stackLogos module (every
// brand SVG path) into the client bundle just for Claude's colour + label.
const CLAUDE_COLOR = "#D97757";
const CLAUDE_NAME = "Claude";

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
  const color = CLAUDE_COLOR;
  const name = CLAUDE_NAME;
  const [word, setWord] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const idx = useRef(0);

  const start = () => {
    idx.current = Math.floor(Math.random() * THINKING.length);
    setWord(THINKING[idx.current]);
    timer.current = setInterval(() => {
      idx.current = (idx.current + 1) % THINKING.length;
      setWord(THINKING[idx.current]);
    }, 1800);
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
    <li className="stack-item stack-item--claude" onPointerEnter={start} onPointerLeave={stop}>
      <span className="stack-tile" style={{ "--logo": color } as CSSProperties}>
        <ClaudeBurst color={color} />
      </span>
      {/* The animated dots are a CSS ::after so the gradient shimmer clips over
          the word AND the dots as one piece of text. */}
      <span className={`stack-name mono ${word ? "stack-name--thinking" : ""}`} aria-label={name}>
        {word ?? name}
      </span>
    </li>
  );
}
