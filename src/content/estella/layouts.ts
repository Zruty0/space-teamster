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
 * `rotationDegrees` supplies the station's fixed docking-map orientation.
 */
export const ESTELLA_LAYOUTS: Partial<Record<string, LayoutOverride>> = {
  // The Hearth
  'estella-i-low-orbit-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 15 },
  'estella-ii-commercial-hub': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 345 },
  'estella-iii-main-customs-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 0 },
  'estella-iii-luxury-habitat': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 45 },
  'estella-iiia-main-port': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 90 },
  'estella-iv-main-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 330 },
  'skim-hub-alpha': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 210 },
  'skim-hub-beta': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 30 },
  'coronal-observation-post': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 180 },

  // The Camps
  'estella-v-transit-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 270 },
  'estella-v-orbital-factory': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 315 },
  'estella-va-ore-depot': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 90 },
  'estella-vi-main-dispatch': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 0 },
  'estella-vi-heavy-cargo-dispatch': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 180 },
  'estella-via-drydock': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 45 },
  'estella-via-component-supply': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 225 },
  'estella-vib-cold-chain-transit': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 270 },
  'estella-vii-transit-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 30 },

  // The Belt
  'estella-viii-friendly-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 330 },
  'estella-viii-high-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 150 },
  'estella-ix-research-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 0 },
  'estella-ix-supply-depot': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 210 },

  // The Wells
  'estella-x-skim-hub': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 180 },
  'estella-xc-transit-refuel-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 0 },
  'estella-xd-orbital-chem-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 90 },
  'estella-xi-industrial-skim-hub': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 270 },
  'estella-xia-orbital-chem-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 120 },
  'estella-xic-research-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 0 },
  'estella-xid-main-port-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 180 },
  'estella-xii-observation-post-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 225 },
  'estella-xiib-transit-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 0 },

  // The Reach
  'estella-xiii-main-port-station': { layoutId: 'small-station-2', autoRotate: false, rotationDegrees: 60 },
  'estella-xiv-transit-dock-station': { layoutId: 'small-station-1', autoRotate: false, rotationDegrees: 300 },
};
