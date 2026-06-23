import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

// Deep measurement (Phase 5): drive several user behaviors against the prod
// build under CPU throttle, capture an INP proxy + a CPU flame-chart profile.
const CPU_THROTTLE = 4;

test("homepage interaction perf (INP proxy + CPU profile)", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });

  await page.goto("/");

  // Event Timing observer — max interaction duration is the INP proxy (this is
  // essentially how web-vitals derives INP), zero deps.
  await page.evaluate(() => {
    (window as unknown as { __events: number[] }).__events = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        (window as unknown as { __events: number[] }).__events.push(
          (e as PerformanceEntry & { duration: number }).duration,
        );
      }
    }).observe({ type: "event", durationThreshold: 0, buffered: true } as PerformanceObserverInit);
  });

  await client.send("Profiler.enable");
  await client.send("Profiler.setSamplingInterval", { interval: 100 });
  await client.send("Profiler.start");

  // Several real user behaviors: click through the interactive elements.
  const clickable = page.locator("button, a, [role=button]");
  const count = Math.min(await clickable.count(), 8);
  for (let i = 0; i < count; i++) {
    await clickable.nth(i).click({ force: true }).catch(() => {});
    await page.waitForTimeout(120);
  }

  const { profile } = await client.send("Profiler.stop");
  mkdirSync("perf-results", { recursive: true });
  writeFileSync("perf-results/homepage.cpuprofile", JSON.stringify(profile));

  const durations: number[] = await page.evaluate(
    () => (window as unknown as { __events: number[] }).__events ?? [],
  );
  const inp = durations.length ? Math.max(...durations) : 0;
  writeFileSync("perf-results/inp.json", JSON.stringify({ inp }, null, 2));
  console.log(`INP proxy (max event duration): ${inp.toFixed(1)}ms; CPU profile -> perf-results/homepage.cpuprofile`);

  const budgets = JSON.parse(readFileSync("budgets.json", "utf8"));
  const inpBudget = budgets.metrics.inp.budget;
  if (inpBudget != null) expect(inp).toBeLessThanOrEqual(inpBudget);
});
