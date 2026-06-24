import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body, Prose } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "Privacy Policy - Edmond Ndanji",
  description: "How this site handles data.",
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader title="Privacy Policy" />
      <Prose>
        <Body>
          This site collects no personal data and sets no tracking or
          advertising cookies. It uses Vercel Speed Insights, which records
          anonymous, aggregated performance metrics (such as page load timings)
          to help keep the site fast. No accounts, no profiles.
        </Body>
        <Body>
          A preference (sound on/off) is stored locally in your browser and
          never leaves your device.
        </Body>
      </Prose>
    </PageShell>
  );
}
