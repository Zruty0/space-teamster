import { cargoMassForClass, type CargoMassClass } from '../../../mission-cost';
import { BALOR_ORBITAL, BAM_EXTRACTION, BAM_FOUNDRY, SHADE, balorDispatchEndpoint, type BalorSurfaceSite } from '../balor-logistics';
import type { DahaiSurfaceSite } from '../dahai-sites';
import type { FactionContractCandidate, FactionContractContext } from './index';

export interface DahaiTradeLane {
  id: string;
  site: DahaiSurfaceSite;
  externalIds: readonly string[];
  direction: 'in' | 'out' | 'both';
  label: string;
  massClass: CargoMassClass;
  purpose: string;
  category?: 'freight' | 'passenger';
  issuerName?: string;
  likelihood?: number;
}
export type DahaiTradeIssuer = Pick<FactionContractCandidate, 'factionId' | 'factionName' | 'factionTag' | 'issuerId' | 'issuerName'>
  & Required<Pick<FactionContractCandidate, 'generosity' | 'compensationRatio' | 'maxCompAllowance'>>;

const BALOR_NAMES: Record<BalorSurfaceSite, string> = {
  [BAM_EXTRACTION]: 'BAM Extraction One', [BAM_FOUNDRY]: 'BAM Foundry One', [SHADE]: 'Shade',
};

/** Explicit additive lanes; seeded legacy actor rosters are left intact.
 * Both endpoints are quoted only after the planetary dispatch adapters run. */
export function dahaiTradeContracts(ctx: FactionContractContext, issuer: DahaiTradeIssuer, lanes: readonly DahaiTradeLane[]): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const lane of lanes) for (const external of lane.externalIds) {
    for (const direction of lane.direction === 'both' ? ['in', 'out'] as const : [lane.direction]) {
      const key = `${issuer.factionId}:${lane.id}:${lane.site}:${external}:${direction}`;
      const balorSite = ([BAM_EXTRACTION, BAM_FOUNDRY, SHADE] as readonly string[]).includes(external) ? external as BalorSurfaceSite : undefined;
      const other = balorSite ? balorDispatchEndpoint(balorSite, key, ctx.worldTime) : external;
      const sourceId = direction === 'out' ? lane.site : other;
      if (sourceId !== ctx.sourceId) continue;
      const issuerName = lane.issuerName ?? issuer.issuerName ?? issuer.factionName;
      out.push({
        ...issuer, issuerName,
        issuerId: issuer.issuerId ?? `${issuer.factionId}:${issuerName.toLowerCase().replace(/[^a-z]+/g, '-')}`,
        templateId: `dahai:${lane.id}:${lane.site}:${external}:${direction}`,
        dahaiDispatchKey: key, gaiaDispatchKey: key,
        sourceId, destinationId: direction === 'out' ? other : lane.site,
        category: lane.category ?? 'freight',
        cargo: { label: lane.label, massClass: lane.massClass, massTons: cargoMassForClass(lane.massClass, key) },
        likelihood: lane.likelihood ?? 0.6,
        details: [lane.purpose, balorSite ? `${direction === 'out' ? 'Receiving' : 'Originating'} Balor site: ${BALOR_NAMES[balorSite]}. ${other === BALOR_ORBITAL ? 'Balor Orbital consolidation; local transport arranged by the issuer.' : 'Direct Balor surface handling.'}` : undefined].filter(Boolean).join(' '),
      });
    }
  }
  return out;
}
