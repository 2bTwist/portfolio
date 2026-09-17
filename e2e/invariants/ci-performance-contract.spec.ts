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
