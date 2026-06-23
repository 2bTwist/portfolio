import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

// Deep measurement: drive several in-place interactions against the prod build
// under CPU throttle, capture an INP proxy (the gate metric) and, best-effort, a
// CPU flame-chart profile.
//
// INP and the CPU profile are measured in SEPARATE phases on purpose. An active
// CPU profiler at a high sample rate saturates the main thread under throttle and
// blocks CDP input dispatch, which made the combined version hang. So we measure
// INP first (no profiler, clean), then capture the profile as a non-blocking
// extra that can never fail the test.
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

  // Drive IN-PLACE interactions: theme switch (re-renders the whole shell) and
  // folder toggle (accordion). These are the heaviest discrete interactions on
  // the page and exactly what INP measures — a click's event-handler duration.
  // Nav links are intentionally excluded: they navigate (covered by LCP /
  // page-load) and would lose the observer.
  //
  // Low-level page.mouse clicks (not locator.click) dispatch real input events —
  // so Event Timing records them — while skipping Playwright's actionability /
  // stability waits, which race under CPU throttle. Coordinates come from a
  // one-shot boundingBox.
  const controls = page.locator(".ide-swatch, .ide-chevron");
  const boxes: ({ x: number; y: number; width: number; height: number } | null)[] = [];
  const total = Math.min(await controls.count(), 8);
  for (let i = 0; i < total; i++) boxes.push(await controls.nth(i).boundingBox());
  const chevronBox = await page.locator(".ide-chevron").first().boundingBox();
  for (let i = 0; i < 4; i++) boxes.push(chevronBox);

  for (const box of boxes) {
    if (!box) continue;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(120);
  }

  const durations: number[] = await page.evaluate(
    () => (window as unknown as { __events: number[] }).__events ?? [],
  );
  const inp = durations.length ? Math.max(...durations) : 0;
  mkdirSync("perf-results", { recursive: true });
  writeFileSync("perf-results/inp.json", JSON.stringify({ inp }, null, 2));
  console.log(`INP proxy (max event duration): ${inp.toFixed(1)}ms`);

  // Best-effort CPU profile over a short window. Bounded so it can never hang
  // the test: if the profiler stalls under throttle, we skip the artifact and
  // still assert on the INP measured above.
  try {
    await Promise.race([
      (async () => {
        await client.send("Profiler.enable");
        await client.send("Profiler.setSamplingInterval", { interval: 1000 });
        await client.send("Profiler.start");
        if (chevronBox) {
          for (let i = 0; i < 3; i++) {
            await page.mouse.click(chevronBox.x + chevronBox.width / 2, chevronBox.y + chevronBox.height / 2);
            await page.waitForTimeout(80);
          }
        }
        const { profile } = await client.send("Profiler.stop");
        writeFileSync("perf-results/homepage.cpuprofile", JSON.stringify(profile));
        console.log("CPU profile -> perf-results/homepage.cpuprofile");
      })(),
      new Promise((resolve) => setTimeout(resolve, 6000)),
    ]);
  } catch (e) {
    console.warn(`CPU profile skipped: ${String(e).split("\n")[0]}`);
  }

  const budgets = JSON.parse(readFileSync("budgets.json", "utf8"));
  const inpBudget = budgets.metrics.inp.budget;
  if (inpBudget != null) expect(inp).toBeLessThanOrEqual(inpBudget);
});
