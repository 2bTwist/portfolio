"use client";

/* Animated icons (lucide + motion) for the LAZY overlays only — the command
   palette and terminal, both loaded via next/dynamic(ssr:false). Because they
   are imported solely from those code-split chunks, motion + lucide-react stay
   OUT of the initial bundle. Do NOT import this file from the always-mounted
   shell. */

import { motion } from "motion/react";
import { Search, Terminal } from "lucide-react";

const MotionSearch = motion.create(Search);
const MotionTerminal = motion.create(Terminal);

const spring = { type: "spring", stiffness: 500, damping: 22 } as const;

export function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <MotionSearch
      size={size}
      initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      whileHover={{ rotate: -12, scale: 1.12 }}
      transition={spring}
    />
  );
}

export function TerminalIcon({ size = 14 }: { size?: number }) {
  return (
    <MotionTerminal
      size={size}
      initial={{ x: -5, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={spring}
    />
  );
}
