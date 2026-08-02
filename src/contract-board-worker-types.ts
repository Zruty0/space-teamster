import type { CareerContract } from './career-contracts';

export interface ContractBoardWorkerRequest {
  requestId: number;
  sourceId: string;
  worldTime: number;
}

export interface PreparedContractBoards {
  sourceId: string;
  worldTime: number;
  freight: CareerContract[];
  passenger: CareerContract[];
}

export interface ContractBoardWorkerResponse {
  requestId: number;
  boards?: PreparedContractBoards;
  error?: string;
}
