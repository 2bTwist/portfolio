import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Shared renderer for per-page social cards (1200x630). Same editor-window
   motif as the root app/opengraph-image.tsx, parameterised by the page's tab
   label, eyebrow, title and summary. Static (prerendered at build), so the
   brand faces + mascot are read from disk once. ttf only — Satori does not
   take woff2. */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const asset = (f: string) => readFileSync(join(process.cwd(), "app/og-assets", f));

/* Clash Display tops out around 88px; long titles need to step down so they
   never clip the card. Tuned against the real post/project titles. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 24) return 88;
  if (n <= 40) return 70;
  if (n <= 60) return 56;
  return 46;
}

export type OgCard = {
  /* The fake filename in the window title bar, e.g. "privacy-basics.mdx". */
  tab: string;
  /* Small accent kicker above the title, e.g. "WRITING" or "WEB PROJECT". */
  eyebrow: string;
  title: string;
  /* One-line description under the title (post summary / project blurb). */
  summary: string;
};

/* Satori has no reliable multi-line clamp, so trim to a safe single-card
   length on a word boundary. */
function clamp(text: string, max = 118): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

export function renderOgCard({ tab, eyebrow, title, summary }: OgCard) {
  const clash = asset("ClashDisplay-Bold.ttf");
  const satoshi = asset("Satoshi-Regular.ttf");
  const satoshiBold = asset("Satoshi-Bold.ttf");
  const mascot = `data:image/png;base64,${asset("mascot.png").toString("base64")}`;

  const dot = (bg: string) => ({ width: 15, height: 15, borderRadius: 999, background: bg });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 48,
          background: "#f3ecdd",
          fontFamily: "Satoshi",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fbf6ea",
            borderRadius: 26,
            border: "1px solid #e3d8c2",
            boxShadow: "0 30px 60px -22px rgba(70,50,30,0.3)",
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
              borderBottom: "1px solid #e3d8c2",
              background: "#f3ecdd",
            }}
          >
            <div style={dot("#cf5b4e")} />
            <div style={dot("#d9a441")} />
            <div style={dot("#6fa85f")} />
            <div style={{ marginLeft: 20, fontSize: 25, color: "#726552" }}>{tab}</div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "46px 66px" }}>
            <div style={{ fontSize: 26, letterSpacing: 4, color: "#a04c39", fontWeight: 700 }}>
              {eyebrow}
            </div>
            <div
              style={{
                fontFamily: "Clash",
                fontSize: titleSize(title),
                color: "#463f33",
                lineHeight: 1.08,
                marginTop: 18,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#726552",
                lineHeight: 1.35,
                marginTop: 20,
                maxWidth: 880,
                display: "flex",
              }}
            >
              {clamp(summary)}
            </div>

            <div style={{ flex: 1 }} />

            {/* Brand footer */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mascot} width={72} height={72} alt="" />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 30, color: "#463f33", fontWeight: 700 }}>Edmond Ndanji</div>
                <div style={{ fontSize: 22, letterSpacing: 3, color: "#a04c39", fontWeight: 700 }}>
                  EDDYB.DEV
                </div>
              </div>
            </div>
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
