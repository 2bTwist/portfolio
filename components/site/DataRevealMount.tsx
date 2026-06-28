"use client";

/* Lazy mount for the first-visit data-reveal popup. The popup is global (it
   lives in the root layout) but only ever runs once per browser and is deferred
   ~1.1s, so its code has no business in the initial-load bundle. Loading it via
   next/dynamic (ssr:false) splits it into its own chunk that isn't referenced by
   the prerendered HTML, so it's excluded from the bundle-size budget. */

import dynamic from "next/dynamic";

const DataReveal = dynamic(
  () => import("./DataReveal").then((m) => m.DataReveal),
  { ssr: false },
);

export function DataRevealMount() {
  return <DataReveal />;
}
