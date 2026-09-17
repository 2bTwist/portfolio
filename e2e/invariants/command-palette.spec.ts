import { expect, test } from "@playwright/test";

async function openPalette(page: import("@playwright/test").Page) {
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.goto("/");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });

  const trigger = page.locator(".ide-command-center");
  await expect(trigger).toHaveCount(1);
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("combobox", { name: "Search files, projects, and posts" });
  await expect(input).toBeFocused();
  return { dialog, input, trigger };
}

test("ArrowDown keeps every command-palette selection inside its scrollport", async ({ page }) => {
  const { dialog, input } = await openPalette(page);
  const options = dialog.getByRole("option");
  const count = await options.count();
  expect(count).toBeGreaterThan(5);

  for (let index = 0; index < count; index += 1) {
    if (index > 0) await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", `cmdk-opt-${index}`);

    const geometry = await dialog.locator("#cmdk-listbox").evaluate((list) => {
      const active = list.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
      if (!active) throw new Error("Expected exactly one selected command result");
      const listRect = list.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      return { listTop: listRect.top, listBottom: listRect.bottom, activeTop: activeRect.top, activeBottom: activeRect.bottom };
    });
    expect(geometry.activeTop).toBeGreaterThanOrEqual(geometry.listTop - 0.5);
    expect(geometry.activeBottom).toBeLessThanOrEqual(geometry.listBottom + 0.5);
  }
});

test("query changes reset selection, clearing restores results, and Escape restores focus", async ({ page }) => {
  const { dialog, input, trigger } = await openPalette(page);
  const initialCount = await dialog.getByRole("option").count();
  expect(initialCount).toBeGreaterThan(0);

  await input.fill("cisco");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await expect(input).toHaveAttribute("aria-activedescendant", "cmdk-opt-0");

  await input.fill("");
  await expect(dialog.getByRole("option")).toHaveCount(initialCount);
  await expect(input).toHaveAttribute("aria-activedescendant", "cmdk-opt-0");

  await input.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
