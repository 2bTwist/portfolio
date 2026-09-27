import { expect, test } from "@playwright/test";

/* Posts reach the shell through the root layout's CatalogueProvider. Without it the
   shell knows only pages and projects: every post route still renders, but posts get
   no tab and the blog folder is empty. Post URLs come from the server-built sitemap,
   not from the shell under test. */
test("every post opens as its own tab and sits in the blog folder", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const posts = [...sitemap.matchAll(/<loc>[^<]*?(\/blog\/(?!tag\/)[^</]+)<\/loc>/g)].map((m) => m[1]);
  expect(posts.length).toBeGreaterThan(0);

  await page.setViewportSize({ width: 1280, height: 800 });
  for (const href of posts) {
    await page.goto(href);
    const slug = href.split("/").pop();
    await expect(page.locator('[aria-label="Open files"] a[aria-current="page"]')).toHaveText(`${slug}.md`);
    await expect(page.getByRole("navigation", { name: "Site files" }).locator(`a[href="${href}"]`)).toBeVisible();
  }
});
