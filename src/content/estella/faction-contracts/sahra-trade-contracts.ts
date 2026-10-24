import { cargoMassForClass } from '../../../mission-cost';
import type { CampsTradeLane, CampsTradeIssuer } from './camps-trade-contracts';
import type { FactionContractCandidate, FactionContractContext } from './index';

export interface SahraTradeLane extends CampsTradeLane {
  /** Explicit packaged mass for small gem lots or compact outpost stores. */
  massTons?: number;
  /** Civilian fixed-pay override, independent of manifest mass. */
  generosity?: number;
  /** Available one paired dispatch epoch in this many, not a forced board slot. */
  everyPairs?: number;
}
function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Separate authored programme; never insert into established seeded pools. */
export function sahraTradeContracts(ctx: FactionContractContext, issuer: CampsTradeIssuer, lanes: readonly SahraTradeLane[]): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const lane of lanes) for (const other of lane.to) for (const reverse of lane.both ? [false, true] : [false]) {
    const sourceId = reverse ? other : lane.from, destinationId = reverse ? lane.from : other;
    if (sourceId !== ctx.sourceId || sourceId === destinationId) continue;
    const templateId = `sahra:${lane.id}:${lane.from}:${other}:${reverse ? 'return' : 'out'}`;
    const key = `${issuer.factionId}:${issuer.issuerId ?? issuer.factionName}:${templateId}`;
    const period = lane.everyPairs ?? 1;
    // Whole adjacent-day pairs preserve each world's exact 50/50 dispatch even
    // for occasional auctions/observer rotations. No extra RNG/state or saves.
    if ((Math.floor(ctx.worldTime / 172800) + hash(`${key}:schedule`)) % period !== 0) continue;
    const issuerName = lane.issuerName ?? issuer.issuerName ?? issuer.factionName;
    out.push({
      ...issuer, issuerName, issuerId: issuer.issuerId ?? `${issuer.factionId}:${issuerName.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      templateId, sourceId, destinationId,
      sahraDispatchKey: key, campsDispatchKey: key, gaiaDispatchKey: key, dahaiDispatchKey: key,
      cargo: { label: lane.label, massClass: lane.massClass, massTons: lane.massTons ?? cargoMassForClass(lane.massClass, key) },
      category: lane.category ?? 'freight', likelihood: lane.likelihood ?? 0.6, details: lane.purpose,
    });
  }
  return out;
}
