import type { Metadata } from "next";
import { DataRevealMount } from "@/components/site/DataRevealMount";
import { PrivacyBody } from "./_body";
import { pageMetadata } from "@/app/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy - Edmond Ndanji",
  description: "How this site handles data: no analytics, no tracking, and an honest note on what a page load still reveals.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PrivacyBody />
      {/* The "what you just handed this site" reveal lives ONLY on this page,
          and fires a few seconds after you land here. It unmounts (and clears
          its timer) the moment you navigate away. */}
      <DataRevealMount />
    </>
  );
}
