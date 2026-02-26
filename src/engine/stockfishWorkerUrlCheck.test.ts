import { describe, expect, it } from 'vitest';
import {
  resolveStockfishWorkerAssets,
  selectStockfishWorkerAssets
} from './stockfishWorkerUrlCheck';

const STOCKFISH_PACKAGE_JSON_IMPORT = 'stockfish/package.json';
const STOCKFISH_PACKAGE_ENTRY_IMPORT = 'stockfish';
const STOCKFISH_PACKAGE_ROOT = '/packages/stockfish';
const STOCKFISH_PACKAGE_JSON_PATH = `${STOCKFISH_PACKAGE_ROOT}/package.json`;
const STOCKFISH_PACKAGE_ENTRY_PATH = `${STOCKFISH_PACKAGE_ROOT}/index.js`;
const STOCKFISH_ASSET_DIR_SRC = `${STOCKFISH_PACKAGE_ROOT}/src`;
const STOCKFISH_ASSET_DIR_DIST = `${STOCKFISH_PACKAGE_ROOT}/dist`;
const LOCAL_NODE_MODULES_ROOT = `${process.cwd()}/node_modules/stockfish`;
const LOCAL_NODE_MODULES_JSON = `${LOCAL_NODE_MODULES_ROOT}/package.json`;

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
      listFiles: async () => [],
      fileExists: async () => false
    });

    expect(resolved).toBeNull();
  });

  it('builds full asset paths from the package root', async () => {
    const resolved = await resolveStockfishWorkerAssets({
      resolveModule: (id) =>
        id === STOCKFISH_PACKAGE_JSON_IMPORT ? STOCKFISH_PACKAGE_JSON_PATH : null,
      listFiles: async (path) => {
        if (path !== STOCKFISH_ASSET_DIR_SRC) {
          throw new Error(`Unexpected path: ${path}`);
        }
        return ['stockfish-17.1-lite-single.js', 'stockfish-17.1-lite-single.wasm'];
      },
      fileExists: async () => true
    });

    expect(resolved).toEqual({
      baseName: 'stockfish-17.1-lite-single',
      scriptPath: `${STOCKFISH_ASSET_DIR_SRC}/stockfish-17.1-lite-single.js`,
      wasmPath: `${STOCKFISH_ASSET_DIR_SRC}/stockfish-17.1-lite-single.wasm`
    });
  });

  it('falls back to the package entry when package.json cannot be resolved', async () => {
    const resolvedIds: string[] = [];
    const resolved = await resolveStockfishWorkerAssets({
      resolveModule: (id) => {
        resolvedIds.push(id);
        if (id === STOCKFISH_PACKAGE_ENTRY_IMPORT) {
          return STOCKFISH_PACKAGE_ENTRY_PATH;
        }
        return null;
      },
      listFiles: async () => [
        'stockfish-17.1-lite-single.js',
        'stockfish-17.1-lite-single.wasm'
      ],
      fileExists: async (path) => path === STOCKFISH_PACKAGE_JSON_PATH
    });

    expect(resolvedIds).toEqual([
      STOCKFISH_PACKAGE_JSON_IMPORT,
      STOCKFISH_PACKAGE_ENTRY_IMPORT
    ]);
    expect(resolved?.scriptPath).toBe(
      `${STOCKFISH_ASSET_DIR_SRC}/stockfish-17.1-lite-single.js`
    );
  });

  it('checks fallback asset directories when src is missing', async () => {
    const queriedPaths: string[] = [];
    const resolved = await resolveStockfishWorkerAssets({
      resolveModule: (id) =>
        id === STOCKFISH_PACKAGE_JSON_IMPORT ? STOCKFISH_PACKAGE_JSON_PATH : null,
      listFiles: async (path) => {
        queriedPaths.push(path);
        if (path === STOCKFISH_ASSET_DIR_SRC) {
          throw new Error('missing src');
        }
        if (path === STOCKFISH_ASSET_DIR_DIST) {
          return ['stockfish-17.1-lite.js', 'stockfish-17.1-lite.wasm'];
        }
        return [];
      },
      fileExists: async () => true
    });

    expect(queriedPaths).toContain(STOCKFISH_ASSET_DIR_SRC);
    expect(queriedPaths).toContain(STOCKFISH_ASSET_DIR_DIST);
    expect(resolved?.scriptPath).toBe(
      `${STOCKFISH_ASSET_DIR_DIST}/stockfish-17.1-lite.js`
    );
  });

  it('uses a local node_modules fallback when resolution fails', async () => {
    const resolved = await resolveStockfishWorkerAssets({
      resolveModule: () => null,
      listFiles: async (path) => {
        if (path !== `${LOCAL_NODE_MODULES_ROOT}/src`) {
          throw new Error(`Unexpected path: ${path}`);
        }
        return ['stockfish-17.1-lite.js', 'stockfish-17.1-lite.wasm'];
      },
      fileExists: async (path) => path === LOCAL_NODE_MODULES_JSON
    });

    expect(resolved).toEqual({
      baseName: 'stockfish-17.1-lite',
      scriptPath: `${LOCAL_NODE_MODULES_ROOT}/src/stockfish-17.1-lite.js`,
      wasmPath: `${LOCAL_NODE_MODULES_ROOT}/src/stockfish-17.1-lite.wasm`
    });
  });
});
