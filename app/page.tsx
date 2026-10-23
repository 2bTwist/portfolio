import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { SITE_URL } from "@/app/lib/site";
import { HomeBody } from "./_body";

export const metadata: Metadata = {
  title: "Edmond Ndanji - Full-stack & mobile engineer",
  description: profile.tagline,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  /* A page's openGraph replaces the layout's whole object, so this restates it.
     video.other is what lets Discord play og-home.mp4 inline; iMessage plays it
     either way. Regenerate the video with `pnpm og:video` when the card changes.
     Next does not resolve video URLs against metadataBase, so this one is absolute. */
  openGraph: {
    type: "video.other",
    siteName: "Edmond Ndanji",
    title: "Edmond Ndanji - Full-stack & mobile engineer",
    description: profile.tagline,
    url: SITE_URL,
    locale: "en_US",
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
