/* Regenerate the hero's static location minimap from data/profile.ts. Run when
   profile.location / profile.coords change:

     pnpm map:generate

   Composites CARTO "light_all" basemap tiles (OSM data) around the profile
   coords into a 640x400 (@2x for the ~300px card) WebP committed to
   public/map-<city>.webp. First-party asset on purpose: the card used to hit
   Stadia's static-map API, which moved behind a paid plan and started serving
   an "Upgrade for Access" placeholder. A committed asset can't rot, needs no
   key, and costs no third-party request at runtime.

   Requires ImageMagick (`brew install imagemagick`). After running, point
   MAP_SRC in components/site/LocationCard.tsx at the printed filename and
   delete the old map asset. Keep the on-card "© OpenStreetMap © CARTO"
   attribution — the data license requires it. */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(__dirname, "..", "data", "profile.ts");

const ZOOM = 12;
const OUT_W = 640;
const OUT_H = 400;
const TILE = 512; // @2x tiles

const src = readFileSync(PROFILE, "utf8");
const coords = src.match(/coords:\s*\{\s*lat:\s*(-?[\d.]+),\s*lon:\s*(-?[\d.]+)/);
const loc = src.match(/location:\s*"([^"]+)"/);
if (!coords || !loc) throw new Error("Could not read coords/location from data/profile.ts");
const lat = Number(coords[1]);
const lon = Number(coords[2]);
const city = loc[1].split(",")[0].trim().toLowerCase().replace(/\s+/g, "-");
const out = join(__dirname, "..", "public", `map-${city}.webp`);

// Web-mercator pixel position of the center at ZOOM, in @2x pixel space.
const n = 2 ** ZOOM;
const latr = (lat * Math.PI) / 180;
const cx = ((lon + 180) / 360) * n * TILE;
const cy = ((1 - Math.log(Math.tan(latr) + 1 / Math.cos(latr)) / Math.PI) / 2) * n * TILE;
const x0 = cx - OUT_W / 2;
const y0 = cy - OUT_H / 2;
const tx0 = Math.floor(x0 / TILE);
const ty0 = Math.floor(y0 / TILE);
const tx1 = Math.floor((x0 + OUT_W - 1) / TILE);
const ty1 = Math.floor((y0 + OUT_H - 1) / TILE);

const work = mkdtempSync(join(tmpdir(), "minimap-"));
try {
  const rows = [];
  for (let ty = ty0; ty <= ty1; ty++) {
    const row = [];
    for (let tx = tx0; tx <= tx1; tx++) {
      const url = `https://basemaps.cartocdn.com/light_all/${ZOOM}/${tx}/${ty}@2x.png`;
      const res = await fetch(url, { headers: { "User-Agent": "portfolio-static-map-build/1.0" } });
      if (!res.ok) throw new Error(`Tile fetch failed (${res.status}): ${url}`);
      const dst = join(work, `${ty}_${tx}.png`);
      writeFileSync(dst, Buffer.from(await res.arrayBuffer()));
      row.push(dst);
    }
    rows.push(row);
  }
  const mosaic = join(work, "mosaic.png");
  const offX = Math.round(x0 - tx0 * TILE);
  const offY = Math.round(y0 - ty0 * TILE);
  // ( rowTiles +append ) per row, rows -append: grid composition without
  // `montage`, which insists on loading a font and fails on bare installs.
  const args = rows.flatMap((row) => ["(", ...row, "+append", ")"]);
  execFileSync("magick", [...args, "-append", mosaic]);
  execFileSync("magick", [mosaic, "-crop", `${OUT_W}x${OUT_H}+${offX}+${offY}`, "+repage", "-strip", "-quality", "82", out]);
  console.log(`Wrote ${out} (${lat}, ${lon} @ z${ZOOM})`);
  console.log(`Ensure MAP_SRC in components/site/LocationCard.tsx is "/map-${city}.webp"`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
