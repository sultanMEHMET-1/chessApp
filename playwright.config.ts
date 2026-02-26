import { defineConfig } from "@playwright/test";

const DEV_SERVER_PORT = 5173; // Vite dev server default port keeps local runs predictable.
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: DEV_SERVER_URL
  },
  webServer: {
    command: `pnpm dev -- --host 127.0.0.1 --port ${DEV_SERVER_PORT}`,
    url: DEV_SERVER_URL,
    reuseExistingServer: !process.env.CI
  }
});
