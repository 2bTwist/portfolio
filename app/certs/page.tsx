import type { Metadata } from "next";
import { CertsBody } from "./_body";
import { pageMetadata } from "@/app/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Certifications - Edmond Ndanji",
  description: "Verified credentials, including the AWS Certified AI Practitioner and Apple Ads certification.",
  path: "/certs",
});

export default function CertsPage() {
  return <CertsBody />;
}
