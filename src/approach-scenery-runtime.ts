// Approved production opt-in: Hartwell's five surface regions only.
import type { ApproachSceneryPainter } from './approach';
import { HARTWELL_APPROACH_TARGETS, hartwellApproachRegion } from './approach-biomes';
import { createHartwellScenery } from './approach-scenery';

/** One painter/material tile per visited target, at most five. No save/physics IO. */
export function createApproachScenery(): ApproachSceneryPainter {
  const painters = new Map<string, ApproachSceneryPainter>();
  return (ctx, cam, state, level, width, height) => {
    if (level.body.id !== 'estella-v' || !HARTWELL_APPROACH_TARGETS.includes(level.poi.id)) return false;
    let painter = painters.get(level.poi.id);
    if (!painter) {
      painter = createHartwellScenery(hartwellApproachRegion(level.poi.id));
      painters.set(level.poi.id, painter);
    }
    return painter(ctx, cam, state, level, width, height);
  };
}
