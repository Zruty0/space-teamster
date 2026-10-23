import './svg-dom';
import { drawGaiaDisc, drawCrateredDisc, drawAuthoredWorldDisc, type WorldTint } from '../src/world-disc-appearance';
import { bodyById, BODIES, SURFACE_POIS } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw new Error(message); }
function recorder() {
  const calls: unknown[][] = [];
  const raw: any = { measureText: (text: string) => ({ width: text.length * 8 }) };
  for (const name of ['createLinearGradient', 'createRadialGradient']) raw[name] = (...args: number[]) => {
    const gradient = { name, args, stops: [] as unknown[], addColorStop(offset: number, color: string) { this.stops.push([offset, color]); } };
    calls.push([name, gradient]); return gradient;
  };
  const ctx = new Proxy(raw, {
    get: (target, key) => key in target ? target[key] : (...args: unknown[]) => calls.push([String(key), ...args]),
    set: (target, key, value) => { calls.push(['set', String(key), value]); target[key] = value; return true; },
  }) as CanvasRenderingContext2D;
  return { ctx, calls };
}
const celeste = bodyById('estella-iiia');
const painters = [drawGaiaDisc, (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => drawCrateredDisc(ctx, x, y, r, celeste.color)];
const originalRandom = Math.random;
try {
  Math.random = () => { throw new Error('per-frame randomness is not allowed'); };
  for (const paint of painters) for (const radius of [0.25, 3, 8, 14, 44, 45, 59, 60, 220, 2000, 10000]) {
    const a = recorder(), b = recorder();
    paint(a.ctx, 640, 400, radius); paint(b.ctx, 640, 400, radius);
    assert(JSON.stringify(a.calls) === JSON.stringify(b.calls), 'static repeatable artwork at every scale');
    assert(a.calls.filter(c => c[0] === 'save').length === a.calls.filter(c => c[0] === 'restore').length, 'balanced canvas state');
    assert(a.calls.findIndex(c => c[0] === 'clip') < a.calls.findIndex(c => c[0] === 'fillRect'), 'all paint clipped before first fill');
    assert(a.calls.some(c => c[0] === 'createRadialGradient') === (radius >= 14), 'small-marker LOD omits shading gradient');
    assert(!a.calls.some(c => c[0] === 'set' && ['filter','shadowBlur','globalCompositeOperation'].includes(String(c[1]))), 'no halo or compositing leaks');
    assert(a.calls.every(c => c.slice(1).every(v => typeof v !== 'number' || Number.isFinite(v))), 'finite drawing coordinates');
    assert(a.calls.filter(c => c[0] === 'lineTo').length < 1200, 'bounded geometry independent of zoom');
  }
} finally { Math.random = originalRandom; }
for (const paint of painters) for (const [x,y,r] of [[0,0,0],[0,0,-1],[0,0,NaN],[0,0,Infinity],[NaN,0,10],[0,Infinity,10]]) {
  const rec = recorder(); paint(rec.ctx, x, y, r); assert(rec.calls.length === 0, 'invalid geometry safely skipped');
}
const badTint = recorder(); drawCrateredDisc(badTint.ctx, 0, 0, 100, [NaN, 100, 100]);
assert(!badTint.calls.length, 'invalid tint safely skipped');
const tints: WorldTint[] = [[170,165,150],[210,120,80],[110,160,205]];
const tinted = tints.map(tint => { const rec = recorder(); const before = JSON.stringify(tint); drawCrateredDisc(rec.ctx, 0, 0, 200, tint); assert(JSON.stringify(tint) === before, 'palette immutable'); return rec.calls; });
const geometry = (calls: unknown[][]) => JSON.stringify(calls.filter(c => c[0] !== 'set'));
assert(tinted.every(c => geometry(c) === geometry(tinted[0])), 'recoloring keeps the same crater relief');
assert(new Set(tinted.map(c => JSON.stringify(c))).size === 3, 'different palettes produce different paints');
for (const body of BODIES) {
  const rec = recorder(); const optedIn = ['estella-iii','estella-iiia'].includes(body.id);
  assert(drawAuthoredWorldDisc(rec.ctx, body.id, 0, 0, 200, body.color) === optedIn, 'only Gaia/Celeste opt in');
  assert((rec.calls.length > 0) === optedIn, 'all other body art left untouched');
}

// Check actual drawn polygons against the authored surface angles, without
// duplicating a second geography model in the test. Native pixels also cover it.
function inside(x: number, y: number, polygon: number[][]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi,yi] = polygon[i], [xj,yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const siteAngle = (id: string) => SURFACE_POIS.find(s => s.id === id)!.surfaceAngle;
for (const radius of [30, 220]) {
  const rec = recorder(); drawGaiaDisc(rec.ctx, 0, 0, radius);
  const land: number[][][] = [], ice: number[][][] = [];
  let path: number[][] = [], fill: unknown;
  for (const call of rec.calls) {
    if (call[0] === 'beginPath') path = [];
    if (call[0] === 'moveTo' || call[0] === 'lineTo') path.push([call[1] as number, call[2] as number]);
    if (call[0] === 'set' && call[1] === 'fillStyle') fill = call[2];
    if (call[0] === 'fill' && fill === '#5a8757') land.push(path);
    if (call[0] === 'fill' && fill === '#d4e6e7') ice.push(path);
  }
  const terrain = (angle: number) => {
    const x = .98 * Math.cos(angle), y = -.98 * Math.sin(angle);
    return ice.some(p => inside(x,y,p)) ? 'ice' : land.some(p => inside(x,y,p)) ? 'land' : 'ocean';
  };
  for (const id of ['estella-iii-capital-city','estella-iii-high-tech-city','estella-iii-agricultural-region','estella-iii-military-spaceport']) {
    assert(terrain(siteAngle(id)) === 'land', `${id} sits on green land at both LODs`);
  }
  const polar = siteAngle('estella-iii-polar-science'), coast = siteAngle('estella-iii-coastal-resort');
  assert(terrain(polar) === 'ice' && terrain(polar - .14) === 'land', 'Cousteau on ice near habitable edge');
  assert(terrain(coast) === 'land' && terrain(coast - .045) === 'land' && terrain(coast + .045) === 'ocean', 'Mirabel at a land/ocean shore');
  assert(siteAngle('estella-iii-finance-city') === siteAngle('estella-iii-capital-city') && siteAngle('estella-iii-historic-site') === siteAngle('estella-iii-capital-city'), 'Orselle districts still co-located');
}

// Exercise actual production rendering: central discs, stellar Gaia marker,
// and Celeste's moving marker around Gaia. Labels/physical state remain intact.
createPlayableEstellaMission('estella-iii-main-customs', 'estella-iii-capital-city', undefined, 731);
createPlayableEstellaMission('estella-iii-main-customs', 'estella-iiia-science-settlement', undefined, 732);
createPlayableEstellaMission('estella-vi-heavy-cargo-station', 'estella-iii-capital-city', undefined, 733);
const gaia = ORBITAL_LEVELS.find(l => l.bodyId === 'estella-iii' && l.systemBodies?.some(b => b.id === 'estella-iiia'))!;
const moon = ORBITAL_LEVELS.find(l => l.bodyId === 'estella-iiia' && l.reentryApproachLevelId !== undefined)!;
const star = ORBITAL_LEVELS.find(l => l.bodyId === 'estella' && l.systemBodies?.some(b => b.id === 'estella-iii'))!;
assert(gaia && moon && star, 'production fixtures generated');
function render(level: OrbitalLevel, time: number) {
  const cam = { x: 1200, y: -2400, zoom: 190 / level.planetRadius };
  const state = createOrbitalState(level, { x: level.planetRadius * 1.5, y: 0, vx: 0, vy: -300, time });
  const before = JSON.stringify({ level, state });
  const rec = recorder(); renderOrbital(rec.ctx, { width: 1280, height: 800 } as HTMLCanvasElement, cam, state, level, time);
  assert(JSON.stringify({ level, state }) === before, 'rendering cannot modify flight state or level geometry');
  return { ...rec, cam };
}
for (const time of [0, 10000, 500000]) {
  const centralGaia = render(gaia, time), centralMoon = render(moon, time), system = render(star, time);
  assert(centralGaia.calls.some(c => c[0] === 'set' && c[2] === '#d4e6e7'), 'central Gaia ice caps');
  assert(centralGaia.calls.some(c => c[0] === 'set' && c[2] === '#306749'), 'central Gaia greenery');
  assert(centralMoon.calls.some(c => c[0] === 'set' && c[2] === 'rgb(90,87,80)'), 'central Celeste tinted crater floors');
  assert(system.calls.some(c => c[0] === 'set' && c[2] === '#d4e6e7'), 'system Gaia marker shares ice caps');
  for (const [level, bodyId, rec] of [[gaia, 'estella-iiia', centralGaia], [star, 'estella-iii', system]] as const) {
    const position = transferBodyState(level, bodyId, time)!;
    const x = (position.x - rec.cam.x) * rec.cam.zoom + 640;
    const y = -(position.y - rec.cam.y) * rec.cam.zoom + 400;
    assert(rec.calls.some(c => c[0] === 'translate' && c[1] === x && c[2] === y), 'shared renderer follows actual moving marker coordinates');
  }
  assert(centralGaia.calls.some(c => c[0] === 'fillText' && c[1] === 'GAIA'), 'central Gaia label retained');
  assert(centralMoon.calls.some(c => c[0] === 'fillText' && c[1] === 'CELESTE'), 'central Celeste label retained');
}
console.log(`World disc appearance passed: ${assertions} assertions; static geometry, palettes, LOD, central/system/moon rendering, unchanged flight state.`);
