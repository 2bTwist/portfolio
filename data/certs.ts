/* Certifications / credential badges. Rendered as 3D badges (Phase 5) with a
   CSS/SVG fallback. The badge FACE is drawn procedurally from these fields
   (name / issuer / year) — no artwork asset required — so `artwork` stays
   optional until real credential art is dropped in for Phase 6.

   The entries below are clearly-labelled PLACEHOLDERS so the 3D infra is
   buildable and verifiable. Swap in real certs in Phase 6. */

export type Cert = {
  id: string;
  name: string;
  issuer: string;
  year?: string;
  /* Accent color for the procedurally-drawn badge face. */
  accent?: string;
  /* Artwork applied to the badge face (texture); real art lands in Phase 6. */
  artwork?: string;
  url?: string;
};

export const CERTS: Cert[] = [
  {
    id: "placeholder-cloud",
    name: "Sample Credential",
    issuer: "Placeholder Authority",
    year: "2026",
    accent: "#c9a23a",
  },
  {
    id: "placeholder-security",
    name: "Example Certification",
    issuer: "Placeholder Institute",
    year: "2026",
    accent: "#7a9e74",
  },
];
