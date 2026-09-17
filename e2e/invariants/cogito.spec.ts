import { expect, test } from "@playwright/test";

test("About introduces Cogito with a searchable internal mention", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByText("every idea deserves a proper home", { exact: false })).toBeVisible();
  const mention = page.locator("a.cogito-mention[href='/projects/cogito']");
  await expect(mention).toBeVisible();
});

test("Cogito mention respects pointer, keyboard, and reduced-motion preview behavior", async ({ page }) => {
  await page.goto("/about");
  const mention = page.locator("a.cogito-mention[href='/projects/cogito']");
  const pop = page.locator(".cogito-pop");
  const preview = page.locator(".cogito-preview img");
  await mention.hover();
  await expect(pop).toHaveCSS("opacity", "1");
  await expect(preview).toHaveAttribute("src", /^blob:/);
  await expect(page.locator(".cogito-preview[data-playing='true']")).toBeVisible();
  const firstPlayback = await preview.getAttribute("src");
  await page.mouse.move(0, 0);
  await expect(page.locator(".cogito-preview[data-playing='false']")).toBeVisible();
  await mention.hover();
  await expect(preview).toHaveAttribute("src", /^blob:/);
  expect(await preview.getAttribute("src")).not.toBe(firstPlayback);
  await page.mouse.move(0, 0);

  await mention.focus();
  await expect(pop).toHaveCSS("opacity", "1");
  await expect(page.locator(".cogito-preview[data-playing='false']")).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await mention.hover();
  await expect(page.locator(".cogito-preview[data-playing='false']")).toBeVisible();
});

test("Cogito keeps alpha artwork inside a white word tooltip in light and dark themes", async ({ page }) => {
  await page.goto("/about");
  const preview = page.locator(".cogito-preview img");
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute("src", /\.webp(?:$|\?)/);
  for (const theme of [/Theme: Cream/i, /Theme: Frappe/i]) {
    await page.getByRole("button", { name: theme }).click();
    await expect(page.locator(".cogito-preview")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator(".cogito-pop")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  }
  const cornerAlpha = await preview.evaluate(async image => {
    const img = image as HTMLImageElement;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, 1, 1).data[3];
  });
  expect(cornerAlpha).toBeLessThan(5);
});

test("Projects exposes an upcoming Cogito card with an animated preview", async ({ page }) => {
  await page.goto("/projects");
  const card = page.locator("a.proj-card[href='/projects/cogito']");
  await expect(card).toBeVisible();
  await expect(card).toContainText(/Cogito/i);
  await expect(card.locator(".proj-card-kind")).toContainText(/In progress/i);
  await expect(card).toContainText(/An iPhone app in the making/i);
  const preview = card.locator(".cogito-preview");
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator("img")).toBeVisible();
  await expect(preview).toHaveAttribute("data-playing", "true");
  await expect.poll(async () => preview.getAttribute("data-playing"), { timeout: 4_900 }).toBe("false");
  await card.hover();
  await expect(preview).toHaveAttribute("data-playing", "true");
});

test("Cogito remains linked with a still WebP poster when JavaScript is unavailable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(new URL("/about", baseURL).toString(), { waitUntil: "domcontentloaded" });
    await expect(page.locator("a.cogito-mention[href='/projects/cogito']")).toBeVisible();
    await expect(page.locator(".cogito-preview img")).toHaveAttribute("src", /\.webp(?:$|\?)/);

    await page.goto(new URL("/projects/cogito", baseURL).toString(), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: /Cogito/i })).toBeVisible();
    await expect(page.getByText(/idea.*proper home|upcoming/i)).toBeVisible();
  } finally {
    await context.close();
  }
});
