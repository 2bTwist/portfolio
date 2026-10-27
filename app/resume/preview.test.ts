import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESUME_PREVIEW } from "./preview";

/* Phones see the resume as an image of the PDF. A PDF update must come with a new
   image, or phones keep showing the old resume. */
describe("the phone resume image", () => {
  it("was generated from the current resume.pdf (run pnpm resume:image)", () => {
    const pdf = readFileSync(join(process.cwd(), "public", "resume.pdf"));
    expect(createHash("sha256").update(pdf).digest("hex")).toBe(RESUME_PREVIEW.pdfSha256);
  });

  it("exists where the page points", () => {
    expect(existsSync(join(process.cwd(), "public", RESUME_PREVIEW.src))).toBe(true);
  });
});
