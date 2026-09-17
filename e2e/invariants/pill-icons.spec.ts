import { expect, test } from "@playwright/test";

const routes = ["/", "/projects", "/projects/cogito", "/experience", "/resume", "/blog/privacy-basics"];

test("every rendered tech pill leads with an icon and keeps accessible text", async ({ page }) => {
  let total = 0;

  for (const route of routes) {
    await page.goto(route);
    const pills = page.locator(".proj-tag");
    const count = await pills.count();
    total += count;

    for (let index = 0; index < count; index += 1) {
      const pill = pills.nth(index);
      const shape = await pill.evaluate(element => ({
        firstElement: element.firstElementChild?.tagName.toLowerCase(),
        visibleText: (element as HTMLElement).innerText.trim(),
        ariaLabel: element.getAttribute("aria-label")?.trim() ?? "",
      }));

      expect(shape.firstElement, `${route} pill ${index} should start with an SVG icon`).toBe("svg");
      expect(
        shape.visibleText || shape.ariaLabel,
        `${route} pill ${index} should retain a text alternative`,
      ).not.toBe("");
    }
  }

  expect(total, "the project route should expose technology pills to exercise the shared contract").toBeGreaterThan(0);
});
