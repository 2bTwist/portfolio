import { expect, test, type Page } from "@playwright/test";

const mobileWidths = [320, 360, 390, 600];
const inlineWidths = [640, 673, 767];

async function navigationGeometry(page: Page) {
  return page.locator('header:has(nav[aria-label="Primary"])').evaluate(header => {
    const nav = header.querySelector<HTMLElement>('nav[aria-label="Primary"]')!;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")].map(link => {
      const rect = link.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    const brand = header.querySelector<HTMLAnchorElement>('a[href="/"]')!.getBoundingClientRect();
    const github = [...header.querySelectorAll<HTMLAnchorElement>("a")].find(link => link.href.includes("github.com"))!.getBoundingClientRect();
    const box = header.getBoundingClientRect();
    return { box, nav: nav.getBoundingClientRect(), links, brand, github, documentOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
  });
}

for (const width of mobileWidths) {
  test(`mobile navigation has one evenly distributed link row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const nav = page.locator('header:has(nav[aria-label="Primary"])');
    await expect(nav).toBeVisible();
    const geometry = await navigationGeometry(page);
    expect(geometry.links).toHaveLength(5);
    expect(Math.max(...geometry.links.map(link => link.top)) - Math.min(...geometry.links.map(link => link.top))).toBeLessThanOrEqual(1);
    expect(geometry.links[0].left).toBeLessThanOrEqual(geometry.nav.left + 2);
    expect(geometry.links.at(-1)!.right).toBeGreaterThanOrEqual(geometry.nav.right - 2);
    expect(geometry.documentOverflows).toBe(false);
  });
}

for (const width of inlineWidths) {
  test(`brand, primary links, and GitHub share one balanced row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const geometry = await navigationGeometry(page);
    const centers = [geometry.brand, geometry.github, ...geometry.links]
      .map(box => (box.top + box.bottom) / 2);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
    expect(geometry.brand.right).toBeLessThan(geometry.links[0].left);
    expect(geometry.links.at(-1)!.right).toBeLessThan(geometry.github.left);
    expect(geometry.documentOverflows).toBe(false);
  });
}

test("desktop replaces the compact header with the IDE navigation at 768px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 800 });
  await page.goto("/");
  await expect(page.locator(".ide-explorer")).toBeVisible();
  await expect(page.locator('header:has(nav[aria-label="Primary"])')).toBeHidden();
});

test("compact navigation opens About by keyboard and browser Back returns home", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  const about = page.getByRole("link", { name: "about", exact: true });
  await about.focus();
  await expect(about).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/about$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});
