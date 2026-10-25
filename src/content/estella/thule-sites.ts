export const THULE = 'estella-xiii';
export const THULE_ANCHORAGE = 'estella-xiii-main-port';
export const COMMON_GROUND = 'estella-xiii-governors-outpost';
export const DEEPWELL = 'estella-xiii-deep-ice-mining';
export const FREEHOLD = 'estella-xiii-prison-exile-colony';
export const VOLYA = 'estella-xiii-long-range-observatory';
export const BELLEVUE = 'estella-xiii-classified-research';
export const THULE_SURFACE_SITES = [COMMON_GROUND, DEEPWELL, FREEHOLD, VOLYA, BELLEVUE] as const;
export const THULE_SITES = [THULE_ANCHORAGE, ...THULE_SURFACE_SITES] as const;

/** Retire incompatible NEW postings only. Keep legacy seeded pools untouched,
 * including their sampling keys; never call this on accepted flights/saves. */
export function retiredThuleLegacyOrder(c: {factionId: string; sourceId: string; destinationId: string}): boolean {
  return (c.factionId === 'house-nunes' && [c.sourceId,c.destinationId].some(id => (THULE_SITES as readonly string[]).includes(id)))
    || (c.factionId === 'daedalus-systems' && [c.sourceId,c.destinationId].includes(VOLYA));
}
