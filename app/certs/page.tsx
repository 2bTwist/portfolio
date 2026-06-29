import type { Metadata } from "next";
import { CertsBody } from "./_body";

export const metadata: Metadata = {
  title: "Certifications - Edmond Ndanji",
  description: "Verified credentials, including the AWS Certified AI Practitioner and Apple Ads certification.",
  alternates: { canonical: "/certs" },
};

export default function CertsPage() {
  return <CertsBody />;
}
