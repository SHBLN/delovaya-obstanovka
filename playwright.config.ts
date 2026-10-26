import { defineConfig, devices } from '@playwright/test'

// На машинах, где не установлен Chromium от Playwright, можно запустить в Edge/Chrome:
//   PW_CHANNEL=msedge npx playwright test --project=catalog
const channel = process.env.PW_CHANNEL || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium-auth',
      testMatch: /e2e\/auth\/.+\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
      use: { ...devices['Desktop Chrome'], channel },
    },
    {
      name: 'catalog',
      testMatch: /e2e\/catalog\/.+\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel },
    },
    {
      name: 'chromium',
      testIgnore: [/e2e\/auth\//, /e2e\/catalog\//],
      use: { ...devices['Desktop Chrome'], channel },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
