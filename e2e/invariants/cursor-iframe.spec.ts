import { expect, test, type Page } from "@playwright/test";

/* The custom cursor hands off to the native cursor over an iframe (the resume
   PDF viewer), and keeps no reference to frames that navigation removed. */

test.use({ viewport: { width: 1440, height: 900 } });

async function openResume(page: Page) {
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByRole("dialog", { name: "Command palette" }).getByRole("combobox");
  await input.fill("resume");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.locator("main iframe").first()).toBeAttached();
}

test("the cursor hands off to the native one over an iframe", async ({ page }) => {
  await page.goto("/resume");
  const frame = page.locator("main iframe").first();
  await expect(frame).toBeVisible();
  await page.mouse.move(5, 300);
  await expect(page.locator("html")).toHaveClass(/\bcursor-custom\b/);
  const box = (await frame.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await expect(page.locator("html")).not.toHaveClass(/\bcursor-custom\b/);
  await page.mouse.move(5, 300);
  await expect(page.locator("html")).toHaveClass(/\bcursor-custom\b/);
});

test("frames removed by navigation are released", async ({ page }) => {
  await page.addInitScript(() => {
    const refs: WeakRef<HTMLIFrameElement>[] = [];
    (window as unknown as { __frames: typeof refs }).__frames = refs;
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          const frames = node instanceof HTMLIFrameElement ? [node] : [...node.querySelectorAll("iframe")];
          for (const f of frames) refs.push(new WeakRef(f));
        }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/about");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
  await page.mouse.move(5, 300);
  await expect(page.locator("html")).toHaveClass(/\bcursor-custom\b/);

  const cycles = 5;
  for (let i = 0; i < cycles; i++) {
    await openResume(page);
    await page.locator("#ide-explorer").getByRole("link", { name: "about.md" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator("main iframe")).toHaveCount(0);
  }

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("HeapProfiler.collectGarbage");
  await page.waitForTimeout(200);
  await cdp.send("HeapProfiler.collectGarbage");

  const counts = await page.evaluate(() => {
    const refs = (window as unknown as { __frames: WeakRef<HTMLIFrameElement>[] }).__frames;
    const detached = refs.filter((r) => {
      const f = r.deref();
      return f !== undefined && !f.isConnected;
    }).length;
    return { observed: refs.length, detached };
  });
  // Positive control: the loop really created and removed frames.
  expect(counts.observed).toBeGreaterThanOrEqual(cycles);
  expect(counts.detached).toBe(0);
});
