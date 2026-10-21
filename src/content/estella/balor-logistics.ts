export const BALOR_ORBITAL = 'estella-i-transit-customs';
export const BAM_EXTRACTION = 'estella-i-refractory-mine';
export const BAM_FOUNDRY = 'estella-i-hot-processing';
export const SHADE = 'estella-i-worker-hab';
export const BALOR_TRADE_SITES = [BALOR_ORBITAL, BAM_EXTRACTION, BAM_FOUNDRY, SHADE] as const;
export type BalorSurfaceSite = typeof BAM_EXTRACTION | typeof BAM_FOUNDRY | typeof SHADE;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return h >>> 0;
}

/** One posting per logical consignment, not competing direct/hub duplicates.
 * Each two-day dispatch pair assigns one day to each endpoint. Pair-specific
 * mixing prevents every lane from switching in lockstep; repeated queries and
 * retries at the same posting epoch agree. Balances dispatches, not player
 * deliveries or the capped board's sampling across unrelated providers.
 */
export function balorDispatchEndpoint(surface: BalorSurfaceSite, routeKey: string, worldTime: number): string {
  const day = Math.floor(worldTime / 86400);
  const firstUsesHub = (hash(`${routeKey}:${Math.floor(day / 2)}`) & 1) === 0;
  const usesHub = (day & 1) === 0 ? firstUsesHub : !firstUsesHub;
  return usesHub ? BALOR_ORBITAL : surface;
}
