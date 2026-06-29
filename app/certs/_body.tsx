import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body } from "@/components/content/ui";
import { CERTS } from "@/data/certs";
import { CertBadge } from "@/components/certs/CertBadge";

export function CertsBody() {
  return (
    <PageShell>
      <PageHeader title="Certifications" />
      <Body>Credentials I have earned. Each badge links out to verify it.</Body>
      <ul className="cert-grid" aria-label="Certifications">
        {CERTS.map((cert) => (
          <li key={cert.id} className="cert-grid-item">
            <CertBadge cert={cert} />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
