import { readFile } from "node:fs/promises";
import path from "node:path";

/* Serves the resume PDF with Content-Disposition: attachment so clicking Download
   always SAVES the file and never navigates / opens a viewer tab. The inline
   viewer keeps using the static /resume.pdf (no attachment header). */
export async function GET() {
  const buf = await readFile(path.join(process.cwd(), "public", "resume.pdf"));
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Edmond_Ndanji_Resume.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
