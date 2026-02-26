import { defineConfig } from '@playwright/test';

const DEV_SERVER_PORT = 5173; // Matches Vite default for consistency.
const DEV_SERVER_URL = `http://127.0.0.1:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: DEV_SERVER_URL,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `pnpm dev --host 127.0.0.1 --port ${DEV_SERVER_PORT}`,
    url: DEV_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
