import { expect, test } from "@playwright/test";

const VIEWPORTS = [360, 768, 1280] as const;

function milliseconds(value: string) {
  const numeric = Number.parseFloat(value);
  return value.endsWith("ms") ? numeric : numeric * 1000;
}

test("revealing the contribution graph preserves its geometry, content, and stagger", async ({ browser, baseURL }) => {
  for (const width of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width, height: 500 }, reducedMotion: "no-preference" });
    try {
      const page = await context.newPage();
      await page.goto(baseURL!);

      const canvas = page.locator(".pulse-canvas");
      const graph = page.getByRole("img", { name: "GitHub contribution graph" });
      const weeks = page.locator(".pulse-weeks");
      await expect(canvas).not.toHaveClass(/\bis-revealed\b/);
      await expect(graph).toBeVisible();

      const before = await weeks.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const row = element.closest(".pulse-graph-row")!.getBoundingClientRect();
        return { width: box.width, height: box.height, rowHeight: row.height };
      });
      const cells = page.locator(".pulse-weeks .pulse-day:not(.is-empty)");
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThan(0);
      expect(await page.locator(".pulse-weeks .pulse-day:not(.is-empty)[title]").count()).toBe(cellCount);

      await graph.scrollIntoViewIfNeeded();
      await expect(canvas).toHaveClass(/\bis-revealed\b/);
      const after = await weeks.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const row = element.closest(".pulse-graph-row")!.getBoundingClientRect();
        return { width: box.width, height: box.height, rowHeight: row.height };
      });

      expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(after.rowHeight - before.rowHeight)).toBeLessThanOrEqual(0.25);

      const timings = await weeks.evaluate((root) =>
        Array.from(root.querySelectorAll<HTMLElement>(".pulse-week")).flatMap((week, weekIndex) =>
          Array.from(week.children).map((cell, dayIndex) => {
            const element = cell as HTMLElement;
            const computed = getComputedStyle(element);
            return {
              empty: element.classList.contains("is-empty"),
              expectedDelay: weekIndex * 20 + dayIndex * 5,
              delay: computed.animationDelay,
              duration: computed.animationDuration,
              name: computed.animationName,
            };
          }),
        ),
      );
      for (const timing of timings.filter((timing) => !timing.empty)) {
        expect(timing.name).toBe("pulse-cell-sweep");
        expect(milliseconds(timing.duration)).toBe(420);
        expect(milliseconds(timing.delay)).toBeCloseTo(timing.expectedDelay, 6);
      }
    } finally {
      await context.close();
    }
  }
});

test("reduced motion keeps the contribution graph immediately visible", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 500 }, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const graph = page.getByRole("img", { name: "GitHub contribution graph" });
    const cell = page.locator(".pulse-weeks .pulse-day:not(.is-empty)").first();
    await expect(graph).toBeVisible();
    await expect(cell).toHaveCSS("opacity", "1");
    await expect(cell).toHaveCSS("animation-name", "none");
    await expect(cell).toHaveCSS("transform", "none");
    expect(await page.locator(".pulse-weeks").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});

test("palette changes retain every contribution intensity color", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "no-preference" });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await page.getByRole("button", { name: "Theme: Frappe" }).click();
    await expect(page.getByRole("button", { name: "Theme: Frappe" })).toHaveAttribute("aria-pressed", "true");

    const colors = await page.evaluate(() => {
      const expected = (background: string) => {
        const reference = document.createElement("i");
        reference.style.background = background;
        document.body.append(reference);
        const value = getComputedStyle(reference).backgroundColor;
        reference.remove();
        return value;
      };
      const definitions = [
        "color-mix(in srgb, var(--border) 68%, var(--surface))",
        "color-mix(in srgb, var(--accent) 22%, var(--surface))",
        "color-mix(in srgb, var(--accent) 43%, var(--surface))",
        "color-mix(in srgb, var(--accent) 68%, var(--surface))",
        "var(--accent)",
      ];
      return definitions.map((definition, level) => ({
        expected: expected(definition),
        actual: getComputedStyle(document.querySelector(`.pulse-day--level-${level}`)!).backgroundColor,
      }));
    });
    for (const color of colors) expect(color.actual).toBe(color.expected);
  } finally {
    await context.close();
  }
});
