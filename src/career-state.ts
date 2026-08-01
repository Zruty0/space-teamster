const CAREER_STORAGE_KEY = 'space-teamster.career.v1';

export const TEAMSTER_CERTIFICATION_IDS = ['basic-1', 'basic-2', 'basic-3'] as const;
export type TeamsterCertificationId = typeof TEAMSTER_CERTIFICATION_IDS[number];

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
  for (const certification of TEAMSTER_CERTIFICATION_IDS) {
    if (!profile.certifications.includes(certification)) break;
    stage++;
  }
  return stage;
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
