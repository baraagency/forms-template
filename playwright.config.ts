import { defineConfig, devices } from "@playwright/test";

// Bun auto-loads .env for the `bun run dev` webServer below, but this config
// (and the Playwright test runner itself) runs under Node, which doesn't.
// Without this, ADMIN_PASSWORD (and similar) can be set for the app but
// invisible to the tests that need to know about it (e.g. to log in, or to
// skip admin-gated assertions), causing spurious failures instead of skips.
try {
  process.loadEnvFile();
} catch {
  // No .env file — nothing to load.
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "DEMO_MODE=true bun run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  outputDir: "test-results",
});
