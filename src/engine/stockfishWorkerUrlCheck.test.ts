import { describe, expect, it } from 'vitest';
import {
  resolveStockfishWorkerAssets,
  selectStockfishWorkerAssets
} from './stockfishWorkerUrlCheck';

const STOCKFISH_PACKAGE_JSON_IMPORT = 'stockfish/package.json';
const STOCKFISH_PACKAGE_ROOT = '/packages/stockfish';
const STOCKFISH_PACKAGE_JSON_PATH = `${STOCKFISH_PACKAGE_ROOT}/package.json`;
const STOCKFISH_ASSET_DIR = `${STOCKFISH_PACKAGE_ROOT}/src`;

describe('selectStockfishWorkerAssets', () => {
  it('prefers lite-single when available', () => {
    const selection = selectStockfishWorkerAssets(
      ['stockfish-17.1-lite.js', 'stockfish-17.1-lite-single.js'],
      ['stockfish-17.1-lite-single.wasm', 'stockfish-17.1-lite.wasm']
    );

    expect(selection?.baseName).toBe('stockfish-17.1-lite-single');
  });

  it('falls back to lite when lite-single is missing', () => {
    const selection = selectStockfishWorkerAssets(
      ['stockfish-17.1-lite.js'],
      ['stockfish-17.1-lite.wasm']
    );

    expect(selection?.baseName).toBe('stockfish-17.1-lite');
  });

  it('returns null when no matching wasm pair exists', () => {
    const selection = selectStockfishWorkerAssets(
      ['stockfish-17.1-lite.js'],
      ['stockfish-17.1.wasm']
    );

    expect(selection).toBeNull();
  });
});

describe('resolveStockfishWorkerAssets', () => {
  it('returns null when the package cannot be resolved', async () => {
    const resolved = await resolveStockfishWorkerAssets({
      resolveModule: () => null,
      listFiles: async () => []
    });

    expect(resolved).toBeNull();
  });

  it('builds full asset paths from the package root', async () => {
    const resolved = await resolveStockfishWorkerAssets({
      resolveModule: (id) => (id === STOCKFISH_PACKAGE_JSON_IMPORT
        ? STOCKFISH_PACKAGE_JSON_PATH
        : null),
      listFiles: async (path) => {
        if (path !== STOCKFISH_ASSET_DIR) {
          throw new Error(`Unexpected path: ${path}`);
        }
        return ['stockfish-17.1-lite-single.js', 'stockfish-17.1-lite-single.wasm'];
      }
    });

    expect(resolved).toEqual({
      baseName: 'stockfish-17.1-lite-single',
      scriptPath: `${STOCKFISH_ASSET_DIR}/stockfish-17.1-lite-single.js`,
      wasmPath: `${STOCKFISH_ASSET_DIR}/stockfish-17.1-lite-single.wasm`
    });
  });
});
