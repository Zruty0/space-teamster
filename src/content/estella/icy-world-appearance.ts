import { icyWorldProfile, type IcyWorldProfile } from '../../icy-world-geometry';

// Stage 3 only: explicit landable globes, never infer from an atmosphere flag.
// Mercy keeps its existing atmosphere; Beira's dark ice is not surface ocean.
export const ESTELLA_ICY_WORLD_PROFILES: Readonly<Partial<Record<string, IcyWorldProfile>>> = Object.freeze({
  'estella-ix': icyWorldProfile('estella-ix', { craterCount: 38, frostCoverage: 0.60, fractureCount: 5, dirt: 0.18 }),
  'estella-xa': icyWorldProfile('estella-xa', { craterCount: 12, craterScale: 0.45, basinCoverage: 0.45, frostCoverage: 0.92, fractureCount: 9, dirt: 0.02 }),
  'estella-xic': icyWorldProfile('estella-xic', { craterCount: 32, basinCoverage: 1.1, frostCoverage: 0.48, fractureCount: 12, dirt: 0.12 }),
  'estella-xiia': icyWorldProfile('estella-xiia', { craterCount: 18, craterScale: 0.5, basinCoverage: 0.6, frostCoverage: 0.95, fractureCount: 4, dirt: 0.04 }),
  'estella-xiic': icyWorldProfile('estella-xiic', { craterCount: 70, craterScale: 0.8, basinCoverage: 1.2, frostCoverage: 0.30, fractureCount: 6, dirt: 0.65 }),
  'estella-xiii': icyWorldProfile('estella-xiii', { craterCount: 28, frostCoverage: 0.85, fractureCount: 6, dirt: 0.08 }),
  'estella-xiv': icyWorldProfile('estella-xiv', { craterCount: 52, craterScale: 0.75, basinCoverage: 1.05, frostCoverage: 0.43, fractureCount: 8, dirt: 0.32 }),
  'reach-rogue-kbo-fragment': icyWorldProfile('reach-rogue-kbo-fragment', { craterCount: 82, craterScale: 0.8, basinCoverage: 1.3, frostCoverage: 0.22, fractureCount: 5, dirt: 0.78 }),
});
export function icyWorldProfileFor(bodyId: string): IcyWorldProfile | undefined {
  return Object.prototype.hasOwnProperty.call(ESTELLA_ICY_WORLD_PROFILES, bodyId) ? ESTELLA_ICY_WORLD_PROFILES[bodyId] : undefined;
}
