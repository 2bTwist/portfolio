import type { Metadata } from "next";
import { ExperienceBody } from "./_body";
import { pageMetadata } from "@/app/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Experience - Edmond Ndanji",
  description: "Software engineering at Cisco, a CS degree at UMBC, and community roles.",
  path: "/experience",
});

export default function ExperiencePage() {
  return <ExperienceBody />;
}
