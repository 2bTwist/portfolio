import type { Metadata } from "next";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body, Prose } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "Terms - Edmond Ndanji",
  description: "Terms of use for this site.",
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageHeader title="Terms" />
      <Prose>
        <Body>
          This is a personal portfolio. The content is provided as-is, for
          information only, with no warranty. Code samples are free to learn
          from. Please don&apos;t republish the writing as your own.
        </Body>
        <Body>External links are not under my control or endorsement.</Body>
      </Prose>
    </PageShell>
  );
}
