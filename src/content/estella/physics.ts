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

/** Exact body physics by stable node id. */
export const ESTELLA_BODY_PHYSICS: Partial<Record<string, BodyPhysicsDef>> = {
  'estella-viii': {
    radius: 180_000,
    gm: 1.7 * 180_000 * 180_000,
    rotationPeriod: 48_000,
    notes: 'Initial authored dwarf-planet test body for Estella navigation prototyping.',
  },
};

/** Exact atmosphere simulation params by stable node id. Empty until values are authored. */
export const ESTELLA_ATMOSPHERE_PHYSICS: Partial<Record<string, AtmospherePhysicsDef>> = {};
