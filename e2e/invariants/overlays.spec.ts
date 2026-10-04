import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/* Overlay contracts: post search recovers from a failed index load, only one
   modal owns input at a time, and the palette honours reduced motion. */

const palette = (page: Page) => page.getByRole("dialog", { name: "Command palette" });
const privacy = (page: Page) => page.getByRole("dialog", { name: "You just handed this site all of this." });

async function ready(page: Page, path = "/") {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(path);
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
}

async function search(page: Page, query: string) {
  await page.keyboard.press("ControlOrMeta+k");
  const input = palette(page).getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill(query);
  return input;
}

test("post search recovers after the index first fails to load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let failNext = true;
  await page.route("**/search-index.json", (route) => {
    if (failNext) {
      failNext = false;
      return route.abort("internetdisconnected");
    }
    return route.continue();
  });
  await ready(page);

  await search(page, "taste");
  await expect(palette(page).getByRole("status")).toHaveText(/blog posts couldn't load/);
  await expect(palette(page).getByRole("option", { name: /You can't prompt taste/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(palette(page)).toHaveCount(0);

  await search(page, "taste");
  await expect(palette(page).getByRole("option", { name: /You can't prompt taste/ })).toBeVisible();
  await expect(palette(page).getByRole("status")).toHaveText("");
  expect(errors).toEqual([]);
});

test("palette results are plain options with no nested controls", async ({ page }) => {
  await ready(page);
  await search(page, "");
  await expect(palette(page).getByRole("option").first()).toBeVisible();
  // Mid-fade colours read as low contrast; scan the settled palette.
  await page
    .locator(".ide-overlay")
    .evaluate((overlay) => Promise.all(overlay.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));
  const results = await new AxeBuilder({ page }).include(".ide-palette").analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);

  // Clicking an option (not a nested button) still navigates.
  await palette(page).getByRole("option", { name: /about\.md/ }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test.describe("one modal at a time", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("data-reveal-seen"));
  });

  test("the privacy reveal waits for the palette to close", async ({ page }) => {
    await ready(page, "/privacy");
    await search(page, "");
    // The reveal is due 3.5s after landing; give it well past that.
    await page.waitForTimeout(5000);
    await expect(privacy(page)).toHaveCount(0);
    await expect(palette(page).getByRole("combobox")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(palette(page)).toHaveCount(0);
    await expect(privacy(page)).toBeVisible();
    await expect(privacy(page).getByRole("button", { name: "Close" })).toBeFocused();
  });

  test("the palette does not open behind the privacy reveal", async ({ page }) => {
    await ready(page, "/privacy");
    await expect(privacy(page)).toBeVisible({ timeout: 8000 });
    await page.keyboard.press("ControlOrMeta+k");
    await page.waitForTimeout(300);
    await expect(palette(page)).toHaveCount(0);

    await privacy(page).getByRole("button", { name: "Got it" }).click();
    await expect(privacy(page)).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+k");
    await expect(palette(page)).toBeVisible();
  });

  test("leaving the page through the palette does not flash the waiting reveal", async ({ page }) => {
    await ready(page, "/privacy");
    await search(page, "about");
    await page.waitForTimeout(4500); // the reveal is now due and waiting
    // Hold the destination's data so the old page stays on screen a while.
    await page.route("**/about?_rsc=*", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    let flashed = false;
    const watch = setInterval(() => {
      privacy(page)
        .count()
        .then((n) => {
          if (n > 0) flashed = true;
        })
        .catch(() => {});
    }, 50);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/about$/, { timeout: 10_000 });
    await page.waitForTimeout(300);
    clearInterval(watch);
    expect(flashed).toBe(false);
    await expect(privacy(page)).toHaveCount(0);
  });

  test("a stalled server lookup does not hold the reveal back", async ({ page }) => {
    await page.route("**/api/whoami", () => {
      /* never answer */
    });
    await ready(page, "/privacy");
    // 3.5s delay + 2s lookup bound, with margin.
    await expect(privacy(page)).toBeVisible({ timeout: 7500 });
    await expect(privacy(page).getByText("What your browser just told it")).toBeVisible();
  });
});

test("with reduced motion the palette icon does not scale or rotate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.keyboard.press("ControlOrMeta+k");
  const icon = palette(page).locator(".ide-palette-search svg");
  await expect(icon).toBeVisible();
  const transforms: string[] = [];
  for (let i = 0; i < 8; i++) {
    transforms.push(await icon.evaluate((el) => getComputedStyle(el).transform));
    await page.waitForTimeout(40);
  }
  expect(transforms.filter((t) => t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)")).toEqual([]);
});
