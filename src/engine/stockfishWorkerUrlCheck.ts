import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Validates that Vite can resolve the Stockfish worker asset URL import.
// Keep this import specifier in sync with the Stockfish worker import.
const STOCKFISH_PACKAGE_NAME = 'stockfish';
const STOCKFISH_PACKAGE_PREFIX = `${STOCKFISH_PACKAGE_NAME}/`;
const STOCKFISH_PACKAGE_JSON_IMPORT = `${STOCKFISH_PACKAGE_NAME}/package.json`;
const STOCKFISH_WORKER_URL_QUERY = '?url';
export const STOCKFISH_WORKER_URL_IMPORT =
  `stockfish/src/stockfish-17.1-lite-single-03e3232.js${STOCKFISH_WORKER_URL_QUERY}`;
const STOCKFISH_WORKER_ASSET_IMPORT = STOCKFISH_WORKER_URL_IMPORT.replace(
  STOCKFISH_WORKER_URL_QUERY,
  ''
);
const STOCKFISH_WORKER_ASSET_RELATIVE_PATH =
  STOCKFISH_WORKER_ASSET_IMPORT.startsWith(STOCKFISH_PACKAGE_PREFIX)
    ? STOCKFISH_WORKER_ASSET_IMPORT.slice(STOCKFISH_PACKAGE_PREFIX.length)
    : STOCKFISH_WORKER_ASSET_IMPORT;

const STOCKFISH_WORKER_URL_ERROR =
  `Stockfish worker URL could not be resolved for ${STOCKFISH_WORKER_URL_IMPORT}. ` +
  'Verify the stockfish dependency and update src/engine/stockfishWorker.ts if needed.';

export type ResolveId = (id: string) => Promise<{ id: string } | null>;
export type ResolveModule = (id: string) => string | null;
export type FileExists = (path: string) => Promise<boolean>;
export type ResolutionFallbacks = {
  resolveModule?: ResolveModule;
  fileExists?: FileExists;
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

async function defaultFileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveWithNode(
  id: string,
  resolveModule: ResolveModule,
  fileExists: FileExists
): Promise<{ id: string } | null> {
  const resolved = resolveModule(id);
  if (!resolved) {
    return null;
  }

  const resolvedPath = resolved.startsWith('file://')
    ? fileURLToPath(resolved)
    : resolved;
  if (!(await fileExists(resolvedPath))) {
    return null;
  }

  return { id: resolvedPath };
}

async function resolveWithPackageRoot(
  resolveModule: ResolveModule,
  fileExists: FileExists
): Promise<{ id: string } | null> {
  const resolvedPackageJson = resolveModule(STOCKFISH_PACKAGE_JSON_IMPORT);
  if (!resolvedPackageJson) {
    return null;
  }

  const resolvedPackagePath = resolvedPackageJson.startsWith('file://')
    ? fileURLToPath(resolvedPackageJson)
    : resolvedPackageJson;
  const candidate = join(
    dirname(resolvedPackagePath),
    STOCKFISH_WORKER_ASSET_RELATIVE_PATH
  );

  if (!(await fileExists(candidate))) {
    return null;
  }

  return { id: candidate };
}

export async function ensureStockfishWorkerUrlResolved(
  resolveId: ResolveId,
  fallbacks: ResolutionFallbacks = {}
): Promise<void> {
  const resolved =
    (await resolveId(STOCKFISH_WORKER_URL_IMPORT)) ??
    (await resolveId(STOCKFISH_WORKER_ASSET_IMPORT)) ??
    (await resolveWithNode(
      STOCKFISH_WORKER_ASSET_IMPORT,
      fallbacks.resolveModule ?? defaultResolveModule,
      fallbacks.fileExists ?? defaultFileExists
    )) ??
    (await resolveWithPackageRoot(
      fallbacks.resolveModule ?? defaultResolveModule,
      fallbacks.fileExists ?? defaultFileExists
    ));

  if (!resolved || !resolved.id) {
    throw new Error(STOCKFISH_WORKER_URL_ERROR);
  }
}
