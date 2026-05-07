import { type Placement } from '../types';

/**
 * Canonical editable placement overrides for Estella nodes.
 *
 * The node inventory can carry a coarse placement so the tree remains readable, but exact
 * spatial data should live here. Add records by stable node id as authored values become
 * known. This lets future edits touch one small file instead of the whole content tree.
 */
export const ESTELLA_PLACEMENTS: Partial<Record<string, Placement>> = {
  // Example shape for a circular stellar orbit:
  // 'estella-iii': {
  //   kind: 'orbit',
  //   parentId: 'estella',
  //   usage: 'stellar',
  //   orbit: {
  //     kind: 'circular',
  //     radius: 150_000_000_000,
  //     epochAngle: 0,
  //     epochTime: 0,
  //     orbitSense: 1,
  //     period: 31_557_600,
  //   },
  // },

  // Example shape for a non-circular cluster orbit:
  // 'belt-cluster-wreckage-field': {
  //   kind: 'orbit',
  //   parentId: 'estella',
  //   usage: 'eccentric',
  //   orbit: {
  //     kind: 'keplerian',
  //     semiMajorAxis: 420_000_000_000,
  //     eccentricity: 0.18,
  //     argumentOfPeriapsis: 1.1,
  //     meanAnomalyAtEpoch: 0.4,
  //     epochTime: 0,
  //     orbitSense: 1,
  //   },
  // },
};
