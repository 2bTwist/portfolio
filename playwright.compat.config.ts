import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// Functional compatibility checks remain separate from Chromium perf budgets.
export default defineConfig({
  ...base,
  testMatch: "**/invariants/morph-image.spec.ts",
  reporter: "list",
  use: { ...base.use, launchOptions: { timeout: 20_000 } },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
