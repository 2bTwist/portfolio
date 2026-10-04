import { expect, test, type Page } from "@playwright/test";

/* A navigation that waits on the server says which page is opening, and the
   message clears once the route changes. A fast navigation shows nothing. */

const status = (page: Page) => page.locator(".nav-pending");

// Holds the route's RSC payload until the returned release() is called.
async function holdRoute(page: Page, path: string) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(`**${path}?_rsc=*`, async (route) => {
    await gate;
    await route.continue();
  });
  return release;
}

for (const width of [1280, 390]) {
  test(`a slow route says what is opening, then clears (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const release = await holdRoute(page, "/projects/cogito");

    await page.locator("main").locator('a[href="/projects/cogito"]').first().click();
    await expect(status(page)).toBeVisible();
    await expect(status(page)).toHaveAttribute("role", "status");
    await expect(status(page)).toContainText(/Opening .*cogito/i);
    await expect(page).not.toHaveURL(/\/projects\/cogito$/);

    release();
    await expect(page).toHaveURL(/\/projects\/cogito$/);
    await expect(status(page)).toBeHidden();
    await expect(status(page)).toHaveText("");
  });
}

test("a route opened from the command palette reports the same way", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
  const release = await holdRoute(page, "/about");

  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox").fill("about");
  await page.keyboard.press("Enter");
  await expect(status(page)).toContainText(/Opening about/i);

  release();
  await expect(page).toHaveURL(/\/about$/);
  await expect(status(page)).toBeHidden();
});

test("the message waits out a short delay, so fast navigations show nothing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
  const release = await holdRoute(page, "/about");

  const clickedAt = await page.evaluate(() => {
    (document.querySelector('#ide-explorer a[href="/about"]') as HTMLElement).click();
    return performance.now();
  });
  // Record when the message first appears, measured in the page's own clock.
  const shownAt = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const el = document.querySelector(".nav-pending")!;
        new MutationObserver(() => {
          if (el.hasAttribute("data-shown")) resolve(performance.now());
        }).observe(el, { attributes: true });
      }),
  );
  expect(shownAt - clickedAt).toBeGreaterThanOrEqual(150);

  release();
  await expect(page).toHaveURL(/\/about$/);
});
