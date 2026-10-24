import './svg-dom';
import { ORBITAL_LEVELS, orbitalHasSurfaceObjective, visibleOrbitalSurfaceMarkers, createOrbitalState, createOrbitalCamera, renderOrbital, invalidatePrediction, type OrbitalLevel } from '../src/orbital';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';

let checks = 0;
function assert(ok: unknown, message: string): asserts ok { checks++; if (!ok) throw new Error(message); }
createPlayableEstellaMission('estella-vi-heavy-cargo-station', 'estella-vi-industrial-city', undefined, 30);
const base: OrbitalLevel = {
  ...ORBITAL_LEVELS[0], station: undefined, targetBodyId: undefined,
  escapeTargetBodyId: undefined, escapeToOrbitalLevelId: undefined, escapeSOIRadius: undefined,
  systemBodies: undefined, landingSiteAngle: 0.25, showLandingSite: true,
  surfaceMarkers: [
    { id: 'other', name: 'Ground other', angle: -0.9, labelVisibility: 'always' },
    { id: 'target', name: 'Ground target', angle: 0.25, labelVisibility: 'target' },
    { id: 'coincident', name: 'Ground coincident', angle: 0.25, labelVisibility: 'always' },
  ],
  orbitMarkers: [{ id: 'orbital-fixture', name: 'Orbital fixture', orbitRadius: ORBITAL_LEVELS[0].planetRadius + 100000, epochAngle: 1, epochTime: 0, orbitSense: -1 }],
};
assert(visibleOrbitalSurfaceMarkers(base).length === 1 && visibleOrbitalSurfaceMarkers(base)[0].id === 'target', 'only active surface destination, including coincident-marker deduplication');
assert(visibleOrbitalSurfaceMarkers({ ...base, landingSiteAngle: 0.25 + 2 * Math.PI })[0]?.id === 'target', 'wrapped longitude matches landing target');
assert(visibleOrbitalSurfaceMarkers({ ...base, landingSiteAngle: 2 }).length === 0, 'no invented target when markers do not match');
const station: NonNullable<OrbitalLevel['station']> = { id: 'orbital-fixture', name: 'Orbital fixture', orbitRadius: base.planetRadius + 100000, epochAngle: 1, epochTime: 0, orbitSense: -1, captureRadius: 1000, captureMaxSpeed: 10 };
const hidden: OrbitalLevel[] = [
  { ...base, station },
  { ...base, showLandingSite: false },
  { ...base, targetBodyId: 'transfer-destination' },
  { ...base, escapeTargetBodyId: 'escape-destination' },
  { ...base, escapeToOrbitalLevelId: 12345 },
];
for (const level of hidden) {
  assert(!orbitalHasSurfaceObjective(level), 'station/transit/escape hides surface objective');
  assert(visibleOrbitalSurfaceMarkers(level).length === 0, 'all surface markers omitted, not just labels');
}

// Exercise the production renderer with a recording desktop canvas (no browser).
// Ground marker leader strokes have a distinct style, so label-only suppression
// cannot pass this regression. Orbital POIs must remain visible.
function draw(level: OrbitalLevel) {
  const labels: string[] = [], strokes: string[] = [];
  const saved: Record<string, unknown>[] = [];
  const raw: any = {
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', globalAlpha: 1,
    fillText(text: string) { labels.push(text); },
    stroke() { strokes.push(this.strokeStyle); },
    save() { saved.push({ fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, font: this.font, globalAlpha: this.globalAlpha }); },
    restore() { Object.assign(this, saved.pop()); },
    measureText(text: string) { return { width: text.length * 8 }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  const ctx = new Proxy(raw, { get(target, key) { return key in target ? target[key] : () => {}; } }) as CanvasRenderingContext2D;
  const state = createOrbitalState(level);
  const camera = createOrbitalCamera(level);
  invalidatePrediction();
  renderOrbital(ctx, { width: 1024, height: 768 } as HTMLCanvasElement, camera, state, level, 0);
  return { labels, strokes };
}
const active = draw(base);
assert(active.labels.includes('GROUND TARGET') && !active.labels.includes('GROUND OTHER') && !active.labels.includes('GROUND COINCIDENT'), 'renderer draws just the active ground label');
assert(active.strokes.filter(style => style === 'rgba(0, 255, 204, 0.28)').length === 1, 'renderer draws just one ground marker leader');
for (const level of hidden) {
  const result = draw(level);
  assert(!result.labels.some(label => label.startsWith('GROUND ')), 'no ground labels during rendezvous/transit/escape');
  assert(!result.strokes.includes('rgba(0, 255, 204, 0.28)'), 'no hidden-site leader lines either');
  assert(result.labels.includes('ORBITAL FIXTURE'), 'orbital station markers unaffected');
}
assert(draw({ ...base, surfaceMarkers: undefined }).labels.includes('LZ'), 'legacy landing target still rendered without POI array');
for (const level of hidden) assert(!draw({ ...level, surfaceMarkers: undefined }).labels.includes('LZ'), 'legacy fallback does not reintroduce ground clutter');

// Actual mission phases around Kuznia/Svarog, not only synthetic goal flags.
const before = new Set(ORBITAL_LEVELS.map(l => l.id));
createPlayableEstellaMission('estella-vi-heavy-cargo-station', 'estella-via-drydock-station', undefined, 31);
const phases = ORBITAL_LEVELS.filter(l => !before.has(l.id));
const kuzniatransit = phases.find(l => l.bodyId === 'estella-vi' && l.targetBodyId === 'estella-via');
const svarogArrival = phases.find(l => l.station?.id === 'estella-via-drydock');
assert(kuzniatransit && kuzniatransit.surfaceMarkers!.length > 0, 'real Kuznia frame includes a ground-site catalog');
assert(visibleOrbitalSurfaceMarkers(kuzniatransit).length === 0, 'Kuznia surface sites hidden while heading to Svarog');
assert(svarogArrival && visibleOrbitalSurfaceMarkers(svarogArrival).length === 0, 'Svarog rendezvous has no ground-site clutter');
const secondBefore = new Set(ORBITAL_LEVELS.map(l => l.id));
createPlayableEstellaMission('estella-vi-heavy-cargo-station', 'estella-vi-industrial-city', undefined, 32);
const landing = ORBITAL_LEVELS.filter(l => !secondBefore.has(l.id)).find(l => l.bodyId === 'estella-vi' && orbitalHasSurfaceObjective(l));
assert(landing && visibleOrbitalSurfaceMarkers(landing).length === 1, 'real Kuznia landing retains its selected ground site');
const targets = estellaSelectableNavTargets();
assert(targets.some(t => t.id === 'estella-vi-industrial-city') && targets.some(t => t.id === 'estella-ii-pandemonium'), 'surface destinations remain navigable');
console.log(`Orbital marker regression passed: ${checks} assertions.`);
