import type { MissionCargoSpec } from '../../../mission-cost';
import { BRUCKNER_FIELD_SERVICES_PROVIDER } from './bruckner-contracts';
import { CERBERUS_HUMAN_RESOURCES_PROVIDER } from './cerberus-contracts';
import { CINDERHOOK_REFINERS_PROVIDER } from './cinderhook-refiners-contracts';
import { KISARAGI_HARMONY_YARDS_PROVIDER } from './kisaragi-contracts';
import { KISARAGI_YARDS_ESTELLA_PROVIDER } from './kisaragi-estella-contracts';
import { GLITTERFIELD_MINERS_PROVIDER } from './glitterfield-miners-contracts';
import { HALLORAN_PROVIDER } from './halloran-contracts';
import { HARTWELL_MACHINERY_BROKERS_PROVIDER } from './hartwell-machinery-contracts';
import { HARTWELL_LABOR_EXCHANGE_PROVIDER } from './hartwell-labor-contracts';
import { NEW_CANAAN_MINERS_MUTUAL_PROVIDER } from './miners-mutual-contracts';
import { PIKE_MINERS_PROVIDER } from './pike-miners-contracts';
import { ROADSTEAD_EXPORT_BROKERS_PROVIDER } from './roadstead-export-contracts';
import { STEEL_COMBINE_PROVIDER } from './steel-combine-contracts';
import { TEAMSTERS_GUILD_PROVIDER } from './teamsters-guild-contracts';
import { VOSS_HEINKEL_METRICWERKE_PROVIDER } from './vhm-contracts';

export interface FactionContractContext {
  sourceId: string;
  worldTime: number;
}

export interface FactionContractCandidate {
  factionId: string;
  factionName: string;
  /** Short market identifier; omit for actors too small to appear on the system market. */
  factionTag?: string;
  templateId: string;
  sourceId: string;
  destinationId: string;
  cargo: MissionCargoSpec;
  likelihood: number;
  /**
   * Pay dials for this contract, all optional; unset dials fall back to mission-cost
   * defaults (generosity 1.25, no flat reward, no fuel compensation).
   * generosity scales the reward with route difficulty; flatReward is a flat floor;
   * compensationRatio/maxCompAllowance reimburse actual fuel up to a cap (the Combine's
   * no-loss model).
   */
  generosity?: number;
  flatReward?: number;
  compensationRatio?: number;
  maxCompAllowance?: number;
  /** Optional issuer-name override (e.g. a sub-committee under the same faction tag). */
  issuerName?: string;
  /** Contract board grouping. Freight is the default; passenger contracts live on their own BBS page. */
  category?: 'freight' | 'passenger';
  /** Message shown on successful delivery. */
  completionMessage?: string;
}

export interface FactionContractProvider {
  id: string;
  name: string;
  /** Faction base pay multiplier; individual templates may override it per candidate. */
  generosity?: number;
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[];
}

export const ESTELLA_FACTION_CONTRACT_PROVIDERS: FactionContractProvider[] = [
  NEW_CANAAN_MINERS_MUTUAL_PROVIDER,
  CERBERUS_HUMAN_RESOURCES_PROVIDER,
  BRUCKNER_FIELD_SERVICES_PROVIDER,
  VOSS_HEINKEL_METRICWERKE_PROVIDER,
  KISARAGI_YARDS_ESTELLA_PROVIDER,
  KISARAGI_HARMONY_YARDS_PROVIDER,
  TEAMSTERS_GUILD_PROVIDER,
  STEEL_COMBINE_PROVIDER,
  HALLORAN_PROVIDER,
  GLITTERFIELD_MINERS_PROVIDER,
  PIKE_MINERS_PROVIDER,
  CINDERHOOK_REFINERS_PROVIDER,
  ROADSTEAD_EXPORT_BROKERS_PROVIDER,
  HARTWELL_MACHINERY_BROKERS_PROVIDER,
  HARTWELL_LABOR_EXCHANGE_PROVIDER,
];

export function generateFactionContractCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  return ESTELLA_FACTION_CONTRACT_PROVIDERS.flatMap(provider => provider.generateContracts(ctx).map(candidate => ({
    ...candidate,
    completionMessage: candidate.completionMessage ?? `${candidate.issuerName ?? candidate.factionName} thanks you for successfully completing this contract.`,
  })));
}
