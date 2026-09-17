import { expect, test, type Locator, type Page } from "@playwright/test";

async function scrollTo(page: Page, locator: Locator, top: number) {
  await locator.evaluate((element, nextTop) => {
    window.getSelection()?.removeAllRanges();
    (element as HTMLElement).scrollTop = nextTop;
    element.dispatchEvent(new Event("scroll"));
  }, top);
}

async function openAboutSplit(page: Page) {
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, 160, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toBeVisible();
}

function line(status: string) {
  return Number(status.match(/Ln\s+(\d+)/)?.[1]);
}

async function expectScrollLine(status: Locator, surface: Locator) {
  const top = await surface.evaluate(element => (element as HTMLElement).scrollTop);
  await expect.poll(async () => line(await status.innerText())).toBe(Math.floor(top / 24) + 1);
}

test("StatusBar follows primary reading depth through split, right scroll, and close", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/blog/privacy-basics");
  await page.locator(".ide-row-icon svg").first().waitFor();
  const status = page.locator(".ide-statusbar");

  const primary = page.locator("[data-editor-scroll]").first();
  await scrollTo(page, primary, 500);
  await expectScrollLine(status, primary);

  await openAboutSplit(page);
  const splitPrimary = page.locator(".ide-split-left[data-editor-scroll]");
  await scrollTo(page, splitPrimary, 800);
  await expectScrollLine(status, splitPrimary);
  const beforeRight = await status.innerText();

  const right = page.locator(".ide-split-right .ide-enter");
  await scrollTo(page, right, 400);
  await expect.poll(async () => status.innerText()).toBe(beforeRight);

  await page.getByRole("button", { name: "Close split pane" }).click();
  const postCloseScroll = await page.locator("[data-editor-scroll]").first().evaluate(element => element.scrollTop);
  test.info().annotations.push({ type: "observed post-close primary scrollTop", description: String(postCloseScroll) });
  const closedPrimary = page.locator("[data-editor-scroll]").first();
  await scrollTo(page, closedPrimary, 300);
  await expectScrollLine(status, closedPrimary);
});
