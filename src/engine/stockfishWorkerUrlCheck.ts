import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Validates that Vite can resolve the Stockfish worker asset URL import.
// Keep this import specifier in sync with the Stockfish worker import.
const STOCKFISH_WORKER_URL_QUERY = '?url';
export const STOCKFISH_WORKER_URL_IMPORT =
  `stockfish/src/stockfish-17.1-lite-single-03e3232.js${STOCKFISH_WORKER_URL_QUERY}`;
const STOCKFISH_WORKER_ASSET_IMPORT = STOCKFISH_WORKER_URL_IMPORT.replace(
  STOCKFISH_WORKER_URL_QUERY,
  ''
);

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
    return createRequire(import.meta.url).resolve(id);
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
    ));

  if (!resolved || !resolved.id) {
    throw new Error(STOCKFISH_WORKER_URL_ERROR);
  }
}
