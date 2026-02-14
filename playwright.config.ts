import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3001";
const HOST = process.env.HOST ?? "127.0.0.1";
const defaultBase = `http://${HOST}:${PORT}`;
const rawBase =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL;
let baseURL: string;
try {
  if (!rawBase) {
    baseURL = defaultBase;
  } else {
    // rawBase が絶対URLならそのまま使用、そうでなければ defaultBase を基に解決
    new URL(rawBase);
    baseURL = rawBase;
  }
} catch {
  baseURL = new URL(rawBase as string, defaultBase).toString();
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 3,
  timeout: 30000,
  reporter: [["html", { open: "never" }], ["list"], ["github"]],
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  use: {
    baseURL,
    trace: "on-first-retry",
    headless: true,
    actionTimeout: 15000,
  },
  webServer: {
    command: `npm run dev -- --hostname ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NEXT_PUBLIC_BASE_URL: baseURL,
      NEXT_PLW: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],
});
