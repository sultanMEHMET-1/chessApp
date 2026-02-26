/**
 * Resolves Stockfish worker assets for Vite configuration and tests.
 */
import { access, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STOCKFISH_PACKAGE_NAME = 'stockfish';
const STOCKFISH_PACKAGE_ENTRY_IMPORT = STOCKFISH_PACKAGE_NAME;
const STOCKFISH_PACKAGE_JSON_IMPORT = `${STOCKFISH_PACKAGE_NAME}/package.json`;
const STOCKFISH_PACKAGE_JSON_NAME = 'package.json';
const NODE_MODULES_DIR_NAME = 'node_modules';
const STOCKFISH_ASSET_DIR_CANDIDATES = ['src', 'dist', ''];
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
  'Run pnpm install and verify the stockfish package provides JS and WASM assets under stockfish/src, stockfish/dist, or the package root.';

export type ResolveModule = (id: string) => string | null;
export type ListFiles = (path: string) => Promise<string[]>;
export type FileExists = (path: string) => Promise<boolean>;
export type ResolutionFallbacks = {
  resolveModule?: ResolveModule;
  listFiles?: ListFiles;
  fileExists?: FileExists;
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
    const projectRequire = createRequire(join(process.cwd(), 'package.json'));
    return projectRequire.resolve(id);
  } catch {
    // Fall through to import-meta resolution.
  }

  try {
    if (typeof import.meta.resolve === 'function') {
      return import.meta.resolve(id);
    }
  } catch {
    return null;
  }

  return null;
}

async function defaultListFiles(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

async function defaultFileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
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

async function findPackageRootFromEntry(
  entryPath: string,
  fileExists: FileExists
): Promise<string | null> {
  let current = dirname(entryPath);

  while (true) {
    const candidate = join(current, STOCKFISH_PACKAGE_JSON_NAME);
    if (await fileExists(candidate)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
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
  const fileExists = fallbacks.fileExists ?? defaultFileExists;

  let packageRoot: string | null = null;

  const resolvedPackageJson = resolveModule(STOCKFISH_PACKAGE_JSON_IMPORT);
  if (resolvedPackageJson) {
    packageRoot = dirname(normalizeResolvedPath(resolvedPackageJson));
  } else {
    const resolvedEntry = resolveModule(STOCKFISH_PACKAGE_ENTRY_IMPORT);
    if (resolvedEntry) {
      packageRoot = await findPackageRootFromEntry(
        normalizeResolvedPath(resolvedEntry),
        fileExists
      );
    }
  }

  if (!packageRoot) {
    const localPackageJson = join(
      process.cwd(),
      NODE_MODULES_DIR_NAME,
      STOCKFISH_PACKAGE_NAME,
      STOCKFISH_PACKAGE_JSON_NAME
    );
    if (await fileExists(localPackageJson)) {
      packageRoot = dirname(localPackageJson);
    }
  }

  if (!packageRoot) {
    return null;
  }

  for (const dir of STOCKFISH_ASSET_DIR_CANDIDATES) {
    const assetDir = dir ? join(packageRoot, dir) : packageRoot;
    let files: string[] = [];
    try {
      files = await listFiles(assetDir);
    } catch {
      continue;
    }

    const scriptFiles = files.filter((file) =>
      basename(file).endsWith(SCRIPT_EXTENSION)
    );
    const wasmFiles = files.filter((file) =>
      basename(file).endsWith(WASM_EXTENSION)
    );
    const selection = selectStockfishWorkerAssets(scriptFiles, wasmFiles);
    if (!selection) {
      continue;
    }

    return {
      baseName: selection.baseName,
      scriptPath: join(assetDir, selection.scriptName),
      wasmPath: join(assetDir, selection.wasmName)
    };
  }

  return null;
}
