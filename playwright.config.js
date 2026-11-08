import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npx --yes http-server . -p 4321 -c-1 --silent',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true,
    timeout: 60_000
  }
});
