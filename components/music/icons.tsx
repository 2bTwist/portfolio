/* Tiny inline transport-control glyphs. Inlined (not an icon library) so the
   globally-mounted now-playing widget adds a few hundred bytes, not a barrel.
   All are 24x24, currentColor, decorative (the buttons carry the aria-label). */

type P = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

export const PlayGlyph = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
  </svg>
);

export const PauseGlyph = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export const NextGlyph = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 5.7v12.6a1 1 0 0 0 1.55.83L16 13.66V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.34L7.55 4.87A1 1 0 0 0 6 5.7Z" />
  </svg>
);

export const PrevGlyph = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M18 5.7v12.6a1 1 0 0 1-1.55.83L8 13.66V18a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v4.34l8.45-5.47A1 1 0 0 1 18 5.7Z" />
  </svg>
);

export const CloseGlyph = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6.4 5A1 1 0 0 0 5 6.4L10.6 12 5 17.6A1 1 0 0 0 6.4 19L12 13.4 17.6 19A1 1 0 0 0 19 17.6L13.4 12 19 6.4A1 1 0 0 0 17.6 5L12 10.6Z" />
  </svg>
);
