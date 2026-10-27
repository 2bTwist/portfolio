import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "@/data/pages";

/* The phone header holds every page that declares a compact slot. They outgrow a
   phone's width, so the link row scrolls sideways on its own; the page never does. */
const COMPACT_LINKS = PAGES.filter((p) => p.compact).length;

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

// Scrolls the link row to its end and returns where the last link landed.
async function lastLinkAtEnd(page: Page) {
  return page.locator('nav[aria-label="Primary"]').evaluate(nav => {
    nav.scrollLeft = nav.scrollWidth;
    const last = nav.querySelector("a:last-of-type")!.getBoundingClientRect();
    return { right: last.right, navRight: nav.getBoundingClientRect().right };
  });
}

for (const width of mobileWidths) {
  test(`mobile navigation keeps every link on one scrollable row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const nav = page.locator('header:has(nav[aria-label="Primary"])');
    await expect(nav).toBeVisible();
    const geometry = await navigationGeometry(page);
    expect(geometry.links).toHaveLength(COMPACT_LINKS);
    expect(Math.max(...geometry.links.map(link => link.top)) - Math.min(...geometry.links.map(link => link.top))).toBeLessThanOrEqual(1);
    // The row starts at its first link, and its last one can be scrolled fully into view.
    expect(geometry.links[0].left).toBeGreaterThanOrEqual(geometry.nav.left);
    expect(geometry.links[0].left).toBeLessThanOrEqual(geometry.nav.left + 6);
    const end = await lastLinkAtEnd(page);
    expect(end.right).toBeLessThanOrEqual(end.navRight + 1);
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
    expect(geometry.links).toHaveLength(COMPACT_LINKS);
    // Links past the row's edge scroll inside it rather than running under GitHub.
    expect(geometry.nav.right).toBeLessThan(geometry.github.left);
    const end = await lastLinkAtEnd(page);
    expect(end.right).toBeLessThanOrEqual(end.navRight + 1);
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
