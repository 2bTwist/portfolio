import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { SITE_URL } from "@/app/lib/site";
import { pageMetadata } from "@/app/lib/metadata";
import { HomeBody } from "./_body";

const share = pageMetadata({
  title: "Edmond Ndanji - Full-stack & mobile engineer",
  description: profile.tagline,
  path: "/",
  ownCard: true,
});

export const metadata: Metadata = {
  ...share,
  alternates: { ...share.alternates, types: { "application/rss+xml": "/rss.xml" } },
  /* video.other is what lets Discord play og-home.mp4 inline; iMessage plays it
     either way. Regenerate the video with `pnpm og:video` when the card changes.
     Next does not resolve video URLs against metadataBase, so this one is absolute. */
  openGraph: {
    ...share.openGraph,
    type: "video.other",
    videos: [{ url: new URL("/og-home.mp4", SITE_URL), type: "video/mp4", width: 1200, height: 630 }],
  },
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: SITE_URL,
  jobTitle: "Full-stack & mobile engineer",
  description: profile.tagline,
  sameAs: [profile.links.github, profile.links.linkedin],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Escape `<` so the serialized JSON can never break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }}
      />
      <HomeBody />
    </>
  );
}
