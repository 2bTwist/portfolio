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

test.describe("the tab context menu", () => {
  async function twoTabs(page: Page) {
    await load(page, "/about");
    await page.locator("#ide-explorer").getByRole("link", { name: "experience.md" }).click();
    await expect(currentTab(page)).toHaveAttribute("href", "/experience");
  }
  const menu = (page: Page) => page.getByRole("menu");

  test("opens from the keyboard (Shift+F10 and the menu key) and moves focus through its items", async ({ page }) => {
    await twoTabs(page);
    const aboutTab = tabs(page).getByRole("link", { name: "about.md" });
    await aboutTab.focus();
    await page.keyboard.press("Shift+F10");
    await expect(menu(page)).toBeVisible();
    // Anchored under the tab, not at the viewport origin (measured loosely: the
    // menu's entrance nudges it a few pixels while it plays).
    const [m, t] = await Promise.all([menu(page).boundingBox(), aboutTab.boundingBox()]);
    expect(m!.y).toBeGreaterThan(t!.y + t!.height / 2);
    expect(Math.abs(m!.x - t!.x)).toBeLessThan(40);

    const item = (name: RegExp) => menu(page).getByRole("menuitem", { name });
    await expect(item(/^Close\b(?! Others| All)/)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(/Close Others/)).toBeFocused();
    await page.keyboard.press("End");
    await expect(item(/Close All/)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(/^Close\b(?! Others| All)/)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(item(/Close All/)).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(aboutTab).toBeFocused();

    await page.keyboard.press("ContextMenu");
    await expect(item(/^Close\b(?! Others| All)/)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(menu(page)).toHaveCount(0);
    await expect(aboutTab).toBeFocused();
  });

  test("skips a disabled item", async ({ page }) => {
    await load(page, "/about");
    await tabs(page).getByRole("link", { name: "about.md" }).focus();
    await page.keyboard.press("Shift+F10");
    await expect(menu(page).getByRole("menuitem", { name: /Close Others/ })).toBeDisabled();
    await page.keyboard.press("ArrowDown");
    await expect(menu(page).getByRole("menuitem", { name: /Close All/ })).toBeFocused();
  });

  test("closing a tab from the menu leaves focus on the current tab", async ({ page }) => {
    await twoTabs(page);
    await tabs(page).getByRole("link", { name: "about.md" }).focus();
    await page.keyboard.press("Shift+F10");
    await page.keyboard.press("Enter");
    await expect(tabs(page).getByRole("link", { name: "about.md" })).toHaveCount(0);
    await expect(currentTab(page)).toBeFocused();
  });

  test("has no entrance animation with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await load(page, "/about");
    await tabs(page).locator(".ide-tab").first().click({ button: "right" });
    await expect(menu(page)).toHaveCSS("animation-name", "none");
  });
});
