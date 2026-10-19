import './svg-dom';
import { localLayoutById } from '../src/local-layouts';
import { createGenericDockingLevel, dockingPoseIsClear, dockingArrivalRadius, bayWorldPos, createDockingState, updateDocking, createDockingCamera, updateDockingCamera, DOCKING_LEVELS, type DockingLevel } from '../src/docking';
import { ESTELLA_LAYOUTS } from '../src/content/estella/layouts';
import { ESTELLA_STATION_POIS } from '../src/content/estella/gameplay';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { Game } from '../src/game';
import { DOMParser as XmlParser } from '@xmldom/xmldom';
import shipyardSvg from '../art/stations/svarog-shipyard.svg?raw';
import type { InputState } from '../src/input';

const input = {} as InputState;
let checks = 0;
function assert(ok: unknown, message: string): asserts ok { checks++; if (!ok) throw new Error(message); }
const xml = new XmlParser().parseFromString(shipyardSvg, 'image/svg+xml');
const ids = new Set<string>();
for (const element of Array.from(xml.getElementsByTagName('*'))) {
  const id = element.getAttribute('id');
  if (id) { assert(!ids.has(id), `unique SVG ID: ${id}`); ids.add(id); }
  const label = element.getAttribute('inkscape:label');
  if (label?.startsWith('berth-')) assert(id === label, 'all berth labels are actual metadata IDs, not solid duplicate rectangles');
}
const layout = localLayoutById('svarog-shipyard')!;
assert(layout.berths.length === 36, '36 shipyard berths');
assert(layout.widthMeters > 500 && layout.heightMeters > 350, 'full shipyard scale retained');
assert(!layout.shapes.some(shape => shape.id === 'rect535'), 'duplicate berth obstacle removed');
const opts = { id: 999, stationId: 'estella-via-drydock', name: 'Svarog Shipyard', subtitle: '', layoutId: 'svarog-shipyard', autoRotate: false, rotationDegrees: 0, fillPct: 1 };
const seeds = new Map<string, number>();
for (let seed = 1; seed <= 1000 && seeds.size < 36; seed++) {
  const level = createGenericDockingLevel({ ...opts, randomSeed: seed, exitMode: true });
  seeds.set(level.bays.find(b => b.isPlayerBay)!.layoutBerthId!, seed);
}
assert(seeds.size === 36, 'every berth covered by deterministic seed');
// Test-only fixed-heading RCS path search. Every accepted edge checks the full
// swept footprint, proving interior bays connect to open space without requiring
// a straight corridor through the station. This adds no in-game autopilot.
function exitRoute(level: DockingLevel, start: { x: number; y: number }, angle: number): Array<{ x: number; y: number }> | undefined {
  type Node = { x: number; y: number; g: number; f: number; parent?: Node };
  const queue: Node[] = [{ x: 0, y: 0, g: 0, f: Math.max(0, level.exitDistance - Math.hypot(start.x, start.y)) }];
  const seen = new Set(['0,0']);
  let expansions = 0;
  while (queue.length && expansions++ < 30000) {
    queue.sort((a, b) => b.f - a.f);
    const n = queue.pop()!;
    const x = start.x + n.x * 4, y = start.y + n.y * 4;
    if (Math.hypot(x, y) > level.exitDistance) {
      const route: Array<{ x: number; y: number }> = [];
      for (let cursor: Node | undefined = n; cursor; cursor = cursor.parent) route.push({ x: start.x + cursor.x * 4, y: start.y + cursor.y * 4 });
      return route.reverse();
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = n.x + dx, ny = n.y + dy, key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      const wx = start.x + nx * 4, wy = start.y + ny * 4;
      if (Math.abs(wx) > level.exitDistance + 8 || Math.abs(wy) > level.exitDistance + 8) continue;
      const across = 0.1 + Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)) * 2;
      const along = 0.1 + Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle)) * 2;
      if (!dockingPoseIsClear(level, x + dx * 2, y + dy * 2, angle, across, along)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny, g: n.g + 4, f: n.g + 4 + Math.max(0, level.exitDistance - Math.hypot(wx, wy)), parent: n });
    }
  }
  return undefined;
}
// Desktop camera geometry checks only; no browser/viewport emulation.
function assertCameraFrame(camera: ReturnType<typeof createDockingCamera>, ship: { x: number; y: number }, level: DockingLevel, W: number, H: number): void {
  const target = !level.exitMode ? level.bays.find(b => b.isTarget) : undefined;
  const focus = level.exitMode ? { x: level.stationX, y: level.stationY }
    : target ? bayWorldPos(target, level.stationX, level.stationY) : ship;
  for (const point of [ship, focus]) {
    assert((Math.abs(point.x - camera.x) + 15) * camera.zoom <= W * 0.41 + 1e-7, 'rig and target footprint stay horizontally visible');
    assert((Math.abs(point.y - camera.y) + 15) * camera.zoom <= H * 0.41 + 1e-7, 'rig and target footprint stay vertically visible');
  }
  assert(camera.zoom > 0 && camera.zoom <= 4, 'normal close zoom is the ceiling');
  if (level.exitMode) assert(camera.zoom >= 1.5, 'departure zoom respects the floor');
}
function assertTightCamera(camera: ReturnType<typeof createDockingCamera>, ship: { x: number; y: number }, level: DockingLevel, W: number, H: number): void {
  assertCameraFrame(camera, ship, level, W, H);
  if (camera.zoom === 4) return;
  const target = level.bays.find(b => b.isTarget);
  const focus = level.exitMode ? { x: level.stationX, y: level.stationY }
    : bayWorldPos(target!, level.stationX, level.stationY);
  const closerZoom = camera.zoom * 1.001;
  assert((Math.abs(ship.x - focus.x) + 30) * closerZoom > W * 0.82
    || (Math.abs(ship.y - focus.y) + 30) * closerZoom > H * 0.82, 'zoom out no farther than required to frame rig and berth');
}
const distances: Record<string, number> = {};
for (const [berthId, randomSeed] of seeds) {
  for (const exitMode of [true, false]) {
    const level = createGenericDockingLevel({ ...opts, randomSeed, exitMode });
    const bay = level.bays.find(b => b.isPlayerBay || b.isTarget)!;
    const p = bayWorldPos(bay, level.stationX, level.stationY);
    const angle = p.angle + Math.PI;
    assert(level.bays.filter(b => b.filled).length === 35, 'all neighboring berths occupied');
    assert(dockingPoseIsClear(level, p.x, p.y, angle), `full docked footprint clear: ${berthId}`);
    assert(dockingPoseIsClear(level, level.startX, level.startY, level.startAngle), `spawn clear: ${berthId}`);
    const state = createDockingState(level);
    const x = state.x, y = state.y;
    updateDocking(state, input, level, 0);
    assert(Math.hypot(state.x - x, state.y - y) < 1e-8, `no collision correction at spawn: ${berthId}`);
    assert(!state.exitComplete, `no instant undocking: ${berthId}`);
    assert(level.exitDistance >= Math.hypot(layout.widthMeters, layout.heightMeters) / 2 + 25, 'exit encloses entire station');
    if (!exitMode) {
      const distance = Math.hypot(level.startX - p.x, level.startY - p.y);
      distances[berthId] = distance;
      assert(distance >= 16 && distance <= 70.001, 'approach outside docking/tractor range');
      for (let d = 0; d <= distance; d += 0.25) {
        const px = p.x + Math.cos(angle) * d, py = p.y + Math.sin(angle) * d;
        assert(dockingPoseIsClear(level, px, py, angle), `contiguous clear approach at ${berthId}, ${d}m`);
      }
      const docked = createDockingState(level, { x: p.x, y: p.y, vx: 0, vy: 0, angle });
      updateDocking(docked, input, level, 0);
      assert(docked.delivered, `delivery accepted at ${berthId}`);
    }
    const retry = createGenericDockingLevel({ ...opts, randomSeed, exitMode });
    assert(JSON.stringify(retry) === JSON.stringify(level), 'retry placement deterministic');
    const camera = createDockingCamera();
    const outside = createDockingState(level, { x: 0, y: level.exitDistance + 1, vx: 0, vy: 0, angle: 0 });
    updateDockingCamera(camera, state, level, 0, 1024, 768);
    if (!exitMode) assert(camera.zoom === 4, 'berth-relative arrivals retain normal close zoom');
    assertTightCamera(camera, state, level, 1024, 768);
    const enlarged = { ...level, localLayout: { ...layout, widthMeters: 5000, heightMeters: 5000 } };
    const enlargedCamera = createDockingCamera();
    updateDockingCamera(enlargedCamera, state, enlarged, 0, 1024, 768);
    assert(JSON.stringify(enlargedCamera) === JSON.stringify(camera), 'station extent does not affect camera zoom or center');
    updateDockingCamera(camera, outside, level, 0, 1024, 768);
    assertTightCamera(camera, outside, level, 1024, 768);
    if (exitMode) {
      assert(camera.x === (outside.x + level.stationX) / 2 && camera.y === (outside.y + level.stationY) / 2, 'departure frames rig and station center');
      const movingCamera = createDockingCamera();
      for (let frame = 0; frame < 120; frame++) {
        const radians = frame * Math.PI / 60;
        const moving = { ...state, x: Math.cos(radians) * level.exitDistance, y: Math.sin(radians) * level.exitDistance };
        updateDockingCamera(movingCamera, moving, level, 1 / 60, 1024, 768);
        assertCameraFrame(movingCamera, moving, level, 1024, 768);
      }
      // A hard minimum wins if both endpoints cannot fit at that zoom.
      // This extreme fixture is well beyond a normal completed departure.
      const translated = { ...level, stationX: 120, stationY: -80 };
      const distant = { ...state, x: 1120, y: 920 };
      updateDockingCamera(camera, distant, translated, 1 / 60, 1024, 768);
      assert(camera.zoom === 1.5 && camera.x === 620 && camera.y === 420, 'departure floor keeps midpoint when a fit is impossible');
      camera.zoom = 0.2;
      updateDockingCamera(camera, distant, translated, 1 / 60, 1024, 768);
      assert(camera.zoom === 1.5, 'smoothing cannot violate departure minimum');
      updateDockingCamera(camera, { ...state, x: 125, y: -75 }, translated, 0, 1024, 768);
      assert(Math.abs(camera.zoom - 4) < 1e-12, 'departure maximum applies near reference point');
    } else {
      // Opposite-side handoffs, movement, and desktop resizing must not let
      // easing hide the target, even for the first positive-dt update.
      const movingCamera = createDockingCamera();
      for (let frame = 0; frame < 60; frame++) {
        const radians = frame * Math.PI / 30;
        const moving = { ...state, x: Math.cos(radians) * 440, y: Math.sin(radians) * 440 };
        const W = frame < 20 ? 1024 : frame < 40 ? 920 : 1600;
        const H = frame < 20 ? 768 : frame < 40 ? 650 : 900;
        updateDockingCamera(movingCamera, moving, level, 1 / 60, W, H);
        assertCameraFrame(movingCamera, moving, level, W, H);
        const settled = createDockingCamera();
        updateDockingCamera(settled, moving, level, 0, W, H);
        assertTightCamera(settled, moving, level, W, H);
      }
      for (let frame = 0; frame < 240; frame++) updateDockingCamera(movingCamera, state, level, 1 / 60, 1024, 768);
      assert(movingCamera.zoom > 3.999, 'arrival eases back to normal close zoom near berth');
    }
    if (exitMode) {
      updateDocking(outside, input, level, 0);
      assert(outside.exitComplete, 'exit works outside enlarged boundary');
      const route = exitRoute(level, { x: p.x + Math.cos(angle) * 18, y: p.y + Math.sin(angle) * 18 }, angle);
      assert(route, `all-occupied departure path to open space: ${berthId}`);
      for (const point of route) {
        assert(dockingPoseIsClear(level, point.x, point.y, angle), 'departure waypoint footprint clear');
        const s = createDockingState(level, { ...point, vx: 0, vy: 0, angle });
        updateDocking(s, input, level, 0);
        assert(Math.hypot(s.x - point.x, s.y - point.y) < 1e-8, 'departure has no physics collision corrections');
        assert(s.exitComplete === (Math.hypot(point.x, point.y) > level.exitDistance), 'departure completion only beyond whole shipyard');
      }
    }
  }
}
console.log({ width: layout.widthMeters, height: layout.heightMeters, berths: seeds.size, minApproach: Math.min(...Object.values(distances)), maxApproach: Math.max(...Object.values(distances)) });

// Existing authored station assets must still generate playable arrivals.
for (const layoutId of ['small-station-1', 'small-station-2', 'medieval-station']) {
  for (let randomSeed = 1; randomSeed <= 50; randomSeed++) {
    const level = createGenericDockingLevel({ ...opts, layoutId, randomSeed, rotationDegrees: 169, exitMode: false });
    assert(dockingPoseIsClear(level, level.startX, level.startY, level.startAngle), `${layoutId} arrival regression`);
    assert(level.exitDistance === 140, `${layoutId} retains existing exit distance`);
    assert(dockingArrivalRadius(level, 120) === 120 && dockingArrivalRadius(level, 180) === 180, 'small-layout handoff distances unchanged');
  }
}
// Actual content wiring and real orbital handoff; radial position changes, not velocity.
const assigned = ESTELLA_LAYOUTS['estella-via-drydock']!;
assert(assigned.layoutId === 'svarog-shipyard' && assigned.autoRotate === false && assigned.rotationDegrees === 0, 'Svarog alone uses fixed upright shipyard');
assert(ESTELLA_LAYOUTS['estella-via-component-supply']!.layoutId === 'small-station-2', 'Veles unchanged');
const station = ESTELLA_STATION_POIS.find(p => p.id === 'estella-via-drydock')!;
assert(station.layoutId === assigned.layoutId && station.rotationDegrees === 0, 'gameplay overlay propagated');
const playable = createPlayableEstellaMission('estella-via-drydock-station', 'estella-via-component-supply-station', undefined, 1234);
assert(playable.start.kind === 'docking' && playable.start.level.localLayout?.id === 'svarog-shipyard', 'real departure uses shipyard');
const arrival = createGenericDockingLevel({ ...opts, id: 998123, randomSeed: 42, exitMode: false });
assert(arrival.exitDistance === 338, 'shipyard exit boundary outside complete bounds');
assert(distances['berth-p-nose-down'] < 25, 'cannot spawn beyond first wall into a disconnected clear pocket');
const thinObstacle = { ...arrival, localLayout: { ...layout, centerX: 0, centerY: 0, svgUnitsPerMeter: 1, shapes: [{
  kind: 'path' as const, id: 'thin-interior-obstacle', data: '', transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  paint: { fill: '#fff', fillOpacity: 1, strokeOpacity: 0, strokeWidth: 0, strokeDash: [], opacity: 1 },
  collisionPolygon: [{ x: -4.3, y: -3.5 }, { x: -4.2, y: -3.5 }, { x: -4.2, y: -2.5 }, { x: -4.3, y: -2.5 }],
}] }, bays: [] };
assert(!dockingPoseIsClear(thinObstacle, 0, 0, 0, 0), 'full-footprint check catches thin obstacle between perimeter probes');
assert(dockingPoseIsClear(thinObstacle, 30, 0, 0), 'clear distant footprint accepted');
DOCKING_LEVELS.push(arrival);
const game: any = Object.create(Game.prototype);
let received: any;
game.loadDocking = (_level: unknown, init: unknown) => { received = init; };
for (let degrees = 0; degrees < 360; degrees += 10) {
  const angle = degrees * Math.PI / 180;
  const r = dockingArrivalRadius(arrival, 120);
  assert(dockingPoseIsClear(arrival, r * Math.cos(angle), r * Math.sin(angle), angle + Math.PI), 'full incoming ring outside hull and parked bays');
  const phase = { level: { dockingLevelId: arrival.id, planetGM: 1e12, station: { orbitSense: 1, orbitRadius: 1e6, epochAngle: 0, epochTime: 0, captureRadius: 20000 } }, os: { time: 0, x: 1e6 + 100 * Math.cos(angle), y: 100 * Math.sin(angle), vx: 3, vy: 998 } };
  const transition = game.transitionOrbitalToDocking(phase);
  assert(transition, 'real orbital transition exists');
  transition.run();
  assert(dockingPoseIsClear(arrival, received.x, received.y, received.angle), 'real orbital handoff spawn clear');
  assert(received.vx === 3 && received.vy === -2, 'incoming relative velocity preserved');
  const camera = createDockingCamera();
  const arriving = createDockingState(arrival, received);
  updateDockingCamera(camera, arriving, arrival, 0, 1024, 768);
  assertTightCamera(camera, arriving, arrival, 1024, 768);
  const proceduralCamera = createDockingCamera();
  updateDockingCamera(proceduralCamera, arriving, { ...arrival, localLayout: undefined }, 0, 1024, 768);
  assert(JSON.stringify(proceduralCamera) === JSON.stringify(camera), 'same task-focused framing for procedural stations');
  updateDockingCamera(camera, arriving, arrival, 1 / 60, 0, 0);
  assert(JSON.stringify(proceduralCamera) === JSON.stringify(camera), 'zero-size canvas cannot corrupt camera during resize');
}
const clusterInit = game.dockingInitFromCluster({ level: { targetPortId: 'test', members: [{ x: 100, y: 50, ports: [{ id: 'test', x: 0, y: 0 }] }] }, cs: { x: 200, y: 50, vx: -2, vy: 3, angle: 0 } }, arrival);
assert(clusterInit && dockingPoseIsClear(arrival, clusterInit.x, clusterInit.y, clusterInit.angle), 'real cluster handoff clears oversized layout');
assert(clusterInit.x === 378 && clusterInit.y === 0, 'cluster arrival ring expanded without changing approach direction');
assert(clusterInit.vx === 0 && clusterInit.vy === 3 && clusterInit.angle === Math.PI / 2, 'existing cluster velocity/heading semantics retained');
console.log(`Station layout regression passed: ${checks} assertions.`);
