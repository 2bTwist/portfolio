import localFont from "next/font/local";

/* Self-hosted Fontshare faces (Clash Display + Satoshi). woff2 are static
   assets, not JS bundle. Exposed as CSS variables consumed by globals.css:
   --font-display (headings/hero) and --font-sans (body).

   display:"optional", NOT "swap". adjustFontFallback (default "Arial") matches
   the fallback's vertical box but not glyph widths, so on a slow load the real
   font swapping in rewraps the multi-line hero blurb to a different line count
   and shifts the page (measured CLS ~0.058 on the slow CI runner). "optional"
   locks whichever font is ready after a short block window for the rest of the
   page, so there is no swap and no rewrap -> CLS 0. The faces are tiny (subset,
   ~20KB, same-origin), so on normal connections the brand fonts still win the
   block window; only genuinely slow first loads fall back, and cached loads
   always show them. */

export const clashDisplay = localFont({
  src: [
    { path: "./ClashDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "./ClashDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "optional",
  // Not preloaded: keeps the critical path clear for the LCP paint.
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const satoshi = localFont({
  src: [
    { path: "./Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./Satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "optional",
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
});
