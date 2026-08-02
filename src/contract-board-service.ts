import type { ContractBoardWorkerRequest, ContractBoardWorkerResponse, PreparedContractBoards } from './contract-board-worker-types';

const BOARD_CACHE_LIMIT = 12;
const cache = new Map<string, PreparedContractBoards>();
const pendingByKey = new Map<string, Promise<PreparedContractBoards>>();
const pendingById = new Map<number, {
  key: string;
  resolve: (boards: PreparedContractBoards) => void;
  reject: (error: Error) => void;
}>();

let worker: Worker | undefined;
let nextRequestId = 1;

function boardKey(sourceId: string, worldTime: number): string {
  return `${sourceId}@${worldTime}`;
}

function cacheBoards(key: string, boards: PreparedContractBoards): void {
  if (cache.has(key)) cache.delete(key);
  while (cache.size >= BOARD_CACHE_LIMIT) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  cache.set(key, boards);
}

function rejectPending(error: Error): void {
  for (const pending of pendingById.values()) pending.reject(error);
  pendingById.clear();
  pendingByKey.clear();
}

function contractWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./contract-board-worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<ContractBoardWorkerResponse>): void => {
    const response = event.data;
    const pending = pendingById.get(response.requestId);
    if (!pending) return;
    pendingById.delete(response.requestId);
    pendingByKey.delete(pending.key);
    if (!response.boards) {
      pending.reject(new Error(response.error ?? 'Contract board generation failed.'));
      return;
    }
    cacheBoards(pending.key, response.boards);
    pending.resolve(response.boards);
  };
  worker.onerror = (event): void => {
    const message = event.message || 'Contract board worker failed.';
    worker?.terminate();
    worker = undefined;
    rejectPending(new Error(message));
  };
  return worker;
}

export function preparedContractBoards(sourceId: string, worldTime: number): PreparedContractBoards | undefined {
  return cache.get(boardKey(sourceId, worldTime));
}

export function prepareContractBoards(sourceId: string, worldTime: number): Promise<PreparedContractBoards> {
  const key = boardKey(sourceId, worldTime);
  const ready = cache.get(key);
  if (ready) return Promise.resolve(ready);
  const pending = pendingByKey.get(key);
  if (pending) return pending;

  const requestId = nextRequestId++;
  let resolveRequest!: (boards: PreparedContractBoards) => void;
  let rejectRequest!: (error: Error) => void;
  const promise = new Promise<PreparedContractBoards>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });
  pendingById.set(requestId, { key, resolve: resolveRequest, reject: rejectRequest });
  pendingByKey.set(key, promise);
  try {
    const request: ContractBoardWorkerRequest = { requestId, sourceId, worldTime };
    contractWorker().postMessage(request);
  } catch (error) {
    pendingById.delete(requestId);
    pendingByKey.delete(key);
    rejectRequest(error instanceof Error ? error : new Error(String(error)));
  }
  return promise;
}
