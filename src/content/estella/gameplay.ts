import { ESTELLA_ATMOSPHERE_PHYSICS, ESTELLA_BODY_FLIGHT_PROFILES, ESTELLA_BODY_PHYSICS, ESTELLA_NODES_BY_ID, ESTELLA_PLACEMENTS } from './index';
import { ESTELLA_SURFACE_FLIGHT_PROFILES } from './flight-profiles';
import { type BodyDef, type StationPoiDef, type SurfacePoiDef, type WeatherProfileDef } from '../../world';
import { type Placement, type WorldNode } from '../types';

function node(id: string): WorldNode {
  const n = ESTELLA_NODES_BY_ID.get(id);
  if (!n) throw new Error(`Missing Estella node: ${id}`);
  return n;
}

function nodeName(id: string): string {
  return node(id).name;
}

function placement(id: string): Placement {
  const p = ESTELLA_PLACEMENTS[id] ?? node(id).placement;
  if (!p) throw new Error(`Missing Estella placement: ${id}`);
  return p;
}

function surfacePlacement(id: string): Extract<Placement, { kind: 'surface' }> {
  const p = placement(id);
  if (p.kind !== 'surface') throw new Error(`${id} is not surface-placed`);
  return p;
}

function orbitPlacement(id: string): Extract<Placement, { kind: 'orbit' }> {
  const p = placement(id);
  if (p.kind !== 'orbit') throw new Error(`${id} is not orbit-placed`);
  return p;
}

function circularOrbit(id: string) {
  const p = orbitPlacement(id);
  if (p.orbit?.kind !== 'circular') throw new Error(`${id} does not have circular orbit params`);
  return p.orbit;
}

function bodyOrbit(id: string): BodyDef['orbit'] {
  const p = ESTELLA_PLACEMENTS[id] ?? node(id).placement;
  if (p?.kind !== 'orbit' || p.orbit?.kind !== 'circular') return undefined;
  return {
    parentBodyId: p.parentId,
    radius: p.orbit.radius,
    epochAngle: p.orbit.epochAngle,
    epochTime: p.orbit.epochTime,
    orbitSense: p.orbit.orbitSense,
  };
}

const TRANSFER_GAMEPLAY_OVERRIDES: Partial<Record<string, NonNullable<BodyDef['transferGameplay']>>> = {
  'estella-iii': { patchRadius: 24_000_000, displayPatchRadius: 24_000_000 },
  'estella-v': { patchRadius: 10_000_000, displayPatchRadius: 10_000_000 },
  'estella-vi': { patchRadius: 14_000_000, displayPatchRadius: 14_000_000 },
  'estella-vii': { patchRadius: 2_500_000, displayPatchRadius: 2_500_000 },
  'estella-viii': { patchRadius: 12_000_000, displayPatchRadius: 12_000_000 },
  'estella-ix': { patchRadius: 4_000_000, displayPatchRadius: 4_000_000 },
};

function derivedMoonTransferGameplay(id: string): NonNullable<BodyDef['transferGameplay']> {
  const orbit = bodyOrbit(id);
  const body = ESTELLA_BODY_PHYSICS[id];
  const parent = orbit?.parentBodyId ? ESTELLA_BODY_PHYSICS[orbit.parentBodyId] : undefined;
  if (!orbit || !body || !parent) return { patchRadius: 320_000, displayPatchRadius: 320_000 };

  // Classical patched-conic SOI estimate. Moon orbits are gameplay-scaled, so derive
  // this from the authored radius/GM/orbit instead of using one stale global moon size.
  const laplaceSoi = orbit.radius * ((body.gm / parent.gm) ** (2 / 5));
  const minPlayableSoi = body.radius * 3;
  const patchRadius = Math.max(320_000, Math.round(Math.max(laplaceSoi, minPlayableSoi) / 10_000) * 10_000);
  return { patchRadius, displayPatchRadius: patchRadius };
}

function transferGameplay(id: string): BodyDef['transferGameplay'] {
  const n = node(id);
  if (!n.capabilities?.hasSOI) return undefined;
  const override = TRANSFER_GAMEPLAY_OVERRIDES[id];
  if (override) return override;
  if (n.kind === 'moon') return derivedMoonTransferGameplay(id);
  if (n.kind === 'dwarf-planet') return { patchRadius: 1_500_000, displayPatchRadius: 1_500_000 };
  if (n.kind === 'gas-giant') return { patchRadius: 120_000_000, displayPatchRadius: 120_000_000 };
  if (n.kind === 'planet') return { patchRadius: 8_000_000, displayPatchRadius: 8_000_000 };
  return undefined;
}

const GAIA_WEATHER: WeatherProfileDef = {
  volatility: 0.8,
  windLayers: [
    { altitudeCenter: 16_000, altitudeWidth: 3_500, strength: -10, probability: 0.9, altitudeJitter: 1_400, strengthJitter: 0.25 },
    { altitudeCenter: 6_000, altitudeWidth: 2_000, strength: 8, probability: 0.75, altitudeJitter: 800, strengthJitter: 0.25 },
  ],
  turbulence: [],
};

const DAHAI_WEATHER: WeatherProfileDef = {
  volatility: 1.3,
  windLayers: [
    { altitudeCenter: 28_000, altitudeWidth: 4_500, strength: 18, probability: 0.95, altitudeJitter: 2_500, strengthJitter: 0.3 },
    { altitudeCenter: 13_000, altitudeWidth: 2_800, strength: -14, probability: 0.85, altitudeJitter: 1_500, strengthJitter: 0.35 },
    { altitudeCenter: 4_500, altitudeWidth: 1_500, strength: 10, probability: 0.75, altitudeJitter: 600, strengthJitter: 0.35 },
  ],
  turbulence: [
    { altitudeMin: 7_000, altitudeMax: 10_000, strength: 3, probability: 0.65, widthJitter: 0.25, strengthJitter: 0.35 },
    { altitudeMin: 18_000, altitudeMax: 21_000, strength: 2, probability: 0.55, widthJitter: 0.25, strengthJitter: 0.35 },
    { altitudeMin: 30_000, altitudeMax: 33_000, strength: 1, probability: 0.45, widthJitter: 0.25, strengthJitter: 0.3 },
  ],
};

const ACHERON_UPPER_CLOUD_WEATHER: WeatherProfileDef = {
  volatility: 1.6,
  windLayers: [
    { altitudeCenter: 88_000, altitudeWidth: 10_000, strength: 14, probability: 0.85, altitudeJitter: 5_000, strengthJitter: 0.35 },
    { altitudeCenter: 60_000, altitudeWidth: 7_500, strength: 10, probability: 0.95, altitudeJitter: 3_500, strengthJitter: 0.4 },
    { altitudeCenter: 42_000, altitudeWidth: 5_500, strength: -12, probability: 0.7, altitudeJitter: 2_500, strengthJitter: 0.45 },
  ],
  turbulence: [
    { altitudeMin: 50_000, altitudeMax: 62_000, strength: 2.0, probability: 0.7, widthJitter: 0.3, strengthJitter: 0.4 },
  ],
};

const ACHERON_ACID_CLOUD_WEATHER: WeatherProfileDef = {
  volatility: 2.0,
  windLayers: [
    { altitudeCenter: 60_000, altitudeWidth: 8_500, strength: 12, probability: 0.8, altitudeJitter: 4_000, strengthJitter: 0.45 },
    { altitudeCenter: 42_000, altitudeWidth: 6_000, strength: -16, probability: 0.95, altitudeJitter: 2_500, strengthJitter: 0.45 },
    { altitudeCenter: 24_000, altitudeWidth: 4_500, strength: 16, probability: 0.85, altitudeJitter: 1_800, strengthJitter: 0.5 },
  ],
  turbulence: [
    { altitudeMin: 31_000, altitudeMax: 38_000, strength: 2.8, probability: 0.85, widthJitter: 0.35, strengthJitter: 0.45 },
    { altitudeMin: 14_000, altitudeMax: 24_000, strength: 3.5, probability: 0.65, widthJitter: 0.35, strengthJitter: 0.5 },
  ],
};

const HARTWELL_CLEAR_WEATHER: WeatherProfileDef = {
  volatility: 1.0,
  windLayers: [
    { altitudeCenter: 18_000, altitudeWidth: 5_000, strength: 12, probability: 0.85, altitudeJitter: 2_000, strengthJitter: 0.35 },
    { altitudeCenter: 6_000, altitudeWidth: 2_200, strength: -8, probability: 0.7, altitudeJitter: 800, strengthJitter: 0.35 },
  ],
  turbulence: [
    { altitudeMin: 5_000, altitudeMax: 8_000, strength: 1.5, probability: 0.45, widthJitter: 0.25, strengthJitter: 0.35 },
  ],
};

const HARTWELL_STORM_WEATHER: WeatherProfileDef = {
  volatility: 2.4,
  windLayers: [
    { altitudeCenter: 24_000, altitudeWidth: 5_000, strength: 18, probability: 0.9, altitudeJitter: 2_000, strengthJitter: 0.45 },
    { altitudeCenter: 11_500, altitudeWidth: 3_200, strength: -16, probability: 0.85, altitudeJitter: 1_200, strengthJitter: 0.5 },
    { altitudeCenter: 3_500, altitudeWidth: 1_400, strength: 14, probability: 0.8, altitudeJitter: 600, strengthJitter: 0.5 },
  ],
  turbulence: [
    { altitudeMin: 3_000, altitudeMax: 7_000, strength: 3.2, probability: 0.8, widthJitter: 0.35, strengthJitter: 0.45 },
    { altitudeMin: 11_000, altitudeMax: 15_500, strength: 2.5, probability: 0.65, widthJitter: 0.3, strengthJitter: 0.4 },
  ],
};

const KUZNIA_WEATHER: WeatherProfileDef = {
  volatility: 1.5,
  windLayers: [
    { altitudeCenter: 46_000, altitudeWidth: 7_000, strength: 20, probability: 0.9, altitudeJitter: 4_000, strengthJitter: 0.4 },
    { altitudeCenter: 24_000, altitudeWidth: 4_500, strength: -18, probability: 0.85, altitudeJitter: 2_500, strengthJitter: 0.4 },
    { altitudeCenter: 9_000, altitudeWidth: 2_400, strength: 12, probability: 0.75, altitudeJitter: 1_200, strengthJitter: 0.35 },
  ],
  turbulence: [
    { altitudeMin: 12_000, altitudeMax: 16_000, strength: 3, probability: 0.65, widthJitter: 0.3, strengthJitter: 0.45 },
    { altitudeMin: 34_000, altitudeMax: 38_000, strength: 2, probability: 0.55, widthJitter: 0.3, strengthJitter: 0.35 },
  ],
};

function weatherProfileForPoi(id: string, bodyId: string): WeatherProfileDef | undefined {
  const explicit = ESTELLA_SURFACE_FLIGHT_PROFILES[id]?.weatherProfile;
  if (explicit) return explicit;
  if (id === 'estella-ii-nimbus-crucible') return ACHERON_ACID_CLOUD_WEATHER;
  if (id === 'estella-ii-pandemonium') return ACHERON_ACID_CLOUD_WEATHER;
  if (id === 'estella-v-storm-research') return HARTWELL_STORM_WEATHER;
  if (id === 'estella-iv-climate-poi-1') return { ...DAHAI_WEATHER, volatility: 2.0 };
  if (id === 'estella-vi-polar-weather-research') return { ...KUZNIA_WEATHER, volatility: 2.1 };
  if (bodyId === 'estella-ii') return ACHERON_UPPER_CLOUD_WEATHER;
  if (bodyId === 'estella-iii') return GAIA_WEATHER;
  if (bodyId === 'estella-iv') return DAHAI_WEATHER;
  if (bodyId === 'estella-v') return HARTWELL_CLEAR_WEATHER;
  if (bodyId === 'estella-vi') return KUZNIA_WEATHER;
  return undefined;
}

function atmosphereColor(id: string, fallback: [number, number, number]): [number, number, number] {
  if (id === 'estella-ii') return [235, 176, 72];
  if (id === 'estella-iii') return [95, 230, 140];
  if (id === 'estella-iv') return [80, 180, 255];
  if (id === 'estella-x') return [230, 180, 100];
  if (id === 'estella-xi') return [230, 145, 100];
  if (id === 'estella-xii') return [100, 160, 240];
  if (id === 'estella-xib') return [130, 190, 210];
  return fallback;
}

function createEstellaBody(id: string): BodyDef {
  const n = node(id);
  const physics = ESTELLA_BODY_PHYSICS[id];
  const flight = ESTELLA_BODY_FLIGHT_PROFILES[id];
  if (!physics) throw new Error(`Missing Estella body physics: ${id}`);
  if (!flight) throw new Error(`Missing Estella body flight profile: ${id}`);
  const atmosphere = ESTELLA_ATMOSPHERE_PHYSICS[id];
  return {
    id,
    name: n.name,
    radius: physics.radius,
    gm: physics.gm,
    color: flight.color,
    planetFillColor: flight.planetFillColor,
    planetStrokeColor: flight.planetStrokeColor,
    terrainFillColor: flight.terrainFillColor,
    terrainStrokeColor: flight.terrainStrokeColor,
    terrainBrightColor: flight.terrainBrightColor,
    atmosphere: atmosphere ? {
      height: atmosphere.height,
      surfaceDensity: atmosphere.surfaceDensity,
      scaleHeight: atmosphere.scaleHeight,
      color: atmosphereColor(id, flight.color),
    } : null,
    orbit: bodyOrbit(id),
    orbitalDefaults: flight.orbitalDefaults,
    transferGameplay: transferGameplay(id),
  };
}

function createSurfacePoi(id: string): SurfacePoiDef {
  const p = surfacePlacement(id);
  const profile = ESTELLA_SURFACE_FLIGHT_PROFILES[id];
  if (!profile) throw new Error(`Missing Estella surface flight profile: ${id}`);
  return {
    id,
    name: nodeName(id),
    subtitle: profile.subtitle,
    bodyId: p.parentId,
    surfaceAngle: p.angle ?? 0,
    altitude: p.altitude ?? 0,
    padCenterX: profile.padCenterX,
    padHalfWidth: profile.padHalfWidth,
    padY: profile.padY,
    roughness: profile.roughness,
    features: profile.features,
    landingLayout: profile.landingLayout,
    landingStart: profile.landingStart,
    descentProfile: profile.descentProfile,
    departureProfile: profile.departureProfile,
    weatherProfile: weatherProfileForPoi(id, p.parentId),
  };
}

function stationCaptureRadius(usage: string | undefined): number {
  if (usage === 'high' || usage === 'moon') return 25_000;
  return 20_000;
}

function stationCaptureMaxSpeed(usage: string | undefined): number {
  if (usage === 'moon') return 25;
  return 22;
}

function createStationPoi(dockNodeId: string): StationPoiDef {
  const orbit = circularOrbit(dockNodeId);
  const orbitPlacementDef = orbitPlacement(dockNodeId);
  const childPoi = [...ESTELLA_NODES_BY_ID.values()].find(n => n.placement?.kind === 'aboard' && n.placement.parentId === dockNodeId);
  return {
    id: dockNodeId,
    name: nodeName(dockNodeId),
    subtitle: childPoi?.summary ?? 'Generated Estella docking site',
    bodyId: orbitPlacementDef.parentId,
    orbit: {
      parentBodyId: orbitPlacementDef.parentId,
      radius: orbit.radius,
      epochAngle: orbit.epochAngle,
      epochTime: orbit.epochTime,
      orbitSense: orbit.orbitSense,
    },
    captureRadius: stationCaptureRadius(orbitPlacementDef.usage),
    captureMaxSpeed: stationCaptureMaxSpeed(orbitPlacementDef.usage),
    docking: {
      undock: { exitDistance: 140, targetSpoke: 0, targetSide: 1, targetSlot: 2, fillPct: 0.55 },
      delivery: { targetSpoke: 2, targetSide: 0, targetSlot: 2, fillPct: 0.55 },
      beamRange: 12,
      beamStrength: 0.5,
      thrustForce: 3200,
      rotTorque: 1200,
      tugMass: 500,
      containerMass: 2000,
      dampingAssist: false,
    },
  };
}

function playableSurfacePoiIds(bodyId: string): string[] {
  return [...ESTELLA_NODES_BY_ID.values()]
    .filter(n => {
      const p = ESTELLA_PLACEMENTS[n.id] ?? n.placement;
      return n.kind === 'poi'
        && p?.kind === 'surface'
        && p.parentId === bodyId
        && ESTELLA_SURFACE_FLIGHT_PROFILES[n.id] !== undefined;
    })
    .map(n => n.id)
    .sort();
}

function playableDockNodeIds(bodyId: string): string[] {
  return [...ESTELLA_NODES_BY_ID.values()]
    .filter(n => {
      const p = ESTELLA_PLACEMENTS[n.id] ?? n.placement;
      const hasAboardPoi = [...ESTELLA_NODES_BY_ID.values()].some(child =>
        child.kind === 'poi' && child.placement?.kind === 'aboard' && child.placement.parentId === n.id,
      );
      return hasAboardPoi
        && p?.kind === 'orbit'
        && p.parentId === bodyId
        && p.orbit?.kind === 'circular';
    })
    .map(n => n.id)
    .sort();
}

function playableBodyIds(): string[] {
  return Object.keys(ESTELLA_BODY_FLIGHT_PROFILES)
    .filter(id => ESTELLA_BODY_PHYSICS[id] !== undefined && ESTELLA_NODES_BY_ID.has(id))
    .sort();
}

const PLAYABLE_BODY_IDS = playableBodyIds();

const ESTELLA_CLUSTER_BODIES: BodyDef[] = [
  {
    id: 'new-canaan-field',
    name: 'New Canaan Field',
    radius: 6_000,
    gm: 0,
    color: [170, 150, 120],
    planetFillColor: '#2a241b',
    planetStrokeColor: '#8a7650',
    atmosphere: null,
    orbit: bodyOrbit('new-canaan-field'),
    orbitalDefaults: {
      baseTimeScale: 100,
      thrustAccel: 0.2,
      thrustAccelMax: 2,
      fuelDeltaV: 1_200,
      transitionAltitude: 0,
    },
    transferGameplay: { patchRadius: 10_000_000, displayPatchRadius: 10_000_000 },
  },
  {
    id: 'glitterfield',
    name: 'Glitterfield',
    radius: 6_000,
    gm: 0,
    color: [200, 205, 215],
    planetFillColor: '#20242a',
    planetStrokeColor: '#b8c0cc',
    atmosphere: null,
    orbit: bodyOrbit('glitterfield'),
    orbitalDefaults: {
      baseTimeScale: 100,
      thrustAccel: 0.2,
      thrustAccelMax: 2,
      fuelDeltaV: 1_200,
      transitionAltitude: 0,
    },
    transferGameplay: { patchRadius: 10_000_000, displayPatchRadius: 10_000_000 },
  },
  {
    id: 'belt-cluster-wreckage-field',
    name: 'Arkfall',
    radius: 5_000,
    gm: 0,
    color: [120, 130, 145],
    planetFillColor: '#151820',
    planetStrokeColor: '#6c7482',
    atmosphere: null,
    orbit: bodyOrbit('belt-cluster-wreckage-field'),
    orbitalDefaults: {
      baseTimeScale: 100,
      thrustAccel: 0.2,
      thrustAccelMax: 2,
      fuelDeltaV: 1_200,
      transitionAltitude: 0,
    },
    transferGameplay: { patchRadius: 7_000_000, displayPatchRadius: 7_000_000 },
  },
  {
    id: 'reach-comet-swarm',
    name: 'Reach Comet Swarm',
    radius: 7_000,
    gm: 0,
    color: [150, 190, 220],
    planetFillColor: '#101822',
    planetStrokeColor: '#7fa6bf',
    atmosphere: null,
    orbit: bodyOrbit('reach-comet-swarm'),
    orbitalDefaults: {
      baseTimeScale: 100,
      thrustAccel: 0.2,
      thrustAccelMax: 2,
      fuelDeltaV: 1_200,
      transitionAltitude: 0,
    },
    transferGameplay: { patchRadius: 10_000_000, displayPatchRadius: 10_000_000 },
  },
];

export const ESTELLA_BODIES: BodyDef[] = [...PLAYABLE_BODY_IDS.map(createEstellaBody), ...ESTELLA_CLUSTER_BODIES];

export const ESTELLA_SURFACE_POIS: SurfacePoiDef[] = PLAYABLE_BODY_IDS.flatMap(bodyId =>
  playableSurfacePoiIds(bodyId).map(createSurfacePoi),
);

export const ESTELLA_STATION_POIS: StationPoiDef[] = PLAYABLE_BODY_IDS.flatMap(bodyId =>
  playableDockNodeIds(bodyId).map(createStationPoi),
);
