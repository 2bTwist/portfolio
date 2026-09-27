import { expect, test, type Page } from "@playwright/test";

// The custom cursor runs on every pointer move, the highest-frequency input on
// the site. Moving across a plain surface must not rewrite <html> attributes:
// each rewrite queues style invalidation for every cursor selector keyed on
// <html>, on every move. Only a real state change (entering a link) may write.

async function plainPoint(page: Page) {
  const point = await page.evaluate(() => {
    const interactive = "a, button, [role='button'], input, .ide-row, .ide-swatch, .ide-pill, .btn";
    const main = document.querySelector("main")!.getBoundingClientRect();
    const content = document.querySelector(".page-content")?.getBoundingClientRect();
    // The editor gutter left of the content column holds no controls.
    const x = Math.round(main.left + Math.max(20, ((content?.left ?? main.left + 80) - main.left) / 2));
    // main is taller than the viewport; probe the middle of its visible part.
    const y = Math.round((Math.max(main.top, 0) + Math.min(main.bottom, window.innerHeight)) / 2);
    const element = document.elementFromPoint(x, y);
    return { x, y, hit: !!element && !!element.closest("main"), interactive: !!element?.closest(interactive) };
  });
  expect(point.hit, "the probe point must land on visible main content").toBe(true);
  expect(point.interactive, "the probe point must be a plain surface").toBe(false);
  return point;
}

test.use({ viewport: { width: 1920, height: 1080 } });

test("pointer moves over a plain surface write no attributes on <html>", async ({ page }) => {
  await page.goto("/");
  // The class is set by the same effect that attaches the move listener.
  await expect(page.locator("html")).toHaveClass(/\bcursor-custom\b/);
  const { x, y } = await plainPoint(page);

  // The first move arms the cursor (class + visibility); that write is expected.
  await page.mouse.move(x, y);
  await expect(page.locator("html")).toHaveAttribute("data-cursor-hidden", "false");

  await page.evaluate(() => {
    const state = window as typeof window & { __htmlMutations?: string[] };
    state.__htmlMutations = [];
    new MutationObserver((records) => {
      for (const record of records) state.__htmlMutations!.push(record.attributeName ?? "");
    }).observe(document.documentElement, { attributes: true });
  });
  for (let i = 0; i < 30; i++) await page.mouse.move(x + (i % 6), y + Math.floor(i / 6));
  const mutations = await page.evaluate(
    () => (window as typeof window & { __htmlMutations?: string[] }).__htmlMutations ?? [],
  );
  expect(mutations).toEqual([]);
});

test("the cursor still reports real hover changes", async ({ page }) => {
  await page.goto("/");
  // The class is set by the same effect that attaches the move listener.
  await expect(page.locator("html")).toHaveClass(/\bcursor-custom\b/);
  const { x, y } = await plainPoint(page);
  await page.mouse.move(x, y);
  await expect(page.locator("html")).toHaveAttribute("data-cursor-hover", "false");

  const link = page.locator("main a").first();
  const box = await link.boundingBox();
  if (!box) throw new Error("Expected a visible link in main");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("html")).toHaveAttribute("data-cursor-hover", "true");

  await page.mouse.move(x, y);
  await expect(page.locator("html")).toHaveAttribute("data-cursor-hover", "false");
});
