/* Certifications / credential badges. Rendered as 3D badges in Phase 5;
   this is the data behind them. Placeholder until Phase 6. */

export type Cert = {
  id: string;
  name: string;
  issuer: string;
  year?: string;
  /* Artwork applied to the badge face (texture); added in Phase 5. */
  artwork?: string;
  url?: string;
};

export const CERTS: Cert[] = [];
