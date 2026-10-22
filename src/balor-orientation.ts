import type { ApproachLevel } from './approach';
import type { OrbitalInitOverride, OrbitalLevel } from './orbital';
import { bodyStateRelativeToParent } from './world';

export const BALOR_BODY_ID = 'estella-i';

/** +X in Balor's authored surface coordinates points into the Eye. */
export function balorEyeAngleAt(worldTime: number): number {
  const position = bodyStateRelativeToParent(BALOR_BODY_ID, worldTime);
  return Math.atan2(-position.y, -position.x);
}

/** Rigid frame change only: no rotation rate, surface velocity or extra energy. */
export function rotateBalorDeparture(init: OrbitalInitOverride, angle: number): OrbitalInitOverride {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { ...init, x: init.x * c - init.y * s, y: init.x * s + init.y * c,
    vx: init.vx * c - init.vy * s, vy: init.vx * s + init.vy * c };
}

/** Clone the local visit, never the catalog. Retry/approach returns retain the
 * snapshot. System-map markers instead face the star from their live position.
 */
export function orientBalorOrbitalVisit(level: OrbitalLevel, worldTime: number, inheritedAngle?: number): OrbitalLevel {
  if (level.balorEyeAngle !== undefined) return level;
  if (level.bodyId !== BALOR_BODY_ID) return level;
  const angle = inheritedAngle ?? balorEyeAngleAt(worldTime);
  const canonicalStart = { x: level.startX, y: level.startY, vx: level.startVX, vy: level.startVY };
  const start = level.station || level.dynamicStartOrbit || level.dynamicStartBodyId
    ? canonicalStart : rotateBalorDeparture(canonicalStart, angle);
  return {
    ...level, balorEyeAngle: angle,
    startX: start.x, startY: start.y, startVX: start.vx, startVY: start.vy,
    landingSiteAngle: level.landingSiteAngle + angle,
    surfaceMarkers: level.surfaceMarkers?.map(marker => ({ ...marker, angle: marker.angle + angle })),
    // Station ephemerides, transfer vectors and incoming ship states remain in
    // their inertial frames. Only canonical static surface starts turn here.
  };
}

export function orientBalorApproach(level: ApproachLevel, eyeAngle: number | undefined): ApproachLevel {
  if (level.body.id !== BALOR_BODY_ID || eyeAngle === undefined || level.balorEyeAngle === eyeAngle) return level;
  const delta = eyeAngle - (level.balorEyeAngle ?? 0);
  return { ...level, balorEyeAngle: eyeAngle,
    frame: { ...level.frame, landingSiteAngle: level.frame.landingSiteAngle + delta },
    poi: { ...level.poi, surfaceAngle: level.poi.surfaceAngle + delta } };
}
