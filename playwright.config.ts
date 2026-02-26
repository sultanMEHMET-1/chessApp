import { defineConfig } from '@playwright/test';

const TEST_DIRECTORY = 'e2e';

export default defineConfig({
  testDir: TEST_DIRECTORY
});
