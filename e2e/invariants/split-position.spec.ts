import { expect, test, type Page } from "@playwright/test";

async function setPrimaryScroll(page: Page, top: number) {
  await page.locator("[data-editor-scroll]").evaluate((element, value) => {
    (element as HTMLElement).scrollTop = value;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  }, top);
  await expect.poll(async () => page.locator("[data-editor-scroll]").evaluate((element) => (element as HTMLElement).scrollTop)).toBeCloseTo(top, 0);
}

async function primaryScroll(page: Page) {
  return page.locator("[data-editor-scroll]").evaluate((element) => (element as HTMLElement).scrollTop);
}

async function dragAboutIntoEditor(page: Page) {
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, editor.y + 100, { steps: 12 });
  await page.mouse.up();
}

test("opening and closing a split preserves the primary editor scroll position", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/blog/privacy-basics");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
  await expect(page.locator("[data-editor-scroll]")).toHaveCount(1);
  await expect(page.locator("[data-editor-scroll] h1")).toBeVisible();
  await expect.poll(async () => page.locator("[data-editor-scroll]").evaluate((element) => (
    element.scrollHeight - element.clientHeight
  ))).toBeGreaterThanOrEqual(500);

  await setPrimaryScroll(page, 500);
  await dragAboutIntoEditor(page);
  const divider = page.getByRole("separator", { name: "Resize split editor" });
  await expect(divider).toBeVisible();
  const afterOpen = await primaryScroll(page);

  await setPrimaryScroll(page, 800);
  await page.getByRole("button", { name: "Close split pane" }).click();
  await expect(divider).toHaveCount(0);
  const afterClose = await primaryScroll(page);

  expect(Math.abs(afterOpen - 500)).toBeLessThanOrEqual(1);
  expect(Math.abs(afterClose - 800)).toBeLessThanOrEqual(1);
});
