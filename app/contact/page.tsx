import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { PageShell } from "@/components/site/PageShell";
import { PageHeader, Body, ActionLink } from "@/components/content/ui";

export const metadata: Metadata = {
  title: "Contact - Edmond Ndanji",
  description: "Get in touch with Edmond Ndanji.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageHeader title="Contact" />
      <Body>Open to interesting work and conversations.</Body>
      <div className="mt-6 flex flex-wrap gap-4">
        <ActionLink href={`mailto:${profile.email}`}>Email</ActionLink>
        <ActionLink href={profile.links.github} variant="ghost">
          GitHub
        </ActionLink>
        <ActionLink href={profile.links.linkedin} variant="ghost">
          LinkedIn
        </ActionLink>
      </div>
    </PageShell>
  );
}
