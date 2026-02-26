import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { ensureStockfishWorkerUrlResolved } from './src/engine/stockfishWorkerUrlCheck';

const DEV_SERVER_PORT = 5173; // Vite default.

function stockfishWorkerUrlCheck(): Plugin {
  let shouldThrow = true;

  return {
    name: 'stockfish-worker-url-check',
    enforce: 'pre',
    configResolved(config) {
      shouldThrow = config.command === 'build';
    },
    async buildStart() {
      try {
        await ensureStockfishWorkerUrlResolved((id) => this.resolve(id));
      } catch (error) {
        if (shouldThrow) {
          throw error;
        }

        const message =
          error instanceof Error ? error.message : String(error);
        this.warn(`${message} Skipping check for dev server startup.`);
      }
    }
  };
}

export default defineConfig({
  plugins: [stockfishWorkerUrlCheck(), react()],
  server: {
    port: DEV_SERVER_PORT
  }
});
