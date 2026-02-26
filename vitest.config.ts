import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const TEST_TIMEOUT_MS = 10_000; // Keeps unit and integration tests deterministic in CI.

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    testTimeout: TEST_TIMEOUT_MS,
    restoreMocks: true,
    clearMocks: true
  }
});
