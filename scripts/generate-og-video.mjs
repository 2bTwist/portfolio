/* Regenerate the homepage's og:video (public/og-home.mp4): a 4 s pixel-art
   loop of the root social card where the mascot idles (bobs one art-pixel,
   blinks, screens flicker) and pixel stars twinkle around it. Run whenever
   app/opengraph-image.tsx, the default palette, or the mascot changes, with
   the site running locally:

     pnpm dev            # in another terminal
     pnpm og:video       # or: node scripts/generate-og-video.mjs <base-url>

   Only link-preview crawlers fetch the file. iMessage autoplays it muted and
   looping; Discord plays it inline because the homepage sets og:type
   video.other. Everywhere else the static og:image stays the preview, and it
   is also the poster frame Discord requires, so every frame keeps the card
   readable.

   The script renders the real card from the running site, blanks the mascot
   box, and re-composites the mascot per frame. It fails loudly if the mascot
   no longer sits where MASCOT_BOX says, so a card layout change cannot ship a
   misaligned video.

   Requires ImageMagick and ffmpeg (`brew install imagemagick ffmpeg`). */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og-home.mp4");
const MASCOT = join(ROOT, "app", "og-assets", "mascot.png");

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

// Where app/opengraph-image.tsx draws the 360px mascot on the 1200x630 card.
const MASCOT_BOX = { x: 725, y: 175, size: 360 };
const STEPS = 32; // logical frames at 8 fps = a 4 s loop
const ART_PX = 6; // one mascot art-pixel at card scale
// The mascot's eyes in mascot.png's own 460px space, for the blink frames.
const EYES = [
  [168, 198],
  [254, 285],
];
const GOLD = "#f7d65c"; // the mascot's screen glow

// Star accent comes from the default palette, so the loop follows a palette change.
const paletteSrc = readFileSync(join(ROOT, "app", "lib", "palette.ts"), "utf8");
const paletteIndex = Number(paletteSrc.match(/DEFAULT_PALETTE_INDEX\s*=\s*(\d+)/)?.[1]);
const accent = [...paletteSrc.matchAll(/"--accent":\s*"(#[0-9a-fA-F]{6})"/g)][paletteIndex]?.[1];
if (!accent) throw new Error("Could not read the default palette's --accent from app/lib/palette.ts");

const magick = (...args) => execFileSync("magick", args, { encoding: "utf8" });

const tmp = mkdtempSync(join(tmpdir(), "og-video-"));
const at = (f) => join(tmp, f);

try {
  const res = await fetch(`${base}/opengraph-image`);
  if (!res.ok) throw new Error(`GET ${base}/opengraph-image -> ${res.status}. Is the site running?`);
  writeFileSync(at("card.png"), Buffer.from(await res.arrayBuffer()));

  const { x, y, size } = MASCOT_BOX;
  // Card surface just inside the box corner, outside the mascot's silhouette.
  const surface = magick(at("card.png"), "-format", `%[pixel:p{${x + 2},${y + 2}}]`, "info:");
  magick(at("card.png"), "-fill", surface, "-draw", `rectangle ${x},${y} ${x + size},${y + size}`, at("base.png"));

  const fit = ["-filter", "Catrom", "-resize", `${size}x${size}`];
  magick(MASCOT, ...fit, at("mascot.png"));
  // Closed eyes: skin over each eye, a dark lid line with upturned ends.
  const lids = EYES.flatMap(([l, r]) => [
    "-fill", "#a15f1f", "-draw", `rectangle ${l},213 ${r},247`,
    "-fill", "#140e0a", "-draw", `rectangle ${l + 2},233 ${r - 2},239`,
    "-draw", `rectangle ${l - 3},228 ${l + 3},234`, "-draw", `rectangle ${r - 3},228 ${r + 3},234`,
  ]);
  magick(MASCOT, ...lids, ...fit, at("blink.png"));
  // Screen flicker: brighten only the yellow screen pixels.
  for (const v of ["mascot", "blink"]) {
    magick(at(`${v}.png`), "(", "+clone", "-modulate", "118", ")",
      "(", "-clone", "0", "-fx", "a>0.99 && r>0.78 && g>0.67 && b<0.67 ? 1 : 0", "-alpha", "off", ")",
      "-composite", at(`${v}-glow.png`));
  }

  // Guard: the re-composited mascot must reproduce the card the site serves.
  magick(at("base.png"), at("mascot.png"), "-geometry", `+${x}+${y}`, "-composite", at("check.png"));
  const crop = ["-crop", `${size}x${size}+${x}+${y}`, "+repage"];
  magick(at("card.png"), ...crop, at("card-box.png"));
  magick(at("check.png"), ...crop, at("check-box.png"));
  let rmse;
  try {
    rmse = execFileSync("magick", ["compare", "-metric", "RMSE", at("card-box.png"), at("check-box.png"), "null:"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (e) {
    rmse = e.stderr; // compare exits 1 when the images differ at all
  }
  const drift = Number(String(rmse).match(/\(([\d.e-]+)\)/)?.[1]);
  if (!(drift < 0.02)) {
    throw new Error(`Mascot is not at MASCOT_BOX on the served card (RMSE ${drift}). Update MASCOT_BOX to match app/opengraph-image.tsx.`);
  }

  const stars = [
    [735, 205, 0], [1060, 240, 3], [1000, 180, 6], [760, 470, 10],
    [1075, 420, 14], [705, 330, 18], [900, 160, 22], [1050, 500, 26],
  ];
  const starCells = [[[0, 0]], [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]];
  starCells[2] = [...starCells[1], [2, 0], [-2, 0], [0, 2], [0, -2]];

  for (let i = 0; i < STEPS; i++) {
    const dy = [0, 0, -ART_PX, -ART_PX][Math.floor(i / 2) % 4];
    const variant = (i === 21 || i === 22 ? "blink" : "mascot") + (Math.floor(i / 4) % 2 ? "-glow" : "");
    const draws = stars.flatMap(([sx, sy, offset], n) => {
      const k = (((i - offset) % STEPS) + STEPS) % STEPS;
      if (k >= 5) return [];
      const cells = starCells[[0, 1, 2, 1, 0][k]];
      return ["-fill", n % 2 ? GOLD : accent, ...cells.flatMap(([cx, cy]) => {
        const px = sx + cx * ART_PX, py = sy + cy * ART_PX;
        return ["-draw", `rectangle ${px},${py} ${px + ART_PX - 1},${py + ART_PX - 1}`];
      })];
    });
    magick(at("base.png"), at(`${variant}.png`), "-geometry", `+${x}+${y + dy}`, "-composite", ...draws,
      at(`frame-${String(i).padStart(2, "0")}.png`));
  }

  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", "8", "-i", at("frame-%02d.png"), "-r", "24",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-tune", "animation",
    "-movflags", "+faststart", "-an", OUT,
  ]);
  console.log(`Wrote public/og-home.mp4 (${Math.round(statSync(OUT).size / 1024)} KB, mascot drift RMSE ${drift})`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
