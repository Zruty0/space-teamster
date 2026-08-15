import type { TeamsterCertificationId } from '../../../career-state';
import type { MissionCargoSpec } from '../../../mission-cost';
import { classifyMissionCargo } from '../../../cargo-handling';
import { BRUCKNER_FIELD_SERVICES_PROVIDER } from './bruckner-contracts';
import { CERBERUS_HUMAN_RESOURCES_PROVIDER } from './cerberus-contracts';
import { CINDERHOOK_REFINERS_PROVIDER } from './cinderhook-refiners-contracts';
import { KISARAGI_HARMONY_YARDS_PROVIDER } from './kisaragi-contracts';
import { KISARAGI_YARDS_ESTELLA_PROVIDER } from './kisaragi-estella-contracts';
import { GLITTERFIELD_MINERS_PROVIDER } from './glitterfield-miners-contracts';
import { HALLORAN_PROVIDER } from './halloran-contracts';
import { HARTWELL_MACHINERY_BROKERS_PROVIDER } from './hartwell-machinery-contracts';
import { HARTWELL_LABOR_EXCHANGE_PROVIDER } from './hartwell-labor-contracts';
import { HARTWELL_SHIPPING_COMPANIES_PROVIDER } from './hartwell-shipping-contracts';
import { NEW_CANAAN_MINERS_MUTUAL_PROVIDER } from './miners-mutual-contracts';
import { PIKE_MINERS_PROVIDER } from './pike-miners-contracts';
import { ROADSTEAD_EXPORT_BROKERS_PROVIDER } from './roadstead-export-contracts';
import { STEEL_COMBINE_PROVIDER } from './steel-combine-contracts';
import { TEAMSTERS_GUILD_PROVIDER } from './teamsters-guild-contracts';
import { VOSS_HEINKEL_METRICWERKE_PROVIDER } from './vhm-contracts';
import { WELLS_NOBLE_HOUSES_PROVIDER } from './wells-noble-contracts';

export interface FactionContractContext {
  sourceId: string;
  worldTime: number;
}

export interface FactionMissionIssuer {
  id: string;
  name: string;
  factionId: string;
  missionTags: string[];
}

export interface FactionContactContractContext extends FactionContractContext {
  issuer: FactionMissionIssuer;
  availableSourceIds: string[];
  progress: Readonly<Record<string, number>>;
}

export interface FactionContractCandidate {
  factionId: string;
  factionName: string;
  /** Short market identifier; omit for actors too small to appear on the system market. */
  factionTag?: string;
  templateId: string;
  sourceId: string;
  destinationId: string;
  /** Optional authored title; ordinary contracts derive a title from cargo and destination. */
  title?: string;
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
  /** Optional issuer identity overrides for named representatives and sub-committees. */
  issuerId?: string;
  issuerName?: string;
  /** Contract board grouping. Freight is the default; passenger and certification work use dedicated entry points. */
  category?: 'freight' | 'passenger' | 'certification';
  /** Certification recorded when this contract succeeds. */
  certificationOnSuccess?: TeamsterCertificationId;
  /** Tutorial certification work is highlighted separately from later endorsements. */
  tutorial?: boolean;
  /** Credential required to accept the visible posting. */
  requiredCertification?: TeamsterCertificationId;
  /** Non-flight passage supplied as part of a certification mission. */
  travelMode?: 'old-nell';
  /** Schedule the run when an orbiting destination is this far ahead of its surface source. */
  destinationLeadAngleFromSource?: number;
  /** Message shown on successful delivery. */
  completionMessage?: string;
}

export interface FactionContractProvider {
  id: string;
  name: string;
  /** Faction base pay multiplier; individual templates may override it per candidate. */
  generosity?: number;
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[];
  generateContactContracts?(ctx: FactionContactContractContext): FactionContractCandidate[];
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
  HARTWELL_SHIPPING_COMPANIES_PROVIDER,
  HARTWELL_LABOR_EXCHANGE_PROVIDER,
  WELLS_NOBLE_HOUSES_PROVIDER,
];

function withDefaultCompletion(candidate: FactionContractCandidate): FactionContractCandidate {
  const cargo = classifyMissionCargo(candidate.cargo);
  return {
    ...candidate,
    cargo,
    requiredCertification: candidate.requiredCertification ?? (cargo.fragile ? 'fragile-cargo' : undefined),
    completionMessage: candidate.completionMessage ?? `${candidate.issuerName ?? candidate.factionName} thanks you for successfully completing this contract.`,
  };
}

export function generateFactionContractCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  return ESTELLA_FACTION_CONTRACT_PROVIDERS.flatMap(provider => provider.generateContracts(ctx).map(withDefaultCompletion));
}

export function generateFactionContactContractCandidates(ctx: FactionContactContractContext): FactionContractCandidate[] {
  const provider = ESTELLA_FACTION_CONTRACT_PROVIDERS.find(candidate => candidate.id === ctx.issuer.factionId);
  return provider?.generateContactContracts?.(ctx).map(withDefaultCompletion) ?? [];
}
