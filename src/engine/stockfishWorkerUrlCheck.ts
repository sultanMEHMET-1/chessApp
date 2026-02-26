/**
 * Resolves Stockfish worker assets for Vite configuration and tests.
 */
import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STOCKFISH_PACKAGE_NAME = 'stockfish';
const STOCKFISH_PACKAGE_JSON_IMPORT = `${STOCKFISH_PACKAGE_NAME}/package.json`;
const STOCKFISH_ASSET_DIR_NAME = 'src';
const SCRIPT_EXTENSION = '.js';
const WASM_EXTENSION = '.wasm';
const DEFAULT_VARIANT_TOKEN = '';
const STOCKFISH_VARIANT_PREFERENCES = [
  { label: 'lite-single', token: 'lite-single' },
  { label: 'lite', token: 'lite' },
  { label: 'default', token: DEFAULT_VARIANT_TOKEN }
];

export const STOCKFISH_WORKER_ASSETS_ERROR =
  'Stockfish worker assets could not be resolved. ' +
  'Run pnpm install and verify the stockfish package provides JS and WASM assets under stockfish/src.';

export type ResolveModule = (id: string) => string | null;
export type ListFiles = (path: string) => Promise<string[]>;
export type ResolutionFallbacks = {
  resolveModule?: ResolveModule;
  listFiles?: ListFiles;
};

export type StockfishWorkerAssetSelection = {
  baseName: string;
  scriptName: string;
  wasmName: string;
};

export type StockfishWorkerAssets = {
  baseName: string;
  scriptPath: string;
  wasmPath: string;
};

function defaultResolveModule(id: string): string | null {
  try {
    if (typeof import.meta.resolve === 'function') {
      return import.meta.resolve(id);
    }
  } catch {
    // Fall through to require-based resolution.
  }

  try {
    const projectRequire = createRequire(join(process.cwd(), 'package.json'));
    return projectRequire.resolve(id);
  } catch {
    return null;
  }
}

async function defaultListFiles(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

function normalizeResolvedPath(resolved: string): string {
  return resolved.startsWith('file://') ? fileURLToPath(resolved) : resolved;
}

function stripExtension(fileName: string, extension: string): string | null {
  if (!fileName.endsWith(extension)) {
    return null;
  }
  return fileName.slice(0, fileName.length - extension.length);
}

function buildBaseMap(files: string[], extension: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of files) {
    const name = basename(file);
    const base = stripExtension(name, extension);
    if (!base) {
      continue;
    }
    map.set(base, name);
  }
  return map;
}

export function selectStockfishWorkerAssets(
  scriptFiles: string[],
  wasmFiles: string[]
): StockfishWorkerAssetSelection | null {
  const scriptMap = buildBaseMap(scriptFiles, SCRIPT_EXTENSION);
  const wasmMap = buildBaseMap(wasmFiles, WASM_EXTENSION);
  const candidateBases = [...scriptMap.keys()].filter((base) => wasmMap.has(base));

  if (candidateBases.length === 0) {
    return null;
  }

  const sortedBases = [...candidateBases].sort();
  for (const preference of STOCKFISH_VARIANT_PREFERENCES) {
    const match =
      preference.token === DEFAULT_VARIANT_TOKEN
        ? sortedBases[0]
        : sortedBases.find((base) => base.includes(preference.token));
    if (match) {
      return {
        baseName: match,
        scriptName: scriptMap.get(match) ?? `${match}${SCRIPT_EXTENSION}`,
        wasmName: wasmMap.get(match) ?? `${match}${WASM_EXTENSION}`
      };
    }
  }

  return null;
}

export async function resolveStockfishWorkerAssets(
  fallbacks: ResolutionFallbacks = {}
): Promise<StockfishWorkerAssets | null> {
  const resolveModule = fallbacks.resolveModule ?? defaultResolveModule;
  const listFiles = fallbacks.listFiles ?? defaultListFiles;

  const resolvedPackageJson = resolveModule(STOCKFISH_PACKAGE_JSON_IMPORT);
  if (!resolvedPackageJson) {
    return null;
  }

  const packageJsonPath = normalizeResolvedPath(resolvedPackageJson);
  const packageRoot = dirname(packageJsonPath);
  const assetDir = join(packageRoot, STOCKFISH_ASSET_DIR_NAME);

  let files: string[] = [];
  try {
    files = await listFiles(assetDir);
  } catch {
    return null;
  }

  const scriptFiles = files.filter((file) => basename(file).endsWith(SCRIPT_EXTENSION));
  const wasmFiles = files.filter((file) => basename(file).endsWith(WASM_EXTENSION));
  const selection = selectStockfishWorkerAssets(scriptFiles, wasmFiles);
  if (!selection) {
    return null;
  }

  return {
    baseName: selection.baseName,
    scriptPath: join(assetDir, selection.scriptName),
    wasmPath: join(assetDir, selection.wasmName)
  };
}
