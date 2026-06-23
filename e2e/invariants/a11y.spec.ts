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
