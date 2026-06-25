import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { ClientBoot } from "@/components/ClientBoot";
import { IdeProvider } from "@/components/ide/store";
import { SoundProvider } from "@/components/feel/SoundProvider";
import { CursorMount } from "@/components/feel/CursorMount";
import { Shell } from "@/components/ide/Shell";
import { getGitInfo } from "@/app/lib/git";
import { getAllPosts } from "@/app/lib/posts";
import type { TreeFile } from "@/app/lib/nav";
import { PALETTES, DEFAULT_PALETTE_INDEX } from "@/app/lib/palette";
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
// pruned by Lightning CSS). The Phase 2 switcher overrides these client-side.
const paletteVars = PALETTES[DEFAULT_PALETTE_INDEX].vars as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const git = getGitInfo();
  // The writing/ folder's children come from the fs-based posts module here
  // (server side) and are handed to the client Explorer.
  const writingFiles: TreeFile[] = getAllPosts().map((p) => ({
    type: "file",
    name: `${p.slug}.md`,
    href: `/writing/${p.slug}`,
  }));
  return (
    <html lang="en" className={`${clashDisplay.variable} ${satoshi.variable}`}>
      <body style={{ ...paletteVars, background: "var(--bg)", color: "var(--text)" }}>
        <SoundProvider>
          <IdeProvider>
            <Shell git={git} writingFiles={writingFiles}>
              {children}
            </Shell>
          </IdeProvider>
        </SoundProvider>
        <CursorMount />
        <ClientBoot />
      </body>
    </html>
  );
}
