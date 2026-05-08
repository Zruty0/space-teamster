import { type TerrainFeature } from '../../world';

export interface EstellaSurfaceFlightProfile {
  subtitle: string;
  padCenterX: number;
  padHalfWidth: number;
  padY: number;
  roughness: number;
  features: TerrainFeature[];
  landingStart: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    landingMaxVSpeed: number;
    landingMaxHSpeed: number;
    landingMaxAngle: number;
  };
  descentProfile: {
    startX: number;
    startY: number;
    startVX: number;
    startVY: number;
    startAngle: number;
    gateY: number;
    gateRadius: number;
    gateMaxSpeed: number;
    gateMinSpeed: number;
  };
  departureProfile: {
    startY: number;
    startVY: number;
    exitAltitude: number;
    thresholdApoapsisAltitude: number;
    targetOrbitAltitude: number;
    orbitDir: 1 | -1;
    fuelSeconds: number;
  };
}

const ESTELLA_VIII_DEFAULT_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  subtitle: 'Generated Estella surface site',
  padCenterX: 1000,
  padHalfWidth: 28,
  padY: 30,
  roughness: 0.6,
  features: [
    { xStart: 900, xEnd: 920, height: 44 },
    { xStart: 1080, xEnd: 1100, height: 50 },
  ],
  landingStart: {
    x: 1000,
    y: 260,
    vx: 0,
    vy: -3,
    landingMaxVSpeed: 4.0,
    landingMaxHSpeed: 3.0,
    landingMaxAngle: 0.26,
  },
  descentProfile: {
    startX: -90_000,
    startY: 9_000,
    startVX: 480,
    startVY: -24,
    startAngle: 1.5,
    gateY: 1500,
    gateRadius: 1800,
    gateMaxSpeed: 150,
    gateMinSpeed: 15,
  },
  departureProfile: {
    startY: 260,
    startVY: 0,
    exitAltitude: 8_000,
    thresholdApoapsisAltitude: 85_000,
    targetOrbitAltitude: 100_000,
    orbitDir: -1,
    fuelSeconds: 180,
  },
};

export const ESTELLA_SURFACE_FLIGHT_PROFILES: Partial<Record<string, EstellaSurfaceFlightProfile>> = {
  'estella-viii-settlement': ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  'estella-viii-mining-site': ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  'estella-viii-abandoned-site': ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
};
