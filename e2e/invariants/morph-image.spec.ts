import { expect, test } from "@playwright/test";

test("blog image morph completes on entry and browser back without hiding either image", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const state = window as Window & { __completedBlogMorphs?: number };
    state.__completedBlogMorphs = 0;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this instanceof HTMLImageElement && this.style.position === "fixed") {
        animation.addEventListener("finish", () => { state.__completedBlogMorphs! += 1; });
      }
      return animation;
    };
  });
  await page.goto("/blog");
  const card = page.locator('a.proj-card[href="/blog/you-cant-prompt-taste"]');
  const image = card.locator(".morph-img-wrap img");
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty("complete", true);
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await card.click();
  await page.waitForURL("**/blog/you-cant-prompt-taste");
  await page.waitForFunction(() => (window as Window & { __completedBlogMorphs?: number }).__completedBlogMorphs === 1);
  const banner = page.locator(".project-banner .morph-img-wrap img");
  await expect(banner).toBeVisible();
  await expect(banner).toHaveJSProperty("complete", true);
  await expect.poll(() => banner.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.goBack();
  await page.waitForURL("**/blog");
  await page.waitForFunction(() => (window as Window & { __completedBlogMorphs?: number }).__completedBlogMorphs === 2);
  await expect(image).toBeVisible();
  await expect(page.locator('img[aria-hidden="true"][style*="position: fixed"]')).toHaveCount(0);
});

test("shared image morph lands on stationary destinations in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const state = window as Window & {
      __morphDestinationSpans?: {
        minTop: number;
        maxTop: number;
        frameCount: number;
        cloneFinish: { left: number; top: number; width: number; height: number };
        destinationAfterFinish: { left: number; top: number; width: number; height: number };
      }[];
    };
    state.__morphDestinationSpans = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const clone = this instanceof HTMLImageElement && this.style.position === "fixed";
      const animation = animate.apply(this, args);
      if (!clone) return animation;

      const tops: number[] = [];
      const sample = () => {
        const destination = document.querySelector(".project-banner .morph-img-wrap")
          ?? document.querySelector('a.proj-card[href="/projects/cisco-mcp"] .morph-img-wrap');
        if (destination) tops.push(destination.getBoundingClientRect().top);
        if (this.isConnected) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      animation.addEventListener("finish", () => {
        const cloneFinish = this.getBoundingClientRect();
        requestAnimationFrame(() => {
          const destination = document.querySelector(".project-banner .morph-img-wrap")
            ?? document.querySelector('a.proj-card[href="/projects/cisco-mcp"] .morph-img-wrap');
          if (tops.length && destination) {
            const destinationAfterFinish = destination.getBoundingClientRect();
          state.__morphDestinationSpans?.push({
            minTop: Math.min(...tops),
            maxTop: Math.max(...tops),
            frameCount: tops.length,
              cloneFinish: { left: cloneFinish.left, top: cloneFinish.top, width: cloneFinish.width, height: cloneFinish.height },
              destinationAfterFinish: {
                left: destinationAfterFinish.left,
                top: destinationAfterFinish.top,
                width: destinationAfterFinish.width,
                height: destinationAfterFinish.height,
              },
          });
          }
        });
      });
      return animation;
    };
  });

  await page.goto("/projects");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });
  const card = page.locator('a.proj-card[href="/projects/cisco-mcp"]');
  await expect(card).toHaveCount(1);
  await card.locator(".morph-img-wrap img").waitFor({ state: "visible" });

  await card.click();
  await page.waitForURL("**/projects/cisco-mcp");
  await page.locator(".project-banner .morph-img-wrap img").waitFor({ state: "visible" });
  await page.waitForFunction(() => (window as Window & { __morphDestinationSpans?: unknown[] }).__morphDestinationSpans?.length === 1);

  await page.getByRole("button", { name: "Go back" }).click();
  await page.waitForURL("**/projects");
  await card.locator(".morph-img-wrap img").waitFor({ state: "visible" });
  await page.waitForFunction(() => (window as Window & { __morphDestinationSpans?: unknown[] }).__morphDestinationSpans?.length === 2);

  const spans = await page.evaluate(
    () => (window as unknown as { __morphDestinationSpans: {
      minTop: number; maxTop: number; frameCount: number;
      cloneFinish: { left: number; top: number; width: number; height: number };
      destinationAfterFinish: { left: number; top: number; width: number; height: number };
    }[] }).__morphDestinationSpans,
  );
  expect(spans).toHaveLength(2);
  for (const span of spans) {
    expect(span.frameCount).toBeGreaterThan(1);
    expect(span.maxTop - span.minTop).toBeLessThanOrEqual(0.5);
    expect(Math.abs(span.cloneFinish.left - span.destinationAfterFinish.left)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(span.cloneFinish.top - span.destinationAfterFinish.top)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(span.cloneFinish.width - span.destinationAfterFinish.width)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(span.cloneFinish.height - span.destinationAfterFinish.height)).toBeLessThanOrEqual(0.5);
  }
});

test("interrupting a morph removes its fixed clone before the unrelated route settles", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/projects");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });

  const card = page.locator('a.proj-card[href="/projects/cisco-mcp"]');
  await expect(card).toHaveCount(1);
  await card.locator(".morph-img-wrap img").waitFor({ state: "visible" });
  await card.click();
  await page.waitForURL("**/projects/cisco-mcp");

  const clones = page.locator('img[aria-hidden="true"][style*="position: fixed"]');
  await expect(clones).toHaveCount(1);
  await page.locator('.ide-explorer a[href="/about"]').click();
  await page.waitForURL("**/about");
  await page.locator("main").first().waitFor({ state: "visible" });

  const cloneCountOnFirstSettledFrame = await page.evaluate(
    () => new Promise<number>((resolve) => requestAnimationFrame(() => {
      resolve(document.querySelectorAll('img[aria-hidden="true"][style*="position: fixed"]').length);
    })),
  );
  expect(cloneCountOnFirstSettledFrame).toBe(0);
});

test("reduced motion navigates without a fixed shared-image clone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects");
  await page.locator(".ide-row-icon svg").first().waitFor({ state: "visible" });

  const card = page.locator('a.proj-card[href="/projects/cisco-mcp"]');
  await expect(card).toHaveCount(1);
  await card.waitFor({ state: "visible" });
  await card.click();
  await page.waitForURL("**/projects/cisco-mcp");
  await page.locator(".project-banner .morph-img-wrap img").waitFor({ state: "visible" });
  await expect(page.locator('img[aria-hidden="true"][style*="position: fixed"]')).toHaveCount(0);
});
