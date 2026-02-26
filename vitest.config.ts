import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const TEST_TIMEOUT_MS = 10_000; // Keeps unit and integration tests deterministic in CI.

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    testTimeout: TEST_TIMEOUT_MS,
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    exclude: ['**/tests/e2e/**', '**/node_modules/**'],
    restoreMocks: true,
    clearMocks: true,
    css: true
  }
});
