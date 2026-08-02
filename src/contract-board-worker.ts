import { generateCareerContracts, generatePassengerContracts } from './career-contracts';
import type { ContractBoardWorkerRequest, ContractBoardWorkerResponse } from './contract-board-worker-types';

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ContractBoardWorkerRequest>) => void) | null;
  postMessage(message: ContractBoardWorkerResponse): void;
};

workerScope.onmessage = (event): void => {
  const { requestId, sourceId, worldTime } = event.data;
  try {
    // Keep both boards in one worker so shared transfer-window calculations are reused.
    const freight = generateCareerContracts(sourceId, worldTime);
    const passenger = generatePassengerContracts(sourceId, worldTime);
    workerScope.postMessage({
      requestId,
      boards: { sourceId, worldTime, freight, passenger },
    });
  } catch (error) {
    workerScope.postMessage({
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
