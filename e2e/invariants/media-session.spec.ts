import { expect, test, type Page } from "@playwright/test";

/* The OS media controls (lock screen, Control Center, Chrome's media hub) show the
   track the player has loaded, follow it across tracks, and clear when the player
   closes. Metadata is set on load, so this holds even when the third-party preview
   audio fails to play in CI. */

const sessionTrack = (page: Page) =>
  page.evaluate(() => {
    const m = navigator.mediaSession.metadata;
    return m && { title: m.title, artist: m.artist, artwork: m.artwork.map((a) => a.sizes) };
  });

test("the OS media controls follow the loaded track and clear on close", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/music");
  expect(await sessionTrack(page)).toBeNull();

  await page.locator(".vinyl-row").first().click();
  const card = page.locator(".npc");
  await expect(card).toBeVisible();
  const shown = async () => ({
    title: await card.locator(".npc-title").getAttribute("title"),
    artist: await card.locator(".npc-artist").getAttribute("title"),
  });

  const first = await shown();
  expect(await sessionTrack(page)).toEqual({ ...first, artwork: ["96x96", "256x256", "512x512"] });

  await card.hover();
  await card.getByRole("button", { name: "Next track", exact: true }).click();
  await expect.poll(async () => (await sessionTrack(page))?.title).not.toBe(first.title);
  expect((await sessionTrack(page))?.title).toBe((await shown()).title);

  await card.getByRole("button", { name: "Close player and stop music", exact: true }).click();
  await expect(card).toBeHidden();
  expect(await sessionTrack(page)).toBeNull();
});
