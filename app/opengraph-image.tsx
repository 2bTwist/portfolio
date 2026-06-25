import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Branded social card (1200x630): the site's editor-window motif on the cream
   palette, the pixel mascot, and the real Clash Display / Satoshi faces. Static
   (prerendered once), so assets are read from disk at build time. */

export const alt = "Edmond Ndanji - Full-stack & mobile engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asset = (f: string) => readFileSync(join(process.cwd(), "app/og-assets", f));

export default function OpengraphImage() {
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
            <div style={{ marginLeft: 20, fontSize: 25, color: "#726552" }}>README.md</div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 66px" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: 28, letterSpacing: 4, color: "#a04c39", fontWeight: 700 }}>EDDYB.DEV</div>
              <div style={{ fontFamily: "Clash", fontSize: 94, color: "#463f33", lineHeight: 1.05, marginTop: 16 }}>
                Edmond Ndanji
              </div>
              <div style={{ fontSize: 40, color: "#726552", marginTop: 16 }}>Full-stack &amp; mobile engineer</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 38, maxWidth: 540 }}>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: "#a04c39", flexShrink: 0 }} />
                <div style={{ fontSize: 24, color: "#726552", lineHeight: 1.35 }}>
                  Non-invasive, carefully crafted software that just works
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mascot} width={360} height={360} alt="" style={{ marginLeft: 12 }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Clash", data: clash, weight: 700, style: "normal" },
        { name: "Satoshi", data: satoshi, weight: 400, style: "normal" },
        { name: "Satoshi", data: satoshiBold, weight: 700, style: "normal" },
      ],
    },
  );
}
