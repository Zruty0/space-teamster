import { cargoMassForClass, type CargoMassClass } from '../../../mission-cost';
import { BALOR_ORBITAL, BAM_EXTRACTION, BAM_FOUNDRY, SHADE, balorDispatchEndpoint, type BalorSurfaceSite } from '../balor-logistics';
import type { FactionContractCandidate, FactionContractContext } from './index';

export interface BalorTradeLane {
  id: string;
  surface: BalorSurfaceSite;
  externalId: string;
  direction: 'in' | 'out';
  label: string;
  massClass: CargoMassClass;
  likelihood: number;
  /** Operational scope only; bespoke narrative receipts require separate review. */
  purpose: string;
}
export type BalorTradeIssuer = Pick<FactionContractCandidate, 'factionId' | 'factionName' | 'factionTag' | 'issuerId' | 'issuerName'>
  & Required<Pick<FactionContractCandidate, 'generosity' | 'compensationRatio' | 'maxCompAllowance'>>;
const SITE_NAMES: Record<BalorSurfaceSite, string> = {
  [BAM_EXTRACTION]: 'BAM Extraction One', [BAM_FOUNDRY]: 'BAM Foundry One', [SHADE]: 'Shade',
};

/** Additive lanes, kept outside actors' seeded general-purpose destination pools.
 * One logical consignment/day, stable cargo mass, balanced gateway dispatches.
 * Skim-specific work bypasses this helper and remains orbital-only.
 */
export function balorTradeContracts(ctx: FactionContractContext, issuer: BalorTradeIssuer, lanes: readonly BalorTradeLane[]): FactionContractCandidate[] {
  return lanes.flatMap(lane => {
    const templateId = `balor-trade:${lane.id}:${lane.externalId}:${lane.label}`;
    const key = `${issuer.factionId}:${issuer.factionName}:${templateId}`;
    const endpoint = balorDispatchEndpoint(lane.surface, key, ctx.worldTime);
    const sourceId = lane.direction === 'in' ? lane.externalId : endpoint;
    if (ctx.sourceId !== sourceId) return [];
    const destinationId = lane.direction === 'in' ? endpoint : lane.externalId;
    return [{
      ...issuer, templateId, sourceId, destinationId, category: 'freight' as const,
      cargo: { label: lane.label, massClass: lane.massClass, massTons: cargoMassForClass(lane.massClass, key) },
      likelihood: lane.likelihood, flatReward: 0,
      details: `${lane.purpose} ${lane.direction === 'in' ? 'Receiving' : 'Originating'} site: ${SITE_NAMES[lane.surface]}. ${endpoint === BALOR_ORBITAL ? 'Balor Orbital consolidation; local transport arranged by the contracting office.' : 'Direct surface handling.'}`,
      // The shared registry supplies its existing neutral receipt. Do not use a
      // provider's unrelated freight/labor narrative on these new contracts.
    }];
  });
}
