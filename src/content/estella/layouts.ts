import { type AccessPoint } from '../types';

export interface LayoutOverride {
  layoutId?: string;
  autoRotate?: boolean;
  rotationDegrees?: number;
  accessPoints?: AccessPoint[];
}

/**
 * Exact map/layout data by physical node id.
 *
 * Use this for stations, asteroids, clusters, and surface facilities that own one
 * navigable local map. POIs remain semantic destinations; pads/berths/clamps live here.
 * `autoRotate` selects a seed-stable random mission orientation when true; otherwise
 * `rotationDegrees` supplies the station's fixed docking-map orientation. Current generic
 * station angles are one-time seeded random assignments, stored here so they remain fixed.
 */
export const ESTELLA_LAYOUTS: Partial<Record<string, LayoutOverride>> = {
  // The Hearth
  'estella-i-low-orbit-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 168 },
  'estella-ii-commercial-hub': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 252 },
  'estella-iii-main-customs-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 85 },
  'estella-iii-luxury-habitat': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 185 },
  'estella-iiia-main-port': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 100 },
  'estella-iv-main-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 179 },
  'skim-hub-alpha': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 359 },
  'skim-hub-beta': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 333 },
  'coronal-observation-post': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 6 },

  // The Camps
  'estella-v-transit-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 268 },
  'estella-v-orbital-factory': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 261 },
  'estella-va-ore-depot': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 104 },
  'estella-vi-main-dispatch': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 239 },
  'estella-vi-heavy-cargo-dispatch': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 36 },
  'estella-via-drydock': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 169 },
  'estella-via-component-supply': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 195 },
  'estella-vib-cold-chain-transit': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 114 },
  'estella-vii-transit-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 171 },

  // The Belt
  'estella-viii-friendly-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 334 },
  'estella-viii-high-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 145 },
  'estella-ix-research-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 21 },
  'estella-ix-supply-depot': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 24 },

  // The Wells — fixed orientations, like the other stations (one-time seed 20261017).
  'estella-x-skim-hub': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 144 },
  'estella-xc-transit-refuel-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 16 },
  'estella-xd-orbital-chem-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 225 },
  'estella-xi-industrial-skim-hub': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 94 },
  'estella-xia-orbital-chem-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 340 },
  'estella-xic-research-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 63 },
  'estella-xid-main-port-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 249 },
  'estella-xi-captive-science-waypoint': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 269 },
  'estella-xie-outer-spec-drydock-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 272 },
  'estella-xii-observation-post-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 268 },
  'estella-xiib-transit-station': { layoutId: 'medieval-station', autoRotate: false, rotationDegrees: 285 },

  // The Reach
  'estella-xiii-main-port-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 293 },
  'estella-xiv-transit-dock-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 244 },
};
