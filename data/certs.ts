/* Certifications. Each renders as a card with the official credential artwork,
   the issuer + date, and a verify link when the issuer exposes a public one.
   `accent` / `artwork` stay optional so a card can fall back to a procedurally
   drawn seal if artwork is ever missing. */

export type Cert = {
  id: string;
  name: string;
  issuer: string;
  year?: string;
  /* Accent color for the procedurally-drawn fallback seal. */
  accent?: string;
  /* Official badge artwork (in /public). */
  artwork?: string;
  /* Public verification URL, when the issuer offers one. */
  url?: string;
};

export const CERTS: Cert[] = [
  {
    id: "aws-ai-practitioner",
    name: "AWS Certified AI Practitioner",
    issuer: "Amazon Web Services",
    year: "May 2026",
    artwork: "/images/certs/aws-ai-practitioner.png",
    url: "https://www.credly.com/go/wkRlcaP0skm8IK5H6PRzZQ",
  },
  {
    id: "apple-search-ads",
    name: "Apple Search Ads Certification",
    issuer: "Apple",
    year: "Mar 2026",
    artwork: "/images/certs/apple-search-ads.png",
  },
];
