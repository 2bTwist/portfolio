import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { AboutBody } from "./_body";
import { pageMetadata } from "@/app/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "About - Edmond Ndanji",
  description: profile.blurb,
  path: "/about",
});

export default function AboutPage() {
  return <AboutBody />;
}
