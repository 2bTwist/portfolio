import Link from "@/components/site/Link";
import { CogitoPreview } from "@/components/content/CogitoPreview";

export function CogitoMention() {
  return (
    <Link href="/projects/cogito" prefetch={false} className="company-link cogito-mention">
      Cogito
      <span className="company-pop cogito-pop" aria-hidden="true">
        <CogitoPreview trigger="hover" />
      </span>
    </Link>
  );
}
