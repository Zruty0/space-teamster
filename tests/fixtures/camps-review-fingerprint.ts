import { publicContentText } from '../../src/content-terminology';

// The review changes display text only. All IDs, seed keys, numeric terms,
// cargo type IDs, quotes and routing remain included in the frozen comparison.
const textKeys = new Set(['name', 'factionName', 'issuerName', 'sourceName', 'sourcePath', 'destinationName', 'destinationPath', 'title', 'details', 'briefing', 'completionMessage', 'label']);
export function reviewFingerprint(rows: unknown[]): [number, number] {
  const json = JSON.stringify(rows, (key, value) => {
    // Object insertion order is not a contract term (render views can add a
    // missing issuer tag); array/posting order remains part of the snapshot.
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
    }
    if (typeof value !== 'string') return value;
    if (textKeys.has(key)) return publicContentText(value);
    if ((key === 'issuerTag' || key === 'factionTag') && value === 'SYC') return 'SSC';
    return value;
  });
  let hash = 2166136261;
  for (const ch of json) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return [rows.length, hash >>> 0];
}
