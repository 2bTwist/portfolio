import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ClientBoot } from "@/components/ClientBoot";
import { IdeProvider } from "@/components/ide/store";
import { SoundProvider } from "@/components/feel/SoundProvider";
import { CursorMount } from "@/components/feel/CursorMount";
import { Shell } from "@/components/ide/Shell";
import { getGitInfo } from "@/app/lib/git";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";
import { clashDisplay, satoshi } from "@/app/fonts/fonts";

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
  const git = getGitInfo();
  return (
    <html lang="en" className={`${clashDisplay.variable} ${satoshi.variable}`}>
      <body style={{ ...paletteVars, background: "var(--bg)", color: "var(--text)" }}>
        <SoundProvider>
          <IdeProvider>
            <Shell git={git}>{children}</Shell>
          </IdeProvider>
        </SoundProvider>
        <CursorMount />
        <ClientBoot />
        <SpeedInsights />
      </body>
    </html>
  );
}
