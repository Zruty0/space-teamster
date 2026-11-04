import { inheritedReputationLevel, INHERITED_REPUTATION_RULES, isReputationId, reputationStanding, type InheritedReputationEmployer, type ReputationId, type ReputationLevel, type ReputationState } from './reputation';

/** Stable employer/provider identity, never guessed from company names or endpoints.
 * Recognition is read-only; explicit earning and access policies live in contract-work-policy/reputation.
 */
const OWN_TRACK_TAGS = {
  ALVARES: 'house-alvares', MENDES: 'house-mendes', NUNES: 'house-nunes',
  STEEL: 'steel-combine', VHM: 'voss-heinkel-metricwerke', KIS: 'kisaragi',
  COVENANT: 'covenant-remnants', DAEDALUS: 'daedalus-systems', CHR: 'cerberus-human-resources',
  BAM: 'balor-advanced-materials', MERREN: 'merren-conservatory',
} as const satisfies Record<string, ReputationId>;

export const EMPLOYER_REPUTATION_PROVIDER_KEYS = {
  'house-alvares': 'ALVARES', 'house-mendes': 'MENDES', 'house-nunes': 'NUNES',
  'steel-combine': 'STEEL', 'voss-heinkel-metricwerke': 'VHM', 'kisaragi-harmony-yards': 'KIS',
  'covenant-remnants': 'COVENANT', 'daedalus-systems': 'DAEDALUS', 'cerberus-human-resources': 'CHR',
  'balor-advanced-materials': 'BAM', 'merren-conservatory': 'MERREN',
  'bruckner-field-services': 'BFS', 'kisaragi-yards-estella': 'KIS-E',
  'oathmark-accord-authority': 'ACCORD', 'wells-noble-houses': 'NOBLE',
  'halloran-smelting-house': 'HALL', 'hartwell-shipping-companies': 'HSC',
  'new-canaan-miners-mutual': 'CO-OP', 'svarog-yard-company': 'SSC',
  'estella-government': 'GOV', 'estella-defence-force': 'EDF', 'estella-institute-of-planetology': 'EIP',
  // Shared commercial recognition does not merge these independent firms/pools.
  'glitterfield-miners': 'COMMERCIAL', 'pike-mining-companies': 'COMMERCIAL',
  'cinderhook-refining-houses': 'COMMERCIAL', 'roadstead-export-brokers': 'COMMERCIAL',
  'hartwell-machinery-brokers': 'COMMERCIAL', 'hartwell-labor-exchange': 'COMMERCIAL',
  'teamsters-guild': 'COMMERCIAL',
  'gaia-civilian-bookings': 'GOV', 'dahai-civilian-bookings': 'GOV',
  'camps-civilian-bookings': 'GOV', 'sahra-civilian-bookings': 'GOV', 'weymark-independent-operators': 'GOV',
} as const satisfies Record<string, keyof typeof OWN_TRACK_TAGS | InheritedReputationEmployer>;

/** All current public providers have explicit recognition; this does not imply ownership. */
export const UNASSIGNED_REPUTATION_PROVIDERS: readonly string[] = [];

/** Full completed level for an independent track, employer tag, or stable provider ID.
 * Undefined means no assigned rule, not level zero. Names/locations are not aliases.
 * Own tracks and BFS/KIS-E exceptions take precedence over generic capped recognition.
 */
export function employerReputationLevel(state: ReputationState | undefined, employer: string): ReputationLevel | undefined {
  if (isReputationId(employer)) return reputationStanding(state, employer).level;
  const key = Object.prototype.hasOwnProperty.call(EMPLOYER_REPUTATION_PROVIDER_KEYS, employer)
    ? EMPLOYER_REPUTATION_PROVIDER_KEYS[employer as keyof typeof EMPLOYER_REPUTATION_PROVIDER_KEYS] : employer;
  if (Object.prototype.hasOwnProperty.call(OWN_TRACK_TAGS, key)) {
    return reputationStanding(state, OWN_TRACK_TAGS[key as keyof typeof OWN_TRACK_TAGS]).level;
  }
  if (Object.prototype.hasOwnProperty.call(INHERITED_REPUTATION_RULES, key)) {
    return inheritedReputationLevel(state, key as InheritedReputationEmployer);
  }
  return undefined;
}
