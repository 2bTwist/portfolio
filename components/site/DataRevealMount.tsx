"use client";

/* Lazy mount for the data-reveal popup. Rendered ONLY by the /privacy page,
   runs once per browser, and is deferred a few seconds, so its code has no
   business in the initial-load bundle. Loading it via next/dynamic (ssr:false)
   splits it into its own chunk that isn't referenced by the prerendered HTML,
   so it's excluded from the bundle-size budget. */

import dynamic from "next/dynamic";

const DataReveal = dynamic(
  () => import("./DataReveal").then((m) => m.DataReveal),
  { ssr: false },
);

export function DataRevealMount() {
  return <DataReveal />;
}
