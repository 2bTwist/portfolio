import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body, Prose } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "Terms - Edmond Ndanji",
  description: "Terms of use for this site.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageHeader title="Terms" />
      <Prose>
        <Body>
          This is my personal portfolio, shared as-is and for information only,
          with no warranty of any kind. The code samples are here to learn from,
          so take them. The writing is mine, though, so please don&apos;t
          republish it as your own.
        </Body>
        <Body>
          Links out to other sites aren&apos;t under my control, and including
          one isn&apos;t an endorsement.
        </Body>
        <Body>
          The card that shows what data you share reads your browser on your own
          device to display it back to you. None of it is stored, logged, or
          sent anywhere.
        </Body>
      </Prose>
    </PageShell>
  );
}
