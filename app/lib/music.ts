/* Typed accessor for the curated vinyl playlist. The data is generated from the
   iTunes Search API by scripts/resolve-music.mjs (pnpm music:resolve) into
   data/music.json, so this module is a plain, server-and-client importable JSON
   wrapper with zero runtime fetching. Tracks play Apple's 30s preview clips; the
   list loops/shuffles so it never "ends". */

import data from "@/data/music.json";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  preview: string;
  durationMs: number | null;
  appleUrl: string | null;
};

export const TRACKS: Track[] = data.tracks as Track[];

/* Apple artwork URLs end in a size segment (…/600x600bb.jpg) that the CDN
   renders at any size, so each image asks for what it displays: `px` CSS pixels
   at 1x, double for 2x screens. The data keeps the 600px original for the
   large now-playing card. */
export function artworkAt(url: string, px: number): { src: string; srcSet: string } {
  const sized = (n: number) => url.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, `/${n}x${n}bb.$1`);
  return { src: sized(px), srcSet: `${sized(px)} 1x, ${sized(px * 2)} 2x` };
}

/** Apple suffixes a lot of albums with " - Single"/" - EP"; drop it for display. */
export function albumLabel(album: string): string {
  return album.replace(/\s+-\s+(Single|EP)$/i, "");
}
