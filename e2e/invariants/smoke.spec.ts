import { test, expect } from "@playwright/test";

// Hard invariant (grilled decision 7): functional correctness must stay green.
// Perf optimization cannot break the page rendering or core content.
test("homepage renders with title and visible content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Edmond/);
  await expect(page.locator("body")).toBeVisible();
});

test("shared popover outline follows the arrow tip", async ({ page }) => {
  await page.goto("/");

  const popover = page.locator(".company-pop").first();
  const arrow = await popover.evaluate((element) => {
    const bubble = getComputedStyle(element);
    const outline = getComputedStyle(element, "::before");
    const fill = getComputedStyle(element, "::after");

    return {
      bubbleBorder: bubble.borderTopColor,
      outlineContent: outline.content,
      outlineColor: outline.borderTopColor,
      outlineWidth: Number.parseFloat(outline.borderTopWidth),
      fillColor: fill.borderTopColor,
      fillWidth: Number.parseFloat(fill.borderTopWidth),
    };
  });

  expect(arrow.outlineContent).not.toBe("none");
  expect(arrow.outlineColor).toBe(arrow.bubbleBorder);
  expect(arrow.outlineWidth).toBeGreaterThan(arrow.fillWidth);
  expect(arrow.fillColor).not.toBe(arrow.outlineColor);
});
