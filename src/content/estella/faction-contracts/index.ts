import type { MissionCargoSpec } from '../../../mission-cost';
import { CERBERUS_HUMAN_RESOURCES_PROVIDER } from './cerberus-contracts';
import { NEW_CANAAN_MINERS_MUTUAL_PROVIDER } from './miners-mutual-contracts';

export interface FactionContractContext {
  sourceId: string;
  worldTime: number;
}

export interface FactionContractCandidate {
  factionId: string;
  factionName: string;
  factionTag: string;
  templateId: string;
  sourceId: string;
  destinationId: string;
  cargo: MissionCargoSpec;
  likelihood: number;
}

export interface FactionContractProvider {
  id: string;
  name: string;
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[];
}

export const ESTELLA_FACTION_CONTRACT_PROVIDERS: FactionContractProvider[] = [
  NEW_CANAAN_MINERS_MUTUAL_PROVIDER,
  CERBERUS_HUMAN_RESOURCES_PROVIDER,
];

export function generateFactionContractCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  return ESTELLA_FACTION_CONTRACT_PROVIDERS.flatMap(provider => provider.generateContracts(ctx));
}
