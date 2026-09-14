import { defineConfig, devices } from "@playwright/test";

// Visual QA for child, parent, and admin surfaces. Starts the production
// server automatically; specs assert structure, labels, touch targets, and
// responsive layout — never game correctness (covered by unit tests).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Cap workers: 4 viewport projects against one local server + Mongo;
  // unbounded parallelism causes timeout flakes under load.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    // System Chrome by default: Playwright browser downloads fail on small
    // disks (ENOSPC). Set PLAYWRIGHT_CHROME_PATH for an explicit binary, or
    // PLAYWRIGHT_CHANNEL=chromium when Playwright browsers are installed.
    ...(process.env.PLAYWRIGHT_CHROME_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } }
      : { channel: (process.env.PLAYWRIGHT_CHANNEL as "chrome" | "chromium" | undefined) ?? "chrome" }),
  },
  webServer: {
    command: "npm start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    // All Chromium-based: the chrome channel is unsupported on WebKit, and
    // Playwright browser downloads are unavailable on small disks (ENOSPC).
    { name: "mobile-320", use: { ...devices["Pixel 7"], viewport: { width: 320, height: 568 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "tablet", use: { ...devices["Galaxy Tab S4"], viewport: { width: 800, height: 1280 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
});
