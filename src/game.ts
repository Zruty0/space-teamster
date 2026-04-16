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
import { createDevPanel, toggleDevPanel } from './dev-panel';
import { LEVELS, LevelDef } from './levels';

const PHYSICS_DT = 1 / 120;
const MAX_FRAME_TIME = 0.1;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private ship: ShipState;
  private terrain: TerrainData;
  private camera: Camera;

  private state: GameState = 'levelSelect';
  private landingScore: LandingScore | null = null;
  private currentLevel: LevelDef = LEVELS[0];

  private accumulator = 0;
  private time = 0;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ship = createShip();
    this.terrain = generateTerrain(this.currentLevel);
    this.camera = createCamera();
    createDevPanel();
  }

  start(): void {
    this.lastFrameTime = performance.now() / 1000;
    requestAnimationFrame(this.loop);
  }

  private loadLevel(level: LevelDef): void {
    this.currentLevel = level;

    // Apply level params to config
    config.gravity = level.gravity;
    config.landingMaxVSpeed = level.landingMaxVSpeed;
    config.landingMaxHSpeed = level.landingMaxHSpeed;
    config.landingMaxAngle = level.landingMaxAngle;
    config.startX = level.startX;
    config.startY = level.startY;
    config.startVX = level.startVX;
    config.startVY = level.startVY;

    // Regenerate terrain
    this.terrain = generateTerrain(level);

    // Reset ship
    this.ship = createShip();

    // Reset camera to ship
    this.camera.x = this.ship.x;
    this.camera.y = this.ship.y;

    this.state = 'flying';
    this.landingScore = null;
    this.time = 0;
    this.accumulator = 0;
  }

  private loop = (): void => {
    const now = performance.now() / 1000;
    let frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    const input = readInput();

    // Handle meta-inputs
    if (input.toggleDevPanel) {
      toggleDevPanel();
    }

    if (this.state === 'levelSelect') {
      // Level selection
      if (input.levelPick >= 1 && input.levelPick <= LEVELS.length) {
        this.loadLevel(LEVELS[input.levelPick - 1]);
      }
    } else {
      // In-game controls
      if (input.reset) {
        this.loadLevel(this.currentLevel);
      }
      if (input.levelSelect) {
        this.state = 'levelSelect';
      }

      // Handle gear toggle at frame level
      if (input.toggleGear && this.state === 'flying') {
        this.ship.gearDeployed = !this.ship.gearDeployed;
      }

      // Clear edge triggers before physics loop
      input.toggleGear = false;
      input.reset = false;
      input.toggleDevPanel = false;
      input.levelSelect = false;
      input.levelPick = 0;

      // Physics
      this.accumulator += frameTime;
      while (this.accumulator >= PHYSICS_DT) {
        this.fixedUpdate(input, PHYSICS_DT);
        this.accumulator -= PHYSICS_DT;
        this.time += PHYSICS_DT;
      }

      // Camera
      const terrainH = getTerrainHeight(this.terrain, this.ship.x);
      updateCamera(this.camera, this.ship, terrainH, frameTime);
    }

    this.renderFrame();
    requestAnimationFrame(this.loop);
  };

  private fixedUpdate(input: InputState, dt: number): void {
    if (this.state !== 'flying') return;

    updateShip(this.ship, input, dt, this.time, input.stopAssist, input.killRotation);
    this.checkCollision();

    if (this.ship.y < -50 || this.ship.y > 2000 ||
        this.ship.x < -200 || this.ship.x > 2200) {
      this.state = 'crashed';
    }
  }

  private checkCollision(): void {
    const ship = this.ship;
    const basePoints = COLLISION_POINTS;
    const gearPoints = ship.gearDeployed ? GEAR_COLLISION_POINTS : [];
    const allPoints = [...basePoints, ...gearPoints];

    for (const [lx, ly] of allPoints) {
      const [wx, wy] = localToWorld(lx, ly, ship.x, ship.y, ship.angle);
      const terrainH = getTerrainHeight(this.terrain, wx);

      if (wy <= terrainH) {
        this.handleCollision(wx);
        return;
      }
    }
  }

  private handleCollision(contactX: number): void {
    const ship = this.ship;
    const onPad = isOnPad(this.terrain, contactX);

    if (!onPad) {
      this.state = 'crashed';
      return;
    }

    const vSpeed = Math.abs(ship.vy);
    const hSpeed = Math.abs(ship.vx);
    const angle = Math.abs(ship.angle);

    const speedOk = vSpeed <= config.landingMaxVSpeed && hSpeed <= config.landingMaxHSpeed;
    const angleOk = angle <= config.landingMaxAngle;
    const gearOk = ship.gearDeployed;

    if (speedOk && angleOk && gearOk) {
      this.state = 'landed';
      this.landingScore = calculateLandingScore(ship, this.terrain);
      ship.vx = 0;
      ship.vy = 0;
      ship.angularVel = 0;
    } else {
      this.state = 'crashed';
    }
  }

  private renderFrame(): void {
    if (this.state === 'levelSelect') {
      drawLevelSelect(this.ctx, this.canvas);
    } else {
      render(
        this.ctx, this.canvas,
        this.camera, this.ship, this.terrain,
        this.time,
      );
      drawHUD(
        this.ctx, this.canvas,
        this.ship, this.terrain,
        this.state, this.landingScore,
        this.currentLevel,
      );
    }
  }
}
