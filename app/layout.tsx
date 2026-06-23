import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ClientBoot } from "@/components/ClientBoot";
import { IdeProvider } from "@/components/ide/store";
import { Shell } from "@/components/ide/Shell";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";

export const metadata: Metadata = {
  title: "Edmond Ndanji",
  description: "Full-stack & mobile engineer.",
};

// Default palette injected as inline CSS vars (server-rendered, no JS, not
// pruned by Lightning CSS). The Phase 2 switcher overrides these client-side.
const paletteVars = PALETTES[DEFAULT_PALETTE_INDEX].vars as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ ...paletteVars, background: "var(--bg)", color: "var(--text)" }}>
        <IdeProvider>
          <Shell>{children}</Shell>
        </IdeProvider>
        <ClientBoot />
        <SpeedInsights />
      </body>
    </html>
  );
}
