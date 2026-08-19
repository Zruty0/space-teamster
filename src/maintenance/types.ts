export const MAINTENANCE_SYSTEM_IDS = [
  'body-frame',
  'powertrain',
  'steering-thrusters',
  'atmospheric-package',
  'landing-docking',
  'cab-controls',
  'auxiliary-systems',
] as const;

export type MaintenanceSystemId = typeof MAINTENANCE_SYSTEM_IDS[number];
export type ComponentGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type ShopGrade = ComponentGrade;
export type WorkGrade = ComponentGrade;
export type FaultSeverity = 'minor' | 'major' | 'total';
export type FaultDiagnosis = 'unknown' | 'suspected' | 'confirmed';
export type ComponentId = string;

export const TELEMETRY_SOURCE_IDS = [
  'standardMainDrive',
  'highMainDrive',
  'driveFiringDuration',
  'standardManeuvering',
  'highManeuvering',
  'brakingSas',
  'flightDuration',
  'passengerOccupancy',
  'loadedThrustStress',
  'freightHandling',
  'passengerService',
  'communications',
  'heatExposure',
  'severeHeatExposure',
  'aerodynamicLoading',
  'turbulenceExposure',
  'wingOperation',
  'surfaceOperation',
  'touchdownStress',
  'dockingOperation',
  'tractorCapture',
  'dockingCollision',
  'otherCollision',
  'atmosphericCollision',
] as const;

export type TelemetrySourceId = typeof TELEMETRY_SOURCE_IDS[number];

export interface FaultDefinition {
  id: string;
  name: string;
  severity: Exclude<FaultSeverity, 'total'>;
}

export interface FaultMultiplierDefinition {
  sourceIds: TelemetrySourceId[] | 'all';
  targetSystemId: MaintenanceSystemId;
  minor: number;
  major: number;
}

export interface RestrictionDefinition {
  minor?: RigRestrictionId[];
  major?: RigRestrictionId[];
  total?: RigRestrictionId[];
}

export interface ComponentDefinition {
  id: ComponentId;
  systemId: MaintenanceSystemId;
  name: string;
  function: string;
  baseHp: number;
  baseAp: number;
  baseCost: number;
  minorThreshold: number;
  majorThreshold: number;
  replacementLaborHours: number;
  faultLibraryIds: string[];
  locations: string[];
  localFaults: FaultDefinition[];
  faultMultipliers: FaultMultiplierDefinition[];
  restrictions: RestrictionDefinition;
}

export interface MaintenanceSystemDefinition {
  id: MaintenanceSystemId;
  name: string;
  optional: boolean;
  componentIds: ComponentId[];
}

export interface ActiveFaultState {
  severity: FaultSeverity;
  faultId?: string;
  locationId?: string;
  diagnosis: FaultDiagnosis;
  generatedMission: number;
  generatedStrike: number;
}

export interface InstalledComponentState {
  installed: boolean;
  grade: ComponentGrade;
  hp: number;
  ap: number;
  fault?: ActiveFaultState;
  lastServiceWorldTime?: number;
  lastServiceMission?: number;
}

export interface CareerRigState {
  schemaVersion: 1;
  rngState: number;
  completedMaintenanceMissions: number;
  components: Record<ComponentId, InstalledComponentState>;
}

export const RIG_RESTRICTION_IDS = [
  'grounded',
  'high-thrust-unavailable',
  'braking-sas-unavailable',
  'wings-unavailable',
  'freight-unavailable',
  'passenger-unavailable',
  'surface-landing-unavailable',
  'station-docking-unavailable',
  'atmospheric-work-unavailable',
] as const;

export type RigRestrictionId = typeof RIG_RESTRICTION_IDS[number];

export interface RigRestriction {
  id: RigRestrictionId;
  componentId?: ComponentId;
  reason: string;
}

export type RigSystemStatus = 'ok' | 'warning' | 'alert';

export interface RigValidationWarning {
  path: string;
  message: string;
}

export interface MaintenanceTelemetryAccumulator {
  standardMainDriveDv: number;
  highMainDriveDv: number;
  distortedDriveFiringSeconds: number;
  standardManeuverDv: number;
  highManeuverDv: number;
  distortedSasSeconds: number;
  distortedFlightSeconds: number;
  distortedPassengerSeconds: number;
  heatIntegral: number;
  severeHeatIntegral: number;
  aerodynamicLoadIntegral: number;
  distortedTurbulenceSeconds: number;
  wingTravelRadians: number;
  surfaceCycles: number;
  touchdownStress: number;
  dockingCycles: number;
  tractorCaptures: number;
  dockingCollisionStress: number;
  otherCollisionStress: number;
  atmosphericCollisionStress: number;
  observedWarpMin: number;
  observedWarpMax: number;
  wallFlightSeconds: number;
}

export interface MissionTelemetryContext {
  missionId: string;
  title: string;
  sourceId?: string;
  destinationId?: string;
  manifestKind: 'freight' | 'passenger' | 'empty';
  manifestMassTons: number;
  attempt: number;
  startWorldTime: number;
}

export interface NormalizedTelemetry {
  sourceUnits: Record<TelemetrySourceId, number>;
}

export interface TelemetryContribution {
  sourceId: TelemetrySourceId;
  systemId: MaintenanceSystemId;
  units: number;
  coefficient: number;
  baseWeight: number;
  multiplier: number;
  adjustedWeight: number;
}

export interface StrikeLedgerEntry {
  index: number;
  systemRoll: number;
  systemId: MaintenanceSystemId;
  componentRoll: number;
  componentId: ComponentId;
  apHitProbability: number;
  apHpRoll: number;
  hpBefore: number;
  hpAfter: number;
  apBefore: number;
  apAfter: number;
  crossedThreshold?: FaultSeverity;
  faultRoll?: number;
  faultId?: string;
  faultName?: string;
  locationRoll?: number;
  locationId?: string;
}

export type MaintenanceLedgerStatus = 'current' | 'discarded' | 'pending' | 'committed';

export interface MaintenanceLedger {
  id: string;
  status: MaintenanceLedgerStatus;
  context: MissionTelemetryContext;
  completionWorldTime?: number;
  raw: MaintenanceTelemetryAccumulator;
  normalized: NormalizedTelemetry;
  contributions: TelemetryContribution[];
  baseSystemWeights: Record<MaintenanceSystemId, number>;
  adjustedSystemWeights: Record<MaintenanceSystemId, number>;
  mean: number;
  rngStateBefore: number;
  rngStateAfter: number;
  poissonRolls: number[];
  strikeCount: number;
  strikes: StrikeLedgerEntry[];
  retryNote?: string;
}

export interface PendingMaintenanceSettlement {
  ledger: MaintenanceLedger;
  resultingRig: CareerRigState;
}

export interface MaintenanceDebugSnapshot {
  rig: CareerRigState;
  validationWarnings: RigValidationWarning[];
  restrictions: RigRestriction[];
  currentLedger?: MaintenanceLedger;
  pendingLedger?: MaintenanceLedger;
  committedLedgers: MaintenanceLedger[];
}
