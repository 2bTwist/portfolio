import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Hard invariant (grilled decision 7): a11y must stay green. The perf loop may
// NOT trade accessibility for speed — if a perf change introduces a serious/
// critical violation, this fails and the loop must escalate.
test("homepage has no serious/critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking.map((v) => v.id)).toEqual([]);
});

// The reading surface (Phase 4) is where contrast can regress: tinted callouts,
// marks, and code blocks over the cream palette. Guard the rendered post too.
test("a blog post has no serious/critical accessibility violations", async ({ page }) => {
  await page.goto("/blog/my-first-post");
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking.map((v) => v.id)).toEqual([]);
});
