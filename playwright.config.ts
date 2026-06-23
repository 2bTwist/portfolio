import { defineConfig, devices } from "@playwright/test";

// Perf e2e ALWAYS runs against a production build (grilled decision 5).
// Serial (workers:1) so measurements aren't contaminated by parallel load.
// Set BASE_URL to point at an already-running prod server (skips the built-in
// build+start) — e.g. BASE_URL=http://localhost:3100 pnpm e2e:perf.
const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["json", { outputFile: "perf-results/playwright.json" }]],
  use: {
    baseURL,
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
