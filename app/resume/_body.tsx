import Image from "next/image";
import { Landmark, type PaneProps } from "@/components/site/PageShell";
import { RESUME_PREVIEW } from "./preview";

export function ResumeBody({ paneLabel }: PaneProps = {}) {
  return (
    <Landmark className="cv-full" paneLabel={paneLabel}>
      <nav aria-label="Resume actions" className="flex flex-wrap gap-5 px-5 py-4 md:hidden">
        <a className="txt-link" href="/resume.pdf" target="_blank" rel="noopener noreferrer">Open PDF</a>
        <a className="txt-link" href="/resume/download">Download PDF</a>
      </nav>
      {/* The page is a full-bleed PDF, so the document heading is visually
          carried by the PDF itself; this keeps a real H1 in the DOM for SEO
          and screen readers. */}
      <h1 className="sr-only">Edmond Ndanji — Resume</h1>
      {/* Phones get the page as an image (scripts/generate-resume-image.mjs): iOS
          Safari draws an embedded PDF at full page width, cropped, and Android
          Chrome draws nothing. */}
      <a className="cv-page" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
        <Image
          src={RESUME_PREVIEW.src}
          width={RESUME_PREVIEW.width}
          height={RESUME_PREVIEW.height}
          sizes="100vw"
          alt="Edmond Ndanji's resume. Opens the PDF."
        />
      </a>
      {/* No sandbox: Chromium blocks its native PDF viewer in sandboxed iframes,
          and this is our own first-party, same-origin static PDF (X-Frame-Options
          + same-origin cover the framing risk). Lazy, so phones that hide it do
          not download it. */}
      <iframe
        className="cv-embed"
        src="/resume.pdf#pagemode=none&zoom=125"
        title="Edmond Ndanji's resume (PDF)"
        loading="lazy"
      />
    </Landmark>
  );
}
