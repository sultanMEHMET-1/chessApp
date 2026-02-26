import { defineConfig } from '@playwright/test';

const DEV_SERVER_HOST = '127.0.0.1';
const DEV_SERVER_PORT = 5173; // Matches the Vite default for consistency.
const DEV_SERVER_URL = `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`;

const TEST_TIMEOUT_MS = 30_000; // Keeps smoke tests deterministic in CI.
const EXPECT_TIMEOUT_MS = 5_000; // Short timeout for UI expectations.
const SERVER_TIMEOUT_MS = 60_000; // Gives the dev server time to boot.

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: TEST_TIMEOUT_MS,
  expect: {
    timeout: EXPECT_TIMEOUT_MS
  },
  use: {
    baseURL: DEV_SERVER_URL,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `pnpm dev --host ${DEV_SERVER_HOST} --port ${DEV_SERVER_PORT}`,
    url: DEV_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: SERVER_TIMEOUT_MS
  }
});
