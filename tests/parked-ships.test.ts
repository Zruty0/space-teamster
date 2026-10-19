import './svg-dom';
import { localLayoutById, populateLocalLayoutShips, type LocalLayout } from '../src/local-layouts';
import { createGenericDockingLevel, createDockingState, updateDocking, dockingPoseIsClear, DOCKING_LEVELS } from '../src/docking';
import { createPlayableEstellaMission } from '../src/estella-playable';
import type { InputState } from '../src/input';

let checks = 0;
function assert(ok: unknown, message: string): asserts ok { checks++; if (!ok) throw new Error(message); }
const base = localLayoutById('svarog-shipyard')!;
const original = JSON.stringify(base);
assert(base.shipDocks?.length === 5, 'five ship dock markers imported');
assert(base.shipDocks.filter(d => d.lengthMeters <= 50).length === 3, 'three small ship docks');
assert(base.shipDocks.filter(d => d.lengthMeters > 50).length === 2, 'two long docks');
assert(base.shapes.length === 275 && !base.shapes.some(s => s.id.startsWith('ship-')), 'pink placeholders neither rendered nor collidable');
assert(base.berths.length === 36, 'ship docks do not become cargo delivery berths');
const stationId = 'estella-via-drydock';
const yard = populateLocalLayoutShips(base, stationId);
const snapshot = JSON.stringify(yard.parkedShips);
assert(snapshot === JSON.stringify([
  { dockId: 'ship-a-nose-left' }, { dockId: 'ship-b-nose-right' },
  { dockId: 'ship-e-nose-down' }, { dockId: 'ship-d-nose-down' },
  { dockId: 'ship-c-nose-down', shipId: 'small-ship-1' },
]), 'stable Svarog population snapshot: C occupied, other docks empty');
assert(populateLocalLayoutShips(base, stationId) === yard, 'immutable station composition reused');
assert(JSON.stringify(populateLocalLayoutShips(JSON.parse(original), stationId)) === JSON.stringify(yard), 'fresh parse/reload yields identical population and geometry');
assert(JSON.stringify(base) === original, 'shared base artwork not mutated');
assert(yard.centerX === base.centerX && yard.centerY === base.centerY && yard.widthMeters === base.widthMeters && yard.heightMeters === base.heightMeters, 'population leaves full yard scale and center unchanged');

function checkGeometry(layout: LocalLayout): void {
  const baseShapes = layout.shapes.filter(s => !s.id.startsWith('ship-'));
  assert(JSON.stringify(baseShapes.map(s => s.id)) === JSON.stringify(base.shapes.map(s => s.id)), 'station artwork keeps its original paint order');
  for (const record of layout.parkedShips!) {
    const dock = layout.shipDocks!.find(d => d.id === record.dockId)!;
    const shapes = layout.shapes.filter(s => s.id.startsWith(`${dock.id}/`));
    if (!record.shipId) { assert(shapes.length === 0, 'empty dock has no ship geometry'); continue; }
    assert(dock.lengthMeters <= 50 && shapes.length > 0, 'only supported small docks populated');
    const first = layout.shapes.indexOf(shapes[0]);
    const last = layout.shapes.indexOf(shapes[shapes.length - 1]);
    if (dock.shapeIndex > 0) assert(layout.shapes.indexOf(baseShapes[dock.shapeIndex - 1]) < first, 'ship painted after artwork preceding its marker');
    if (dock.shapeIndex < baseShapes.length) assert(last < layout.shapes.indexOf(baseShapes[dock.shapeIndex]), 'ship painted before artwork following its marker');
    const dx = Math.cos(dock.noseAngle), dy = -Math.sin(dock.noseAngle); // SVG y down
    const halfLength = dock.lengthMeters * layout.svgUnitsPerMeter / 2;
    const halfWidth = dock.widthMeters * layout.svgUnitsPerMeter / 2;
    for (const shape of shapes) {
      assert(shape.id.startsWith(`${dock.id}/${record.shipId}/`), 'model shapes namespaced by dock');
      const polygons = [shape.collisionPolygon ?? [], ...(shape.strokeCollisionPolygons ?? [])];
      for (const polygon of polygons) for (const point of polygon) {
        const px = point.x - dock.svgCenterX, py = point.y - dock.svgCenterY;
        assert(Math.abs(px * dx + py * dy) <= halfLength + 1e-7, 'paint/collision stays within dock length');
        assert(Math.abs(-px * dy + py * dx) <= halfWidth + 1e-7, 'paint/collision stays within dock width');
      }
      // Independently compare the rendered transform of the first path point
      // with its collider point; composed parent transforms must agree.
      if (shape.kind === 'path' && shape.collisionPolygon) {
        const tokens = shape.data.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)!;
        const x = Number(tokens[1]), y = Number(tokens[2]), t = shape.transform;
        const p = shape.collisionPolygon[0];
        assert(Math.hypot(t.a * x + t.c * y + t.e - p.x, t.b * x + t.d * y + t.f - p.y) < 1e-7, 'render and collider transforms coincide');
      }
    }
  }
}
checkGeometry(yard);
const cShapes = yard.shapes.filter(s => s.id.startsWith('ship-c-nose-down/'));
const floorIndex = yard.shapes.findIndex(s => s.id === 'rect9');
assert(yard.shapes[floorIndex].paint.fill === '#2c1111', 'dock interior stays authored dark red, not repainted black');
for (const shape of cShapes) {
  assert(floorIndex < yard.shapes.indexOf(shape), 'dock C floor below ship');
  for (const rib of ['path98', 'path99']) assert(yard.shapes.indexOf(shape) < yard.shapes.findIndex(s => s.id === rib), 'dock C foreground ribs above every ship shape');
}
// Marker slots at either end also work; insertion is not tied to Svarog IDs.
for (const shapeIndex of [0, base.shapes.length]) {
  const moved = { ...base, shipDocks: base.shipDocks!.map(d => ({ ...d, shapeIndex })) };
  checkGeometry(populateLocalLayoutShips(moved, stationId));
}

// Fixed deterministic sample: each dock independently supports empty and every
// design. Occupancy uses a separate draw from the uniformly indexed model draw.
const states = new Map<string, Set<string>>();
const patterns = new Set<string>();
const modelCounts = new Map<string, number>();
let occupied = 0;
let fullyOccupiedStation: string | undefined;
for (let i = 0; i < 200; i++) {
  const key = `fixture-station-${i}`;
  const populated = populateLocalLayoutShips(base, key);
  const small = populated.parkedShips!.filter(p => base.shipDocks!.find(d => d.id === p.dockId)!.lengthMeters <= 50);
  patterns.add(small.map(p => p.shipId ? '1' : '0').join(''));
  if (small.every(p => p.shipId)) fullyOccupiedStation ??= key;
  for (const p of populated.parkedShips!) {
    const dock = base.shipDocks!.find(d => d.id === p.dockId)!;
    if (dock.lengthMeters > 50) { assert(!p.shipId, 'long docks always empty'); continue; }
    const seen = states.get(p.dockId) ?? new Set();
    seen.add(p.shipId ?? 'empty'); states.set(p.dockId, seen);
    if (p.shipId) { occupied++; modelCounts.set(p.shipId, (modelCounts.get(p.shipId) ?? 0) + 1); }
  }
  checkGeometry(populated);
}
assert(patterns.size === 8, 'all independent occupancy combinations possible, including all-empty/all-full');
for (const seen of states.values()) assert(seen.size === 4, 'each small dock can be empty or use any of three ships');
assert(occupied > 240 && occupied < 360, '50/50 occupancy sanity check over fixed sample');
for (const count of modelCounts.values()) assert(count > 60 && count < 140, 'roughly uniform model selection over fixed sample');

// Author-specified nose direction rotates the same model, without mirroring or
// changing size/selection. This also covers future left/right/up dock markers.
for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const rotatedBase = { ...base, shipDocks: base.shipDocks!.map(d => ({ ...d, noseAngle: angle })) };
  const rotated = populateLocalLayoutShips(rotatedBase, stationId);
  assert(JSON.stringify(rotated.parkedShips) === snapshot, 'dock pose does not reroll selection');
  checkGeometry(rotated);
  const delta = -(angle - base.shipDocks!.find(d => d.id === 'ship-c-nose-down')!.noseAngle);
  const center = base.shipDocks!.find(d => d.id === 'ship-c-nose-down')!;
  for (const shape of yard.shapes.filter(s => s.id.startsWith('ship-c-nose-down/'))) {
    const turned = rotated.shapes.find(s => s.id === shape.id)!;
    for (let i = 0; i < (shape.collisionPolygon?.length ?? 0); i++) {
      const p = shape.collisionPolygon![i], q = turned.collisionPolygon![i];
      const x = p.x - center.svgCenterX, y = p.y - center.svgCenterY;
      assert(Math.hypot(center.svgCenterX + x * Math.cos(delta) - y * Math.sin(delta) - q.x,
        center.svgCenterY + x * Math.sin(delta) + y * Math.cos(delta) - q.y) < 1e-7, 'nose direction rotates artwork and collider together');
    }
  }
}

const opts = { id: 123, stationId, name: 'Svarog Shipyard', subtitle: '', layoutId: base.id, autoRotate: false, rotationDegrees: 0, fillPct: 1 };
for (const key of [stationId, fullyOccupiedStation!]) {
  const population = JSON.stringify(populateLocalLayoutShips(base, key).parkedShips);
  const visited = new Set<string>();
  for (let randomSeed = 1; randomSeed < 1000 && visited.size < 36; randomSeed++) {
    for (const exitMode of [false, true]) {
      const level = createGenericDockingLevel({ ...opts, stationId: key, id: randomSeed, name: `Unrelated display label ${randomSeed}`, randomSeed, exitMode });
      visited.add(level.bays.find(b => b.isTarget || b.isPlayerBay)!.layoutBerthId!);
      assert(JSON.stringify(level.localLayout!.parkedShips) === population, 'mission seed, phase, level ID and display name cannot reroll yard');
      assert(dockingPoseIsClear(level, level.startX, level.startY, level.startAngle), 'all occupied cargo neighbors + yard ships leave rig spawn clear');
      const s = createDockingState(level), x = s.x, y = s.y;
      updateDocking(s, {} as InputState, level, 0);
      assert(Math.hypot(s.x - x, s.y - y) < 1e-8, 'populated yard has no spawn collision correction');
    }
  }
  assert(visited.size === 36, 'all cargo berths covered for actual and fully occupied shipyard');
}
const departure = createPlayableEstellaMission('estella-via-drydock-station', 'estella-via-component-supply-station', undefined, 1234);
assert(departure.start.kind === 'docking' && JSON.stringify(departure.start.level.localLayout!.parkedShips) === snapshot, 'real departure uses stable station identity');
createPlayableEstellaMission('estella-via-component-supply-station', 'estella-via-drydock-station', undefined, 9876);
const arrival = [...DOCKING_LEVELS].reverse().find(l => !l.exitMode && l.layoutId === base.id)!;
assert(arrival && JSON.stringify(arrival.localLayout!.parkedShips) === snapshot, 'real return visit has same ships despite different mission seed');
for (const id of ['small-station-1', 'small-station-2', 'medieval-station']) {
  const layout = localLayoutById(id)!;
  assert(populateLocalLayoutShips(layout, 'irrelevant') === layout, 'stations without ship markers unchanged');
}
console.log(`Parked ship regression passed: ${checks} assertions. Occupied ${occupied}/600; models ${JSON.stringify(Object.fromEntries(modelCounts))}.`);
