import { expect, test } from "@playwright/test";

/* Phones cannot show an embedded PDF (iOS Safari crops it at page width, Android
   Chrome draws nothing), so below 768px the resume is an image of the page that
   fits the screen and opens the PDF. Wider screens keep the PDF viewer. */

test("on a phone the resume fits the screen and opens the PDF", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/resume");
  const image = page.getByRole("link", { name: "Edmond Ndanji's resume. Opens the PDF." });
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("href", "/resume.pdf");
  const fit = await image.locator("img").evaluate((img: HTMLImageElement) => {
    const box = img.getBoundingClientRect();
    return { left: box.left, right: box.right };
  });
  expect(fit.left).toBeGreaterThanOrEqual(0);
  expect(fit.right).toBeLessThanOrEqual(390);
  await expect.poll(() => image.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator("iframe.cv-embed")).toBeHidden();
});

test("on desktop the resume stays the PDF viewer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/resume");
  await expect(page.locator("iframe.cv-embed")).toBeVisible();
  await expect(page.locator(".cv-page")).toBeHidden();
});
