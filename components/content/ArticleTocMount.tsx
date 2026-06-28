"use client";

/* Lazy mount for the side table-of-contents. It's a non-critical reading aid
   that only reads the DOM after mount, so it doesn't belong in the initial-load
   bundle. next/dynamic (ssr:false) splits it into its own chunk that the
   prerendered HTML doesn't reference, keeping it out of the bundle-size budget. */

import dynamic from "next/dynamic";

const ArticleToc = dynamic(
  () => import("./ArticleToc").then((m) => m.ArticleToc),
  { ssr: false },
);

export function ArticleTocMount() {
  return <ArticleToc />;
}
