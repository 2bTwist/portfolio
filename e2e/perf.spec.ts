import { test, expect, type Locator } from "@playwright/test";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Deep measurement: drive several in-place interactions against the prod build
// under CPU throttle, capture an Event Timing interaction proxy (the gate metric) and, best-effort, a
// CPU flame-chart profile.
//
// This is a local lab proxy, not field INP. INP and the CPU profile are measured
// in SEPARATE phases on purpose. An active
// CPU profiler at a high sample rate saturates the main thread under throttle and
// blocks CDP input dispatch, which made the combined version hang. So we measure
// INP first (no profiler, clean), then capture the profile as a non-blocking
// extra that can never fail the test.
const CPU_THROTTLE = 4;
type MeasuredEvent = Pick<
  PerformanceEventTiming,
  "name" | "duration" | "startTime" | "processingStart" | "processingEnd"
> & { interactionId: number };
type ExercisedAction = {
  kind: "swatch" | "twistie";
  index: number;
  before: string | null;
  after: string | null;
  changeExpected: boolean;
  stateChanged: boolean;
};

test("homepage interaction perf (INP proxy + CPU profile)", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });

  await page.goto("/");
  // The explorer icons are client-mounted. Wait for one before measuring so
  // every target below has its real handler and state, not only SSR markup.
  await expect(page.locator(".ide-row-icon svg").first()).toBeVisible();

  // Event Timing observer — max interaction duration is the local lab proxy.
  // Keep pointerdown/up/click entries Chrome associates with an interaction,
  // excluding unrelated Event Timing entries. This is not field INP.
  await page.evaluate(() => {
    (window as unknown as {
      __events: MeasuredEvent[];
    }).__events = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const event = e as MeasuredEvent;
        if (["pointerdown", "pointerup", "click"].includes(event.name) && event.interactionId > 0) {
          (window as unknown as {
            __events: MeasuredEvent[];
          }).__events.push({
            name: event.name, duration: event.duration, interactionId: event.interactionId,
            startTime: event.startTime, processingStart: event.processingStart,
            processingEnd: event.processingEnd,
          });
        }
      }
    }).observe({ type: "event", durationThreshold: 0, buffered: true } as PerformanceObserverInit);
  });

  // Drive IN-PLACE interactions: theme switch (re-renders the whole shell) and
  // folder toggle (accordion). These are the heaviest discrete interactions on
  // the page and exactly what INP measures — a click's event-handler duration.
  // Nav links are intentionally excluded: they navigate (covered by LCP /
  // page-load) and would lose the observer.
  //
  // Low-level page.mouse clicks (not locator.click) dispatch real input events.
  // Resolve the rectangle immediately before every click: folder expansion
  // changes row positions, so retained coordinates can otherwise hit a link.
  const clickInPlace = async (target: Locator) => {
    const box = await target.boundingBox();
    if (!box) throw new Error("Expected an interaction target to be visible");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(120);
    await expect(page).toHaveURL(/\/$/);
  };

  const swatches = page.locator(".ide-swatch");
  const swatchCount = await swatches.count();
  expect(swatchCount).toBeGreaterThan(0);
  const actions: ExercisedAction[] = [];
  for (let i = 0; i < swatchCount; i++) {
    const swatch = swatches.nth(i);
    const before = await swatch.getAttribute("aria-pressed");
    await clickInPlace(swatch);
    await expect(swatch).toHaveAttribute("aria-pressed", "true");
    const after = await swatch.getAttribute("aria-pressed");
    actions.push({
      kind: "swatch", index: i, before, after,
      changeExpected: before !== "true", stateChanged: after !== before,
    });
  }
  const twisties = page.locator(".ide-twistie-hit");
  const twistieCount = await twisties.count();
  expect(twistieCount).toBeGreaterThan(0);
  for (let i = 0; i < twistieCount; i++) {
    const twistie = twisties.nth(i);
    const row = twistie.locator("xpath=..");
    const before = await row.getAttribute("aria-expanded");
    expect(before === "true" || before === "false").toBe(true);
    const expected = before === "true" ? "false" : "true";
    await clickInPlace(twistie);
    await expect(row).toHaveAttribute("aria-expanded", expected);
    const after = await row.getAttribute("aria-expanded");
    actions.push({
      kind: "twistie", index: i, before, after,
      changeExpected: true, stateChanged: after !== before,
    });
  }
  const twistie = twisties.first();
  for (let i = 0; i < 4; i++) {
    const row = twistie.locator("xpath=..");
    const before = await row.getAttribute("aria-expanded");
    expect(before === "true" || before === "false").toBe(true);
    const expected = before === "true" ? "false" : "true";
    await clickInPlace(twistie);
    await expect(row).toHaveAttribute("aria-expanded", expected);
    const after = await row.getAttribute("aria-expanded");
    actions.push({
      kind: "twistie", index: 0, before, after,
      changeExpected: true, stateChanged: after !== before,
    });
  }

  const events: MeasuredEvent[] = await page.evaluate(
    () => (window as unknown as { __events: MeasuredEvent[] }).__events ?? [],
  );
  expect(events.length).toBeGreaterThan(0);
  const inp = Math.max(...events.map((event) => event.duration));
  mkdirSync("perf-results", { recursive: true });
  const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
  writeFileSync(
    "perf-results/inp.json",
    JSON.stringify({
      inp, url: page.url(), buildId, interactionCount: events.length, events, actions,
      specSha256: createHash("sha256").update(readFileSync("e2e/perf.spec.ts")).digest("hex"),
      browserVersion: page.context().browser()?.version(),
      measuredAt: new Date().toISOString(),
    }, null, 2),
  );
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
        // Replay the palette switches measured above as well as the explorer
        // interactions. This diagnostic profile stays separate from the gate,
        // but it must include the whole-shell work that a theme click performs.
        for (let i = 0; i < swatchCount; i++) {
          const swatch = swatches.nth(i);
          await clickInPlace(swatch);
          await expect(swatch).toHaveAttribute("aria-pressed", "true");
        }
        for (let i = 0; i < 3; i++) {
          const box = await twistie.boundingBox();
          if (!box) break;
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(80);
          await expect(page).toHaveURL(/\/$/);
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

  // Best-effort rendering trace in a fresh browser context. This is intentionally
  // after the gate artifact and does not feed its verdict: unlike the warmed gate
  // page, it includes startup work that can delay the first theme presentation.
  // Keep the trace bounded and close its isolated context on every path, so an
  // incomplete CDP stream cannot leave diagnostic work running beside the gate.
  const traceUrl = page.url();
  const browser = page.context().browser();
  const traceViewport = page.viewportSize() ?? { width: 1280, height: 720 };
  const traceBrowserVersion = browser?.version();
  await page.close().catch((closeError) => {
    console.warn(`Rendering trace gate-page cleanup skipped: ${String(closeError).split("\n")[0]}`);
  });
  if (!browser) {
    console.warn("Rendering trace skipped: browser connection unavailable");
  } else {
    try {
      const traceContext = await browser.newContext({
        viewport: traceViewport,
      });
      const tracePage = await traceContext.newPage();
      const traceClient = await traceContext.newCDPSession(tracePage);
      const traceEvents: unknown[] = [];
      let tracingActive = false;
      let traceAbortError: Error | undefined;
      let resolveTrace!: () => void;
      const traceComplete = new Promise<void>((resolve) => {
        resolveTrace = resolve;
      });
      traceClient.on("Tracing.dataCollected", (event: { value?: unknown[] }) => {
        if (event.value) traceEvents.push(...event.value);
      });
      traceClient.on("Tracing.tracingComplete", () => resolveTrace());

      let endTimer: ReturnType<typeof setTimeout> | undefined;
      const endTracing = async () => {
        if (!tracingActive) return;
        tracingActive = false;
        await new Promise<void>((resolve, reject) => {
          endTimer = setTimeout(() => reject(new Error("Tracing.end timed out")), 1500);
          void traceClient.send("Tracing.end").then(resolve, reject);
        }).finally(() => {
          if (endTimer) clearTimeout(endTimer);
        });
      };

      const traceWork = (async () => {
        await traceClient.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
        await traceClient.send("Tracing.start", {
          categories: [
            "devtools.timeline",
            "blink.user_timing",
            "disabled-by-default-devtools.timeline",
            "disabled-by-default-devtools.timeline.frame",
            "disabled-by-default-devtools.timeline.invalidationTracking",
            "cc",
            "gpu",
            "viz",
          ].join(","),
          transferMode: "ReportEvents",
        });
        tracingActive = true;
        await tracePage.goto(traceUrl);
        const { frameTree } = await traceClient.send("Page.getFrameTree") as {
          frameTree: { frame: { id: string } };
        };
        await expect(tracePage.locator(".ide-row-icon svg").first()).toBeVisible();
        const traceSwatches = tracePage.locator(".ide-swatch");
        await expect(traceSwatches).toHaveCount(3);
        for (let i = 0; i < 3; i++) {
          const swatch = traceSwatches.nth(i);
          const box = await swatch.boundingBox();
          if (!box) throw new Error("Rendering trace target was not visible");
          await tracePage.evaluate((index) => performance.mark(`theme-probe-${index}`), i);
          await tracePage.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await tracePage.waitForTimeout(120);
          await expect(tracePage).toHaveURL(/\/$/);
        }
        await endTracing();
        await traceComplete;
        if (traceAbortError) throw traceAbortError;
        writeFileSync(
          "perf-results/homepage.trace.json",
          JSON.stringify({
            traceEvents,
            metadata: {
              url: tracePage.url(),
              frameId: frameTree.frame.id,
              browserVersion: traceBrowserVersion,
              cpuThrottle: CPU_THROTTLE,
              actions: ["swatch:0", "swatch:1", "swatch:2"],
              marks: ["theme-probe-0", "theme-probe-1", "theme-probe-2"],
              measuredAt: new Date().toISOString(),
            },
          }),
        );
        console.log("Rendering trace -> perf-results/homepage.trace.json");
      })();

      let traceTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          traceWork,
          new Promise<never>((_, reject) => {
            traceTimer = setTimeout(() => reject(new Error("Rendering trace timed out")), 6000);
          }),
        ]);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.warn(`Rendering trace skipped: ${error.message}`);
        traceAbortError = error;
        resolveTrace();
        try {
          await endTracing();
        } catch (endError) {
          console.warn(`Rendering trace cleanup skipped: ${String(endError).split("\n")[0]}`);
        }
      } finally {
        if (traceTimer) clearTimeout(traceTimer);
        await traceContext.close().catch((closeError) => {
          console.warn(`Rendering trace context cleanup skipped: ${String(closeError).split("\n")[0]}`);
        });
        let settleTimer: ReturnType<typeof setTimeout> | undefined;
        await Promise.race([
          traceWork.catch(() => undefined),
          new Promise<void>((resolve) => {
            settleTimer = setTimeout(resolve, 1000);
          }),
        ]);
        if (settleTimer) clearTimeout(settleTimer);
      }
    } catch (e) {
      console.warn(`Rendering trace setup skipped: ${String(e).split("\n")[0]}`);
    }
  }

  const budgets = JSON.parse(readFileSync("budgets.json", "utf8"));
  const inpBudget = budgets.metrics.inp.budget;
  if (inpBudget != null) expect(inp).toBeLessThanOrEqual(inpBudget);
});
