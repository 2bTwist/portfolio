import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/", "/about", "/projects", "/projects/cogito", "/projects/cisco-mcp",
  "/projects/tactilelens", "/projects/beseen", "/experience", "/certs", "/blog",
  "/blog/privacy-basics", "/blog/tag/privacy", "/blog/tag/security", "/blog/tag/web",
  "/resume", "/music", "/privacy", "/terms",
];
const widths = [320, 390, 640, 768, 820, 1024, 1280, 1440];

async function renderedHorizontalBounds(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    const viewport = window.innerWidth;
    if (!main) throw new Error("main content was unavailable");

    const textBoundary = (element: Element | null) => {
      for (let node = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (["hidden", "clip"].includes(style.overflowX) || style.clip !== "auto") return null;
        if (["scroll", "auto"].includes(style.overflowX) && node.matches("[data-editor-scroll]")) {
          return node.getBoundingClientRect();
        }
      }
      return new DOMRect(0, 0, viewport, window.innerHeight);
    };

    const range = document.createRange();
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const escapedText: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const boundary = textBoundary(node.parentElement);
      if (!boundary) continue;
      range.selectNode(node);
      if ([...range.getClientRects()].some(rect => rect.width > 0 && (
        rect.left < boundary.left - 1 || rect.right > boundary.right + 1
      ))) {
        escapedText.push(node.textContent!.trim().slice(0, 80));
      }
    }

    return {
      documentOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollPorts: [...document.querySelectorAll<HTMLElement>("[data-editor-scroll]")]
        .map((port, index) => ({ index, clientWidth: port.clientWidth, scrollWidth: port.scrollWidth }))
        .filter(port => port.scrollWidth > port.clientWidth + 1),
      escapedText: escapedText.slice(0, 6),
    };
  });
}

for (const width of widths) {
  test(`public content stays visibly inside the ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} should be a public route`).toBe(200);
      await page.locator("main").first().waitFor({ state: "visible" });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
      const bounds = await renderedHorizontalBounds(page);
      expect.soft(bounds.documentOverflows, `${route} creates horizontal page scroll at ${width}px`).toBe(false);
      expect.soft(bounds.scrollPorts, `${route} creates horizontal editor scroll at ${width}px`).toEqual([]);
      expect.soft(bounds.escapedText, `${route} visibly clips text at ${width}px`).toEqual([]);
    }
  });
}

test("empty tag pages render as public empty states and unknown routes return 404", async ({ page }) => {
  const emptyTag = await page.goto("/blog/tag/unknown", { waitUntil: "domcontentloaded" });
  expect(emptyTag?.status()).toBe(200);
  await expect(page.getByText("No posts with this tag.")).toBeVisible();

  const missing = await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
  expect(missing?.status()).toBe(404);
});

test("a 20% primary split does not create horizontal scroll for Experience", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/experience");
  await page.locator(".ide-explorer a").first().waitFor({ state: "visible" });
  const row = await page.locator('.ide-explorer a[href="/about"] .ide-row-name').boundingBox();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!row || !editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2);
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, editor.y + 160, { steps: 12 });
  await page.mouse.up();
  const divider = page.getByRole("separator", { name: "Resize split editor" });
  await expect(divider).toBeVisible();
  const [dividerBox, rootBox] = await Promise.all([
    divider.boundingBox(), page.locator("[data-editor-root]").first().boundingBox(),
  ]);
  if (!dividerBox || !rootBox) throw new Error("split divider geometry was unavailable");
  await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + 100);
  await page.mouse.down();
  await page.mouse.move(rootBox.x + rootBox.width * 0.2, dividerBox.y + 100, { steps: 12 });
  await page.mouse.up();
  await expect(divider).toHaveAttribute("aria-valuenow", "20");
  const left = page.locator(".ide-split-left");
  await expect.poll(async () => left.evaluate(port => port.scrollWidth <= port.clientWidth + 1)).toBe(true);
});
