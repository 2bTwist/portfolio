import type { Cert } from "@/data/certs";
import { badgeFaceSvg } from "./badgeFace";

/* Static cert badge — server-rendered, in the HTML, paints instantly (no WebGL,
   no lazy chunk, no load flash). Shows the cert's artwork image when present,
   otherwise the procedural placeholder seal. A soft shadow + gentle idle float
   (reduced-motion gated, in CSS) make it read as floating on the page. */

export function CertBadge({ cert }: { cert: Cert }) {
  const label = `${cert.name} — ${cert.issuer}${cert.year ? `, ${cert.year}` : ""}`;
  return (
    <figure className="cert-badge">
      {cert.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element -- on-brand badge art, sized by CSS
        <img className="cert-badge-art" src={cert.artwork} alt={label} loading="lazy" />
      ) : (
        <div
          className="cert-badge-art"
          role="img"
          aria-label={label}
          dangerouslySetInnerHTML={{ __html: badgeFaceSvg(cert) }}
        />
      )}
    </figure>
  );
}
