"use client";

/* Animated icons (lucide + motion) for the LAZY overlays only — the command
   palette and terminal, both loaded via next/dynamic(ssr:false). Because they
   are imported solely from those code-split chunks, motion + lucide-react stay
   OUT of the initial bundle. Do NOT import this file from the always-mounted
   shell. */

import { motion, useReducedMotion } from "motion/react";
import { Search, Terminal } from "lucide-react";

const MotionSearch = motion.create(Search);
const MotionTerminal = motion.create(Terminal);

const spring = { type: "spring", stiffness: 500, damping: 22 } as const;

/* Inline Motion transforms ignore the stylesheet's reduced-motion rules, so the
   preference is applied here: with it, icons only fade in, with no scale,
   rotation, or travel. */

export function SearchIcon({ size = 16 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <MotionSearch
      size={size}
      initial={reduce ? { opacity: 0 } : { scale: 0.6, rotate: -20, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
      whileHover={reduce ? undefined : { rotate: -12, scale: 1.12 }}
      transition={spring}
    />
  );
}

export function TerminalIcon({ size = 14 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <MotionTerminal
      size={size}
      initial={reduce ? { opacity: 0 } : { x: -5, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { x: 0, opacity: 1 }}
      transition={spring}
    />
  );
}
