import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body, Prose } from "@/components/content/ui";
import { DataRevealMount } from "@/components/site/DataRevealMount";

export const metadata: Metadata = {
  title: "Privacy Policy - Edmond Ndanji",
  description: "How this site handles data: no analytics, no tracking, and an honest note on what a page load still reveals.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader title="Privacy Policy" />
      <Prose>
        <Body>
          This site runs no analytics, sets no tracking or advertising cookies,
          and has no accounts or profiles. There is nothing here trying to
          follow you.
        </Body>
        <Body>
          A few preferences (the theme, the panel sizes, and whether sound is
          on) are saved in your browser&apos;s local storage so the site
          remembers how you like it. They never leave your device.
        </Body>
        <Body>
          In the interest of full honesty, two ordinary parties still see
          standard request data. Vercel hosts this site and, like any web
          server, records your IP address and basic request metadata in its
          logs. And the small location map on the home page loads its image from
          Stadia Maps, which means your IP and browser are sent to them to fetch
          that tile. No tracking, but it is data you hand over simply by
          visiting.
        </Body>
        <Body>
          Curious exactly what a website learns about you the moment you arrive?
          That is the whole point of the card that popped up a moment ago. If
          you&apos;d rather hand over less, here&apos;s{" "}
          <Link href="/blog/privacy-basics" className="txt-link">
            how to protect your privacy online
          </Link>
          .
        </Body>
      </Prose>
      {/* The "what you just handed this site" reveal lives ONLY on this page,
          and fires a few seconds after you land here. It unmounts (and clears
          its timer) the moment you navigate away. */}
      <DataRevealMount />
    </PageShell>
  );
}
