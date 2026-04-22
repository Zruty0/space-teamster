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
  APPROACH_LEVELS, ApproachLevel, ApproachState, ApproachCamera, ApproachInitOverride,
  createApproachState, createApproachCamera, updateApproach,
  updateApproachCamera, renderApproach, drawApproachHUD,
} from './approach';
import {
  ORBITAL_LEVELS, OrbitalLevel, OrbitalState, OrbitalCamera, OrbitalInitOverride,
  createOrbitalState, createOrbitalCamera, updateOrbital,
  updateOrbitalCamera, renderOrbital, drawOrbitalHUD,
  orbitalToApproachParams, getTransferBody, transferBodyState,
} from './orbital';
import {
  DOCKING_LEVELS, DockingLevel, DockingState, DockingCamera, DockingInitOverride,
  createDockingState, createDockingCamera, updateDocking,
  updateDockingCamera, renderDocking, drawDockingHUD,
} from './docking';
import { MISSIONS } from './missions';

const PHYSICS_DT = 1 / 120;
const MAX_FRAME_TIME = 0.1;

type Phase =
  | { kind: 'levelSelect' }
  | { kind: 'landing'; level: LevelDef; ship: ShipState; terrain: TerrainData; camera: Camera; state: GameState; score: LandingScore | null; initOverride?: { x: number; y: number; vx: number; vy: number }; launchGuidance?: { targetAltitude: number; orbitDir: 1 | -1; nextApproachLevelId: number } }
  | { kind: 'approach'; level: ApproachLevel; as: ApproachState; cam: ApproachCamera; state: 'approaching' | 'approachSuccess' | 'approachFailed'; initOverride?: ApproachInitOverride }
  | { kind: 'orbital'; level: OrbitalLevel; os: OrbitalState; cam: OrbitalCamera; state: 'orbiting' | 'enteredAtmo' | 'crashed' | 'docked'; initOverride?: OrbitalInitOverride }
  | { kind: 'docking'; level: DockingLevel; ds: DockingState; cam: DockingCamera; state: 'docking' | 'delivered' | 'crashed'; initOverride?: DockingInitOverride };

const TOTAL_LEVELS = MISSIONS.length;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: Phase = { kind: 'levelSelect' };
  private accumulator = 0;
  private time = 0;
  private lastFrameTime = 0;
  private menuSelection = 0;
  private currentMissionId: number | null = null;
  private guidanceText = '';
  private guidanceUntil = 0;

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

  private loadLanding(
    level: LevelDef,
    initOverride?: { x: number; y: number; vx: number; vy: number },
    launchGuidance?: { targetAltitude: number; orbitDir: 1 | -1; nextApproachLevelId: number },
  ): void {
    config.gravity = level.gravity;
    config.landingMaxVSpeed = level.landingMaxVSpeed;
    config.landingMaxHSpeed = level.landingMaxHSpeed;
    config.landingMaxAngle = level.landingMaxAngle;
    const init = initOverride ?? { x: level.startX, y: level.startY, vx: level.startVX, vy: level.startVY };
    config.startX = init.x;
    config.startY = init.y;
    config.startVX = init.vx;
    config.startVY = init.vy;
    const terrain = generateTerrain(level);
    const ship = createShip();
    if (launchGuidance) {
      ship.gearDeployed = true;
      ship.x = level.padCenterX;
      ship.y = getTerrainHeight(terrain, level.padCenterX) + 6.6;
      ship.vx = 0;
      ship.vy = 0;
      ship.angle = 0;
      ship.angularVel = 0;
      ship.throttle = 0;
    }
    const camera = createCamera();
    camera.x = ship.x;
    camera.y = ship.y;
    this.phase = { kind: 'landing', level, ship, terrain, camera, state: 'flying', score: null, initOverride, launchGuidance };
    if (launchGuidance) this.showGuidance(`CLIMB TO above ${launchGuidance.targetAltitude.toFixed(0)}m`);
    else this.showGuidance('LAND ON THE PAD');
    setDevPanelMode('landing');
    this.time = 0;
    this.accumulator = 0;
  }

  private loadApproach(level: ApproachLevel, initOverride?: ApproachInitOverride): void {
    const as = createApproachState(level, initOverride);
    const cam = createApproachCamera(level);
    if (initOverride) { cam.x = as.x; cam.y = as.y; }
    this.phase = { kind: 'approach', level, as, cam, state: 'approaching', initOverride };
    if (level.departure) {
      const dir = level.departure.orbitDir === -1 ? 'LEFT' : 'RIGHT';
      this.showGuidance(`CLIMB to ${(level.departure.exitAltitude / 1000).toFixed(1)}km and ACCELERATE ${dir}`);
    } else {
      this.showGuidance('ARRIVE AT TARGET AREA');
    }
    setDevPanelMode('approach', () => this.loadApproach(level, initOverride));
    this.time = 0;
    this.accumulator = 0;
  }

  private loadDocking(level: DockingLevel, initOverride?: DockingInitOverride): void {
    const ds = createDockingState(level, initOverride);
    const cam = createDockingCamera();
    if (initOverride) { cam.x = ds.x; cam.y = ds.y; }
    this.phase = { kind: 'docking', level, ds, cam, state: 'docking', initOverride };
    this.showGuidance(level.exitMode ? 'CLEAR THE STATION' : 'DELIVER TO TARGET BAY');
    this.time = 0;
    this.accumulator = 0;
  }

  private loadOrbital(level: OrbitalLevel, initOverride?: OrbitalInitOverride): void {
    const os = createOrbitalState(level, initOverride);
    const cam = createOrbitalCamera(level);
    if (initOverride) { cam.x = os.x; cam.y = os.y; }
    this.phase = { kind: 'orbital', level, os, cam, state: 'orbiting', initOverride };
    const guidance = level.station ? 'RENDEZVOUS WITH TARGET'
      : level.targetBodyId ? 'INTERCEPT TARGET BODY'
      : level.escapeSOIRadius ? 'ESCAPE TOWARD TARGET'
      : (level.showLandingSite === false ? 'MAINTAIN ORBITAL OBJECTIVE' : 'DEORBIT TO TARGET');
    this.showGuidance(guidance);
    this.time = 0;
    this.accumulator = 0;
  }

  private showGuidance(text: string, duration = 4): void {
    this.guidanceText = text;
    this.guidanceUntil = performance.now() / 1000 + duration;
  }

  private drawGuidanceBanner(): void {
    const now = performance.now() / 1000;
    if (!this.guidanceText || now > this.guidanceUntil) return;
    const W = this.canvas.width;
    this.ctx.save();
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.fillText(this.guidanceText, W / 2, 30);
    this.ctx.restore();
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

  private startMission(missionId: number): void {
    this.currentMissionId = missionId;

    if (missionId === 1) {
      this.loadDocking(DOCKING_LEVELS.find(l => l.id === 1)!);
      return;
    }

    if (missionId === 2) {
      const castor = LEVELS.find(l => l.id === 6)!;
      const departure = APPROACH_LEVELS.find(l => l.id === 12)!;
      const orbitDir = departure.departure?.orbitDir ?? 1;
      this.loadLanding(
        castor,
        { x: castor.padCenterX, y: castor.padY + 6.6, vx: 0, vy: 0 },
        { targetAltitude: castor.startY, orbitDir, nextApproachLevelId: 12 },
      );
      return;
    }

    if (missionId === 3) {
      this.loadDocking(DOCKING_LEVELS.find(l => l.id === 13)!);
      return;
    }

    if (missionId === 4) {
      const tycho = LEVELS.find(l => l.id === 7)!;
      const departure = APPROACH_LEVELS.find(l => l.id === 14)!;
      const orbitDir = departure.departure?.orbitDir ?? 1;
      this.loadLanding(
        tycho,
        { x: tycho.padCenterX, y: tycho.padY + 6.6, vx: 0, vy: 0 },
        { targetAltitude: tycho.startY, orbitDir, nextApproachLevelId: 14 },
      );
      return;
    }

    if (missionId === 5) {
      const castor = LEVELS.find(l => l.id === 6)!;
      const departure = APPROACH_LEVELS.find(l => l.id === 15)!;
      const orbitDir = departure.departure?.orbitDir ?? 1;
      this.loadLanding(
        castor,
        { x: castor.padCenterX, y: castor.padY + 6.6, vx: 0, vy: 0 },
        { targetAltitude: castor.startY, orbitDir, nextApproachLevelId: 15 },
      );
      return;
    }
  }

  private launchLevel(index: number): void {
    const mission = MISSIONS[index];
    if (!mission || mission.stub) return;
    this.startMission(mission.id);
  }

  // --- Landing phase ---

  private handleLanding(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'landing' }>;

    if (input.reset) { this.loadLanding(p.level, p.initOverride, p.launchGuidance); return; }
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
        if (this.shouldHoldLaunchOnPad(p, input)) {
          this.clampLaunchShipToPad(p);
        } else {
          updateShip(p.ship, input, PHYSICS_DT, this.time, input.stopAssist, input.killRotation);
          this.checkLandingCollision(p);
        }
        if (p.launchGuidance && p.state === 'flying') {
          const alt = p.ship.y - getTerrainHeight(p.terrain, p.ship.x);
          if (alt >= p.launchGuidance.targetAltitude && p.ship.vy >= 0) {
            this.transitionLandingToApproach(p);
            return;
          }
        }
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
          if (p.launchGuidance) {
            const groundY = getTerrainHeight(p.terrain, p.ship.x);
            p.ship.vx = 0; p.ship.vy = 0; p.ship.angularVel = 0; p.ship.angle = 0;
            p.ship.y = groundY + 6.6;
          } else {
            p.state = 'landed';
            p.score = calculateLandingScore(p.ship, p.terrain);
            p.ship.vx = 0; p.ship.vy = 0; p.ship.angularVel = 0;
          }
        } else {
          p.state = 'crashed';
        }
        return;
      }
    }
  }

  private shouldHoldLaunchOnPad(
    p: Extract<Phase, { kind: 'landing' }>,
    input: InputState,
  ): boolean {
    if (!p.launchGuidance) return false;
    const onPad = isOnPad(p.terrain, p.ship.x);
    if (!onPad) return false;
    const groundY = getTerrainHeight(p.terrain, p.ship.x);
    const grounded = Math.abs(p.ship.y - (groundY + 6.6)) < 0.2;
    const settled = Math.abs(p.ship.vx) < 0.2 && Math.abs(p.ship.vy) < 0.2 && Math.abs(p.ship.angularVel) < 0.05 && Math.abs(p.ship.angle) < 0.05;
    const holding = !input.throttleUp && p.ship.throttle < 0.05;
    return grounded && settled && holding;
  }

  private clampLaunchShipToPad(p: Extract<Phase, { kind: 'landing' }>): void {
    const groundY = getTerrainHeight(p.terrain, p.ship.x);
    p.ship.x = p.level.padCenterX;
    p.ship.y = groundY + 6.6;
    p.ship.vx = 0;
    p.ship.vy = 0;
    p.ship.angle = 0;
    p.ship.angularVel = 0;
    p.ship.throttle = 0;
  }

  // --- Docking phase ---

  private handleDocking(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'docking' }>;

    if (input.reset) { this.loadDocking(p.level, p.initOverride); return; }
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

    updateDockingCamera(p.cam, p.ds, p.level, frameTime, this.canvas.width, this.canvas.height);
  }

  private transitionDockingToOrbital(p: Extract<Phase, { kind: 'docking' }>): void {
    if (this.currentMissionId === 1) {
      const orbLevel = ORBITAL_LEVELS.find(l => l.id === 11);
      if (orbLevel) this.loadOrbital(orbLevel);
      return;
    }
    if (this.currentMissionId === 3) {
      const orbLevel = ORBITAL_LEVELS.find(l => l.id === 13);
      if (orbLevel) this.loadOrbital(orbLevel);
    }
  }

  // --- Orbital phase ---

  private handleOrbital(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'orbital' }>;

    if (input.reset) { this.loadOrbital(p.level, p.initOverride); return; }
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
        if (p.os.docked) {
          if (this.currentMissionId === 2 || this.currentMissionId === 4) {
            this.transitionOrbitalToDocking(p);
            return;
          }
          p.state = 'docked';
        }
        if (this.handleMissionOrbitalTransition(p)) return;
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

  private handleMissionOrbitalTransition(p: Extract<Phase, { kind: 'orbital' }>): boolean {
    if (this.currentMissionId !== 5) return false;

    if (p.level.escapeSOIRadius && p.level.escapeToOrbitalLevelId) {
      const r = Math.sqrt(p.os.x * p.os.x + p.os.y * p.os.y);
      if (r >= p.level.escapeSOIRadius) {
        const nextLevel = ORBITAL_LEVELS.find(l => l.id === p.level.escapeToOrbitalLevelId);
        if (!nextLevel) return false;
        const castorState = transferBodyState(nextLevel, 'castor', p.os.time);
        if (!castorState) return false;
        const localSpeed = Math.sqrt(p.os.vx * p.os.vx + p.os.vy * p.os.vy);
        if (localSpeed < 0.01) return false;
        const escapeAngle = Math.atan2(p.os.vy, p.os.vx);
        this.loadOrbital(nextLevel, {
          x: castorState.x,
          y: castorState.y,
          vx: castorState.vx + Math.cos(escapeAngle) * localSpeed,
          vy: castorState.vy + Math.sin(escapeAngle) * localSpeed,
          time: p.os.time,
        });
        return true;
      }
    }

    if (p.level.targetBodyId) {
      const body = getTransferBody(p.level, p.level.targetBodyId);
      const bodyState = body ? transferBodyState(p.level, body.id, p.os.time) : null;
      if (!body || !bodyState) return false;

      const rx = p.os.x - bodyState.x;
      const ry = p.os.y - bodyState.y;
      const rvx = p.os.vx - bodyState.vx;
      const rvy = p.os.vy - bodyState.vy;
      const dist = Math.sqrt(rx * rx + ry * ry);
      const speed = Math.sqrt(rvx * rvx + rvy * rvy);
      const minR = body.radius + (body.arrivalAltitudeMin ?? 0);
      const maxR = body.radius + (body.arrivalAltitudeMax ?? 0);
      const targetR = Math.max(minR, Math.min(maxR, dist));
      const vEsc = Math.sqrt(2 * body.gm / targetR);
      const minSpeed = Math.max(vEsc * 1.002, vEsc + (body.arrivalSpeedMarginMin ?? 2));
      const maxSpeed = Math.max(minSpeed + 1, vEsc + (body.arrivalSpeedMarginMax ?? 100));
      const rHatX = rx / Math.max(dist, 1);
      const rHatY = ry / Math.max(dist, 1);
      const radialSpeed = rvx * rHatX + rvy * rHatY;
      const arrivalReady = dist <= body.patchRadius && radialSpeed < 0;
      if (!arrivalReady) return false;

      const arrivalLevelId = body.arrivalOrbitalLevelId;
      const arrivalLevel = arrivalLevelId ? ORBITAL_LEVELS.find(l => l.id === arrivalLevelId) : null;
      if (!arrivalLevel) return false;

      const tanX = -rHatY;
      const tanY = rHatX;
      const tangentialSpeed = rvx * tanX + rvy * tanY;
      const speedMag = Math.max(speed, 1);
      const dirRad = radialSpeed / speedMag;
      const dirTan = tangentialSpeed / speedMag;
      const targetSpeed = Math.max(minSpeed, Math.min(maxSpeed, speed));
      const targetVR = dirRad * targetSpeed;
      const targetVT = dirTan * targetSpeed;
      const initOverride: OrbitalInitOverride = {
        x: rHatX * targetR,
        y: rHatY * targetR,
        vx: rHatX * targetVR + tanX * targetVT,
        vy: rHatY * targetVR + tanY * targetVT,
        time: p.os.time,
      };
      this.loadOrbital(arrivalLevel, initOverride);
      return true;
    }

    return false;
  }

  private transitionLandingToApproach(p: Extract<Phase, { kind: 'landing' }>): void {
    const nextId = p.launchGuidance?.nextApproachLevelId;
    const approachLevel = APPROACH_LEVELS.find(l => l.id === nextId);
    if (!approachLevel) return;

    const terrainH = getTerrainHeight(p.terrain, p.ship.x);
    const initOverride: ApproachInitOverride = {
      x: p.ship.x - p.level.padCenterX,
      y: Math.max(0, p.ship.y - terrainH),
      vx: p.ship.vx,
      vy: p.ship.vy,
      angle: p.ship.angle,
    };
    this.loadApproach(approachLevel, initOverride);
  }

  private transitionApproachToLanding(p: Extract<Phase, { kind: 'approach' }>): void {
    const landingLevel = LEVELS.find(l => l.id === p.level.landingLevelId) ?? LEVELS[0];

    if (p.level.gateRadius > 0) {
      const gateLeft = p.level.gateX - p.level.gateRadius;
      const gateWidth = Math.max(1, p.level.gateRadius * 2);
      const nx = Math.max(0, Math.min(1, (p.as.x - gateLeft) / gateWidth));
      const ny = Math.max(0, Math.min(1, p.as.y / Math.max(1, p.level.gateY)));

      const landingHalfSpan = 500;
      const landingAltMin = 100;
      const landingAltMax = 300;
      const initOverride = {
        x: landingLevel.padCenterX + (nx * 2 - 1) * landingHalfSpan,
        y: landingLevel.padY + (landingAltMin + ny * (landingAltMax - landingAltMin)),
        vx: Math.max(-20, Math.min(20, p.as.vx)),
        vy: Math.max(-5, Math.min(20, p.as.vy)),
      };
      this.loadLanding(landingLevel, initOverride);
      return;
    }

    const speed = Math.sqrt(p.as.vx * p.as.vx + p.as.vy * p.as.vy);
    const maxEntrySpeed = 50;
    let vx = p.as.vx;
    let vy = p.as.vy;
    if (speed > maxEntrySpeed) {
      const scale = maxEntrySpeed / speed;
      vx *= scale;
      vy *= scale;
    }
    const targetAlt = landingLevel.startY;
    const startY = Math.max(landingLevel.padY + targetAlt * 0.5, Math.min(p.as.y, landingLevel.padY + targetAlt));
    vy = Math.max(vy, -10);

    const initOverride = {
      x: landingLevel.padCenterX,
      y: startY,
      vx: Math.min(Math.abs(vx), 10) * (vx > 0 ? 1 : -1),
      vy: vy,
    };
    this.loadLanding(landingLevel, initOverride);
  }

  private transitionOrbitalToApproach(p: Extract<Phase, { kind: 'orbital' }>): void {
    const explicitId = p.level.reentryApproachLevelId;
    const approachLevel = explicitId
      ? APPROACH_LEVELS.find(l => l.id === explicitId)
      : APPROACH_LEVELS[p.level.approachLevelIdx];
    if (!approachLevel) {
      p.state = 'enteredAtmo';
      return;
    }
    const params = orbitalToApproachParams(p.os, p.level);
    this.loadApproach(approachLevel, params);
  }

  private approachToOrbitalInit(level: ApproachLevel, as: ApproachState, orbitalLevel: OrbitalLevel): OrbitalInitOverride {
    if (level.spherical) {
      return {
        x: as.worldX,
        y: as.worldY,
        vx: as.worldVX,
        vy: as.worldVY,
      };
    }

    const ref = level.orbitalRef ?? {
      planetRadius: orbitalLevel.planetRadius,
      planetGM: orbitalLevel.planetGM,
      landingSiteAngle: orbitalLevel.landingSiteAngle,
      localDir: -1 as 1 | -1,
    };
    const localDir = ref.localDir;
    const theta = ref.landingSiteAngle + as.x / (ref.planetRadius * localDir);
    const r = ref.planetRadius + Math.max(0, as.y);
    const radX = Math.cos(theta), radY = Math.sin(theta);
    const tanX = -radY * localDir, tanY = radX * localDir;
    return {
      x: radX * r,
      y: radY * r,
      vx: tanX * as.vx + radX * as.vy,
      vy: tanY * as.vx + radY * as.vy,
    };
  }

  private transitionApproachToOrbital(p: Extract<Phase, { kind: 'approach' }>): void {
    const orbitalLevelId = p.level.departure?.orbitalLevelId ?? p.level.returnToOrbital?.orbitalLevelId;
    if (!orbitalLevelId) return;
    const orbitalLevel = ORBITAL_LEVELS.find(l => l.id === orbitalLevelId);
    if (!orbitalLevel) return;
    this.loadOrbital(orbitalLevel, this.approachToOrbitalInit(p.level, p.as, orbitalLevel));
  }

  private transitionOrbitalToDocking(p: Extract<Phase, { kind: 'orbital' }>): void {
    const dockingLevelId = this.currentMissionId === 4 ? 14 : 12;
    const dockingLevel = DOCKING_LEVELS.find(l => l.id === dockingLevelId);
    const station = p.level.station;
    if (!dockingLevel || !station) return;

    const sense: 1 | -1 = (p.level.startX * p.level.startVY - p.level.startY * p.level.startVX) < 0 ? -1 : 1;
    const stOmega = sense * Math.sqrt(p.level.planetGM / (station.orbitRadius ** 3));
    const stAngle = station.startAngle + stOmega * p.os.time;
    const stSpeed = Math.sqrt(p.level.planetGM / station.orbitRadius);
    const stX = station.orbitRadius * Math.cos(stAngle);
    const stY = station.orbitRadius * Math.sin(stAngle);
    const stVX = -sense * stSpeed * Math.sin(stAngle);
    const stVY = sense * stSpeed * Math.cos(stAngle);

    let relX = p.os.x - stX;
    let relY = p.os.y - stY;
    let relDist = Math.sqrt(relX * relX + relY * relY);
    const relVX = p.os.vx - stVX;
    const relVY = p.os.vy - stVY;

    if (relDist < 1) {
      relX = relVX;
      relY = relVY;
      relDist = Math.sqrt(relX * relX + relY * relY);
    }
    if (relDist < 1) {
      relX = -1;
      relY = 0;
      relDist = 1;
    }

    const ux = relX / relDist;
    const uy = relY / relDist;
    const baseDist = dockingLevel.beamRange * 10;
    const startDist = baseDist * (1 + Math.min(1, relDist / station.captureRadius));
    const initOverride: DockingInitOverride = {
      x: ux * startDist,
      y: uy * startDist,
      vx: relVX,
      vy: relVY,
      angle: Math.atan2(-uy, -ux),
    };
    this.loadDocking(dockingLevel, initOverride);
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
          if (p.level.departure) this.transitionApproachToOrbital(p);
          else this.transitionApproachToLanding(p);
          return;
        }
        if (p.level.returnToOrbital && p.as.vy > 0 && p.as.y > p.level.returnToOrbital.exitAltitude + 50) {
          this.transitionApproachToOrbital(p);
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
    const mission = this.currentMissionId ? MISSIONS.find(m => m.id === this.currentMissionId) : null;
    const completionText = mission?.completionText ?? '';

    if (p.kind === 'levelSelect') {
      drawLevelSelect(this.ctx, this.canvas, this.menuSelection);
    } else if (p.kind === 'landing') {
      render(this.ctx, this.canvas, p.camera, p.ship, p.terrain, this.time);
      drawHUD(this.ctx, this.canvas, p.ship, p.terrain, p.state, p.score, p.level, completionText, p.launchGuidance);
    } else if (p.kind === 'approach') {
      renderApproach(this.ctx, this.canvas, p.cam, p.as, p.level, this.time);
      drawApproachHUD(this.ctx, this.canvas, p.as, p.level, p.state, this.time);
    } else if (p.kind === 'orbital') {
      renderOrbital(this.ctx, this.canvas, p.cam, p.os, p.level, this.time);
      drawOrbitalHUD(this.ctx, this.canvas, p.os, p.level, p.state);
    } else if (p.kind === 'docking') {
      renderDocking(this.ctx, this.canvas, p.cam, p.ds, p.level, this.time);
      drawDockingHUD(this.ctx, this.canvas, p.ds, p.level, p.state, completionText);
    }
    this.drawGuidanceBanner();
  }
}
