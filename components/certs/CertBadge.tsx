import type { Cert } from "@/data/certs";
import { badgeFaceSvg } from "./badgeFace";

/* A certification card: the official badge artwork in a media area, then the
   name, issuer + date, and a verify link when the issuer offers a public one.
   Server-rendered (in the HTML, no WebGL, no load flash). When a cert has a
   verify URL the whole card is the link; otherwise it's a plain figure. */

export function CertBadge({ cert }: { cert: Cert }) {
  const label = `${cert.name} — ${cert.issuer}${cert.year ? `, ${cert.year}` : ""}`;

  const media = (
    <div className="cert-card-media">
      {cert.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element -- official badge art, sized by CSS
        <img className="cert-card-art" src={cert.artwork} alt={label} loading="lazy" />
      ) : (
        <div
          className="cert-card-art cert-card-art--svg"
          role="img"
          aria-label={label}
          dangerouslySetInnerHTML={{ __html: badgeFaceSvg(cert) }}
        />
      )}
    </div>
  );

  const body = (
    <div className="cert-card-body">
      <h2 className="cert-card-name">{cert.name}</h2>
      <p className="cert-card-meta mono">
        {cert.issuer}
        {cert.year ? ` · ${cert.year}` : ""}
      </p>
      {cert.url ? (
        <span className="cert-card-verify mono">
          Verify
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </span>
      ) : null}
    </div>
  );

  if (cert.url) {
    return (
      <a className="cert-card cert-card--link" href={cert.url} target="_blank" rel="noreferrer noopener">
        {media}
        {body}
      </a>
    );
  }

  return (
    <figure className="cert-card">
      {media}
      {body}
    </figure>
  );
}
