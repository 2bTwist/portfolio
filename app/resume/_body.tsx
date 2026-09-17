export function ResumeBody() {
  return (
    <main className="cv-full">
      <nav aria-label="Resume actions" className="flex flex-wrap gap-5 px-5 py-4 md:hidden">
        <a className="txt-link" href="/resume.pdf" target="_blank" rel="noopener noreferrer">Open PDF</a>
        <a className="txt-link" href="/resume/download">Download PDF</a>
      </nav>
      {/* The page is a full-bleed PDF, so the document heading is visually
          carried by the PDF itself; this keeps a real H1 in the DOM for SEO
          and screen readers. */}
      <h1 className="sr-only">Edmond Ndanji — Resume</h1>
      {/* No sandbox: Chromium blocks its native PDF viewer in sandboxed iframes,
          and this is our own first-party, same-origin static PDF (X-Frame-Options
          + same-origin cover the framing risk). */}
      <iframe
        className="cv-embed"
        src="/resume.pdf#pagemode=none&zoom=125"
        title="Edmond Ndanji's resume (PDF)"
      />
    </main>
  );
}
