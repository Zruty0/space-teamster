import { crateredWorldProfile, type CrateredWorldProfile } from '../../cratered-world-geometry';

// Stage 2 opt-in list, not an inference from atmosphere or body size. Ice worlds,
// Calatrava and other bespoke worlds await their own separately approved stages.
// Tints come from existing BodyDef.color; these settings affect artwork only.
export const ESTELLA_ROCKY_WORLD_PROFILES: Readonly<Partial<Record<string, CrateredWorldProfile>>> = Object.freeze({
  'estella-iiia': crateredWorldProfile('estella-iiia'), // Celeste: exact accepted baseline.
  'estella-va': crateredWorldProfile('estella-va', { craterCount: 84, craterScale: 0.88, basinCoverage: 0.65, reliefContrast: 0.95 }), // Pike
  'estella-via': crateredWorldProfile('estella-via', { craterCount: 62, basinCoverage: 1.15, reliefContrast: 1.15 }), // Svarog
  'estella-vib': crateredWorldProfile('estella-vib', { craterCount: 64, craterScale: 1.05, basinCoverage: 0.9, reliefContrast: 1.1 }), // Kalyna
  'estella-vii': crateredWorldProfile('estella-vii', { craterCount: 72, craterScale: 0.82, basinCoverage: 0.75, reliefContrast: 0.8 }), // Tessera
  'estella-viii': crateredWorldProfile('estella-viii', { craterCount: 48, craterScale: 1.12, basinCoverage: 1.2 }), // Weymark
  'estella-xb': crateredWorldProfile('estella-xb', { craterCount: 66, basinCoverage: 0.85 }), // Tinto
  'estella-xc': crateredWorldProfile('estella-xc', { craterCount: 42, craterScale: 1.18, basinCoverage: 1.25, reliefContrast: 0.95 }), // Thronehold
  'estella-xid': crateredWorldProfile('estella-xid', { basinCoverage: 0.95 }), // Cadiz
  'estella-xie': crateredWorldProfile('estella-xie', { craterCount: 74, craterScale: 0.88, basinCoverage: 0.8, reliefContrast: 1.2 }), // Oathmark
  'estella-xif': crateredWorldProfile('estella-xif', { craterCount: 44, craterScale: 0.92, basinCoverage: 1.1, reliefContrast: 0.8 }), // Coimbra
  'estella-xiib': crateredWorldProfile('estella-xiib', { craterCount: 88, craterScale: 0.85, basinCoverage: 0.65, reliefContrast: 1.05 }), // Vigil
  'estella-xiid': crateredWorldProfile('estella-xiid', { craterCount: 50, craterScale: 0.88, basinCoverage: 0.7, reliefContrast: 0.9 }), // Ceuta
});

export function rockyWorldProfileFor(bodyId: string): CrateredWorldProfile | undefined {
  return Object.prototype.hasOwnProperty.call(ESTELLA_ROCKY_WORLD_PROFILES, bodyId)
    ? ESTELLA_ROCKY_WORLD_PROFILES[bodyId] : undefined;
}
