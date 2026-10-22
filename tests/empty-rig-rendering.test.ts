import './svg-dom';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { createShip } from '../src/ship';
import { createCamera, drawLandingShip } from '../src/renderer';
import { APPROACH_LEVELS, createApproachCamera, createApproachState, drawApproachShip } from '../src/approach';
import { ORBITAL_LEVELS, createOrbitalCamera, createOrbitalState, drawOrbitalShip } from '../src/orbital';
import { NEW_CANAAN_CLUSTER_LEVEL, createClusterCamera, createClusterState, drawClusterShip } from '../src/cluster';
import { createGenericDockingLevel, createDockingCamera, createDockingState, drawTug } from '../src/docking';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw Error(message); }
const containerColors = new Set(['#102010', '#1a2a1a', '#44aa66', '#335f33', 'rgba(68, 170, 102, 0.85)', 'rgba(68, 170, 102, 0.3)']);
type Paint = { operation: string; color: string; geometry: unknown[]; width?: number };
function trace(draw: (ctx: CanvasRenderingContext2D) => void): Paint[] {
  const paints: Paint[] = []; let path: unknown[] = [];
  const base: any = {
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    beginPath() { path = []; },
    moveTo(...args: number[]) { path.push(['M', ...args]); },
    lineTo(...args: number[]) { path.push(['L', ...args]); },
    arc(...args: unknown[]) { path.push(['A', ...args]); },
    closePath() { path.push(['Z']); },
    stroke() { paints.push({operation:'stroke',color:this.strokeStyle,geometry:[...path],width:this.lineWidth}); },
    fill() { paints.push({operation:'fill',color:this.fillStyle,geometry:[...path]}); },
    strokeRect(...args: number[]) { paints.push({operation:'strokeRect',color:this.strokeStyle,geometry:args,width:this.lineWidth}); },
    fillRect(...args: number[]) { paints.push({operation:'fillRect',color:this.fillStyle,geometry:args}); },
  };
  const ctx = new Proxy(base, { get: (target, key) => key in target ? target[key] : () => {} }) as CanvasRenderingContext2D;
  draw(ctx);
  return paints;
}
createPlayableEstellaMission('estella-vi-heavy-cargo-station','estella-vi-industrial-city',undefined,30);
const ship = createShip();
ship.gearDeployed = true;
const approachLevel = APPROACH_LEVELS[0], approach = createApproachState(approachLevel);
approach.vx = approach.vy = 0;
const orbitalLevel = ORBITAL_LEVELS[0], orbital = createOrbitalState(orbitalLevel);
orbital.vx = orbital.vy = 0;
const cluster = createClusterState(NEW_CANAAN_CLUSTER_LEVEL);
const dockingLevel = createGenericDockingLevel({id:9999,name:'Render test',subtitle:'',exitMode:false});
const docking = createDockingState(dockingLevel);
const scenarios: Array<[string, unknown, (ctx: CanvasRenderingContext2D, visible?: boolean) => void]> = [
  ['landing', ship, (ctx, visible) => drawLandingShip(ctx,createCamera(),ship,1280,900,0,visible)],
  ['approach', approach, (ctx, visible) => drawApproachShip(ctx,createApproachCamera(approachLevel),approach,approachLevel,1280,900,0,visible)],
  ['orbital', orbital, (ctx, visible) => drawOrbitalShip(ctx,createOrbitalCamera(orbitalLevel),orbital,orbitalLevel,1280,900,0,visible)],
  ['cluster', cluster, (ctx, visible) => drawClusterShip(ctx,createClusterCamera(NEW_CANAAN_CLUSTER_LEVEL),cluster,1280,900,0,visible)],
  ['docking', docking, (ctx, visible) => drawTug(ctx,createDockingCamera(),docking,dockingLevel,1280,900,0,visible)],
];
for (const [phase, state, draw] of scenarios) {
  const before = JSON.stringify(state);
  const loaded = trace(ctx => draw(ctx,true));
  const empty = trace(ctx => draw(ctx,false));
  assert(loaded.some(p => containerColors.has(p.color)),`${phase}: loaded container visible`);
  assert(!empty.some(p => containerColors.has(p.color)),`${phase}: no container fill, outline or ribs on empty run`);
  assert(empty.some(p => p.color === '#00ff88'),`${phase}: chassis/cab retained`);
  assert(JSON.stringify(loaded.filter(p => !containerColors.has(p.color))) === JSON.stringify(empty),`${phase}: all non-container paint unchanged (cab/frame/engines/gear)`);
  assert(JSON.stringify(trace(ctx => draw(ctx))) === JSON.stringify(loaded),`${phase}: normal/default rendering unchanged`);
  assert(JSON.stringify(trace(ctx => draw(ctx,false))) === JSON.stringify(empty),`${phase}: empty rendering stable on retry`);
  assert(JSON.stringify(state) === before,`${phase}: rendering does not change flight state`);
}
console.log(`Empty rig rendering passed: ${assertions} assertions across all five flight views.`);
