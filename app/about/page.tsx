import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { AboutBody } from "./_body";

export const metadata: Metadata = {
  title: "About - Edmond Ndanji",
  description: profile.blurb,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutBody />;
}
