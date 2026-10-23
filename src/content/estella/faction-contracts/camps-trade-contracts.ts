import { cargoMassForClass, type CargoMassClass } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext } from './index';

export interface CampsTradeLane {
  id: string;
  from: string;
  to: readonly string[];
  label: string;
  massClass: CargoMassClass;
  purpose: string;
  both?: boolean;
  category?: 'freight' | 'passenger';
  issuerName?: string;
  likelihood?: number;
}
export type CampsTradeIssuer = Pick<FactionContractCandidate, 'factionId' | 'factionName' | 'factionTag' | 'issuerId' | 'issuerName'>
  & Required<Pick<FactionContractCandidate, 'generosity' | 'compensationRatio' | 'maxCompAllowance'>>;

/** Authored additions outside legacy seeded pools. Endpoints remain operational
 * sites until the shared planetary dispatch pipeline runs, before quoting. */
export function campsTradeContracts(ctx: FactionContractContext, issuer: CampsTradeIssuer, lanes: readonly CampsTradeLane[]): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const lane of lanes) for (const other of lane.to) for (const reverse of lane.both ? [false, true] : [false]) {
    const sourceId = reverse ? other : lane.from, destinationId = reverse ? lane.from : other;
    if (sourceId !== ctx.sourceId || sourceId === destinationId) continue;
    const templateId = `camps:${lane.id}:${lane.from}:${other}:${reverse ? 'return' : 'out'}`;
    const key = `${issuer.factionId}:${issuer.issuerId ?? issuer.factionName}:${templateId}`;
    const issuerName = lane.issuerName ?? issuer.issuerName ?? issuer.factionName;
    out.push({
      ...issuer, issuerName, issuerId: issuer.issuerId ?? `${issuer.factionId}:${issuerName.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      templateId, sourceId, destinationId, campsDispatchKey: key, gaiaDispatchKey: key, dahaiDispatchKey: key,
      cargo: { label: lane.label, massClass: lane.massClass, massTons: cargoMassForClass(lane.massClass, key) },
      category: lane.category ?? 'freight', likelihood: lane.likelihood ?? 0.6, details: lane.purpose,
    });
  }
  return out;
}
