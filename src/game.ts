// Game loop, state machine, collision detection, level management.

import { config } from './config';
import { InputState, readInput } from './input';
import {
  ShipState, createShip, updateShip,
  COLLISION_POINTS, GEAR_COLLISION_POINTS, localToWorld,
} from './ship';
import { TerrainData, generateTerrain, getTerrainHeight, isOnPad } from './terrain';
import { Camera, createCamera, updateCamera, render } from './renderer';
import { drawHUD, GameState, LandingScore, calculateLandingScore, drawLevelSelect } from './hud';
import { createDevPanel, toggleDevPanel, setDevPanelMode } from './dev-panel';
import { LEVELS, LevelDef } from './levels';
import {
  APPROACH_LEVELS, ApproachLevel, ApproachState, ApproachCamera,
  createApproachState, createApproachCamera, updateApproach,
  updateApproachCamera, renderApproach, drawApproachHUD,
} from './approach';
import {
  ORBITAL_LEVELS, OrbitalLevel, OrbitalState, OrbitalCamera,
  createOrbitalState, createOrbitalCamera, updateOrbital,
  updateOrbitalCamera, renderOrbital, drawOrbitalHUD,
  orbitalToApproachParams,
} from './orbital';
import {
  DOCKING_LEVELS, DockingLevel, DockingState, DockingCamera,
  createDockingState, createDockingCamera, updateDocking,
  updateDockingCamera, renderDocking, drawDockingHUD,
} from './docking';
import { MISSIONS } from './missions';

const PHYSICS_DT = 1 / 120;
const MAX_FRAME_TIME = 0.1;

type Phase =
  | { kind: 'levelSelect' }
  | { kind: 'landing'; level: LevelDef; ship: ShipState; terrain: TerrainData; camera: Camera; state: GameState; score: LandingScore | null }
  | { kind: 'approach'; level: ApproachLevel; as: ApproachState; cam: ApproachCamera; state: 'approaching' | 'approachSuccess' | 'approachFailed'; initOverride?: { x: number; y: number; vx: number; vy: number; angle: number } }
  | { kind: 'orbital'; level: OrbitalLevel; os: OrbitalState; cam: OrbitalCamera; state: 'orbiting' | 'enteredAtmo' | 'crashed' | 'docked' }
  | { kind: 'docking'; level: DockingLevel; ds: DockingState; cam: DockingCamera; state: 'docking' | 'delivered' | 'crashed' };

const TOTAL_LEVELS = MISSIONS.length;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: Phase = { kind: 'levelSelect' };
  private accumulator = 0;
  private time = 0;
  private lastFrameTime = 0;
  private menuSelection = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    createDevPanel();
  }

  start(): void {
    this.lastFrameTime = performance.now() / 1000;
    requestAnimationFrame(this.loop);
  }

  // --- Level loading ---

  private loadLanding(level: LevelDef): void {
    config.gravity = level.gravity;
    config.landingMaxVSpeed = level.landingMaxVSpeed;
    config.landingMaxHSpeed = level.landingMaxHSpeed;
    config.landingMaxAngle = level.landingMaxAngle;
    config.startX = level.startX;
    config.startY = level.startY;
    config.startVX = level.startVX;
    config.startVY = level.startVY;
    const terrain = generateTerrain(level);
    const ship = createShip();
    const camera = createCamera();
    camera.x = ship.x;
    camera.y = ship.y;
    this.phase = { kind: 'landing', level, ship, terrain, camera, state: 'flying', score: null };
    setDevPanelMode('landing');
    this.time = 0;
    this.accumulator = 0;
  }

  private loadApproach(level: ApproachLevel, initOverride?: { x: number; y: number; vx: number; vy: number; angle: number }): void {
    const as = createApproachState(level, initOverride);
    const cam = createApproachCamera(level);
    if (initOverride) { cam.x = as.x; cam.y = as.y; }
    this.phase = { kind: 'approach', level, as, cam, state: 'approaching', initOverride };
    setDevPanelMode('approach', () => this.loadApproach(level, initOverride));
    this.time = 0;
    this.accumulator = 0;
  }

  private loadDocking(level: DockingLevel): void {
    const ds = createDockingState(level);
    const cam = createDockingCamera();
    this.phase = { kind: 'docking', level, ds, cam, state: 'docking' };
    this.time = 0;
    this.accumulator = 0;
  }

  private loadOrbital(level: OrbitalLevel): void {
    const os = createOrbitalState(level);
    const cam = createOrbitalCamera(level);
    this.phase = { kind: 'orbital', level, os, cam, state: 'orbiting' };
    this.time = 0;
    this.accumulator = 0;
  }

  // --- Main loop ---

  private loop = (): void => {
    const now = performance.now() / 1000;
    let frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    const input = readInput();

    if (input.toggleDevPanel) toggleDevPanel();

    const p = this.phase;

    if (p.kind === 'levelSelect') {
      this.handleLevelSelect(input);
    } else if (p.kind === 'landing') {
      this.handleLanding(input, frameTime);
    } else if (p.kind === 'approach') {
      this.handleApproach(input, frameTime);
    } else if (p.kind === 'orbital') {
      this.handleOrbital(input, frameTime);
    } else if (p.kind === 'docking') {
      this.handleDocking(input, frameTime);
    }

    this.renderFrame();
    requestAnimationFrame(this.loop);
  };

  // --- Level select ---

  private handleLevelSelect(input: InputState): void {
    // Arrow/WASD navigation
    if (input.menuUp) this.menuSelection = (this.menuSelection - 1 + TOTAL_LEVELS) % TOTAL_LEVELS;
    if (input.menuDown) this.menuSelection = (this.menuSelection + 1) % TOTAL_LEVELS;

    // Confirm with Enter/Space
    if (input.menuConfirm) {
      this.launchLevel(this.menuSelection);
      return;
    }

    // Direct number key pick (still works)
    if (input.levelPick >= 1 && input.levelPick <= TOTAL_LEVELS) {
      this.menuSelection = input.levelPick - 1;
      this.launchLevel(this.menuSelection);
    }
  }

  private launchLevel(index: number): void {
    const mission = MISSIONS[index];
    if (!mission || mission.stub) return; // can't launch stubs

    // Mission 1: Mail Run — starts at docking (undock from Calloway station)
    if (mission.id === 1) {
      this.loadDocking(DOCKING_LEVELS[0]);
      return;
    }

    // Stubs handled above, but just in case:
    return;
  }

  // --- Landing phase ---

  private handleLanding(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'landing' }>;

    if (input.reset) { this.loadLanding(p.level); return; }
    if (input.levelSelect) { this.phase = { kind: 'levelSelect' }; return; }
    if (input.toggleGear && p.state === 'flying') {
      p.ship.gearDeployed = !p.ship.gearDeployed;
    }

    input.toggleGear = false;
    input.reset = false;
    input.levelSelect = false;
    input.levelPick = 0;

    this.accumulator += frameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'flying') {
        updateShip(p.ship, input, PHYSICS_DT, this.time, input.stopAssist, input.killRotation);
        this.checkLandingCollision(p);
        if (p.ship.y < -50 || p.ship.y > 2000 || p.ship.x < -200 || p.ship.x > 2200) {
          p.state = 'crashed';
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
    }

    const th = getTerrainHeight(p.terrain, p.ship.x);
    updateCamera(p.camera, p.ship, th, frameTime);
  }

  private checkLandingCollision(p: Extract<Phase, { kind: 'landing' }>): void {
    const pts = [...COLLISION_POINTS, ...(p.ship.gearDeployed ? GEAR_COLLISION_POINTS : [])];
    for (const [lx, ly] of pts) {
      const [wx, wy] = localToWorld(lx, ly, p.ship.x, p.ship.y, p.ship.angle);
      if (wy <= getTerrainHeight(p.terrain, wx)) {
        const onPad = isOnPad(p.terrain, wx);
        if (!onPad) { p.state = 'crashed'; return; }
        const vs = Math.abs(p.ship.vy), hs = Math.abs(p.ship.vx), ang = Math.abs(p.ship.angle);
        if (vs <= config.landingMaxVSpeed && hs <= config.landingMaxHSpeed &&
            ang <= config.landingMaxAngle && p.ship.gearDeployed) {
          p.state = 'landed';
          p.score = calculateLandingScore(p.ship, p.terrain);
          p.ship.vx = 0; p.ship.vy = 0; p.ship.angularVel = 0;
        } else {
          p.state = 'crashed';
        }
        return;
      }
    }
  }

  // --- Docking phase ---

  private handleDocking(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'docking' }>;

    if (input.reset) { this.loadDocking(p.level); return; }
    if (input.levelSelect) { this.phase = { kind: 'levelSelect' }; return; }

    input.reset = false;
    input.levelSelect = false;

    this.accumulator += frameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'docking') {
        updateDocking(p.ds, input, p.level, PHYSICS_DT);
        if (!p.ds.alive) p.state = 'crashed';
        if (p.ds.delivered) p.state = 'delivered';
        if (p.ds.exitComplete) {
          this.transitionDockingToOrbital(p);
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
    }

    updateDockingCamera(p.cam, p.ds, frameTime);
  }

  private transitionDockingToOrbital(p: Extract<Phase, { kind: 'docking' }>): void {
    // Mission 1: transition to Castor orbit (ORBITAL_LEVELS index 2)
    const orbLevel = ORBITAL_LEVELS[2]; // Castor orbit
    if (orbLevel) {
      this.loadOrbital(orbLevel);
    }
  }

  // --- Orbital phase ---

  private handleOrbital(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'orbital' }>;

    if (input.reset) { this.loadOrbital(p.level); return; }
    if (input.levelSelect) { this.phase = { kind: 'levelSelect' }; return; }

    input.reset = false;
    input.levelSelect = false;

    this.accumulator += frameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'orbiting') {
        updateOrbital(p.os, input, p.level, PHYSICS_DT);
        // Clear edge triggers after first step
        input.warpUp = false;
        input.warpDown = false;

        if (!p.os.alive) p.state = 'crashed';
        if (p.os.docked) p.state = 'docked';
        if (p.os.enteredAtmo) {
          this.transitionOrbitalToApproach(p);
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
    }

    updateOrbitalCamera(p.cam, p.os, p.level, frameTime, this.canvas.width, this.canvas.height);
  }

  private transitionApproachToLanding(p: Extract<Phase, { kind: 'approach' }>): void {
    // Determine which landing level to use
    // For now: Castor approach (id=11) -> Castor landing (LEVELS[5], id=6)
    // Kepler's Rest approach (id=6) -> Luna Station (LEVELS[0], id=1)
    let landingIdx = 0;
    if (p.level.id === 11) landingIdx = 5; // Castor
    const landingLevel = LEVELS[landingIdx];

    // Nudge: clamp speed and position to survivable approach
    const speed = Math.sqrt(p.as.vx * p.as.vx + p.as.vy * p.as.vy);
    const maxEntrySpeed = 50; // max speed entering landing phase
    let vx = p.as.vx;
    let vy = p.as.vy;
    if (speed > maxEntrySpeed) {
      const scale = maxEntrySpeed / speed;
      vx *= scale;
      vy *= scale;
    }
    // Clamp altitude: at least 150m above pad
    const minAlt = landingLevel.padY + 150;
    const startY = Math.max(p.as.y, minAlt);
    // Nudge vertical speed: no more than -10 m/s downward
    vy = Math.max(vy, -10);

    config.gravity = landingLevel.gravity;
    config.landingMaxVSpeed = landingLevel.landingMaxVSpeed;
    config.landingMaxHSpeed = landingLevel.landingMaxHSpeed;
    config.landingMaxAngle = landingLevel.landingMaxAngle;
    config.startX = landingLevel.padCenterX; // start near pad
    config.startY = startY;
    config.startVX = Math.min(Math.abs(vx), 10) * (vx > 0 ? 1 : -1); // gentle horizontal
    config.startVY = vy;
    const terrain = generateTerrain(landingLevel);
    const ship = createShip();
    ship.x = config.startX;
    ship.y = config.startY;
    ship.vx = config.startVX;
    ship.vy = config.startVY;
    const camera = createCamera();
    camera.x = ship.x;
    camera.y = ship.y;
    this.phase = { kind: 'landing', level: landingLevel, ship, terrain, camera, state: 'flying', score: null };
    this.time = 0;
    this.accumulator = 0;
  }

  private transitionOrbitalToApproach(p: Extract<Phase, { kind: 'orbital' }>): void {
    const approachLevel = APPROACH_LEVELS[p.level.approachLevelIdx];
    if (!approachLevel) {
      // No approach level configured — just show the end screen
      p.state = 'enteredAtmo';
      return;
    }
    const params = orbitalToApproachParams(p.os, p.level);
    this.loadApproach(approachLevel, params);
  }

  // --- Approach phase ---

  private handleApproach(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'approach' }>;

    if (input.reset) { this.loadApproach(p.level, p.initOverride); return; }
    if (input.levelSelect) { this.phase = { kind: 'levelSelect' }; return; }

    input.reset = false;
    input.levelSelect = false;

    this.accumulator += frameTime;
    let edgeConsumed = false;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'approaching') {
        updateApproach(p.as, input, p.level, PHYSICS_DT, this.time);
        // Clear edge triggers after first physics step
        if (!edgeConsumed) { edgeConsumed = true; }
        else { input.toggleHeatShield = false; input.toggleWings = false; }

        if (!p.as.alive) p.state = 'approachFailed';
        if (p.as.gateReached) {
          this.transitionApproachToLanding(p);
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
    }

    updateApproachCamera(p.cam, p.as, p.level, frameTime, this.canvas.width, this.canvas.height);
  }

  // --- Render ---

  private renderFrame(): void {
    const p = this.phase;
    if (p.kind === 'levelSelect') {
      drawLevelSelect(this.ctx, this.canvas, this.menuSelection);
    } else if (p.kind === 'landing') {
      render(this.ctx, this.canvas, p.camera, p.ship, p.terrain, this.time);
      drawHUD(this.ctx, this.canvas, p.ship, p.terrain, p.state, p.score, p.level);
    } else if (p.kind === 'approach') {
      renderApproach(this.ctx, this.canvas, p.cam, p.as, p.level, this.time);
      drawApproachHUD(this.ctx, this.canvas, p.as, p.level, p.state, this.time);
    } else if (p.kind === 'orbital') {
      renderOrbital(this.ctx, this.canvas, p.cam, p.os, p.level, this.time);
      drawOrbitalHUD(this.ctx, this.canvas, p.os, p.level, p.state);
    } else if (p.kind === 'docking') {
      renderDocking(this.ctx, this.canvas, p.cam, p.ds, p.level, this.time);
      drawDockingHUD(this.ctx, this.canvas, p.ds, p.level, p.state);
    }
  }
}
