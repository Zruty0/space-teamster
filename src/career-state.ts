const CAREER_STORAGE_KEY = 'space-teamster.career.v1';

export interface CareerProfile {
  locationId: string;
  money: number;
  worldTime: number;
  /** Number of successfully completed Basic Teamster practicals, from 0 through 3. */
  basicCertificationStage: number;
}

export const CAREER_START_LOCATION_ID = 'caravanserai-main-commercial-dock';

export function defaultCareerProfile(): CareerProfile {
  return { locationId: CAREER_START_LOCATION_ID, money: 0, worldTime: 0, basicCertificationStage: 0 };
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
      basicCertificationStage: typeof parsed.basicCertificationStage === 'number' ? Math.max(0, Math.min(3, Math.floor(parsed.basicCertificationStage))) : 0,
    };
  } catch {
    return defaultCareerProfile();
  }
}

export function saveCareerProfile(profile: CareerProfile): void {
  localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(profile));
}

export function resetCareerProfile(): CareerProfile {
  const profile = defaultCareerProfile();
  saveCareerProfile(profile);
  return profile;
}
