import { PageShell } from "@/components/site/PageShell";
import { VinylPlayer } from "@/components/music/VinylPlayer";

export function MusicBody() {
  return (
    <PageShell width="wide">
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
