import { type AccessPoint } from '../types';

export interface LayoutOverride {
  layoutId?: string;
  accessPoints?: AccessPoint[];
}

/**
 * Exact map/layout data by physical node id.
 *
 * Use this for stations, asteroids, clusters, and surface facilities that own one
 * navigable local map. POIs remain semantic destinations; pads/berths/clamps live here.
 */
export const ESTELLA_LAYOUTS: Partial<Record<string, LayoutOverride>> = {};
