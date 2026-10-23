import type { Metadata } from "next";

/* Page metadata from one set of facts, so a page cannot set its title without its
   share tags. A page's openGraph or twitter object replaces the layout's whole
   object (Next merges metadata shallowly), so a page that sets neither unfurls as
   the homepage, and one that sets them partially loses the inherited card image.
   e2e/invariants/share-metadata.spec.ts holds every route to this. */

export const SITE_NAME = "Edmond Ndanji";

/* The root social card, app/opengraph-image.tsx. */
const SITE_CARD = { url: "/opengraph-image", width: 1200, height: 630, alt: "Edmond Ndanji - Full-stack & mobile engineer" };

type PageMetadata = {
  /* The document title, e.g. "About - Edmond Ndanji". */
  title: string;
  description: string;
  /* Canonical path, also the share URL. */
  path: string;
  /* The card's title when it should differ from the document title (posts drop the suffix). */
  shareTitle?: string;
  type?: "website" | "article";
  /* The route has its own opengraph-image file, which supplies the card instead. */
  ownCard?: boolean;
};

export function pageMetadata({ title, description, path, shareTitle = title, type = "website", ownCard }: PageMetadata) {
  // Omit the key for an own card: even `images: undefined` suppresses the route's opengraph-image file.
  const images = ownCard ? {} : { images: [SITE_CARD] };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: SITE_NAME, locale: "en_US", title: shareTitle, description, url: path, ...images },
    twitter: { card: "summary_large_image", title: shareTitle, description, ...images },
  } satisfies Metadata;
}
