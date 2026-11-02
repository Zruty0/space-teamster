import { canonicalEstellaLocationId } from './content/estella/location-aliases';
import { createDefaultNunesInquiryState, migrateNunesInquiryState, type NunesInquiryState } from './content/estella/faction-contracts/nunes-inquiries';
import { createDefaultRigState, migrateRigState } from './maintenance/rig-state';
import { MAINTENANCE_SYSTEM_IDS, type CareerRigState, type FabricatedFaultClaim, type MaintenanceSystemId } from './maintenance/types';
import { normalizeReputations, type ReputationState } from './reputation';

const CAREER_STORAGE_KEY = 'space-teamster.career.v1';

export const TEAMSTER_CERTIFICATION_IDS = [
  'basic-1',
  'basic-2',
  'basic-3',
  'line',
  'thin-atmosphere',
  'thick-atmosphere',
  'fragile-cargo',
  'volatile-cargo',
  'passenger',
] as const;
export type TeamsterCertificationId = typeof TEAMSTER_CERTIFICATION_IDS[number];
export type TeamsterRank = 'Teamster Trainee' | 'Junior Teamster' | 'Teamster';

export interface PurchasableTeamsterLicense {
  certificationId: Extract<TeamsterCertificationId, 'fragile-cargo' | 'volatile-cargo' | 'passenger'>;
  name: string;
  price: number;
  requiresCertification: Extract<TeamsterCertificationId, 'basic-3' | 'line'>;
}

export const PURCHASABLE_TEAMSTER_LICENSES: readonly PurchasableTeamsterLicense[] = [
  { certificationId: 'fragile-cargo', name: 'Fragile Cargo License', price: 5_000, requiresCertification: 'line' },
  { certificationId: 'volatile-cargo', name: 'Volatile Cargo License', price: 40_000, requiresCertification: 'basic-3' },
  { certificationId: 'passenger', name: 'Passenger License', price: 25_000, requiresCertification: 'basic-3' },
];

export interface MaintenanceShopInspectionState {
  diagnosedWorldTime: number;
  // Missing on legacy reports: condition freshness cannot be established.
  diagnosedMaintenanceMission?: number;
  creditRemaining: number;
  dishonestyRevision: number;
  fabricatedFaults: FabricatedFaultClaim[];
  fabricatedServiceComponentIds: string[];
  pretendMaintainedComponentIds: string[];
}

export interface CareerProfile {
  locationId: string;
  money: number;
  worldTime: number;
  certifications: TeamsterCertificationId[];
  rig: CareerRigState;
  maintenanceShopInspections: Record<string, MaintenanceShopInspectionState>;
  nunesInquiries: NunesInquiryState;
  /** Mission-giving people learned through introductions, never inferred from visits. */
  knownContactIds?: string[];
  /** Optional for old profiles; load/default fills missing tracks at zero. */
  reputations?: ReputationState;
}

export const CAREER_START_LOCATION_ID = 'caravanserai-main-commercial-dock';

export function defaultCareerProfile(): CareerProfile {
  return { locationId: CAREER_START_LOCATION_ID, money: 0, worldTime: 0, certifications: [], knownContactIds: [], reputations: normalizeReputations(undefined), rig: createDefaultRigState(false), maintenanceShopInspections: {}, nunesInquiries: createDefaultNunesInquiryState(0) };
}

function isTeamsterCertificationId(value: unknown): value is TeamsterCertificationId {
  return typeof value === 'string' && TEAMSTER_CERTIFICATION_IDS.includes(value as TeamsterCertificationId);
}

function migratedFabricatedFaults(value: unknown): FabricatedFaultClaim[] {
  if (!Array.isArray(value)) return [];
  const claims: FabricatedFaultClaim[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const claim = raw as Partial<FabricatedFaultClaim>;
    if (typeof claim.id !== 'string' || !claim.id || ids.has(claim.id)
      || typeof claim.systemId !== 'string' || !MAINTENANCE_SYSTEM_IDS.includes(claim.systemId as MaintenanceSystemId)
      || typeof claim.componentId !== 'string' || !claim.componentId
      || typeof claim.faultId !== 'string' || !claim.faultId) continue;
    ids.add(claim.id);
    claims.push({
      id: claim.id,
      systemId: claim.systemId as MaintenanceSystemId,
      componentId: claim.componentId,
      faultId: claim.faultId,
      ...(typeof claim.locationId === 'string' && claim.locationId ? { locationId: claim.locationId } : {}),
      statusActive: claim.statusActive !== false,
    });
  }
  return claims;
}

function migratedComponentIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && !!id))];
}

const MAINTENANCE_SHOP_ID_MIGRATIONS: Readonly<Record<string, string>> = {
  'serrat-domain-shipyard-service-yard': 'vilar-gryphon-aerie-outfitter',
};

function migratedShopInspections(parsed: any): Record<string, MaintenanceShopInspectionState> {
  if (!parsed?.maintenanceShopInspections || typeof parsed.maintenanceShopInspections !== 'object') return {};
  return Object.fromEntries(Object.entries(parsed.maintenanceShopInspections).flatMap(([shopId, raw]) => {
    const migratedShopId = MAINTENANCE_SHOP_ID_MIGRATIONS[shopId] ?? shopId;
    const inspection = raw as Partial<MaintenanceShopInspectionState> | null;
    if (!inspection || typeof inspection.diagnosedWorldTime !== 'number' || !Number.isFinite(inspection.diagnosedWorldTime)) return [];
    const creditRemaining = typeof inspection.creditRemaining === 'number' && Number.isFinite(inspection.creditRemaining)
      ? Math.max(0, Math.floor(inspection.creditRemaining))
      : 0;
    return [[migratedShopId, {
      diagnosedWorldTime: inspection.diagnosedWorldTime,
      ...(typeof inspection.diagnosedMaintenanceMission === 'number'
        && Number.isSafeInteger(inspection.diagnosedMaintenanceMission) && inspection.diagnosedMaintenanceMission >= 0
        ? { diagnosedMaintenanceMission: inspection.diagnosedMaintenanceMission } : {}),
      creditRemaining,
      dishonestyRevision: typeof inspection.dishonestyRevision === 'number' && Number.isFinite(inspection.dishonestyRevision)
        ? Math.max(0, Math.floor(inspection.dishonestyRevision))
        : 0,
      fabricatedFaults: migratedFabricatedFaults(inspection.fabricatedFaults),
      fabricatedServiceComponentIds: migratedComponentIds(inspection.fabricatedServiceComponentIds),
      pretendMaintainedComponentIds: migratedComponentIds(inspection.pretendMaintainedComponentIds),
    }]];
  }));
}

function migratedCertifications(parsed: any): TeamsterCertificationId[] {
  const certifications = Array.isArray(parsed?.certifications)
    ? parsed.certifications.filter(isTeamsterCertificationId)
    : [];
  const legacyStage = typeof parsed?.basicCertificationStage === 'number'
    ? Math.max(0, Math.min(3, Math.floor(parsed.basicCertificationStage)))
    : 0;
  for (let stage = 1; stage <= legacyStage; stage++) {
    const certification = `basic-${stage}` as TeamsterCertificationId;
    if (!certifications.includes(certification)) certifications.push(certification);
  }
  return TEAMSTER_CERTIFICATION_IDS.filter(certification => certifications.includes(certification));
}

export function loadCareerProfile(): CareerProfile {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return defaultCareerProfile();
    const parsed = JSON.parse(raw);
    if (typeof parsed?.locationId !== 'string' || typeof parsed?.money !== 'number') return defaultCareerProfile();
    const certifications = migratedCertifications(parsed);
    const profile: CareerProfile = {
      // Resume retired Balor/Orselle locations at their current physical site
      // without resetting progress or rewriting contracts and flight history.
      locationId: canonicalEstellaLocationId(parsed.locationId === 'estella-i-deep-listening' ? 'estella-i-worker-hab' : parsed.locationId),
      money: parsed.money,
      worldTime: typeof parsed.worldTime === 'number' ? parsed.worldTime : 0,
      certifications,
      reputations: normalizeReputations(parsed.reputations),
      // Pre-contact-knowledge careers that completed Gid's practicals already
      // know him. An explicit empty list on a newer save remains authoritative.
      knownContactIds: Array.isArray(parsed.knownContactIds)
        ? migratedComponentIds(parsed.knownContactIds)
        : parsed.knownContactIds === undefined && certifications.some(id => ['basic-1', 'basic-2', 'basic-3', 'line'].includes(id))
          ? ['gideon-gid-bell'] : [],
      rig: migrateRigState(parsed.rig, certifications.includes('thin-atmosphere') || certifications.includes('thick-atmosphere')),
      maintenanceShopInspections: migratedShopInspections(parsed),
      nunesInquiries: migrateNunesInquiryState(parsed.nunesInquiries, typeof parsed.worldTime === 'number' ? parsed.worldTime : 0),
    };
    if (parsed.rig?.schemaVersion !== profile.rig.schemaVersion) {
      // Persist the one-time thermal-equipment migration without losing a loaded
      // career if browser storage is temporarily unavailable.
      try { saveCareerProfile(profile); } catch { /* retry on the next career save */ }
    }
    return profile;
  } catch {
    return defaultCareerProfile();
  }
}

export function hasTeamsterCertification(profile: Pick<CareerProfile, 'certifications'>, certification: TeamsterCertificationId): boolean {
  return profile.certifications.includes(certification);
}

export function basicTeamsterCertificationStage(profile: Pick<CareerProfile, 'certifications'>): number {
  let stage = 0;
  for (const certification of ['basic-1', 'basic-2', 'basic-3'] as const) {
    if (!profile.certifications.includes(certification)) break;
    stage++;
  }
  return stage;
}

export function teamsterRank(profile: Pick<CareerProfile, 'certifications'>): TeamsterRank {
  if (profile.certifications.includes('line')) return 'Teamster';
  if (profile.certifications.includes('basic-3')) return 'Junior Teamster';
  return 'Teamster Trainee';
}

export function teamsterCertificationName(certification: TeamsterCertificationId): string {
  const names: Record<TeamsterCertificationId, string> = {
    'basic-1': 'Basic 1 Practical',
    'basic-2': 'Basic 2 Practical',
    'basic-3': 'Basic Certification',
    line: 'Line Certification',
    'thin-atmosphere': 'Thin-Atmosphere Endorsement',
    'thick-atmosphere': 'Thick-Atmosphere Endorsement',
    'fragile-cargo': 'Fragile Cargo License',
    'volatile-cargo': 'Volatile Cargo License',
    passenger: 'Passenger License',
  };
  return names[certification];
}

export function awardTeamsterCertification(profile: CareerProfile, certification: TeamsterCertificationId): void {
  if (profile.certifications.includes(certification)) return;
  profile.certifications.push(certification);
  profile.certifications = TEAMSTER_CERTIFICATION_IDS.filter(id => profile.certifications.includes(id));
}

export function saveCareerProfile(profile: CareerProfile): void {
  localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(profile));
}

export function resetCareerProfile(): CareerProfile {
  const profile = defaultCareerProfile();
  saveCareerProfile(profile);
  return profile;
}
