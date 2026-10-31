import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 40000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "python3 scripts/test-pocketbase.py",
      url: "http://127.0.0.1:3101/api/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm run dev -- --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        POCKETBASE_URL: "http://127.0.0.1:3101",
        AUTH_APP_ORIGIN: "http://127.0.0.1:3100",
        AUTH_REGISTRATION_ENABLED: "true",
        NEXT_DIST_DIR: ".next-test",
      },
    },
  ],
});
