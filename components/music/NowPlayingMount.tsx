"use client";

/* Lazy global mount for the now-playing dock. Loaded via next/dynamic(ssr:false)
   so its chunk (widget + player store) is split out and never referenced by the
   prerendered HTML — keeping it out of the bundle-size budget, exactly like
   DataRevealMount. The widget itself renders null until playback starts, so this
   costs effectively nothing on routes where no music is playing. */

import dynamic from "next/dynamic";

const NowPlayingWidget = dynamic(
  () => import("./NowPlayingWidget").then((m) => m.NowPlayingWidget),
  { ssr: false },
);

export function NowPlayingMount() {
  return <NowPlayingWidget />;
}
