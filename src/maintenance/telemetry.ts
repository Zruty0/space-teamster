import { MAINTENANCE_COMPONENTS } from './catalog';
import type {
  CareerRigState,
  MaintenanceSystemId,
  MaintenanceTelemetryAccumulator,
  MissionTelemetryContext,
  NormalizedTelemetry,
  TelemetryContribution,
  TelemetrySourceId,
} from './types';
import { MAINTENANCE_SYSTEM_IDS, TELEMETRY_SOURCE_IDS } from './types';

export function createMaintenanceTelemetry(): MaintenanceTelemetryAccumulator {
  return {
    standardMainDriveDv: 0,
    highMainDriveDv: 0,
    distortedDriveFiringSeconds: 0,
    standardManeuverDv: 0,
    highManeuverDv: 0,
    distortedSasSeconds: 0,
    distortedFlightSeconds: 0,
    distortedPassengerSeconds: 0,
    heatIntegral: 0,
    severeHeatIntegral: 0,
    aerodynamicLoadIntegral: 0,
    distortedTurbulenceSeconds: 0,
    wingTravelRadians: 0,
    surfaceCycles: 0,
    touchdownStress: 0,
    dockingCycles: 0,
    tractorCaptures: 0,
    dockingCollisionStress: 0,
    otherCollisionStress: 0,
    atmosphericCollisionStress: 0,
    observedWarpMin: 1,
    observedWarpMax: 1,
    wallFlightSeconds: 0,
  };
}

export function cloneMaintenanceTelemetry(value: MaintenanceTelemetryAccumulator): MaintenanceTelemetryAccumulator {
  return { ...value };
}

export function warpDistortion(userWarp: number): number {
  return 1 + 0.5 * Math.log10(Math.max(1, userWarp));
}

export interface FlightTelemetryStep {
  wallDt: number;
  userWarp?: number;
  passengerOccupied?: boolean;
  standardMainDriveDv?: number;
  highMainDriveDv?: number;
  mainDriveFiring?: boolean;
  standardManeuverDv?: number;
  highManeuverDv?: number;
  sasFiring?: boolean;
  atmospheric?: boolean;
  temperature?: number;
  aerodynamicAcceleration?: number;
  turbulence?: boolean;
  wingTravelRadians?: number;
}

export function accumulateFlightTelemetry(accumulator: MaintenanceTelemetryAccumulator, step: FlightTelemetryStep): void {
  const wallDt = Math.max(0, step.wallDt);
  const userWarp = Math.max(1, step.userWarp ?? 1);
  const distortedDt = wallDt * warpDistortion(userWarp);
  accumulator.wallFlightSeconds += wallDt;
  accumulator.distortedFlightSeconds += distortedDt;
  if (step.passengerOccupied) accumulator.distortedPassengerSeconds += distortedDt;
  accumulator.observedWarpMin = Math.min(accumulator.observedWarpMin, userWarp);
  accumulator.observedWarpMax = Math.max(accumulator.observedWarpMax, userWarp);
  accumulator.standardMainDriveDv += Math.max(0, step.standardMainDriveDv ?? 0);
  accumulator.highMainDriveDv += Math.max(0, step.highMainDriveDv ?? 0);
  accumulator.standardManeuverDv += Math.max(0, step.standardManeuverDv ?? 0);
  accumulator.highManeuverDv += Math.max(0, step.highManeuverDv ?? 0);
  if (step.mainDriveFiring) accumulator.distortedDriveFiringSeconds += distortedDt;
  if (step.sasFiring) accumulator.distortedSasSeconds += distortedDt;
  accumulator.wingTravelRadians += Math.max(0, step.wingTravelRadians ?? 0);
  if (step.atmospheric) {
    const temperature = Math.max(0, step.temperature ?? 0);
    const severe = Math.max(0, (temperature - 0.8) / 0.2);
    const aeroG = Math.max(0, step.aerodynamicAcceleration ?? 0) / 9.80665;
    accumulator.heatIntegral += temperature * temperature * distortedDt;
    accumulator.severeHeatIntegral += severe * severe * distortedDt;
    accumulator.aerodynamicLoadIntegral += aeroG * aeroG * distortedDt;
    if (step.turbulence) accumulator.distortedTurbulenceSeconds += distortedDt;
  }
}

const COEFFICIENTS: Readonly<Partial<Record<TelemetrySourceId, Partial<Record<MaintenanceSystemId, number>>>>> = {
  standardMainDrive: { 'body-frame': 0.04, powertrain: 0.14, 'cab-controls': 0.02 },
  highMainDrive: { 'body-frame': 0.08, powertrain: 0.30, 'cab-controls': 0.03 },
  driveFiringDuration: { powertrain: 0.06, 'auxiliary-systems': 0.02 },
  standardManeuvering: { 'body-frame': 0.02, 'steering-thrusters': 0.10, 'cab-controls': 0.02 },
  highManeuvering: { 'body-frame': 0.04, 'steering-thrusters': 0.20, 'cab-controls': 0.02 },
  brakingSas: { 'steering-thrusters': 0.04, 'cab-controls': 0.01 },
  flightDuration: { 'cab-controls': 0.06, 'auxiliary-systems': 0.08 },
  passengerOccupancy: { 'auxiliary-systems': 0.05 },
  loadedThrustStress: { 'body-frame': 0.05, 'auxiliary-systems': 0.03 },
  freightHandling: { 'body-frame': 0.01, 'auxiliary-systems': 0.05 },
  passengerService: { 'auxiliary-systems': 0.04 },
  communications: { 'auxiliary-systems': 0.02 },
  heatExposure: { 'body-frame': 0.01, powertrain: 0.02, 'atmospheric-package': 0.10, 'auxiliary-systems': 0.01 },
  severeHeatExposure: { 'body-frame': 0.05, powertrain: 0.10, 'atmospheric-package': 0.30, 'cab-controls': 0.05, 'auxiliary-systems': 0.05 },
  aerodynamicLoading: { 'body-frame': 0.03, 'steering-thrusters': 0.02, 'atmospheric-package': 0.08 },
  turbulenceExposure: { 'body-frame': 0.03, 'steering-thrusters': 0.03, 'atmospheric-package': 0.05, 'cab-controls': 0.01 },
  wingOperation: { 'atmospheric-package': 0.03, 'cab-controls': 0.01 },
  surfaceOperation: { 'body-frame': 0.01, 'landing-docking': 0.05 },
  touchdownStress: { 'body-frame': 0.15, 'steering-thrusters': 0.05, 'landing-docking': 0.35, 'auxiliary-systems': 0.05 },
  dockingOperation: { 'body-frame': 0.01, 'landing-docking': 0.05, 'auxiliary-systems': 0.01 },
  tractorCapture: { 'body-frame': 0.01, 'landing-docking': 0.07 },
  dockingCollision: { 'body-frame': 0.12, 'steering-thrusters': 0.08, 'landing-docking': 0.30, 'auxiliary-systems': 0.05 },
  otherCollision: { 'body-frame': 0.45, powertrain: 0.05, 'steering-thrusters': 0.15, 'landing-docking': 0.10, 'cab-controls': 0.05, 'auxiliary-systems': 0.10 },
  atmosphericCollision: { 'atmospheric-package': 0.10 },
};

function emptySystemWeights(): Record<MaintenanceSystemId, number> {
  return Object.fromEntries(MAINTENANCE_SYSTEM_IDS.map(id => [id, 0])) as Record<MaintenanceSystemId, number>;
}

export function normalizeTelemetry(raw: MaintenanceTelemetryAccumulator, context: MissionTelemetryContext, includeSettlementCycles = true): NormalizedTelemetry {
  const totalThrustDv = raw.standardMainDriveDv + raw.highMainDriveDv + raw.standardManeuverDv + raw.highManeuverDv;
  const sourceUnits = Object.fromEntries(TELEMETRY_SOURCE_IDS.map(id => [id, 0])) as Record<TelemetrySourceId, number>;
  Object.assign(sourceUnits, {
    standardMainDrive: raw.standardMainDriveDv / 1000,
    highMainDrive: raw.highMainDriveDv / 1000,
    driveFiringDuration: raw.distortedDriveFiringSeconds / 300,
    standardManeuvering: raw.standardManeuverDv / 100,
    highManeuvering: raw.highManeuverDv / 100,
    brakingSas: raw.distortedSasSeconds / 60,
    flightDuration: raw.distortedFlightSeconds / 600,
    passengerOccupancy: raw.distortedPassengerSeconds / 600,
    loadedThrustStress: (Math.max(0, context.manifestMassTons) / 30) * (totalThrustDv / 1000),
    freightHandling: includeSettlementCycles && context.manifestKind === 'freight' ? 1 : 0,
    passengerService: includeSettlementCycles && context.manifestKind === 'passenger' ? 1 : 0,
    communications: includeSettlementCycles ? 1 : 0,
    heatExposure: raw.heatIntegral / 30,
    severeHeatExposure: raw.severeHeatIntegral / 10,
    aerodynamicLoading: raw.aerodynamicLoadIntegral / 30,
    turbulenceExposure: raw.distortedTurbulenceSeconds / 30,
    wingOperation: raw.wingTravelRadians / 10,
    surfaceOperation: raw.surfaceCycles,
    touchdownStress: raw.touchdownStress,
    dockingOperation: raw.dockingCycles,
    tractorCapture: raw.tractorCaptures,
    dockingCollision: raw.dockingCollisionStress,
    otherCollision: raw.otherCollisionStress,
    atmosphericCollision: raw.atmosphericCollisionStress,
  });
  return { sourceUnits };
}

function contributionMultiplier(rig: CareerRigState, sourceId: TelemetrySourceId, systemId: MaintenanceSystemId): number {
  let value = 1;
  for (const component of MAINTENANCE_COMPONENTS) {
    const state = rig.components[component.id];
    if (!state?.installed || !state.fault || state.fault.severity === 'total') continue;
    for (const effect of component.faultMultipliers) {
      if (effect.targetSystemId !== systemId) continue;
      if (effect.sourceIds !== 'all' && !effect.sourceIds.includes(sourceId)) continue;
      value *= state.fault.severity === 'minor' ? effect.minor : effect.major;
    }
  }
  return value;
}

export function calculateTelemetryWeights(raw: MaintenanceTelemetryAccumulator, context: MissionTelemetryContext, rig: CareerRigState, includeSettlementCycles = true): {
  normalized: NormalizedTelemetry;
  contributions: TelemetryContribution[];
  baseSystemWeights: Record<MaintenanceSystemId, number>;
  adjustedSystemWeights: Record<MaintenanceSystemId, number>;
  mean: number;
} {
  const normalized = normalizeTelemetry(raw, context, includeSettlementCycles);
  const contributions: TelemetryContribution[] = [];
  const baseSystemWeights = emptySystemWeights();
  const adjustedSystemWeights = emptySystemWeights();
  for (const sourceId of TELEMETRY_SOURCE_IDS) {
    const units = normalized.sourceUnits[sourceId];
    for (const systemId of MAINTENANCE_SYSTEM_IDS) {
      const coefficient = COEFFICIENTS[sourceId]?.[systemId] ?? 0;
      const baseWeight = units * coefficient;
      const multiplier = contributionMultiplier(rig, sourceId, systemId);
      const systemInstalled = MAINTENANCE_COMPONENTS.some(component => component.systemId === systemId && rig.components[component.id]?.installed);
      const adjustedWeight = systemInstalled ? baseWeight * multiplier : 0;
      contributions.push({ sourceId, systemId, units, coefficient, baseWeight, multiplier, adjustedWeight });
      baseSystemWeights[systemId] += baseWeight;
      adjustedSystemWeights[systemId] += adjustedWeight;
    }
  }
  const mean = MAINTENANCE_SYSTEM_IDS.reduce((sum, id) => sum + adjustedSystemWeights[id], 0);
  return { normalized, contributions, baseSystemWeights, adjustedSystemWeights, mean };
}

export function cleanTelemetryFixture(): { raw: MaintenanceTelemetryAccumulator; context: MissionTelemetryContext } {
  const raw = createMaintenanceTelemetry();
  raw.standardMainDriveDv = 900;
  raw.highMainDriveDv = 100;
  raw.distortedDriveFiringSeconds = 300;
  raw.standardManeuverDv = 100;
  raw.distortedSasSeconds = 30;
  raw.distortedFlightSeconds = 600;
  raw.surfaceCycles = 0;
  raw.dockingCycles = 2;
  raw.tractorCaptures = 1;
  return {
    raw,
    context: { missionId: 'clean-fixture', title: 'Clean fixture', manifestKind: 'freight', manifestMassTons: 30, attempt: 1, startWorldTime: 0 },
  };
}
