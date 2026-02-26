// Validates that Vite can resolve the Stockfish worker asset URL import.
// Keep this import specifier in sync with the Stockfish worker import.
export const STOCKFISH_WORKER_URL_IMPORT =
  'stockfish/src/stockfish-17.1-lite-single-03e3232.js?url';

const STOCKFISH_WORKER_URL_ERROR =
  `Stockfish worker URL could not be resolved for ${STOCKFISH_WORKER_URL_IMPORT}. ` +
  'Verify the stockfish dependency and update src/engine/stockfishWorker.ts if needed.';

export type ResolveId = (id: string) => Promise<{ id: string } | null>;

export async function ensureStockfishWorkerUrlResolved(
  resolveId: ResolveId
): Promise<void> {
  const resolved = await resolveId(STOCKFISH_WORKER_URL_IMPORT);

  if (!resolved || !resolved.id) {
    throw new Error(STOCKFISH_WORKER_URL_ERROR);
  }
}
