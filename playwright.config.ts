import { defineConfig } from "@playwright/test";

const DEV_SERVER_HOST = "127.0.0.1";
const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: DEV_SERVER_URL
  },
  webServer: {
    command: `pnpm dev -- --host ${DEV_SERVER_HOST} --port ${DEV_SERVER_PORT}`,
    url: DEV_SERVER_URL,
    reuseExistingServer: !process.env.CI
  }
});
