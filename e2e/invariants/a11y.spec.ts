import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Hard invariant (grilled decision 7): a11y must stay green. The perf loop may
// NOT trade accessibility for speed — if a perf change introduces a serious/
// critical violation, this fails and the loop must escalate.
for (const theme of ["Cream", "Latte", "Frappe (soft dark)"]) {
  test(`homepage has no serious/critical accessibility violations in ${theme}`, async ({ page }) => {
    await page.goto("/");
    const control = page.getByRole("button", { name: `Theme: ${theme}`, exact: true });
    await page.locator(".ide-row-icon svg").first().waitFor();
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
    const background = { Cream: "rgb(243, 236, 221)", Latte: "rgb(238, 241, 245)", "Frappe (soft dark)": "rgb(48, 52, 70)" }[theme];
    await expect(page.locator("body")).toHaveCSS("background-color", background!);
    // Scan the selected theme after its short color transitions settle.
    // Looping decorative animations do not block this readiness check.
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().filter(animation => animation instanceof CSSTransition).map(animation => animation.finished.catch(() => {})));
    });
    await expect(page.locator(".pulse-grid")).toHaveCount(1);
    await page.locator(".pulse-grid").scrollIntoViewIfNeeded();
    const labelResults = await new AxeBuilder({ page }).withRules(["label-content-name-mismatch"]).analyze();
    expect(labelResults.violations).toEqual([]);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking.map((v) => v.id), JSON.stringify(blocking.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, reason: n.failureSummary })) })))).toEqual([]);
  });
}

// The reading surface (Phase 4) is where contrast can regress: tinted callouts,
// marks, and code blocks over the cream palette. Guard the rendered post too.
test("a blog post has no serious/critical accessibility violations", async ({ page }) => {
  await page.goto("/blog/privacy-basics");
  await expect(page.getByRole("heading", { level: 1, name: "My little take on privacy" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking.map((v) => v.id)).toEqual([]);
});
