import { icyWorldProfile, type IcyWorldProfile } from '../../icy-world-geometry';
import type { WorldTint } from '../../world-disc-primitives';

// Stage 3 only: explicit landable globes, never infer from an atmosphere flag.
// Mercy keeps its existing atmosphere; Beira's dark ice is not surface ocean.
export const ESTELLA_ICY_WORLD_PROFILES: Readonly<Partial<Record<string, IcyWorldProfile>>> = Object.freeze({
  'estella-xa': icyWorldProfile('estella-xa', { craterCount: 12, craterScale: 0.45, basinCoverage: 0.45, frostCoverage: 0.92, dirt: 0.02 }),
  'estella-xic': icyWorldProfile('estella-xic', { craterCount: 32, basinCoverage: 1.1, frostCoverage: 0.48, dirt: 0.12 }),
  'estella-xiia': icyWorldProfile('estella-xiia', { craterCount: 18, craterScale: 0.5, basinCoverage: 0.6, frostCoverage: 0.95, dirt: 0.04 }),
  'estella-xiic': icyWorldProfile('estella-xiic', { craterCount: 70, craterScale: 0.8, basinCoverage: 1.2, frostCoverage: 0.30, dirt: 0.65 }),
  'estella-xiii': icyWorldProfile('estella-xiii', { craterCount: 28, frostCoverage: 0.85, dirt: 0.08 }),
  'estella-xiv': icyWorldProfile('estella-xiv', { craterCount: 52, craterScale: 0.75, basinCoverage: 1.05, frostCoverage: 0.43, dirt: 0.32 }),
  'reach-rogue-kbo-fragment': icyWorldProfile('reach-rogue-kbo-fragment', { craterCount: 82, craterScale: 0.8, basinCoverage: 1.3, frostCoverage: 0.22, dirt: 0.78 }),
});
// Art-only palettes: do not change atmosphere, terrain, navigation or physics.
// Sahra (IX) now uses the approved rocky/regolith profile; its ice is buried.
export const ESTELLA_ICY_WORLD_TINTS: Readonly<Partial<Record<string, WorldTint>>> = Object.freeze({
  'estella-xa': Object.freeze([145, 199, 215] as const), // glacial cyan
  'estella-xic': Object.freeze([135, 181, 165] as const), // pale jade
  'estella-xiia': Object.freeze([216, 205, 178] as const), // ivory
  'estella-xiic': Object.freeze([175, 145, 121] as const), // dusty taupe
  'estella-xiii': Object.freeze([163, 187, 219] as const), // pearl blue
  'estella-xiv': Object.freeze([157, 153, 185] as const), // dusky violet-grey
  'reach-rogue-kbo-fragment': Object.freeze([143, 160, 143] as const), // ash/sage
});
export function icyWorldTintFor(bodyId: string, fallback: WorldTint): WorldTint {
  return Object.prototype.hasOwnProperty.call(ESTELLA_ICY_WORLD_TINTS, bodyId) ? ESTELLA_ICY_WORLD_TINTS[bodyId]! : fallback;
}
export function icyWorldProfileFor(bodyId: string): IcyWorldProfile | undefined {
  return Object.prototype.hasOwnProperty.call(ESTELLA_ICY_WORLD_PROFILES, bodyId) ? ESTELLA_ICY_WORLD_PROFILES[bodyId] : undefined;
}
