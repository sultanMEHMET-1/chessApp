import { defineConfig, normalizePath, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import {
  type StockfishWorkerAssets,
  STOCKFISH_WORKER_ASSETS_ERROR,
  resolveStockfishWorkerAssets
} from './src/engine/stockfishWorkerUrlCheck';

const DEV_SERVER_PORT = 5173; // Vite default.
const VIRTUAL_STOCKFISH_ASSETS_ID = 'virtual:stockfish-assets';
const RESOLVED_VIRTUAL_STOCKFISH_ASSETS_ID = '\0virtual:stockfish-assets';

function buildStockfishAssetsModule(assets: StockfishWorkerAssets | null): string {
  const errorMessage = JSON.stringify(STOCKFISH_WORKER_ASSETS_ERROR);
  if (!assets) {
    return [
      `export const stockfishEngineScriptUrl = '';`,
      `export const stockfishEngineWasmUrl = '';`,
      'export const stockfishEngineAssetsAvailable = false;',
      `export const stockfishEngineAssetsError = ${errorMessage};`
    ].join('\n');
  }

  const scriptImport = `/@fs/${normalizePath(assets.scriptPath)}?url`;
  const wasmImport = `/@fs/${normalizePath(assets.wasmPath)}?url`;
  return [
    `import scriptUrl from '${scriptImport}';`,
    `import wasmUrl from '${wasmImport}';`,
    '',
    'export const stockfishEngineScriptUrl = scriptUrl;',
    'export const stockfishEngineWasmUrl = wasmUrl;',
    'export const stockfishEngineAssetsAvailable = true;',
    `export const stockfishEngineAssetsError = ${errorMessage};`
  ].join('\n');
}

function stockfishAssetsPlugin(): Plugin {
  let shouldThrow = true;
  let resolvedAssets: StockfishWorkerAssets | null = null;
  let resolutionAttempted = false;

  const loadAssets = async () => {
    if (resolutionAttempted) {
      return resolvedAssets;
    }
    resolutionAttempted = true;
    resolvedAssets = await resolveStockfishWorkerAssets();
    return resolvedAssets;
  };

  return {
    name: 'stockfish-assets',
    enforce: 'pre',
    configResolved(config) {
      shouldThrow = config.command === 'build';
    },
    async buildStart() {
      const assets = await loadAssets();
      if (!assets) {
        if (shouldThrow) {
          throw new Error(STOCKFISH_WORKER_ASSETS_ERROR);
        }
        this.warn(`${STOCKFISH_WORKER_ASSETS_ERROR} Skipping check for dev server startup.`);
      }
    },
    resolveId(id) {
      if (id === VIRTUAL_STOCKFISH_ASSETS_ID) {
        return RESOLVED_VIRTUAL_STOCKFISH_ASSETS_ID;
      }
      return null;
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_STOCKFISH_ASSETS_ID) {
        return null;
      }
      const assets = await loadAssets();
      return buildStockfishAssetsModule(assets);
    }
  };
}

export default defineConfig({
  plugins: [stockfishAssetsPlugin(), react()],
  server: {
    port: DEV_SERVER_PORT
  }
});
