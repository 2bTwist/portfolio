"use client";

/* Lazy mount for the custom cursor. The cursor is decorative and stays hidden
   (native cursor shown) until the first pointer move, so deferring its chunk —
   including the inlined hand-path data — off the initial load has no perceptible
   cost and keeps that JS out of the always-loaded route bundle (the size gate).
   ssr:false is required (a Server Component can't do it), hence this wrapper. */

import dynamic from "next/dynamic";

const CustomCursor = dynamic(
  () => import("./CustomCursor").then((m) => m.CustomCursor),
  { ssr: false },
);

export function CursorMount() {
  return <CustomCursor />;
}
