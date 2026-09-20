import { expect, test, type Locator, type Page } from "@playwright/test";
import { PALETTES } from "../../app/lib/palette";

// Requirement: on compact widths the desktop status bar (which holds the theme
// switcher) is hidden, so the compact site header must offer the same theme
// switcher, exposed as a "Theme" group of `Theme: <palette name>` buttons.

async function visibleThemeGroups(page: Page): Promise<Locator[]> {
  const groups = page.getByRole("group", { name: "Theme" });
  const total = await groups.count();
  const visible: Locator[] = [];
  for (let i = 0; i < total; i++) {
    const candidate = groups.nth(i);
    if (await candidate.isVisible()) visible.push(candidate);
  }
  return visible;
}

async function pressedCount(group: Locator): Promise<number> {
  return group.getByRole("button").evaluateAll(
    els => els.filter(el => el.getAttribute("aria-pressed") === "true").length,
  );
}

async function readAccent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const rootValue = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (rootValue) return rootValue;
    return getComputedStyle(document.body).getPropertyValue("--accent").trim();
  });
}

async function buttonContainsPoint(button: Locator, x: number, y: number): Promise<boolean> {
  return button.evaluate((el, point) => {
    const hit = document.elementFromPoint(point.x, point.y);
    return !!hit && (hit === el || el.contains(hit));
  }, { x, y });
}

test("compact header exposes exactly one Theme group with one button per palette and one pressed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  const visible = await visibleThemeGroups(page);
  expect(visible).toHaveLength(1);
  const group = visible[0];

  const headerWithNav = page.locator('header:has(nav[aria-label="Primary"])');
  await expect(headerWithNav).toHaveCount(1);
  const groupInHeader = headerWithNav.getByRole("group", { name: "Theme" });
  await expect(groupInHeader).toHaveCount(1);
  await expect(groupInHeader).toBeVisible();

  const buttons = group.getByRole("button");
  await expect(buttons).toHaveCount(PALETTES.length);
  for (const palette of PALETTES) {
    await expect(group.getByRole("button", { name: `Theme: ${palette.name}` })).toBeVisible();
  }

  expect(await pressedCount(group)).toBe(1);
});

test("activating an unpressed theme button switches --accent and survives reload", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  const [group] = await visibleThemeGroups(page);
  expect(group).toBeTruthy();

  let chosen: (typeof PALETTES)[number] | undefined;
  for (const palette of PALETTES) {
    const button = group.getByRole("button", { name: `Theme: ${palette.name}` });
    if ((await button.getAttribute("aria-pressed")) !== "true") {
      chosen = palette;
      break;
    }
  }
  expect(chosen).toBeTruthy();

  const accentBefore = await readAccent(page);
  const target = group.getByRole("button", { name: `Theme: ${chosen!.name}` });
  await target.click();

  await expect(target).toHaveAttribute("aria-pressed", "true");
  expect(await pressedCount(group)).toBe(1);

  const accentAfter = await readAccent(page);
  expect(accentAfter).not.toBe(accentBefore);

  await page.reload();
  const [groupAfterReload] = await visibleThemeGroups(page);
  expect(groupAfterReload).toBeTruthy();
  const targetAfterReload = groupAfterReload.getByRole("button", { name: `Theme: ${chosen!.name}` });
  await expect(targetAfterReload).toHaveAttribute("aria-pressed", "true");
  expect(await pressedCount(groupAfterReload)).toBe(1);
  expect(await readAccent(page)).toBe(accentAfter);
});

test("theme buttons have adequate, non-overlapping touch targets and no horizontal overflow at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  const [group] = await visibleThemeGroups(page);
  expect(group).toBeTruthy();
  const buttons = group.getByRole("button");
  const count = await buttons.count();
  expect(count).toBe(PALETTES.length);

  // Effective hit area is measured via elementFromPoint probes, not
  // getBoundingClientRect, because a compliant target may be visually
  // smaller than 24x24 while an invisible padding/pseudo-element expands
  // its actual hit area to meet the minimum.
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox();
    if (!box) throw new Error(`theme button ${i} has no bounding box`);
    boxes.push(box);
  }

  const offsets: Array<[number, number]> = [
    [-11, 0],
    [11, 0],
    [0, -11],
    [0, 11],
  ];
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const box = boxes[i];
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (const [dx, dy] of offsets) {
      const within = await buttonContainsPoint(button, cx + dx, cy + dy);
      expect(within, `button ${i} effective hit area probe at offset ${dx},${dy} from centre (24x24 minimum)`).toBe(true);
    }
  }

  for (let i = 0; i < count - 1; i++) {
    const boxA = boxes[i];
    const boxB = boxes[i + 1];
    const midX = (boxA.x + boxA.width / 2 + boxB.x + boxB.width / 2) / 2;
    const midY = (boxA.y + boxA.height / 2 + boxB.y + boxB.height / 2) / 2;
    const inA = await buttonContainsPoint(buttons.nth(i), midX, midY);
    const inB = await buttonContainsPoint(buttons.nth(i + 1), midX, midY);
    expect(inA && inB, `midpoint between buttons ${i} and ${i + 1} resolves to only one`).toBe(false);
  }

  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows, `document overflows horizontally at ${width}px`).toBe(false);
  }
});

test("desktop shows exactly one Theme group, reachable and operable by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const visible = await visibleThemeGroups(page);
  expect(visible).toHaveLength(1);
  const group = visible[0];

  const buttons = group.getByRole("button");
  const count = await buttons.count();
  let target: Locator | undefined;
  for (let i = 0; i < count; i++) {
    if ((await buttons.nth(i).getAttribute("aria-pressed")) !== "true") {
      target = buttons.nth(i);
      break;
    }
  }
  expect(target).toBeTruthy();

  await target!.focus();
  await expect(target!).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(target!).toHaveAttribute("aria-pressed", "true");
});
