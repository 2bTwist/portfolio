import { expect, test, type CDPSession, type Page } from "@playwright/test";

/* Leaving a page lets its DOM go. Chromium keeps a lazy, `sizes="auto"` image
   observed after it is removed, and a source write on a detached image
   re-registers it with the document; either way the whole detached page stays
   reachable. Going back and forth must not grow the live DOM. Chromium only:
   the counters come from CDP. */

test.skip(({ browserName }) => browserName !== "chromium", "DOM counters come from the Chrome DevTools Protocol");

async function liveNodes(cdp: CDPSession, page: Page) {
  await cdp.send("HeapProfiler.collectGarbage");
  await page.waitForTimeout(150);
  await cdp.send("HeapProfiler.collectGarbage");
  return (await cdp.send("Memory.getDOMCounters")).nodes;
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`projects ↔ a project does not retain detached pages (${reducedMotion} motion)`, async ({ page, context }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 1440, height: 900 });
    const cdp = await context.newCDPSession(page);
    await page.goto("/projects");

    const cycle = async () => {
      await page.locator('a.proj-card[href="/projects/cisco-mcp"]').click();
      await page.waitForURL("**/projects/cisco-mcp");
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "Go back", exact: true }).click();
      await page.waitForURL("**/projects");
      await page.waitForTimeout(300);
    };

    // Two warm-up cycles settle caches; after that the count must hold.
    await cycle();
    await cycle();
    const settled = await liveNodes(cdp, page);
    for (let i = 0; i < 4; i++) await cycle();
    // Each retained page was ~146 nodes; allow a little slack for live widgets.
    expect(await liveNodes(cdp, page)).toBeLessThanOrEqual(settled + 40);
  });
}
