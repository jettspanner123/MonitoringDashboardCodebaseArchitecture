import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './Tests',
  fullyParallel: true,
  // Explicit, rather than Playwright's own default - makes sure a hung test
  // (e.g. a genuinely dead environment) can never serialize the whole run
  // down to one worker and block every other page's test from starting.
  workers: 4,
  reporter: 'html',
  timeout: 180000,
  globalSetup: require.resolve('./GlobalAuthenticationSetup'),
  use: {
    storageState: 'auth.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 60000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
