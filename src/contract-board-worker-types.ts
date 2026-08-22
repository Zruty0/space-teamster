import type { CareerContract } from './career-contracts';
import type { NunesInquirySnapshot } from './content/estella/faction-contracts/nunes-inquiries';

export interface ContractBoardWorkerRequest {
  requestId: number;
  sourceId: string;
  worldTime: number;
  nunesInquiries: NunesInquirySnapshot;
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
