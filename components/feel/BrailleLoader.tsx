/* Braille-dot loader — the site's loading motif. The spinning frames are
   driven purely by a CSS content animation (see .braille-loader in globals);
   under reduced-motion it settles on a single static braille glyph. Server
   component (no client JS). */

export function BrailleLoader({ label = "Loading" }: { label?: string }) {
  return (
    <span className="braille-loader mono" role="status" aria-label={label} aria-live="polite" />
  );
}
