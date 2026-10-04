"use client";

/* The interface-sound mute switch. One control, shown in the status bar on
   desktop and in the compact header, so every layout that plays sounds can
   silence them. */

import { useSound } from "./SoundProvider";

export function MuteToggle({ className }: { className: string }) {
  const { muted, toggleMuted } = useSound();
  return (
    <button
      type="button"
      className={className}
      data-sound="switch"
      // The label names the action, so no aria-pressed: "Mute, pressed" would
      // read as already muted.
      aria-label={muted ? "Unmute UI sounds" : "Mute UI sounds"}
      onClick={() => toggleMuted()}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9h3l5-4v14l-5-4H4z" />
        {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M15.5 9.5a4 4 0 010 5" />}
      </svg>
    </button>
  );
}
