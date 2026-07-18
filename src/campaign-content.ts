export interface LandingPhaseDef {
  id: number;
  poiId: string;
}

export interface ClusterPhaseDef {
  id: number;
}

export interface ApproachPhaseDef {
  id: number;
  kind: 'descent' | 'departure';
  poiId: string;
  subtitle?: string;
  fuelSeconds?: number;
  landingPoiId?: string;
  returnToOrbitalLevelId?: number;
  departureOrbitalLevelId?: number;
  exitAltitude?: number;
  thresholdApoapsisAltitude?: number;
  targetOrbitAltitude?: number;
  orbitDir?: 1 | -1;
}

export interface TransferSystemBodyDef {
  bodyId: string;
  patchRadius: number;
  displayPatchRadius?: number;
  arrivalAltitudeMin?: number;
  arrivalAltitudeMax?: number;
  arrivalSpeedMarginMin?: number;
  arrivalSpeedMarginMax?: number;
  arrivalOrbitalLevelId?: number;
}

export type OrbitalSeedDef =
  | {
    kind: 'localPoiOrbit';
    poiId: string;
    orbitAlt: number;
    orbitSense: 1 | -1;
  }
  | {
    kind: 'transferBodyOrbit';
    bodyId: string;
  };

export type OrbitalPhaseDef =
  | {
    id: number;
    kind: 'surfaceOrbit';
    poiId: string;
    name: string;
    subtitle: string;
    orbitAlt: number;
    reentryApproachLevelId: number;
    orbitSense: 1 | -1;
    fuelDeltaV?: number;
    thrustAccel?: number;
    thrustAccelMax?: number;
    showLandingSite?: boolean;
    orbitModeId?: string;
    escapeToOrbitalLevelId?: number;
    escapeTargetBodyId?: string;
    parentTransferPeriapsisAltitude?: number;
  }
  | {
    id: number;
    kind: 'stationOrbit';
    stationPoiId: string;
    name: string;
    subtitle: string;
    playerOrbitAlt: number;
    reentryApproachLevelId: number;
    startSense: 1 | -1;
    fuelDeltaV: number;
    dockingLevelId: number;
    showLandingSite?: boolean;
    orbitModeId?: string;
    escapeToOrbitalLevelId?: number;
    parentTransferPeriapsisAltitude?: number;
  }
  | {
    id: number;
    kind: 'systemTransfer';
    bodyId: string;
    name: string;
    subtitle: string;
    seed: OrbitalSeedDef;
    reentryApproachLevelId: number;
    fuelDeltaV: number;
    showLandingSite?: boolean;
    orbitModeId?: string;
    systemBodies: TransferSystemBodyDef[];
    targetBodyId: string;
    conicRadiusBodyId: string;
    conicRadiusScale: number;
  }
  | {
    id: number;
    kind: 'bodyArrival';
    bodyId: string;
    name: string;
    subtitle: string;
    reentryApproachLevelId: number;
    startAltitude: number;
    startExcessSpeed: number;
    startRadialVelocity: number;
    fuelDeltaV: number;
    showLandingSite?: boolean;
    escapeToOrbitalLevelId?: number;
  };

export const LANDING_PHASES: LandingPhaseDef[] = [];

export const APPROACH_PHASES: ApproachPhaseDef[] = [];

export const ORBITAL_PHASES: OrbitalPhaseDef[] = [];

