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

/** Apple suffixes a lot of albums with " - Single"/" - EP"; drop it for display. */
export function albumLabel(album: string): string {
  return album.replace(/\s+-\s+(Single|EP)$/i, "");
}
