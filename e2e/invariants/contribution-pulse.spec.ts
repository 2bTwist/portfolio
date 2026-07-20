import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
});

test("contribution graph fills its row", async ({ page }) => {
  const graph = page.locator(".pulse-weeks");
  await graph.scrollIntoViewIfNeeded();

  const unusedRightSpace = await graph.evaluate((element) => {
    const graphBounds = element.getBoundingClientRect();
    const cells = [...element.querySelectorAll<HTMLElement>(".pulse-day:not(.is-empty)")];
    const finalCellRight = Math.max(...cells.map((cell) => cell.getBoundingClientRect().right));
    return graphBounds.right - finalCellRight;
  });

  expect(unusedRightSpace).toBeLessThan(8);
});

test("contribution count links to GitHub", async ({ page }) => {
  await expect(page.getByRole("link", { name: "View contributions on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/2bTwist",
  );
});
