import { expect, test, type Page } from "@playwright/test";

async function dragAboutIntoEditor(page: Page, holdMs = 0, target = 0.75) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor();
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * target, 160, { steps: 12 });
  if (holdMs) await page.waitForTimeout(holdMs);
  await page.mouse.up();
}

test("Explorer about drag opens a split pane on immediate release", async ({ page }) => {
  await dragAboutIntoEditor(page);
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close split pane" })).toBeVisible();
});

test("Explorer about drag opens a split pane after a 100ms hover", async ({ page }) => {
  await dragAboutIntoEditor(page, 100);
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toBeVisible();
});

test("split divider supports arrows and its close control removes the split", async ({ page }) => {
  await dragAboutIntoEditor(page);
  const divider = page.getByRole("separator", { name: "Resize split editor" });
  const initial = Number(await divider.getAttribute("aria-valuenow"));
  await divider.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await divider.getAttribute("aria-valuenow"))).toBeGreaterThan(initial);
  const keyboardRatio = await divider.getAttribute("aria-valuenow");
  const dividerBox = await divider.boundingBox();
  if (!dividerBox) throw new Error("split divider geometry was unavailable");
  await page.mouse.click(dividerBox.x + dividerBox.width / 2, dividerBox.y + 80);
  await expect(divider).toHaveAttribute("aria-valuenow", keyboardRatio!);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(async () => Number(await divider.getAttribute("aria-valuenow"))).toBeLessThan(Number(keyboardRatio));
  await page.getByRole("button", { name: "Close split pane" }).click();
  await expect(divider).toHaveCount(0);
});

test("releasing outside the editor does not open a split", async ({ page }) => {
  await dragAboutIntoEditor(page, 0, -0.1);
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toHaveCount(0);
});

test("Escape cancels an in-flight Explorer drag", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor();
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, 160, { steps: 12 });
  await expect(page.locator(".ide-drag-ghost.is-active")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".ide-drag-ghost.is-active")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toHaveCount(0);
});

test("pointercancel restores the pre-drag state", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor();
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  if (!row) throw new Error("Explorer row geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.evaluate(() => {
    window.addEventListener("pointerdown", (event) => {
      (window as Window & { __splitPointerId?: number }).__splitPointerId = event.pointerId;
    }, { capture: true, once: true });
  });
  await page.mouse.down();
  await page.mouse.move(row.x + row.width / 2 + 30, row.y + row.height / 2, { steps: 4 });
  await expect(page.locator(".ide-drag-ghost.is-active")).toBeVisible();
  await page.evaluate(() => {
    const pointerId = (window as Window & { __splitPointerId?: number }).__splitPointerId;
    if (typeof pointerId !== "number") throw new Error("pointerdown ID was not captured");
    window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId }));
  });
  await expect(page.locator(".ide-drag-ghost.is-active")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveCSS("cursor", "grabbing");
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toHaveCount(0);
});

test("pointercancel rolls a split-divider drag back to its committed ratio", async ({ page }) => {
  await dragAboutIntoEditor(page);
  const divider = page.getByRole("separator", { name: "Resize split editor" });
  const before = await divider.getAttribute("aria-valuenow");
  const box = await divider.boundingBox();
  if (!box) throw new Error("split divider geometry was unavailable");
  await page.evaluate(() => {
    window.addEventListener("pointerdown", (event) => {
      (window as Window & { __dividerPointerId?: number }).__dividerPointerId = event.pointerId;
    }, { capture: true, once: true });
  });
  await page.mouse.move(box.x + box.width / 2, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 80, { steps: 4 });
  await page.evaluate(() => {
    const pointerId = (window as Window & { __dividerPointerId?: number }).__dividerPointerId;
    window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId }));
  });
  await expect(divider).toHaveAttribute("aria-valuenow", before!);
  await expect(page.locator("body")).not.toHaveAttribute("data-dragging", "true");
});
