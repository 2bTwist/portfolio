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
