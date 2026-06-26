import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body } from "@/components/content/ui";
import { CERTS } from "@/data/certs";
import { CertBadge } from "@/components/certs/CertBadge";

export const metadata: Metadata = {
  title: "Certifications - Edmond Ndanji",
  description: "Verified credentials, including the AWS Certified AI Practitioner and Apple Ads certification.",
};

export default function CertsPage() {
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
