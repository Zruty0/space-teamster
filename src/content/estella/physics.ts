import { type AtmosphereModel } from '../types';

export interface BodyPhysicsDef {
  radius: number;
  gm: number;
  rotationPeriod?: number;
  notes?: string;
}

export interface AtmospherePhysicsDef {
  kind: AtmosphereModel['kind'];
  height: number;
  surfaceDensity: number;
  scaleHeight: number;
  windProfileId?: string;
  turbulenceProfileId?: string;
  notes?: string;
}

export interface BodyFlightProfileDef {
  color: [number, number, number];
  planetFillColor?: string;
  planetStrokeColor?: string;
  terrainFillColor?: string;
  terrainStrokeColor?: string;
  terrainBrightColor?: string;
  orbitalDefaults: {
    baseTimeScale: number;
    thrustAccel: number;
    thrustAccelMax: number;
    fuelDeltaV: number;
    transitionAltitude: number;
  };
}

/** Exact body physics by stable node id. */
export const ESTELLA_BODY_PHYSICS: Partial<Record<string, BodyPhysicsDef>> = {
  'estella-viii': {
    radius: 180_000,
    gm: 1.7 * 180_000 * 180_000,
    rotationPeriod: 48_000,
    notes: 'Initial authored dwarf-planet test body for Estella navigation prototyping.',
  },
  'estella-ix': {
    radius: 165_000,
    gm: 1.45 * 165_000 * 165_000,
    rotationPeriod: 52_000,
    notes: 'Icy sibling dwarf planet near Estella VIII for same-belt transfer prototyping.',
  },
};

/** Flight/rendering profile data needed to adapt Estella bodies into current gameplay phases. */
export const ESTELLA_BODY_FLIGHT_PROFILES: Partial<Record<string, BodyFlightProfileDef>> = {
  'estella-viii': {
    color: [135, 155, 170],
    planetFillColor: '#101820',
    planetStrokeColor: '#607080',
    terrainFillColor: '#101820',
    terrainStrokeColor: '#607080',
    terrainBrightColor: '#8da0ad',
    orbitalDefaults: {
      baseTimeScale: 50,
      thrustAccel: 0.05,
      thrustAccelMax: 1.0,
      fuelDeltaV: 900,
      transitionAltitude: 8_000,
    },
  },
  'estella-ix': {
    color: [150, 180, 205],
    planetFillColor: '#0d1720',
    planetStrokeColor: '#6c8fa8',
    terrainFillColor: '#0d1720',
    terrainStrokeColor: '#6c8fa8',
    terrainBrightColor: '#a8c5d8',
    orbitalDefaults: {
      baseTimeScale: 50,
      thrustAccel: 0.05,
      thrustAccelMax: 1.0,
      fuelDeltaV: 900,
      transitionAltitude: 8_000,
    },
  },
};

/** Exact atmosphere simulation params by stable node id. Empty until values are authored. */
export const ESTELLA_ATMOSPHERE_PHYSICS: Partial<Record<string, AtmospherePhysicsDef>> = {};
