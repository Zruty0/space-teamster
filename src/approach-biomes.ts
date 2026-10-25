// Surface art direction, not collision terrain or weather physics.
// A target's persistent identity seeds its region; phase IDs/names/time do not.
export interface ApproachBiome {
  readonly id: string;
  readonly bodyId: string;
  readonly name: string;
  readonly palette: Readonly<{
    sky: string; horizon: string; far: string; middle: string;
    ground: string; deep: string; light: string; shadow: string; sediment: string;
  }>;
}
export const HARTWELL_APPROACH_BIOME: ApproachBiome = Object.freeze({
  id: 'hartwell-dry-uplands-v1', bodyId: 'estella-v', name: 'Rust plains and eroded uplands',
  palette: Object.freeze({ sky: '#111c2d', horizon: '#988574', far: '#817a76', middle: '#926d55',
    ground: '#875035', deep: '#392b29', light: '#c99261', shadow: '#51362f', sediment: '#ab764e' }),
});
export const HARTWELL_APPROACH_TARGETS = Object.freeze([
  'estella-v-capital-settlement', 'estella-v-open-cast-mine', 'estella-v-atmo-refinery',
  'estella-v-storm-research', 'estella-v-abandoned-colony',
]);
export interface ApproachRegion {
  readonly targetId: string;
  readonly biome: ApproachBiome;
  readonly seed: number;
  readonly reliefSeed: number;
  readonly materialSeed: number;
}
function hash(text: string): number {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function hartwellApproachRegion(targetId: string): ApproachRegion {
  if (!HARTWELL_APPROACH_TARGETS.includes(targetId)) throw new Error(`No reviewed Hartwell biome assignment: ${targetId}`);
  const key = `approach-region-v1:estella-v:${targetId}`;
  return Object.freeze({ targetId, biome: HARTWELL_APPROACH_BIOME, seed: hash(key),
    reliefSeed: hash(`${key}:relief`), materialSeed: hash(`${key}:material`) });
}
/** Stateless indexed stream: negative/positive cells can be visited in any order. */
export function regionRandom(seed: number, cell: number, channel = 0): number {
  let h = seed ^ Math.imul(cell, 374761393) ^ Math.imul(channel + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export function regionNoise(seed: number, x: number, channel = 0): number {
  const cell = Math.floor(x), f = smooth(x - cell);
  return regionRandom(seed, cell, channel) * (1 - f) + regionRandom(seed, cell + 1, channel) * f;
}
/** Broad mesa massifs and shoulders first; noise supplies only subordinate erosion. */
export function approachRidgeHeight(region: ApproachRegion, layer: 0 | 1, x: number): number {
  const seed = region.reliefSeed ^ (layer ? 0x6a09e667 : 0xbb67ae85);
  const size = layer ? 12000 : 19000, cell = Math.floor(x / size);
  let height = 180;
  for (let i = cell - 1; i <= cell + 1; i++) {
    const r = (c: number) => regionRandom(seed, i, c);
    const centre = (i + .2 + r(0) * .6) * size;
    const width = size * (.35 + r(1) * .38);
    const d = Math.abs(x - centre) / width;
    const mesa = smooth((1 - d) / (.22 + r(2) * .42));
    const shoulder = smooth((1.25 - d) / .75);
    const peak = (layer ? 850 : 1600) + r(3) * (layer ? 1400 : 1900);
    const top = 1 - .21 * regionNoise(seed, x / 2100, 7);
    height = Math.max(height, peak * (.78 * mesa * top + .22 * shoulder));
  }
  return height + 75 * regionNoise(seed, x / 350, 8) + 120 * regionNoise(seed, x / 1400, 9);
}
/** Coordinates attached to the target, not the camera or approach direction. */
export function regionCoordinate(worldX: number, targetX: number, localDir: 1 | -1): number {
  return (worldX - targetX) * localDir;
}
