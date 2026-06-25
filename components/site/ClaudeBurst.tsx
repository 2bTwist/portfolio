/* Claude burst rebuilt as 12 individual tapered spokes (verified geometry from
   the Anthropic brand mark: irregular tip angles + per-spoke length). Each spoke
   can scaleY/opacity-animate from the hub outward, so on hover the rays
   "breathe" in and out as a staggered wave (see .claude-spoke in globals.css) —
   the real Claude thinking feel, not a spin. Static (full) at rest. */

import type { CSSProperties } from "react";

export function ClaudeBurst({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`stack-tile-logo stack-tile-logo--claude ${className}`} fill={color} aria-hidden="true">
      <g transform="rotate(81 12 12)">
        <path className="claude-spoke" style={{ "--sd": "0s" } as CSSProperties} d="M11.05 10.00 L11.66 2.49 L12.34 2.49 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(41 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.1s" } as CSSProperties} d="M11.05 10.00 L11.66 2.24 L12.34 2.24 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(10 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.2s" } as CSSProperties} d="M11.05 10.00 L11.66 2.65 L12.34 2.65 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-26 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.3s" } as CSSProperties} d="M11.05 10.00 L11.66 1.60 L12.34 1.60 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-56 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.4s" } as CSSProperties} d="M11.05 10.00 L11.66 2.33 L12.34 2.33 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-89 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.5s" } as CSSProperties} d="M11.05 10.00 L11.66 2.49 L12.34 2.49 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-123 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.6s" } as CSSProperties} d="M11.05 10.00 L11.66 2.97 L12.34 2.97 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-146 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.7s" } as CSSProperties} d="M11.05 10.00 L11.66 2.57 L12.34 2.57 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-177 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.8s" } as CSSProperties} d="M11.05 10.00 L11.66 2.49 L12.34 2.49 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-213 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-0.9s" } as CSSProperties} d="M11.05 10.00 L11.66 2.57 L12.34 2.57 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-228 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-1s" } as CSSProperties} d="M11.05 10.00 L11.66 2.24 L12.34 2.24 L12.95 10.00 Z" />
      </g>
      <g transform="rotate(-256 12 12)">
        <path className="claude-spoke" style={{ "--sd": "-1.1s" } as CSSProperties} d="M11.05 10.00 L11.66 2.24 L12.34 2.24 L12.95 10.00 Z" />
      </g>
    </svg>
  );
}
