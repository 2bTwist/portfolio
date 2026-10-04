import { expect, test, type Page } from "@playwright/test";

/* A split pane shows the same document as the route, without a second <main>
   or repeated ids, and opening or closing it never remounts the route. */

const POST = "/blog/you-cant-prompt-taste";

async function dragIntoSplit(page: Page, href: string, source = page.locator(`#ide-explorer a[href="${href}"] .ide-row-name`)) {
  // hover() waits for the source to hold still, so the press lands on it.
  await source.hover();
  const editor = await page.locator("[data-editor-root]").first().boundingBox();
  if (!editor) throw new Error("split drag geometry was unavailable");
  await page.mouse.down();
  await page.mouse.move(editor.x + editor.width * 0.75, 160, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toBeVisible();
}

async function load(page: Page, path: string) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(path);
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
}

test("the same article in both panes keeps one main and unique ids", async ({ page }) => {
  await load(page, POST);
  await dragIntoSplit(page, POST);
  const pane = page.getByRole("region", { name: /\(split pane\)$/ });
  await expect(pane.getByRole("heading", { level: 1, name: "You can't prompt taste" })).toBeVisible();
  await expect(pane.locator(".prose-content h2").first()).toBeVisible();

  await expect(page.locator("main")).toHaveCount(1);
  const duplicates = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const el of document.querySelectorAll("[id]")) counts.set(el.id, (counts.get(el.id) ?? 0) + 1);
    return [...counts].filter(([, n]) => n > 1).map(([id]) => id);
  });
  expect(duplicates).toEqual([]);
});

test("an article split shows the route's header: banner, date and tags", async ({ page }) => {
  await load(page, "/about");
  await dragIntoSplit(page, POST);
  const pane = page.getByRole("region", { name: /\(split pane\)$/ });
  await expect(pane.getByRole("heading", { level: 1, name: "You can't prompt taste" })).toBeVisible();
  await expect(pane.locator(".project-banner img")).toBeVisible();
  await expect(pane.getByRole("link", { name: /^#/ }).first()).toBeVisible();
  await expect(pane.getByText(/^\d{4}-\d{2}-\d{2}$/)).toBeVisible();
});

test("a project split shows the route's header", async ({ page }) => {
  await load(page, "/about");
  await dragIntoSplit(page, "/projects/cogito");
  const pane = page.getByRole("region", { name: /\(split pane\)$/ });
  await expect(pane.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(pane.getByRole("link", { name: "← projects/" })).toBeVisible();
  await expect(pane.locator(".project-banner img")).toBeVisible();
});

test("the route is not remounted when a split opens or closes", async ({ page }) => {
  await load(page, POST);
  await page.locator("main").evaluate((main) => {
    (main as HTMLElement & { __original?: boolean }).__original = true;
  });
  const original = () =>
    page.locator("main").evaluate((main) => (main as HTMLElement & { __original?: boolean }).__original === true);

  await dragIntoSplit(page, "/about");
  expect(await original()).toBe(true);
  await page.getByRole("button", { name: "Close split pane" }).click();
  await expect(page.getByRole("separator", { name: "Resize split editor" })).toHaveCount(0);
  expect(await original()).toBe(true);
});

test("the article outline lists only the route's headings", async ({ page }) => {
  await load(page, "/about");
  // Wide enough that the split's primary column still has room for the outline.
  await page.setViewportSize({ width: 3000, height: 1200 });
  await dragIntoSplit(page, POST);
  const pane = page.getByRole("region", { name: /\(split pane\)$/ });
  await expect(pane.locator(".prose-content h2").first()).toBeVisible();

  // The route's outline mounts while the pane's copy of the article is on screen.
  await page.locator("#ide-explorer").getByRole("link", { name: "you-cant-prompt-taste.md" }).click();
  await expect(page).toHaveURL(new RegExp(`${POST}$`));
  const outline = page.getByRole("navigation", { name: "On this page" });
  await expect(outline).toBeVisible();
  const routeHeadings = await page.locator("main .prose-content").locator("h2, h3").count();
  await expect(outline.getByRole("link")).toHaveCount(routeHeadings);
  const hrefs = await outline.getByRole("link").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs.filter((h) => h?.startsWith("#split-"))).toEqual([]);
});

test("every splittable page opens in a pane without a second main", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("data-reveal-seen", "1"));
  // The pages outside the explorer get tabs: privacy (unlisted) by landing on
  // it, resume through the palette; client navigation keeps both.
  await load(page, "/privacy");
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByRole("dialog", { name: "Command palette" }).getByRole("combobox");
  await input.fill("resume");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/resume$/);
  await page.locator("#ide-explorer").getByRole("link", { name: "blog/" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  const tab = (href: string) => page.locator('[aria-label="Open files"] .ide-tab').filter({ has: page.locator(`a[href="${href}"]`) });

  const fromExplorer = ["/", "/about", "/projects", "/experience", "/certs", "/music"];
  const fromTabs = ["/resume", "/privacy"];
  for (const href of [...fromExplorer, ...fromTabs]) {
    await dragIntoSplit(page, href, fromTabs.includes(href) ? tab(href) : undefined);
    const pane = page.getByRole("region", { name: /\(split pane\)$/ });
    await expect(pane, href).toBeAttached();
    await expect(page.locator("main"), href).toHaveCount(1);
    await page.getByRole("button", { name: "Close split pane" }).click();
    await expect(page.getByRole("separator", { name: "Resize split editor" })).toHaveCount(0);
  }
});
