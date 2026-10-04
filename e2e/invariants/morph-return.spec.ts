import { expect, test, type Page } from "@playwright/test";

/* A project card only pulls the page to itself on a return: the visitor left
   this page by that card. Whatever scrolling happens, the desktop chrome never
   moves: the shell is clipped, not a scroll container. */

const tabs = (page: Page) => page.locator('[aria-label="Open files"]');
const editor = (page: Page) => page.locator("[data-editor-scroll]");

async function chromeTop(page: Page) {
  return page.locator(".ide-titlebar").evaluate((el) => el.getBoundingClientRect().top);
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`${reducedMotion} motion`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/");
      await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
    });

    test("reaching a project from the explorer, then README's tab, leaves README at the top", async ({ page }) => {
      await page.locator("#ide-explorer").getByRole("link", { name: "beseen.tsx" }).click();
      await expect(page).toHaveURL(/\/projects\/beseen$/);
      await tabs(page).getByRole("link", { name: "README.md" }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.waitForTimeout(600);
      expect(await editor(page).evaluate((el) => el.scrollTop)).toBe(0);
      expect(await chromeTop(page)).toBe(0);
    });

    test("returning to the card that was clicked centers it without moving the chrome", async ({ page }) => {
      const card = page.locator("main a.proj-card[href='/projects/beseen']");
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await expect(page).toHaveURL(/\/projects\/beseen$/);
      await tabs(page).getByRole("link", { name: "README.md" }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.waitForTimeout(600);
      // The card is the last row, so centering runs out of editor scroll; the
      // chrome must still not take up the rest.
      await expect(card).toBeInViewport();
      expect(await editor(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      expect(await chromeTop(page)).toBe(0);
    });
  });
}
