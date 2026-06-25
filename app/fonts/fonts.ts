import localFont from "next/font/local";

/* Self-hosted Fontshare faces (Clash Display + Satoshi). woff2 are static
   assets, not JS bundle. Exposed as CSS variables consumed by globals.css:
   --font-display (headings/hero) and --font-sans (body).

   preload:true + display:"swap": the brand fonts MUST be on screen from the
   first paint (no system-font flash). Preloading fetches the tiny subset woff2
   (~20KB each, same-origin) at high priority in <head>, so they are almost
   always ready before the hero paints -> text renders directly in the brand
   face, no swap flash. "swap" guarantees the brand font always wins eventually
   even on a slow connection. This also avoids the swap rewrap that caused CLS:
   when the font is already there at paint, there is nothing to swap.
   (display:"optional" was rejected: it shows the fallback on slow loads and can
   skip the brand font entirely, which kills the design.) */

export const clashDisplay = localFont({
  src: [
    { path: "./ClashDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "./ClashDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const satoshi = localFont({
  src: [
    { path: "./Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./Satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
});
