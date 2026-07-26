import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate } from './index';

export type CompletionBlurb = (candidate: FactionContractCandidate, cargo: string, destination: string, issuer: string) => string;

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function destinationName(destinationId: string): string {
  return ESTELLA_NODES_BY_ID.get(destinationId)?.name ?? destinationId;
}

export function completionBlurbFrom(pool: CompletionBlurb[], candidate: FactionContractCandidate, worldTime: number): string {
  const generationDay = Math.floor(worldTime / 86_400);
  const index = hashString(`${candidate.factionId}:${candidate.templateId}:${candidate.sourceId}->${candidate.destinationId}:${candidate.cargo.label}:${generationDay}`) % pool.length;
  return pool[index](candidate, candidate.cargo.label, destinationName(candidate.destinationId), candidate.issuerName ?? candidate.factionName);
}
