import { expect, test, type Browser } from "@playwright/test";

// Large monitors scale the whole rem-based UI (globals.css `html` font-size):
// laptops through 1920px are untouched, the layout grows with the viewport up
// to 2560px, and holds there. Nothing may scroll sideways at any width.

const routes = ["/", "/projects", "/blog/you-cant-prompt-taste"];

async function measure(browser: Browser, baseURL: string | undefined, width: number, route: string) {
  const context = await browser.newContext({ viewport: { width, height: 1200 }, baseURL });
  try {
    const page = await context.newPage();
    await page.goto(route);
    await expect(page.locator("aside").first()).toBeVisible();
    return await page.evaluate(() => {
      const width = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().width;
      return {
        content: width(".page-content"),
        sidebar: width("aside"),
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
  } finally {
    await context.close();
  }
}

for (const route of routes) {
  test(`${route} keeps laptops unchanged and scales up on large monitors`, async ({ browser, baseURL }) => {
    const at: Record<number, Awaited<ReturnType<typeof measure>>> = {};
    for (const width of [1440, 1920, 2560, 3440]) {
      at[width] = await measure(browser, baseURL, width, route);
      expect(at[width].overflowX, `${route} scrolls sideways at ${width}px`).toBe(false);
    }

    // Laptop band: identical layout.
    expect(at[1920].content).toBeCloseTo(at[1440].content, 0);
    expect(at[1920].sidebar).toBeCloseTo(at[1440].sidebar, 0);

    // Large monitors: content and chrome grow together (about 1.25x by 2560px).
    expect(at[2560].content / at[1920].content).toBeGreaterThan(1.2);
    expect(at[2560].sidebar / at[1920].sidebar).toBeGreaterThan(1.2);

    // Past the cap the layout holds rather than shrinking or growing further.
    expect(at[3440].content).toBeCloseTo(at[2560].content, 0);
    expect(at[3440].sidebar).toBeCloseTo(at[2560].sidebar, 0);
  });
}
