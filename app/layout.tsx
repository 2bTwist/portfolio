import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { ClientBoot } from "@/components/ClientBoot";
import { IdeProvider } from "@/components/ide/store";
import { SoundProvider } from "@/components/feel/SoundProvider";
import { CursorMount } from "@/components/feel/CursorMount";
import { NowPlayingMount } from "@/components/music/NowPlayingMount";
import { Shell } from "@/components/ide/Shell";
import { getGitInfo } from "@/app/lib/git";
import { getContentEntries } from "@/app/lib/catalogue";
import { CatalogueProvider } from "@/components/ide/CatalogueProvider";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";
import { PRE_PAINT_SCRIPT } from "@/app/lib/pre-paint";
import { clashDisplay, satoshi } from "@/app/fonts/fonts";
import { SITE_URL } from "@/app/lib/site";
import { profile } from "@/data/profile";

const TITLE = "Edmond Ndanji - Full-stack & mobile engineer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: profile.tagline,
  applicationName: "Edmond Ndanji",
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  icons: { icon: "/favicon.ico" },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    siteName: "Edmond Ndanji",
    title: TITLE,
    description: profile.tagline,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: profile.tagline,
  },
  robots: { index: true, follow: true },
};

// Default palette injected as inline CSS vars (server-rendered, no JS, not
// pruned by Lightning CSS). A saved palette overrides them before the first
// paint (PRE_PAINT_SCRIPT), and the switcher after that.
const paletteVars = PALETTES[DEFAULT_PALETTE_INDEX].vars as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const git = getGitInfo();
  return (
    <html lang="en" className={`${clashDisplay.variable} ${satoshi.variable}`}>
      {/* The pre-paint script restyles <body> before hydration. */}
      <body style={{ ...paletteVars, background: "var(--bg)", color: "var(--text)" }} suppressHydrationWarning>
        {/* A saved palette and explorer width, applied to <body> before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
        {/* A note for anyone who reads the source. */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html:
              "<!--\n  Reading the source? Respect.\n  Built by Edmond Ndanji (eddyb.dev) with Next.js, an editor-shell aesthetic,\n  and a terminal that plays Fur Elise if you let it.\n  Say hi: ndanjiedmond@gmail.com\n-->",
          }}
        />
        <SoundProvider>
          {/* Posts and tags are read here, on the server, for the shell's catalogue view. */}
          <CatalogueProvider entries={getContentEntries()}>
            <IdeProvider>
              <Shell git={git}>{children}</Shell>
            </IdeProvider>
          </CatalogueProvider>
        </SoundProvider>
        <CursorMount />
        <NowPlayingMount />
        <ClientBoot />
      </body>
    </html>
  );
}
