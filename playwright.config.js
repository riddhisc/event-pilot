import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5190',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    url: 'http://localhost:5190',
    command: 'npm run dev -- --port 5190',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
