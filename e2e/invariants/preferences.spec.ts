import { expect, test } from "@playwright/test";
import { PALETTES } from "../../app/lib/palette";

/* Preferences (CONTEXT.md: preference): a returning visitor's saved
   palette and explorer width are in place from the first painted frame and still
   there once the page is interactive, on a hydrated page and on the 404 page, which
   React renders on the client. Each frame is sampled in requestAnimationFrame, which
   runs just before that frame paints. */

type Frame = { bg: string; width: number };

const frappe = PALETTES.findIndex((p) => p.name.startsWith("Frappe"));

for (const path of ["/", "/blog/no-such-post"]) {
  test(`a saved palette and explorer width hold from the first frame on ${path}`, async ({ page }) => {
    expect(frappe).toBeGreaterThan(0);
    await page.addInitScript((palette) => {
      localStorage.setItem("ide.palette", String(palette));
      localStorage.setItem("ide:explorer-width", "300");
      const frames: Frame[] = [];
      (window as Window & { __frames?: Frame[] }).__frames = frames;
      const sample = () => {
        const explorer = document.getElementById("ide-explorer");
        if (explorer) {
          frames.push({
            bg: getComputedStyle(document.body).getPropertyValue("--bg").trim(),
            width: Math.round(explorer.getBoundingClientRect().width),
          });
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, frappe);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);
    // Client-mounted icons mean hydration (or the client render) has finished.
    await page.locator(".ide-row-icon svg").first().waitFor();
    await page.waitForTimeout(300);
    const frames = await page.evaluate(() => (window as Window & { __frames?: Frame[] }).__frames ?? []);
    expect(frames.length).toBeGreaterThan(0);
    const wrong = frames.filter((f) => f.bg !== PALETTES[frappe].vars["--bg"] || f.width !== 300);
    expect(wrong).toEqual([]);

    // What the controls report matches what is painted.
    await expect(page.locator(".ide-swatch").nth(frappe)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("separator", { name: "Resize file explorer" })).toHaveAttribute("aria-valuenow", "300");
  });
}

test("with nothing saved, the default palette and width render", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--bg").trim()))
    .toBe(PALETTES[0].vars["--bg"]);
  await expect.poll(() => page.locator("#ide-explorer").evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBe(220);
});
