import type { MissionCargoSpec } from '../../../mission-cost';
import { BRUCKNER_FIELD_SERVICES_PROVIDER } from './bruckner-contracts';
import { CERBERUS_HUMAN_RESOURCES_PROVIDER } from './cerberus-contracts';
import { KISARAGI_HARMONY_YARDS_PROVIDER } from './kisaragi-contracts';
import { KISARAGI_YARDS_ESTELLA_PROVIDER } from './kisaragi-estella-contracts';
import { NEW_CANAAN_MINERS_MUTUAL_PROVIDER } from './miners-mutual-contracts';
import { VOSS_HEINKEL_METRICWERKE_PROVIDER } from './vhm-contracts';

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
  BRUCKNER_FIELD_SERVICES_PROVIDER,
  VOSS_HEINKEL_METRICWERKE_PROVIDER,
  KISARAGI_YARDS_ESTELLA_PROVIDER,
  KISARAGI_HARMONY_YARDS_PROVIDER,
];

export function generateFactionContractCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  return ESTELLA_FACTION_CONTRACT_PROVIDERS.flatMap(provider => provider.generateContracts(ctx));
}
