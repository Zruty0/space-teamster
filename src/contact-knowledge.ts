import { saveCareerProfile, type CareerProfile } from './career-state';
import { LOCAL_DIRECTORY_ENTRIES, type LocalContactDef } from './local-directory';

/** Contacts are mission-giving people, not named shop staff or institutional offices. */
export function missionContacts(): LocalContactDef[] {
  return LOCAL_DIRECTORY_ENTRIES.filter((entry): entry is LocalContactDef =>
    entry.kind === 'contact' && !!entry.factionId && !!entry.missionTags?.length);
}
export function knownMissionContacts(profile: Pick<CareerProfile, 'knownContactIds'>): LocalContactDef[] {
  const known = new Set(profile.knownContactIds ?? []);
  return missionContacts().filter(contact => known.has(contact.id));
}
export function contactSummary(contacts: readonly Pick<LocalContactDef, 'id' | 'name'>[]): string | undefined {
  const unique = [...new Map(contacts.map(contact => [contact.id, contact])).values()];
  return unique.length === 1 ? unique[0].name : unique.length > 1 ? `${unique.length} contacts` : undefined;
}
/** Atomic knowledge acquisition; callers publish the result only after save succeeds. */
export function learnMissionContacts(profile: CareerProfile, ids: readonly string[]): CareerProfile {
  const valid = new Set(missionContacts().map(contact => contact.id));
  const known = new Set(profile.knownContactIds ?? []);
  const additions = ids.filter(id => valid.has(id) && !known.has(id));
  if (!additions.length) return profile;
  const next = { ...profile, knownContactIds: [...new Set([...known, ...additions])] };
  saveCareerProfile(next);
  return next;
}
