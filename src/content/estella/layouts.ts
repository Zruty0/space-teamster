import { type AccessPoint } from '../types';

export interface LayoutOverride {
  layoutId?: string;
  autoRotate?: boolean;
  accessPoints?: AccessPoint[];
}

/**
 * Exact map/layout data by physical node id.
 *
 * Use this for stations, asteroids, clusters, and surface facilities that own one
 * navigable local map. POIs remain semantic destinations; pads/berths/clamps live here.
 * `autoRotate` currently determines whether an authored orbital station receives a
 * seed-stable random orientation when its docking mission is created.
 */
export const ESTELLA_LAYOUTS: Partial<Record<string, LayoutOverride>> = {
  // The Hearth
  'estella-i-low-orbit-station': { layoutId: 'small-station-2', autoRotate: true },
  'estella-ii-commercial-hub': { layoutId: 'small-station-2', autoRotate: true },
  'estella-iii-main-customs-station': { layoutId: 'small-station-2', autoRotate: true },
  'estella-iii-luxury-habitat': { layoutId: 'small-station-2', autoRotate: true },
  'estella-iiia-main-port': { layoutId: 'small-station-1', autoRotate: true },
  'estella-iv-main-station': { layoutId: 'small-station-1', autoRotate: true },
  'skim-hub-alpha': { layoutId: 'small-station-1', autoRotate: false },
  'skim-hub-beta': { layoutId: 'small-station-1', autoRotate: false },
  'coronal-observation-post': { layoutId: 'small-station-1', autoRotate: false },

  // The Camps
  'estella-v-transit-station': { layoutId: 'small-station-2', autoRotate: true },
  'estella-v-orbital-factory': { layoutId: 'small-station-2', autoRotate: true },
  'estella-va-ore-depot': { layoutId: 'small-station-1', autoRotate: false },
  'estella-vi-main-dispatch': { layoutId: 'small-station-2', autoRotate: true },
  'estella-vi-heavy-cargo-dispatch': { layoutId: 'small-station-2', autoRotate: false },
  'estella-via-drydock': { layoutId: 'small-station-2', autoRotate: false },
  'estella-via-component-supply': { layoutId: 'small-station-2', autoRotate: false },
  'estella-vib-cold-chain-transit': { layoutId: 'small-station-1', autoRotate: false },
  'estella-vii-transit-station': { layoutId: 'small-station-1', autoRotate: true },

  // The Belt
  'estella-viii-friendly-station': { layoutId: 'small-station-1', autoRotate: true },
  'estella-viii-high-station': { layoutId: 'small-station-1', autoRotate: false },
  'estella-ix-research-station': { layoutId: 'small-station-1', autoRotate: false },
  'estella-ix-supply-depot': { layoutId: 'small-station-1', autoRotate: true },

  // The Wells
  'estella-x-skim-hub': { layoutId: 'small-station-2', autoRotate: false },
  'estella-xc-transit-refuel-station': { layoutId: 'small-station-1', autoRotate: true },
  'estella-xd-orbital-chem-station': { layoutId: 'small-station-1', autoRotate: false },
  'estella-xi-industrial-skim-hub': { layoutId: 'small-station-2', autoRotate: false },
  'estella-xia-orbital-chem-station': { layoutId: 'small-station-1', autoRotate: false },
  'estella-xic-research-station': { layoutId: 'small-station-2', autoRotate: true },
  'estella-xid-main-port-station': { layoutId: 'small-station-2', autoRotate: true },
  'estella-xii-observation-post-station': { layoutId: 'small-station-1', autoRotate: false },
  'estella-xiib-transit-station': { layoutId: 'small-station-1', autoRotate: true },

  // The Reach
  'estella-xiii-main-port-station': { layoutId: 'small-station-2', autoRotate: true },
  'estella-xiv-transit-dock-station': { layoutId: 'small-station-1', autoRotate: true },
};
