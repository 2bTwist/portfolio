import { expect, test, type Locator, type Page } from "@playwright/test";

/* Resize handles (specs/decisions/2026-09-27-resize-handle.md). For every handle in
   the shell: a release commits and saves; an interruption rolls back, saves nothing,
   and leaves no page-wide drag state; the keyboard reaches the same values. */

type Handle = {
  name: string;
  /* Storage key its committed size is saved under. */
  key: string;
  /* Pointer movement that grows the pane. */
  grow: { x: number; y: number };
  /* The arrow key that grows the pane. */
  growKey: string;
  open: (page: Page) => Promise<void>;
  /* The pane's rendered size along the handle's axis, in CSS px. */
  size: (page: Page) => Promise<number>;
};

async function desktop(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor();
}

async function openSplit(page: Page) {
  await desktop(page);
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, 160, { steps: 12 });
  await page.mouse.up();
  await page.getByRole("separator", { name: "Resize split editor" }).waitFor();
}

const extent = (selector: string, axis: "width" | "height") => (page: Page) =>
  page.locator(selector).first().evaluate((el, a) => el.getBoundingClientRect()[a], axis);

const HANDLES: Handle[] = [
  {
    name: "Resize file explorer",
    key: "ide:explorer-width",
    grow: { x: 40, y: 0 },
    growKey: "ArrowRight",
    open: desktop,
    size: extent('aside[aria-label="File explorer"]', "width"),
  },
  {
    name: "Resize terminal",
    key: "ide.terminal-height",
    grow: { x: 0, y: -40 },
    growKey: "ArrowUp",
    open: async (page) => {
      await desktop(page);
      await page.keyboard.press("Control+`");
      await page.getByRole("separator", { name: "Resize terminal" }).waitFor();
    },
    size: extent(".ide-terminal-out", "height"),
  },
  {
    name: "Resize split editor",
    key: "ide-split-ratio",
    grow: { x: 40, y: 0 },
    growKey: "ArrowRight",
    open: openSplit,
    size: extent(".ide-split-left", "width"),
  },
];

const saved = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);

// Presses the handle's centre, remembering the pointer ID for a synthetic cancel.
async function press(page: Page, handle: Locator) {
  const box = await handle.boundingBox();
  if (!box) throw new Error("handle geometry was unavailable");
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.evaluate(() => {
    window.addEventListener(
      "pointerdown",
      (event) => ((window as Window & { __resizePointerId?: number }).__resizePointerId = event.pointerId),
      { capture: true, once: true },
    );
  });
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  return at;
}

const INTERRUPTIONS: Record<string, (page: Page) => Promise<unknown>> = {
  pointercancel: (page) =>
    page.evaluate(() => {
      const pointerId = (window as Window & { __resizePointerId?: number }).__resizePointerId;
      if (typeof pointerId !== "number") throw new Error("pointerdown ID was not captured");
      window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId }));
    }),
  "window blur": (page) => page.evaluate(() => window.dispatchEvent(new Event("blur"))),
  Escape: (page) => page.keyboard.press("Escape"),
};

async function expectNoDragState(page: Page) {
  await expect(page.locator("body")).not.toHaveAttribute("data-dragging");
  await expect(page.locator("html")).not.toHaveAttribute("data-cursor-grabbing");
  await expect(page.locator("[data-resize-axis][data-dragging]")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.cursor)).toBe("");
}

for (const h of HANDLES) {
  test.describe(h.name, () => {
    test("a release commits the size, saves it, and survives a reload", async ({ page }) => {
      await h.open(page);
      const before = await h.size(page);
      const savedBefore = await saved(page, h.key);
      const at = await press(page, page.getByRole("separator", { name: h.name }));
      await page.mouse.move(at.x + h.grow.x, at.y + h.grow.y, { steps: 4 });
      await page.mouse.up();
      const after = await h.size(page);
      expect(after).toBeGreaterThan(before + 10);
      expect(await saved(page, h.key)).not.toBe(savedBefore);
      await expectNoDragState(page);

      await h.open(page);
      expect(Math.abs((await h.size(page)) - after)).toBeLessThanOrEqual(2);
    });

    for (const [event, interrupt] of Object.entries(INTERRUPTIONS)) {
      test(`${event} rolls the drag back and saves nothing`, async ({ page }) => {
        await h.open(page);
        const before = await h.size(page);
        const savedBefore = await saved(page, h.key);
        const at = await press(page, page.getByRole("separator", { name: h.name }));
        await page.mouse.move(at.x + h.grow.x, at.y + h.grow.y, { steps: 4 });
        expect(await h.size(page)).toBeGreaterThan(before + 10);

        await interrupt(page);
        await expect.poll(() => h.size(page)).toBeCloseTo(before, 0);
        await expectNoDragState(page);

        // The pointer is still down, but the drag is over.
        await page.mouse.move(at.x + 2 * h.grow.x, at.y + 2 * h.grow.y, { steps: 4 });
        await page.mouse.up();
        expect(await h.size(page)).toBeCloseTo(before, 0);
        expect(await saved(page, h.key)).toBe(savedBefore);
      });
    }

    test("the keyboard moves it within its limits and saves", async ({ page }) => {
      await h.open(page);
      const handle = page.getByRole("separator", { name: h.name });
      await handle.focus();
      await expect(handle).toBeFocused();
      const value = async () => Number(await handle.getAttribute("aria-valuenow"));
      const min = Number(await handle.getAttribute("aria-valuemin"));
      const max = Number(await handle.getAttribute("aria-valuemax"));
      expect(min).toBeLessThan(max);

      const start = await value();
      const size = await h.size(page);
      const savedBefore = await saved(page, h.key);
      await page.keyboard.press(h.growKey);
      await expect.poll(value).toBeGreaterThan(start);
      expect(await h.size(page)).toBeGreaterThan(size);
      expect(await saved(page, h.key)).not.toBe(savedBefore);

      await page.keyboard.press("End");
      await expect.poll(value).toBe(max);
      await page.keyboard.press("Home");
      await expect.poll(value).toBe(min);
    });
  });
}

test("arrowing past the explorer's limit does not set off the bouncer", async ({ page }) => {
  await desktop(page);
  const handle = page.getByRole("separator", { name: "Resize file explorer" });
  await handle.focus();
  await expect(handle).toBeFocused();
  await page.keyboard.press("End");
  for (let i = 0; i < 8; i += 1) await page.keyboard.press("ArrowRight");
  const max = await handle.getAttribute("aria-valuemax");
  expect(max).not.toBeNull();
  await expect(handle).toHaveAttribute("aria-valuenow", max!);
  await expect(page.locator(".ide-nudge")).toHaveCount(0);
});

test("a saved explorer width past the normal cap restores the won cap", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ide:explorer-width", "420"));
  await desktop(page);
  const handle = page.getByRole("separator", { name: "Resize file explorer" });
  await expect(handle).toHaveAttribute("aria-valuenow", "420");
  await expect(handle).toHaveAttribute("aria-valuemax", "460");
  await expect.poll(() => HANDLES[0].size(page)).toBeCloseTo(420, 0);
});

test("the bouncer's lockout ends the drag and keeps the width it reached", async ({ page }) => {
  await desktop(page);
  const handle = page.getByRole("separator", { name: "Resize file explorer" });
  const at = await press(page, handle);
  for (let shove = 0; shove < 4; shove += 1) {
    await page.mouse.move(at.x + 200, at.y, { steps: 5 });
    await page.mouse.move(at.x + 30, at.y, { steps: 5 });
  }
  await expect(handle).toHaveAttribute("data-locked", "true");
  await expectNoDragState(page);
  await page.mouse.up();
  expect(await saved(page, "ide:explorer-width")).toBe(await handle.getAttribute("aria-valuemax"));
});

test("a right-button press does not start a resize", async ({ page }) => {
  await desktop(page);
  const before = await HANDLES[0].size(page);
  const box = await page.getByRole("separator", { name: "Resize file explorer" }).boundingBox();
  if (!box) throw new Error("handle geometry was unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + 200);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(box.x + 60, box.y + 200, { steps: 4 });
  expect(await HANDLES[0].size(page)).toBeCloseTo(before, 0);
  await expectNoDragState(page);
  await page.mouse.up({ button: "right" });
});

test("a press whose pointer capture fails leaves the handle usable", async ({ page }) => {
  await desktop(page);
  const handle = page.getByRole("separator", { name: "Resize file explorer" });
  // A pointer ID the browser has no record of makes setPointerCapture throw.
  await handle.evaluate((el) => {
    window.addEventListener("error", (e) => e.preventDefault(), { once: true });
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 999, isPrimary: true, button: 0, bubbles: true }));
  });
  await expectNoDragState(page);
  const before = await HANDLES[0].size(page);
  const at = await press(page, handle);
  await page.mouse.move(at.x + 40, at.y, { steps: 4 });
  await page.mouse.up();
  expect(await HANDLES[0].size(page)).toBeGreaterThan(before + 10);
});

test("modified arrow keys are left to the browser", async ({ page }) => {
  await desktop(page);
  const handle = page.getByRole("separator", { name: "Resize file explorer" });
  await handle.focus();
  const before = await handle.getAttribute("aria-valuenow");
  for (const key of ["Alt+ArrowRight", "Control+ArrowRight", "Meta+ArrowRight"]) await page.keyboard.press(key);
  await expect(handle).toHaveAttribute("aria-valuenow", before!);
});

test("the terminal's limit is the height it can render", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ide.terminal-height", "900"));
  await HANDLES[1].open(page);
  const handle = page.getByRole("separator", { name: "Resize terminal" });
  const max = Number(await handle.getAttribute("aria-valuemax"));
  await expect.poll(() => HANDLES[1].size(page)).toBeCloseTo(max, 0);
  await expect(handle).toHaveAttribute("aria-valuenow", String(max));
  await handle.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("End");
  await expect.poll(() => HANDLES[1].size(page)).toBeCloseTo(max, 0);
});

test("closing the terminal mid-drag saves nothing", async ({ page }) => {
  await HANDLES[1].open(page);
  const savedBefore = await saved(page, "ide.terminal-height");
  const at = await press(page, page.getByRole("separator", { name: "Resize terminal" }));
  await page.mouse.move(at.x, at.y - 40, { steps: 4 });
  await page.keyboard.press("Control+`");
  await expect(page.getByRole("separator", { name: "Resize terminal" })).toBeHidden();
  await page.mouse.up();
  expect(await saved(page, "ide.terminal-height")).toBe(savedBefore);
  await expectNoDragState(page);
});

test.describe("with a touchscreen", () => {
  test.use({ hasTouch: true });

  test("a second handle cannot start a resize while one is live", async ({ page, context }) => {
    await HANDLES[1].open(page);
    const explorer = await press(page, page.getByRole("separator", { name: "Resize file explorer" }));
    await page.mouse.move(explorer.x + 20, explorer.y, { steps: 3 });
    const box = await page.getByRole("separator", { name: "Resize terminal" }).boundingBox();
    if (!box) throw new Error("terminal handle geometry was unavailable");
    const cdp = await context.newCDPSession(page);
    const touch = { x: box.x + 300, y: box.y + box.height / 2, id: 7 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touch] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...touch, y: touch.y - 30 }] });
    await expect(page.locator("[data-resize-axis][data-dragging]")).toHaveCount(1);

    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.mouse.up();
    await expectNoDragState(page);
  });
});
