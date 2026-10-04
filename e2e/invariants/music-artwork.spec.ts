import { expect, test } from "@playwright/test";

/* Music artwork is requested at the size it is shown: list thumbnails and the
   cued record never download the 600px original. Apple's CDN is stubbed, so
   this checks the requested URLs, not Apple. */

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

test("the music page requests artwork at its displayed size", async ({ page }) => {
  const sizes: string[] = [];
  await page.route("https://is1-ssl.mzstatic.com/**", (route) => {
    sizes.push(route.request().url().match(/\/(\d+x\d+)bb\.\w+$/)?.[1] ?? "unsized");
    return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/music");
  const rows = page.locator(".vinyl-row-art");
  await expect(rows.first()).toBeAttached();
  const rowCount = await rows.count();
  // Lazy thumbnails below the fold load once scrolled to.
  await rows.last().scrollIntoViewIfNeeded();
  await expect.poll(() => sizes.length).toBeGreaterThanOrEqual(rowCount);

  // Positive control: artwork really is being requested through the stub.
  expect(rowCount).toBeGreaterThan(5);
  expect(sizes).not.toContain("600x600");
  expect(sizes).not.toContain("unsized");
  // 1x screens ask for 36px rows and the 150px cued record.
  expect(sizes).toContain("36x36");
});
