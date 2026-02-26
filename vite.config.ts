import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { ensureStockfishWorkerUrlResolved } from './src/engine/stockfishWorkerUrlCheck';

const DEV_SERVER_PORT = 5173; // Vite default.

function stockfishWorkerUrlCheck(): Plugin {
  return {
    name: 'stockfish-worker-url-check',
    enforce: 'pre',
    async buildStart() {
      await ensureStockfishWorkerUrlResolved((id) => this.resolve(id));
    }
  };
}

export default defineConfig({
  plugins: [stockfishWorkerUrlCheck(), react()],
  server: {
    port: DEV_SERVER_PORT
  }
});
