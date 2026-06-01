import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 設定
 *
 * 執行方式（由 package.json test:e2e 統一啟動）：
 *   yarn test:e2e
 *
 * 流程：
 *   1. emulator:clean — 清理殘留 port
 *   2. firebase emulators:exec 啟動 emulator
 *   3. seed:emulator — 建立假資料
 *   4. dev:emulator:bg — 背景啟動 nuxt dev（port 7000）
 *   5. playwright test — 等 server ready 後測試
 */
export default defineConfig({
  testDir: "./specs",
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:3777",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-dev-shm-usage", "--no-sandbox"],
        },
      },
    },
  ],
  // webServer 由外層 test:e2e 腳本負責啟動，這裡只等待 ready
  webServer: {
    command: "dotenv -e .env.emulator -- nuxt dev --port 3777",
    url: "http://localhost:3777",
    cwd: "../..",
    // 不 reuse！避免碰到 macOS ControlCenter 或其他佔用 port 的進程
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
