import { expect, test, type Page } from "@playwright/test";

/* Tabs follow the route: whatever brought the page on screen, its tab is open
   and current, and closing tabs never leaves a page without one. */

const tabs = (page: Page) => page.locator('[aria-label="Open files"]');
const currentTab = (page: Page) => tabs(page).locator('a[aria-current="page"]');

async function load(page: Page, path = "/") {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(path);
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
}

test("an inline content link opens the destination's tab", async ({ page }) => {
  await load(page);
  await page.locator("main").locator('a[href="/projects/cogito"]').first().click();
  await expect(page).toHaveURL(/\/projects\/cogito$/);
  await expect(currentTab(page)).toHaveAttribute("href", "/projects/cogito");
});

test("back and forward keep the current tab on the displayed page", async ({ page }) => {
  await load(page);
  await page.locator("main").locator('a[href="/projects/cogito"]').first().click();
  await expect(currentTab(page)).toHaveAttribute("href", "/projects/cogito");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(currentTab(page)).toHaveAttribute("href", "/");

  await page.goForward();
  await expect(page).toHaveURL(/\/projects\/cogito$/);
  await expect(currentTab(page)).toHaveAttribute("href", "/projects/cogito");
});

test("closing the last tab on README keeps README's tab", async ({ page }) => {
  await load(page);
  await tabs(page).getByRole("button", { name: "Close README.md" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(currentTab(page)).toHaveAttribute("href", "/");
});

test("closing the current tab moves to its neighbour", async ({ page }) => {
  await load(page, "/about");
  await page.locator("#ide-explorer").getByRole("link", { name: "experience.md" }).click();
  await expect(page).toHaveURL(/\/experience$/);
  await tabs(page).getByRole("button", { name: "Close experience.md" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(currentTab(page)).toHaveAttribute("href", "/about");
  await expect(tabs(page).getByRole("link", { name: "experience.md" })).toHaveCount(0);
});

for (const from of ["/", "/about"]) {
  test(`Close All from ${from} lands on README with its tab`, async ({ page }) => {
    await load(page, from);
    await tabs(page).locator(".ide-tab").first().click({ button: "right" });
    await page.getByRole("menuitem", { name: /Close All/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(tabs(page).locator(".ide-tab")).toHaveCount(1);
    await expect(currentTab(page)).toHaveAttribute("href", "/");
  });
}

test("compact layouts can mute interface sounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.locator(".site-nav");
  const soundsFromThemeClick = async (theme: RegExp) => {
    await page.evaluate(() => performance.clearMarks());
    await nav.getByRole("button", { name: theme }).click();
    return page.evaluate(() => performance.getEntriesByType("mark").filter((m) => m.name.startsWith("sound:")).length);
  };
  // Positive control: unmuted, a compact theme click does play.
  await expect.poll(() => soundsFromThemeClick(/^Theme: Latte/)).toBeGreaterThan(0);

  const mute = nav.getByRole("button", { name: "Mute UI sounds" });
  await expect(mute).toBeVisible();
  await mute.click();
  await expect(nav.getByRole("button", { name: "Unmute UI sounds" })).toBeVisible();
  expect(await soundsFromThemeClick(/^Theme: Cream/)).toBe(0);
});
