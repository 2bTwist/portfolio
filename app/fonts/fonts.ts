import localFont from "next/font/local";

/* Self-hosted Fontshare faces (Clash Display + Satoshi). woff2 are static
   assets, not JS bundle. Exposed as CSS variables consumed by globals.css:
   --font-display (headings/hero) and --font-sans (body). display:swap so the
   plain site paints immediately with the fallback while the face loads. */

export const clashDisplay = localFont({
  src: [
    { path: "./ClashDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "./ClashDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  // Display face is only used in headings and swaps in over the fallback, so we
  // don't preload it — that frees the critical path for the actual LCP paint.
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
  display: "swap",
  // Not preloaded: the page paints immediately on the size-adjusted system
  // fallback (CLS stays 0) and Satoshi swaps in without delaying the LCP paint.
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
});
