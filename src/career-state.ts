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

export interface CareerProfile {
  locationId: string;
  money: number;
  worldTime: number;
  certifications: TeamsterCertificationId[];
}

export const CAREER_START_LOCATION_ID = 'caravanserai-main-commercial-dock';

export function defaultCareerProfile(): CareerProfile {
  return { locationId: CAREER_START_LOCATION_ID, money: 0, worldTime: 0, certifications: [] };
}

function isTeamsterCertificationId(value: unknown): value is TeamsterCertificationId {
  return typeof value === 'string' && TEAMSTER_CERTIFICATION_IDS.includes(value as TeamsterCertificationId);
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
    return {
      locationId: parsed.locationId,
      money: parsed.money,
      worldTime: typeof parsed.worldTime === 'number' ? parsed.worldTime : 0,
      certifications: migratedCertifications(parsed),
    };
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
