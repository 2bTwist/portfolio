import { expect, test, type Page } from "@playwright/test";

/* The explorer's folder rows: the page link and the disclosure are separate
   controls, and a collapsed subtree leaves the keyboard order. */

const explorer = (page: Page) => page.locator("#ide-explorer");
const disclosure = (page: Page) => explorer(page).getByRole("button", { name: "projects folder" });
const group = (page: Page) => page.locator("#explorer-group-projects");

async function load(page: Page, path = "/") {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(path);
  await explorer(page).locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
}

test("a collapsed folder's files are not keyboard targets", async ({ page }) => {
  await load(page);
  await expect(group(page).getByRole("link").first()).toBeVisible();

  await disclosure(page).focus();
  await page.keyboard.press("Enter");
  await expect(disclosure(page)).toHaveAttribute("aria-expanded", "false");
  await expect(group(page)).toBeHidden();

  // Disclosure -> its folder link -> whatever follows the hidden subtree.
  await page.keyboard.press("Tab");
  await expect(explorer(page).getByRole("link", { name: "projects/" })).toBeFocused();
  await page.keyboard.press("Tab");
  const insideHiddenGroup = await page.evaluate(
    () => document.getElementById("explorer-group-projects")?.contains(document.activeElement) ?? false,
  );
  expect(insideHiddenGroup).toBe(false);
});

test("collapsing a folder that holds focus returns focus to its disclosure", async ({ page }) => {
  await load(page);
  await group(page).getByRole("link").first().focus();
  // A synthetic click does not move focus, like a click in Safari.
  await disclosure(page).evaluate((button: HTMLButtonElement) => button.click());
  await expect(group(page)).toBeHidden();
  await expect(disclosure(page)).toBeFocused();
});

test("a folder link navigates without collapsing, and reveals a collapsed folder", async ({ page }) => {
  await load(page);
  const link = explorer(page).getByRole("link", { name: "projects/" });

  await link.click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(disclosure(page)).toHaveAttribute("aria-expanded", "true");

  await disclosure(page).click();
  await expect(disclosure(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/\/projects$/);

  await link.click();
  await expect(disclosure(page)).toHaveAttribute("aria-expanded", "true");
});

test("a folder's disclosure is at least a 24px target", async ({ page }) => {
  await load(page);
  const box = (await disclosure(page).boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
});

test("a modified click on an explorer row is left to the browser", async ({ page, context }) => {
  await load(page);
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    explorer(page).getByRole("link", { name: "about.md" }).click({ modifiers: ["ControlOrMeta"] }),
  ]);
  await popup.close();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[aria-label="Open files"]').getByRole("link", { name: "about.md" })).toHaveCount(0);
});

test("explorer rows hold still under hover and selection", async ({ page }) => {
  await load(page, "/about");
  const row = explorer(page).getByRole("link", { name: "experience.md" });
  const before = await row.boundingBox();
  await row.hover();
  const hovered = await row.evaluate((el) => getComputedStyle(el).transform);
  expect(hovered).toBe("none");
  expect(await row.boundingBox()).toEqual(before);

  const current = explorer(page).locator('.ide-row[aria-current="page"]');
  await expect(current).toHaveCount(1);
  const weights = await explorer(page)
    .locator(".ide-row-name")
    .evaluateAll((names) => new Set(names.map((n) => getComputedStyle(n).fontWeight)).size);
  expect(weights).toBe(1);
});
