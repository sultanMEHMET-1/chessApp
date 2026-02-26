import { describe, expect, it } from 'vitest';
import {
  STOCKFISH_WORKER_URL_IMPORT,
  ensureStockfishWorkerUrlResolved
} from './stockfishWorkerUrlCheck';

const RESOLVED_ID = '/assets/stockfish-worker.js';

describe('ensureStockfishWorkerUrlResolved', () => {
  it('uses the Stockfish worker URL import specifier', async () => {
    let receivedId = '';
    const resolveId = async (id: string) => {
      receivedId = id;
      return { id: RESOLVED_ID };
    };

    await ensureStockfishWorkerUrlResolved(resolveId);

    expect(receivedId).toBe(STOCKFISH_WORKER_URL_IMPORT);
  });

  it('throws when the worker URL cannot be resolved', async () => {
    const resolveId = async () => null;

    await expect(ensureStockfishWorkerUrlResolved(resolveId)).rejects.toThrow(
      /Stockfish worker URL could not be resolved/
    );
  });
});
