import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_COLORS as C } from "@/app/lib/palette";

/* Shared renderer for per-page social cards (1200x630). Same editor-window
   motif as the root app/opengraph-image.tsx, parameterised by the page's tab
   label, eyebrow, title and summary. Static (prerendered at build), so the
   brand faces + mascot are read from disk once. ttf only — Satori does not
   take woff2. */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const asset = (f: string) => readFileSync(join(process.cwd(), "app/og-assets", f));
const dataUrl = (bytes: Buffer, mime: string) => `data:${mime};base64,${bytes.toString("base64")}`;

/* Banner art lives under public/. Satori cannot decode WebP ("u2 is not
   iterable"), so only PNG/JPEG banners appear on the card; a WebP banner keeps
   the text-only card. Save banners meant for sharing as PNG; next/image still
   serves visitors an optimized AVIF/WebP. */
const OG_ART_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

function ogArtDataUrl(src: string): string | null {
  const mime = OG_ART_MIME[src.split(".").pop()?.toLowerCase() ?? ""];
  return mime ? dataUrl(readFileSync(join(process.cwd(), "public", src)), mime) : null;
}

/* Clash Display tops out around 88px; long titles need to step down so they
   never clip the card. Tuned against the real post/project titles. */
function titleSize(title: string, withArt: boolean): number {
  const n = title.length;
  const size = n <= 24 ? 88 : n <= 40 ? 70 : n <= 60 ? 56 : 46;
  /* The art takes the right third of the card, so the text column is narrower. */
  return withArt ? Math.round(size * 0.78) : size;
}

export type OgCard = {
  /* The fake filename in the window title bar, e.g. "privacy-basics.mdx". */
  tab: string;
  /* Small accent kicker above the title, e.g. "WRITING" or "WEB PROJECT". */
  eyebrow: string;
  title: string;
  /* One-line description under the title (post summary / project blurb). */
  summary: string;
  /* Optional banner art (public/ path), shown on the right of the card. */
  art?: string;
};

/* Satori has no reliable multi-line clamp, so trim to a safe single-card
   length on a word boundary. */
function clamp(text: string, max = 118): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

export function renderOgCard({ tab, eyebrow, title, summary, art }: OgCard) {
  const clash = asset("ClashDisplay-Bold.ttf");
  const satoshi = asset("Satoshi-Regular.ttf");
  const satoshiBold = asset("Satoshi-Bold.ttf");
  const mascot = dataUrl(asset("mascot.png"), "image/png");
  const artSrc = art ? ogArtDataUrl(art) : null;

  const dot = (bg: string) => ({ width: 15, height: 15, borderRadius: 999, background: bg });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 48,
          background: C["--bg"],
          fontFamily: "Satoshi",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: C["--surface"],
            borderRadius: 26,
            border: `1px solid ${C["--border"]}`,
            boxShadow: `0 30px 60px -22px ${C["--text"]}4d`,
            overflow: "hidden",
          }}
        >
          {/* Window title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "24px 30px",
              borderBottom: `1px solid ${C["--border"]}`,
              background: C["--bg"],
            }}
          >
            <div style={dot(C["--dot-close"])} />
            <div style={dot(C["--dot-min"])} />
            <div style={dot(C["--dot-max"])} />
            <div style={{ marginLeft: 20, fontSize: 25, color: C["--muted"] }}>{tab}</div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: artSrc ? "46px 20px 46px 66px" : "46px 66px" }}>
              <div style={{ fontSize: 26, letterSpacing: 4, color: C["--accent"], fontWeight: 700 }}>
                {eyebrow}
              </div>
              <div
                style={{
                  fontFamily: "Clash",
                  fontSize: titleSize(title, !!artSrc),
                  color: C["--text"],
                  lineHeight: 1.08,
                  marginTop: 18,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: artSrc ? 24 : 28,
                  color: C["--muted"],
                  lineHeight: 1.35,
                  marginTop: artSrc ? 16 : 20,
                  maxWidth: 880,
                  display: "flex",
                }}
              >
                {clamp(summary, artSrc ? 90 : 118)}
              </div>

              <div style={{ flex: 1 }} />

              {/* Brand footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mascot} width={72} height={72} alt="" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 30, color: C["--text"], fontWeight: 700 }}>Edmond Ndanji</div>
                  <div style={{ fontSize: 22, letterSpacing: 3, color: C["--accent"], fontWeight: 700 }}>
                    EDDYB.DEV
                  </div>
                </div>
              </div>
            </div>
            {artSrc ? (
              <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 30 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artSrc} width={450} height={253} style={{ objectFit: "contain" }} alt="" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Clash", data: clash, weight: 700, style: "normal" },
        { name: "Satoshi", data: satoshi, weight: 400, style: "normal" },
        { name: "Satoshi", data: satoshiBold, weight: 700, style: "normal" },
      ],
    },
  );
}
