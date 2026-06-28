import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume - Edmond Ndanji",
  description: "Edmond Ndanji's resume.",
  alternates: { canonical: "/resume" },
};

/* The page IS the PDF: public/resume.pdf rendered full-bleed by the browser's
   native viewer (no pdf.js dep, no HTML re-creation). Opens with the sidebar
   closed at 125% (pagemode/zoom are honored by Firefox's pdf.js). The Download
   action lives in the editor tab bar (see Tabs.tsx). */

export default function ResumePage() {
  return (
    <main className="cv-full">
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
