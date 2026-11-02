/** Standing model only. No awards, contract gates, pricing or access effects. */
export const REPUTATION_TRACKS = [
  { id: 'house-alvares', name: 'House Alvares', titles: ['Unpresented Stranger', 'Carrier by Ducal Warrant', 'Favoured Client of the Court', 'Intimate of the Ducal Household'] },
  { id: 'house-mendes', name: 'House Mendes', titles: ['Unproven Outsider', 'Provisioner to the Banners', 'Honoured Ally of the House', 'Companion of the Marshal’s Table'] },
  { id: 'house-nunes', name: 'House Nunes', titles: ['Unintroduced Stranger', 'Bearer of the Watch Warrant', 'Esteemed Friend of the Outer Watch', 'Keeper of the House’s Confidence'] },
  { id: 'steel-combine', name: 'Steel Combine', titles: ['Unaffiliated Worker', 'Registered Sympathizer', 'Honorary Citizen', 'Honorary Udarnik'] },
  { id: 'voss-heinkel-metricwerke', name: 'Voss-Heinkel Metricwerke', titles: ['Unrated Operator', 'Field-Proven Contractor', 'Factory-Warranted Carrier', 'Partner of the Works'] },
  { id: 'kisaragi', name: 'Kisaragi', titles: ['Unproven Hand', 'Proven Hand', 'Carrier of the Marque', 'Honoured Friend of the House'] },
  { id: 'covenant-remnants', name: 'Covenant Remnants', titles: ['Unsealed Stranger', 'Guest at the Gate', 'Friend of the Covenant', 'Unsealed Kindred'] },
  { id: 'daedalus-systems', name: 'Daedalus Systems', titles: ['Unknown Quantity', 'Known Quantity', 'Authorized Contractor', 'Authorized Partner'] },
  { id: 'cerberus-human-resources', name: 'Cerberus Human Resources', titles: ['Unverified Asset', 'Verified Asset', 'Trusted Instrument', 'Friend of the Board'] },
  { id: 'balor-advanced-materials', name: 'Balor Advanced Materials', titles: ['Unrated contractor', 'Rated contractor', 'Trusted contractor'] },
  { id: 'merren-conservatory', name: 'Merren Conservatory', titles: ['Unrated contractor', 'Rated contractor', 'Trusted contractor'] },
  { id: 'smuggler-notoriety', name: 'Notoriety', titles: ['No Name', 'Safe Pair of Hands', 'A Name Worth Trusting', 'One of Our Own'] },
] as const;

export type ReputationId = typeof REPUTATION_TRACKS[number]['id'];
export type ReputationLevel = 0 | 1 | 2 | 3;
/** Bar units, not an XP/reward economy: 1.5 is rank 1 and half of the second bar. */
export type ReputationState = Record<ReputationId, number>;
export type ReputationEditResult = 'saved' | 'unchanged' | 'invalid' | 'save-failed';

export function isReputationId(id: unknown): id is ReputationId {
  return REPUTATION_TRACKS.some(track => track.id === id);
}

export function reputationMaxLevel(id: ReputationId): 2 | 3 {
  return (REPUTATION_TRACKS.find(track => track.id === id)!.titles.length - 1) as 2 | 3;
}

export function normalizedReputation(value: unknown, maxLevel: 2 | 3 = 3): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(maxLevel, value)) : 0;
}

/** Missing/partial legacy saves start unknown; never infer standing from completed work. */
export function normalizeReputations(value: unknown): ReputationState {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(REPUTATION_TRACKS.map(track => [track.id,
    normalizedReputation(Object.prototype.hasOwnProperty.call(source, track.id) ? source[track.id] : undefined, reputationMaxLevel(track.id)),
  ])) as ReputationState;
}

export function reputationStanding(state: ReputationState | undefined, id: ReputationId) {
  const track = REPUTATION_TRACKS.find(track => track.id === id)!;
  const maxLevel = reputationMaxLevel(id);
  const progress = normalizedReputation(state?.[id], maxLevel);
  // Do not round near thresholds: a partial bar never grants the next rank.
  const level = Math.floor(progress) as ReputationLevel;
  const bars = Array.from({ length: maxLevel }, (_, index) => Math.max(0, Math.min(1, progress - index)));
  return { id, name: track.name, progress, level, maxLevel, title: track.titles[level]!, bars };
}

/** Independent employers may recognize shared standings without changing ownership.
 * These read-only rules do not gate contracts or transfer progress between tracks.
 * Corporate set: the six corporations with their own standing; excludes the Combine.
 */
export const INHERITED_REPUTATION_TRACKS = {
  BFS: ['voss-heinkel-metricwerke'],
  'KIS-E': ['kisaragi'],
  ACCORD: ['house-alvares', 'house-mendes', 'house-nunes'],
  HALL: ['voss-heinkel-metricwerke', 'kisaragi', 'daedalus-systems', 'cerberus-human-resources', 'balor-advanced-materials', 'merren-conservatory'],
} as const satisfies Record<string, readonly ReputationId[]>;

export function inheritedReputationLevel(state: ReputationState | undefined, employer: keyof typeof INHERITED_REPUTATION_TRACKS): ReputationLevel {
  return Math.max(...INHERITED_REPUTATION_TRACKS[employer].map(id => reputationStanding(state, id).level)) as ReputationLevel;
}
