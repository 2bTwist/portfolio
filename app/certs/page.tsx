import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body } from "@/components/content/ui";
import { CERTS } from "@/data/certs";
import { badgeFaceSvg } from "@/components/certs/badgeFace";
import { BadgeLazy } from "@/components/certs/BadgeLazy";

export const metadata: Metadata = {
  title: "Certifications - Edmond Ndanji",
  description: "Credential badges.",
};

export default function CertsPage() {
  return (
    <PageShell>
      <PageHeader title="Certifications" />
      <Body>Drag a badge to spin it. Placeholder credentials for now.</Body>
      <ul className="cert-grid" aria-label="Certifications">
        {CERTS.map((cert) => (
          <li key={cert.id} className="cert-grid-item">
            <BadgeLazy cert={cert} faceSvg={badgeFaceSvg(cert)} />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
