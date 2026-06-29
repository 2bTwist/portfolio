import type { Metadata } from "next";
import { ResumeBody } from "./_body";

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
  return <ResumeBody />;
}
