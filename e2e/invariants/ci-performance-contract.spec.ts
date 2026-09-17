import { expect, test } from "@playwright/test";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { gunzipSync } from "node:zlib";

type Response = { status: number; headers: Record<string, string | string[] | undefined>; body: Buffer };

function rawRequest(url: URL, headers: Record<string, string>, method = "GET"): Promise<Response> {
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const response = request(url, { method, headers }, incoming => {
      const chunks: Buffer[] = [];
      incoming.on("data", chunk => chunks.push(Buffer.from(chunk)));
      incoming.on("end", () => resolve({ status: incoming.statusCode ?? 0, headers: incoming.headers, body: Buffer.concat(chunks) }));
    });
    response.on("error", reject);
    response.end();
  });
}

test("contribution API negotiates gzip without changing its JSON or cache contract", async ({ baseURL }) => {
  const endpoint = new URL("/api/github-contributions", baseURL);
  const identityRuns = await Promise.all(Array.from({ length: 3 }, () => rawRequest(endpoint, { "accept-encoding": "identity" })));
  const gzipRuns = await Promise.all(Array.from({ length: 3 }, () => rawRequest(endpoint, { "accept-encoding": "gzip" })));

  for (const response of [...identityRuns, ...gzipRuns]) {
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^application\/json/);
    expect(response.headers["cache-control"]).toMatch(/^public, s-maxage=(21600|300), stale-while-revalidate=86400$/);
  }
  for (const response of identityRuns) expect(response.headers["content-encoding"]).toBeUndefined();
  for (const response of gzipRuns) {
    expect(response.headers["content-encoding"]).toBe("gzip");
    expect(response.headers.vary).toMatch(/(^|,)\s*Accept-Encoding\s*(,|$)/i);
  }

  const identity = identityRuns.map(response => JSON.parse(response.body.toString("utf8")));
  const gzip = gzipRuns.map(response => JSON.parse(gunzipSync(response.body).toString("utf8")));
  expect(gzip).toEqual(identity);
  expect(Math.max(...gzipRuns.map(response => response.body.length))).toBeLessThan(
    Math.min(...identityRuns.map(response => response.body.length)),
  );

  const head = await rawRequest(endpoint, { "accept-encoding": "gzip" }, "HEAD");
  expect(head.status).toBe(200);
  expect(head.body).toHaveLength(0);
  expect(head.headers["cache-control"]).toMatch(/^public, s-maxage=(21600|300), stale-while-revalidate=86400$/);
});

test("theme swatches visibly update, retain their pressed state, and persist", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const swatches = page.locator(".ide-swatch");
    await expect(swatches).toHaveCount(3);
    await expect(page.locator(".hero-mascot")).toHaveCSS("animation-name", /hero-bob/);

    const dark = page.getByRole("button", { name: /Theme: Frappe/i });
    await dark.click();
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.locator("body").evaluate(body => getComputedStyle(body).getPropertyValue("--bg").trim())).toBe("#303446");

    await page.reload();
    await expect(page.getByRole("button", { name: /Theme: Frappe/i })).toHaveAttribute("aria-pressed", "true");
  } finally {
    await context.close();
  }
});

test("palette changes suppress global transitions without muting local interaction motion", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const hero = page.locator(".hero-mascot");
    await expect(hero).toHaveCSS("animation-name", /hero-bob/);
    await expect(hero).toHaveCSS("animation-play-state", "running");
    await page.evaluate(() => {
      const state = window as typeof window & {
        __transitionRuns?: { property: string; target: string }[];
        __transitionRunObserverInstalled?: boolean;
      };
      state.__transitionRuns = [];
      if (state.__transitionRunObserverInstalled) return;
      document.addEventListener(
        "transitionrun",
        (event) => {
          const target = event.target;
          state.__transitionRuns?.push({
            property: event.propertyName,
            target: target instanceof Element ? target.getAttribute("class") ?? "" : "",
          });
        },
        true,
      );
      state.__transitionRunObserverInstalled = true;
    });

    const switchPalette = async (name: string, expectedBackground: string) => {
      await page.evaluate(() => {
        (window as typeof window & { __transitionRuns?: unknown[] }).__transitionRuns = [];
      });
      const swatch = page.getByRole("button", { name: `Theme: ${name}` });
      await swatch.click();
      await expect(swatch).toHaveAttribute("aria-pressed", "true");
      await expect.poll(() => page.locator("body").evaluate((body) => getComputedStyle(body).getPropertyValue("--bg").trim())).toBe(expectedBackground);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const transitions = await page.evaluate(
        () => (window as typeof window & { __transitionRuns?: { property: string; target: string }[] }).__transitionRuns ?? [],
      );
      expect(transitions).toEqual([]);
    };

    await switchPalette("Latte", "#eef1f5");
    await switchPalette("Frappe (soft dark)", "#303446");
    await switchPalette("Latte", "#eef1f5");
    await expect(hero).toHaveCSS("animation-name", /hero-bob/);
    await expect(hero).toHaveCSS("animation-play-state", "running");

    // Let the one-shot palette guard finish before driving ordinary local motion.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const row = page.locator(".ide-row").filter({ hasText: "about.md" }).first();
    await page.evaluate(() => {
      (window as typeof window & { __transitionRuns?: unknown[] }).__transitionRuns = [];
    });
    await row.hover();
    await expect.poll(() =>
      page.evaluate(() =>
        (window as typeof window & { __transitionRuns?: { property: string; target: string }[] }).__transitionRuns?.some(
          (transition) => transition.target.includes("ide-row") && transition.property === "transform",
        ),
      ),
    ).toBe(true);

    const button = page.locator(".btn").first();
    await button.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    const box = await button.boundingBox();
    if (!box) throw new Error("Expected an interactive button");
    await page.evaluate(() => {
      (window as typeof window & { __transitionRuns?: unknown[] }).__transitionRuns = [];
    });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(() =>
      page.evaluate(() =>
        (window as typeof window & { __transitionRuns?: { property: string; target: string }[] }).__transitionRuns?.some(
          (transition) => transition.target.includes("btn__front") && transition.property === "transform",
        ),
      ),
    ).toBe(true);
    await page.mouse.up();

    await page.reload();
    await expect(page.getByRole("button", { name: "Theme: Latte" })).toHaveAttribute("aria-pressed", "true");
  } finally {
    await context.close();
  }
});
