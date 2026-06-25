/* Tech-stack tiles — chunky, tactile cream "app-icon" squircles with a real
   brand SVG inside each (server component; logos are inlined, see stackLogos).
   The brand hue drives both the icon fill and a faint glow behind it.

   A couple of tiles are flip cards: on hover they rotate 180° to reveal a
   related tech on the back (Postgres → Supabase, Expo → React Native). */

import type { CSSProperties } from "react";
import { STACK_LOGOS, STACK_ORDER } from "./stackLogos";

// front id → back id for the flip tiles
const FLIP: Record<string, string> = {
  postgres: "supabase",
  expo: "reactnative",
};

function Logo({ id }: { id: string }) {
  const { color, svg } = STACK_LOGOS[id];
  return (
    <svg
      viewBox="0 0 24 24"
      className={`stack-tile-logo stack-tile-logo--${id}`}
      fill={color}
      aria-hidden="true"
    >
      {svg}
    </svg>
  );
}

function Face({ id, side }: { id: string; side: "front" | "back" }) {
  const { color, name } = STACK_LOGOS[id];
  return (
    <span
      className={`stack-face stack-face--${side}`}
      style={{ "--logo": color } as CSSProperties}
      title={name}
    >
      <Logo id={id} />
    </span>
  );
}

export function TechStack({ className = "" }: { className?: string }) {
  return (
    <ul className={`stack-grid ${className}`}>
      {STACK_ORDER.map((id) => {
        const front = STACK_LOGOS[id];
        const backId = FLIP[id];
        const back = backId ? STACK_LOGOS[backId] : null;

        return (
          <li key={id} className="stack-item">
            {back ? (
              <>
                <span className="stack-tile stack-tile--flip" tabIndex={0}>
                  <span className="stack-flip">
                    <Face id={id} side="front" />
                    <Face id={backId!} side="back" />
                  </span>
                </span>
                {/* Name crossfades to the back tech in sync with the flip. */}
                <span className="stack-name stack-name--flip mono">
                  <span className="stack-name-front">{front.name}</span>
                  <span className="stack-name-back">{back.name}</span>
                </span>
              </>
            ) : (
              <>
                <span className="stack-tile" style={{ "--logo": front.color } as CSSProperties}>
                  <Logo id={id} />
                </span>
                <span className="stack-name mono">{front.name}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
