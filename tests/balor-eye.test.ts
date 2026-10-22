import './svg-dom';
import { drawBalorDisc, balorShoreX, BALOR_EYE_ARC } from '../src/balor-appearance';
import { balorEyeAngleAt, orientBalorOrbitalVisit, orientBalorApproach, rotateBalorDeparture } from '../src/balor-orientation';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, createOrbitalCamera, orbitalToApproachParams, surfaceDistanceFromLandingTarget, updateOrbital, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';
import { APPROACH_LEVELS, createApproachState, type ApproachLevel, type ApproachInitOverride } from '../src/approach';
import { bodyById, bodyStateRelativeToParent, SURFACE_POIS } from '../src/world';
import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import type { InputState } from '../src/input';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw new Error(message); }
function close(a: number, b: number, message: string, tolerance = 1e-7): void { assert(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`); }
function direction(a: number, b: number, message: string): void { close(Math.cos(a), Math.cos(b), message); close(Math.sin(a), Math.sin(b), message); }
const sources = ['estella-i-worker-hab', 'estella-i-refractory-mine', 'estella-i-hot-processing'];
close(BALOR_EYE_ARC * 180 / Math.PI, 30, 'Eye occupies 30 degrees total, not a 30-degree radius');
for (let i = -100; i <= 100; i++) {
  const y = i / 100;
  assert(balorShoreX(y) > Math.cos(16 * Math.PI / 180), 'shoreline stays within approximately 30-degree cap');
}
const body = bodyById('estella-i');
const year = 2 * Math.PI * Math.sqrt(body.orbit!.radius ** 3 / bodyById('estella').gm);
const game: any = Object.create(Game.prototype);
game.career = defaultCareerProfile();
game.canvas = { width: 1280, height: 800 };
game.missionDvUsed = 27;
game.activeManifestCondition = {};
game.activeMaintenanceTelemetry = createMaintenanceTelemetry();
game.showGuidance = () => {};
game.showContextualOperationsManual = () => {};

const landingLevels: OrbitalLevel[] = [];
for (const source of sources) {
  const before = new Set(ORBITAL_LEVELS.map(l => l.id));
  createPlayableEstellaMission('estella-vi-heavy-cargo-station', source, undefined, 600);
  landingLevels.push(ORBITAL_LEVELS.find(l => !before.has(l.id) && l.bodyId === 'estella-i' && l.reentryApproachLevelId !== undefined)!);
}
for (let i = 0; i < 24; i++) {
  const time = year * i / 24 + 1234;
  const pos = bodyStateRelativeToParent('estella-i', time);
  const angle = balorEyeAngleAt(time);
  close(Math.cos(angle), -pos.x / Math.hypot(pos.x, pos.y), 'eye faces actual star X at entry');
  close(Math.sin(angle), -pos.y / Math.hypot(pos.x, pos.y), 'eye faces actual star Y at entry');
  for (const template of landingLevels) {
    assert(template, 'generated landing orbit exists');
    const original = JSON.stringify(template);
    const visit = orientBalorOrbitalVisit(template, time);
    close(visit.balorEyeAngle!, angle, 'visit snapshots entry orientation');
    close(visit.landingSiteAngle, template.landingSiteAngle + angle, 'target shares eye frame');
    assert(JSON.stringify(template) === original && template.balorEyeAngle === undefined, 'global orbital templates not mutated');
    assert(orientBalorOrbitalVisit(visit, time + year / 3) === visit, 'retry/return cannot accumulate rotation');
    const nextVisit = orientBalorOrbitalVisit(template, time + year / 4);
    assert(Math.abs(Math.sin(nextVisit.balorEyeAngle! - angle)) > 0.99, 'fresh entry follows new time');
    for (const marker of visit.surfaceMarkers!) {
      const canonical = template.surfaceMarkers!.find(m => m.id === marker.id)!;
      direction(marker.angle - angle, canonical.angle, 'surface geography rigidly attached to eye');
      const x = Math.cos(canonical.angle), canvasY = -Math.sin(canonical.angle);
      assert(x < balorShoreX(canvasY) - 0.01, `${marker.name} is on solid terrain`);
      if (marker.id === sources[0]) assert(x < -0.8, 'Shade remains on dark side');
    }
    const approachTemplate = APPROACH_LEVELS.find(a => a.id === template.reentryApproachLevelId)!;
    const approachOriginal = JSON.stringify(approachTemplate);
    const approach = orientBalorApproach(approachTemplate, angle);
    close(approach.frame.landingSiteAngle, visit.landingSiteAngle, 'approach frame aligned');
    assert(JSON.stringify(approachTemplate) === approachOriginal, 'approach registry immutable');
    const r = body.radius + 5000;
    const theta = visit.landingSiteAngle + 0.02;
    const init = { x: r * Math.cos(theta), y: r * Math.sin(theta), vx: 50, vy: -30, time, temperature: 0.17 };
    const os = createOrbitalState(visit, init);
    const params = orbitalToApproachParams(os, visit);
    const state = createApproachState(approach, params);
    close(state.x, params.x, 'descent preserves along-track distance', 1e-6);
    close(state.y, 5000, 'descent preserves altitude', 1e-6);
    close(state.worldX, os.x, 'descent preserves inertial X');
    close(state.worldY, os.y, 'descent preserves inertial Y');
    close(state.temperature, os.temperature, 'descent preserves temperature');
    close(surfaceDistanceFromLandingTarget(visit, os.x, os.y), body.radius * 0.02, 'impact guidance uses oriented target', 1e-6);
  }
}

// Production Game loading, retry, orbital -> approach -> orbital, and first
// launch. Ship states from space are not rotated; surface launch changes frame
// once, preserving energy/angular momentum and all non-geometric fields.
const template = landingLevels[0];
const entry = year * 0.37;
const arrival = { x: 330000, y: -120000, vx: 100, vy: 300, time: entry, temperature: 0.23 };
game.loadOrbital(template, arrival, entry);
const first = game.phase;
close(first.os.x, arrival.x, 'incoming transfer position not rotated');
close(first.os.vy, arrival.vy, 'incoming transfer velocity not rotated');
const frozenAngle = first.level.balorEyeAngle;
updateOrbital(first.os, {} as InputState, first.level, 0.05);
close(first.level.balorEyeAngle, frozenAngle, 'physics does not spin planet');
close(first.os.balorEyeAngle, frozenAngle, 'physics does not advance visual snapshot');
game.loadOrbital(first.level, first.initOverride, first.worldTimeStart);
close(game.phase.level.landingSiteAngle, first.level.landingSiteAngle, 'retry never double-rotates landing target');
close(game.phase.os.x, arrival.x, 'retry restores exact arrival');
let received: { level: ApproachLevel; init: ApproachInitOverride; time: number } | undefined;
game.loadApproach = (level: ApproachLevel, init: ApproachInitOverride, time: number) => { received = { level, init, time }; };
const landingTheta = game.phase.level.landingSiteAngle;
game.phase.os.x = Math.cos(landingTheta) * (body.radius + 4000);
game.phase.os.y = Math.sin(landingTheta) * (body.radius + 4000);
game.phase.os.time = entry + 40000;
game.transitionOrbitalToApproach(game.phase).run();
assert(received, 'real descent transition dispatched');
close(received.level.balorEyeAngle!, frozenAngle, 'descent inherits old orientation, not current clock');
const descentState = createApproachState(received.level, received.init);
close(descentState.x, 0, 'aligned landing target remains beneath ship', 1e-6);
game.time = 500;
const returning = { kind: 'approach', level: received.level, as: descentState, worldTimeStart: received.time };
const returnTransition = game.transitionApproachToOrbital(returning, 'contingency');
assert(returnTransition, 'return-to-orbit transition exists');
returnTransition.run();
close(game.phase.level.balorEyeAngle, frozenAngle, 'same visit retains eye through approach detour');
close(game.phase.os.x, descentState.worldX, 'return does not rotate inertial state twice');
close(game.phase.os.vy, descentState.worldVY, 'return retains velocity');

for (const source of sources) {
  const mission = createPlayableEstellaMission(source, 'estella-vi-heavy-cargo-station', undefined, 601);
  assert(mission.start.kind === 'landing', 'surface launch fixture');
  const approachId = mission.start.nextApproachLevelId;
  const approach = APPROACH_LEVELS.find(a => a.id === approachId)!;
  const ascent = createApproachState(approach, { x: 75, y: approach.departure!.exitAltitude, vx: 450, vy: 3, angle: 0, temperature: 0.11 });
  game.time = 123;
  game.transitionApproachToOrbital({ level: approach, as: ascent, worldTimeStart: entry }).run();
  const expected = rotateBalorDeparture({ x: ascent.worldX, y: ascent.worldY, vx: ascent.worldVX, vy: ascent.worldVY, temperature: ascent.temperature }, balorEyeAngleAt(entry + 123));
  close(game.phase.os.x, expected.x, 'first ascent transforms position once');
  close(game.phase.os.vy, expected.vy, 'first ascent transforms velocity once');
  close(Math.hypot(game.phase.os.vx, game.phase.os.vy), Math.hypot(ascent.worldVX, ascent.worldVY), 'frame change preserves speed');
  close(game.phase.os.x * game.phase.os.vy - game.phase.os.y * game.phase.os.vx, ascent.worldX * ascent.worldVY - ascent.worldY * ascent.worldVX, 'frame change preserves angular momentum', 1e-5);
  close(game.phase.os.temperature, 0.11, 'launch preserves temperature');
  assert(game.phase.os.dvUsed === 0 && game.missionDvUsed === 27, 'orientation adds no billable delta-v');
}

function recorder() {
  const calls: unknown[][] = [];
  const raw: any = { measureText: (text: string) => ({ width: text.length * 8 }) };
  for (const type of ['createLinearGradient', 'createRadialGradient']) raw[type] = (...args: number[]) => {
    const gradient = { type, args, stops: [] as unknown[], addColorStop(offset: number, color: string) { this.stops.push([offset, color]); } };
    calls.push([type, gradient]);
    return gradient;
  };
  const ctx = new Proxy(raw, { get: (target, key) => key in target ? target[key] : (...args: unknown[]) => calls.push([String(key), ...args]), set: (target, key, value) => { calls.push(['set', String(key), value]); target[key] = value; return true; } }) as CanvasRenderingContext2D;
  return { ctx, calls };
}
for (const radius of [3, 8, 14, 40, 250, 2000]) for (const angle of [0, Math.PI / 2, -2.3]) {
  const a = recorder(), b = recorder();
  drawBalorDisc(a.ctx, 500, 350, radius, angle);
  drawBalorDisc(b.ctx, 500, 350, radius, angle);
  assert(JSON.stringify(a.calls) === JSON.stringify(b.calls), 'geometry/paint deterministic across draws');
  assert(a.calls.some(c => c[0] === 'rotate' && c[1] === -angle), 'world angle converts to canvas sign');
  assert(a.calls.filter(c => c[0] === 'save').length === a.calls.filter(c => c[0] === 'restore').length, 'balanced canvas state');
  assert(a.calls.findIndex(c => c[0] === 'clip') < a.calls.findIndex(c => c[0] === 'fillRect'), 'all surface paint clipped to planet');
  assert(a.calls.some(c => c[0] === 'createRadialGradient') === (radius >= 14), 'tiny markers use simplified no-gradient cap');
  assert(!a.calls.some(c => c[0] === 'set' && (c[1] === 'shadowBlur' || c[1] === 'filter')), 'no halo/filter masking chart');
}
for (const radius of [0, -5, NaN, Infinity]) {
  const r = recorder(); drawBalorDisc(r.ctx, 0, 0, radius, 0);
  assert(r.calls.length === 0, 'invalid/zero radius safe');
}
// Production rendering at two times uses the snapshot, not live star direction.
game.loadOrbital(template, arrival, entry);
for (const elapsed of [0, year / 4]) {
  game.phase.os.time = entry + elapsed;
  const r = recorder();
  renderOrbital(r.ctx, game.canvas, game.phase.cam, game.phase.os, game.phase.level, elapsed);
  assert(r.calls.some(c => c[0] === 'rotate' && c[1] === -frozenAngle), 'local renderer uses entry snapshot at any time');
}
const system = ORBITAL_LEVELS.find(l => l.bodyId === 'estella' && l.systemBodies?.some(b => b.id === 'estella-i'))!;
assert(system, 'system-map fixture');
const systemVisit = orientBalorOrbitalVisit(system, entry);
assert(systemVisit === system, 'system view does not acquire a local surface snapshot');
const systemState = createOrbitalState(systemVisit, { ...arrival, x: body.orbit!.radius, y: 0 });
assert(systemState.balorEyeAngle === undefined, 'system state has no frozen Eye orientation');
for (let step = 0; step <= 12; step++) {
  const elapsed = year * step / 12;
  systemState.time = entry + elapsed;
  // Even stale snapshots from a previous frame must not override chart facing.
  const staleVisit = { ...systemVisit, balorEyeAngle: frozenAngle };
  systemState.balorEyeAngle = frozenAngle;
  const cam = { ...createOrbitalCamera(systemVisit), x: step * 1e6, y: -step * 2e6 };
  const position = transferBodyState(systemVisit, 'estella-i', systemState.time)!;
  const bx = (position.x - cam.x) * cam.zoom + game.canvas.width / 2;
  const by = -(position.y - cam.y) * cam.zoom + game.canvas.height / 2;
  const r = recorder();
  renderOrbital(r.ctx, game.canvas, cam, systemState, staleVisit, elapsed);
  const marker = r.calls.findIndex(c => c[0] === 'translate' && c[1] === bx && c[2] === by);
  assert(marker >= 0 && r.calls[marker + 1][0] === 'rotate', 'find actual Balor marker, not ship rotation');
  const worldAngle = -(r.calls[marker + 1][1] as number);
  direction(worldAngle, Math.atan2(-position.y, -position.x), 'system Eye always points from current Balor position to Estella');
  if (step === 3) assert(Math.abs(Math.sin(worldAngle - frozenAngle!)) > 0.99, 'quarter-orbit advance cannot reuse frozen entry angle');
  const hint = r.calls.findIndex(c => c[0] === 'set' && c[1] === 'strokeStyle' && c[2] === '#ffb448');
  assert(hint >= 0, 'tiny system marker retains orange Eye hint');
  const hintStroke = r.calls.findIndex((c, i) => i > hint && c[0] === 'stroke');
  const laterStroke = r.calls.findIndex((c, i) => i > hintStroke && c[0] === 'stroke');
  assert(laterStroke < 0 || r.calls.slice(hintStroke + 1, laterStroke).some(c => c[0] === 'beginPath'), 'generic body border cannot repaint the orange Eye path white');
}
const beforeRendezvous = new Set(ORBITAL_LEVELS.map(l => l.id));
createPlayableEstellaMission('estella-vi-heavy-cargo-station', 'estella-i-transit-customs', undefined, 602);
const rendezvous = ORBITAL_LEVELS.find(l => !beforeRendezvous.has(l.id) && l.bodyId === 'estella-i' && l.station)!;
assert(rendezvous, 'station rendezvous fixture');
const orientedStation = orientBalorOrbitalVisit(rendezvous, entry);
assert(orientedStation.station === rendezvous.station && orientedStation.orbitMarkers === rendezvous.orbitMarkers, 'station ephemerides never rotate with the surface');
close(orientedStation.startX, rendezvous.startX, 'station start position remains inertial');
close(orientedStation.startVY, rendezvous.startVY, 'station start velocity remains inertial');
const beforeLocal = new Set(ORBITAL_LEVELS.map(l => l.id));
createPlayableEstellaMission('estella-i-transit-customs', sources[0], undefined, 603);
const local = ORBITAL_LEVELS.find(l => !beforeLocal.has(l.id) && l.bodyId === 'estella-i' && l.dynamicStartOrbit)!;
assert(local, 'local station-to-surface fixture');
const expectedStart = game.dynamicOrbitalStart(local, entry);
game.loadOrbital(local, undefined, entry);
close(game.phase.os.x, expectedStart.x, 'dynamic station departure not rotated');
close(game.phase.os.vy, expectedStart.vy, 'dynamic station departure velocity not rotated');
const other = ORBITAL_LEVELS.find(l => l.bodyId === 'estella-vi')!;
assert(orientBalorOrbitalVisit(other, entry) === other, 'other planets unchanged');
assert(SURFACE_POIS.filter(p => p.bodyId === 'estella-i').every(p => p.surfaceAngle < 0), 'catalog keeps canonical eye-relative longitudes, not a visit angle');
console.log(`Balor Eye regression passed: ${assertions} assertions.`);
