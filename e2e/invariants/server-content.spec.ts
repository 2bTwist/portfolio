import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: "Edmond Ndanji", content: "Full-stack & Mobile engineer" },
  { path: "/projects", heading: "Projects", content: "Things I have built" },
  { path: "/blog/privacy-basics", heading: "My little take on privacy", content: "privacy" },
];

test("server-rendered routes paint meaningful content with JavaScript disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  try {
    for (const route of routes) {
      const page = await context.newPage();
      await page.goto(new URL(route.path, baseURL).toString(), { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.getByText(route.content, { exact: false }).first()).toBeVisible();
      await page.close();
    }

    const page = await context.newPage();
    await page.goto(new URL("/", baseURL).toString(), { waitUntil: "domcontentloaded" });
    const projects = page.locator('.ide-explorer a[href="/projects"]');
    await expect(projects).toBeVisible();
    await projects.click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();

    const article = page.locator('.ide-explorer a[href="/blog/privacy-basics"]');
    await expect(article).toBeVisible();
    await article.click();
    await expect(page).toHaveURL(/\/blog\/privacy-basics$/);
    await expect(page.getByRole("heading", { level: 1, name: "My little take on privacy" })).toBeVisible();
    await page.close();
  } finally {
    await context.close();
  }
});
