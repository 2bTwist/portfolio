import { expect, test, type Locator } from "@playwright/test";

// Measure the rendered pair, rather than reasserting palette token values.
async function contrast(foreground: Locator, background: Locator) {
  const [fg, bg] = await Promise.all([
    foreground.evaluate(el => getComputedStyle(el).color),
    background.evaluate(el => getComputedStyle(el).backgroundColor),
  ]);
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.map(Number);
    expect(channels[3] ?? 1, `Expected opaque color: ${color}`).toBe(1);
    return channels.slice(0, 3).reduce((sum, channel, i) => {
      const c = channel / 255;
      return sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
    }, 0);
  };
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const theme of ["Cream", "Latte", "Frappe (soft dark)"]) {
  test(`music controls remain readable and separated in ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/music");
    await page.getByRole("button", { name: `Theme: ${theme}`, exact: true }).click();
    await page.locator(".vinyl-row").first().click();
    const card = page.locator(".npc");
    await expect(card).toBeVisible();
    // The artwork reveals its transport when the pointer enters the card.
    await card.hover();
    // Pause if playback succeeded; failed preview loading still leaves the UI
    // available, so contrast does not depend on a third-party audio service.
    const pause = card.getByRole("button", { name: "Pause", exact: true });
    if (await pause.count()) await pause.click();
    const meta = card.locator(".npc-meta");
    for (const label of [".npc-title", ".npc-artist"]) {
      expect(await contrast(card.locator(label), meta)).toBeGreaterThanOrEqual(4.5);
    }
    for (const selector of [".npc-btn", ".npc-close"]) {
      for (const button of await card.locator(selector).all()) {
        expect(await contrast(button.locator("svg"), button)).toBeGreaterThanOrEqual(3);
        await button.hover();
        expect(await contrast(button.locator("svg"), button)).toBeGreaterThanOrEqual(3);
      }
    }
    await card.screenshot({ path: testInfo.outputPath("music-card.png") });

    for (const viewport of [{ width: 1440, height: 900 }, { width: 2560, height: 1440 }, { width: 1280, height: 400 }]) {
      await page.setViewportSize(viewport);
      for (const sizeKey of ["Home", "End"]) {
        await page.getByRole("separator", { name: "Resize file explorer" }).press(sizeKey);
        await card.locator(".npc-close").focus();
        await page.keyboard.press("Tab");
        await expect(card.getByRole("button", { name: "Previous track" })).toBeFocused();
        await expect(card.locator(".npc-controls")).toHaveCSS("opacity", "1");
        const boxes = await card.locator(".npc-close, .npc-btn, .npc-meta").evaluateAll(elements => elements.map(el => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }));
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j];
            expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
              `Controls overlap at ${viewport.width}×${viewport.height}, ${sizeKey}`).toBe(true);
          }
        }
      }
    }

    await page.locator('.ide-row[href="/about"]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    const dock = page.locator(".np-dock");
    await expect(dock).toBeVisible();
    const play = dock.locator(".np-btn--primary");
    expect(await contrast(play.locator("svg"), play)).toBeGreaterThanOrEqual(3);
    const box = (await dock.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await dock.getByRole("button", { name: "Close player and stop music" }).click();
    await expect(dock).toBeHidden();
  });
}
