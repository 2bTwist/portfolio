import type { Metadata } from "next";
import { ExperienceBody } from "./_body";

export const metadata: Metadata = {
  title: "Experience - Edmond Ndanji",
  description: "Software engineering at Cisco, a CS degree at UMBC, and community roles.",
  alternates: { canonical: "/experience" },
};

export default function ExperiencePage() {
  return <ExperienceBody />;
}
