import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { JsonLd } from "@/components/site/JsonLd";
import { VinylPlayer } from "@/components/music/VinylPlayer";
import { TRACKS } from "@/app/lib/music";

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
    <PageShell width="wide">
      <JsonLd data={playlistLd} />
      <h1 className="display text-4xl sm:text-5xl font-bold mb-2" style={{ color: "var(--text)" }}>
        On repeat
      </h1>
      <p className="mb-8 font-sans" style={{ color: "var(--muted)" }}>
        A little turntable of what I&apos;ve had playing lately. Drop the needle.
      </p>
      <VinylPlayer />
    </PageShell>
  );
}
