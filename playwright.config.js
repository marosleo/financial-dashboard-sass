const { defineConfig, devices } = require("@playwright/test");

const testPort = process.env.PLAYWRIGHT_TEST_PORT ?? "3002";
const baseURL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://localhost:${testPort}`;

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  globalTimeout: 10 * 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run dev --workspace @financial-dashboard/web -- --port ${testPort}`,
    url: `${baseURL}/login`,
    reuseExistingServer:
      process.env.PLAYWRIGHT_REUSE_SERVER === "true" || !process.env.CI,
    timeout: 120_000,
  },
});
