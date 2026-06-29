import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { TRACKS } from "@/app/lib/music";
import { MusicBody } from "./_body";

export const metadata: Metadata = {
  title: "Music - Edmond Ndanji",
  description: "A vinyl player of what I've had on repeat lately, from Richard Bona to Radiohead. Press play.",
  alternates: { canonical: "/music" },
  openGraph: {
    title: "Music - Edmond Ndanji",
    description: "A vinyl player of what I've had on repeat lately. Press play.",
    url: "/music",
  },
};

const playlistLd = {
  "@context": "https://schema.org",
  "@type": "MusicPlaylist",
  name: "On repeat — Edmond Ndanji",
  numTracks: TRACKS.length,
  track: TRACKS.map((t) => ({
    "@type": "MusicRecording",
    name: t.title,
    byArtist: { "@type": "MusicGroup", name: t.artist },
    inAlbum: { "@type": "MusicAlbum", name: t.album },
  })),
};

export default function MusicPage() {
  return (
    <>
      <JsonLd data={playlistLd} />
      <MusicBody />
    </>
  );
}
