import { test, expect } from "@playwright/test";

// Hard invariant (grilled decision 7): functional correctness must stay green.
// Perf optimization cannot break the page rendering or core content.
test("homepage renders with title and visible content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Edmond/);
  await expect(page.locator("body")).toBeVisible();
});
