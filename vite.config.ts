import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { ensureStockfishWorkerUrlResolved } from './src/engine/stockfishWorkerUrlCheck';

const DEV_SERVER_PORT = 5173; // Vite default.
const STOCKFISH_PACKAGE_JSON_IMPORT = 'stockfish/package.json';
const STOCKFISH_ALIAS_PATTERN = /^stockfish\//;

const projectRequire = createRequire(import.meta.url);
let stockfishPackageRoot: string | null = null;
try {
  stockfishPackageRoot = dirname(
    projectRequire.resolve(STOCKFISH_PACKAGE_JSON_IMPORT)
  );
} catch {
  stockfishPackageRoot = null;
}

const stockfishAlias = stockfishPackageRoot
  ? [
      {
        find: STOCKFISH_ALIAS_PATTERN,
        replacement: `${stockfishPackageRoot}/`
      }
    ]
  : [];

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
  resolve: {
    alias: stockfishAlias
  },
  server: {
    port: DEV_SERVER_PORT
  }
});
