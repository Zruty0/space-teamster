// HUD overlay: speed, altitude, pitch, throttle, warnings, level select.

import { config } from './config';
import { ShipState } from './ship';
import { TerrainData, getTerrainHeight } from './terrain';
import { LEVELS, LevelDef } from './levels';
import { APPROACH_LEVELS } from './approach';
import { ORBITAL_LEVELS } from './orbital';
import { DOCKING_LEVELS } from './docking';

const COL_HUD = '#00ff88';
const COL_HUD_DIM = '#007744';
const COL_WARNING = '#ffaa00';
const COL_DANGER = '#ff3333';
const COL_SUCCESS = '#00ffcc';
const COL_TITLE = '#00ccff';

export type GameState = 'flying' | 'landed' | 'crashed' | 'levelSelect';

// --- Level select screen ---
export function drawLevelSelect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  selectedIndex: number,
): void {
  const W = canvas.width;
  const H = canvas.height;

  // Background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  // Compute layout from total item count
  const totalItems = LEVELS.length + APPROACH_LEVELS.length;
  const lineH = 44;
  const totalListH = totalItems * lineH + 40; // +40 for approach header
  const topPad = 80;
  const startY = Math.max(topPad + 20, (H - totalListH - topPad) / 2 + topPad);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 36px monospace';
  ctx.fillText('SPACE TEAMSTER', W / 2, startY - 50);

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '16px monospace';
  ctx.fillText('Select Landing Zone', W / 2, startY - 20);

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const y = startY + i * lineH;
    const gravLabel = `${level.gravity.toFixed(1)} m/s²`;
    const padLabel = `±${level.padHalfWidth}m pad`;

    // Difficulty dots
    const dots = '●'.repeat(level.id) + '○'.repeat(5 - level.id);

    const selected = selectedIndex === i;

    // Selection highlight
    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(W / 2 - 160, y - 16, 500, lineH - 4);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', W / 2 - 150, y);
    }

    // Number key
    ctx.fillStyle = selected ? COL_TITLE : COL_HUD_DIM;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${level.id}]`, W / 2 - 140, y);

    // Name
    ctx.fillStyle = selected ? '#ffffff' : COL_HUD;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(level.name, W / 2 - 120, y);

    // Subtitle + stats
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '13px monospace';
    ctx.fillText(`${level.subtitle}  |  g=${gravLabel}  ${padLabel}  ${dots}`, W / 2 - 120, y + 18);
  }

  // Approach section
  const approachStartY = startY + LEVELS.length * lineH + 20;
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('── Approach ──', W / 2, approachStartY);

  for (let i = 0; i < APPROACH_LEVELS.length; i++) {
    const level = APPROACH_LEVELS[i];
    const y = approachStartY + 20 + i * lineH;
    const num = LEVELS.length + 1 + i;

    const selected = selectedIndex === LEVELS.length + i;

    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(W / 2 - 160, y - 16, 500, lineH - 4);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', W / 2 - 150, y);
    }

    ctx.fillStyle = selected ? COL_TITLE : COL_HUD_DIM;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${num}]`, W / 2 - 140, y);

    ctx.fillStyle = selected ? '#ffffff' : COL_HUD;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(level.name, W / 2 - 120, y);

    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '13px monospace';
    ctx.fillText(level.subtitle, W / 2 - 120, y + 18);
  }

  // Orbital section
  const orbitalStartY = approachStartY + 20 + APPROACH_LEVELS.length * lineH + 20;
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('── Orbital ──', W / 2, orbitalStartY);

  for (let i = 0; i < ORBITAL_LEVELS.length; i++) {
    const level = ORBITAL_LEVELS[i];
    const y = orbitalStartY + 20 + i * lineH;
    const num = LEVELS.length + APPROACH_LEVELS.length + 1 + i;

    const selected = selectedIndex === LEVELS.length + APPROACH_LEVELS.length + i;

    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(W / 2 - 160, y - 16, 500, lineH - 4);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', W / 2 - 150, y);
    }

    ctx.fillStyle = selected ? COL_TITLE : COL_HUD_DIM;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${num}]`, W / 2 - 140, y);

    ctx.fillStyle = selected ? '#ffffff' : COL_HUD;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(level.name, W / 2 - 120, y);

    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '13px monospace';
    ctx.fillText(level.subtitle, W / 2 - 120, y + 18);
  }

  // Docking section
  const dockingStartY = orbitalStartY + 20 + ORBITAL_LEVELS.length * lineH + 20;
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('── Docking ──', W / 2, dockingStartY);

  for (let i = 0; i < DOCKING_LEVELS.length; i++) {
    const level = DOCKING_LEVELS[i];
    const y = dockingStartY + 20 + i * lineH;
    const num = LEVELS.length + APPROACH_LEVELS.length + ORBITAL_LEVELS.length + 1 + i;

    const selected = selectedIndex === LEVELS.length + APPROACH_LEVELS.length + ORBITAL_LEVELS.length + i;

    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(W / 2 - 160, y - 16, 500, lineH - 4);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', W / 2 - 150, y);
    }

    ctx.fillStyle = selected ? COL_TITLE : COL_HUD_DIM;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${num}]`, W / 2 - 140, y);

    ctx.fillStyle = selected ? '#ffffff' : COL_HUD;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(level.name, W / 2 - 120, y);

    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '13px monospace';
    ctx.fillText(level.subtitle, W / 2 - 120, y + 18);
  }

  // Footer
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  const footerY = dockingStartY + 20 + DOCKING_LEVELS.length * lineH + 30;
  ctx.fillText('↑↓: Select  Enter: Launch  (or press 1-9)', W / 2, footerY);
}

// --- In-game HUD ---
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  ship: ShipState,
  terrain: TerrainData,
  state: GameState,
  landingScore: LandingScore | null,
  level: LevelDef,
): void {
  const W = canvas.width;
  const H = canvas.height;
  const terrainH = getTerrainHeight(terrain, ship.x);
  const altitude = ship.y - terrainH;
  const vSpeed = ship.vy;
  const hSpeed = ship.vx;
  const speed = Math.sqrt(vSpeed * vSpeed + hSpeed * hSpeed);
  const pitchDeg = (ship.angle * 180 / Math.PI);

  ctx.save();

  // --- Level name (top right) ---
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText(`${level.name}  [g=${config.gravity.toFixed(1)}]`, W - 20, 24);

  // --- Left panel: flight data ---
  const lx = 20;
  let ly = 30;
  const lineH = 20;

  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';

  // Altitude
  drawLabel(ctx, lx, ly, 'ALT', `${altitude.toFixed(1)} m`, COL_HUD);
  ly += lineH;

  // Vertical speed
  const vsColor = Math.abs(vSpeed) > config.landingMaxVSpeed * 2 ? COL_DANGER :
                   Math.abs(vSpeed) > config.landingMaxVSpeed ? COL_WARNING : COL_HUD;
  drawLabel(ctx, lx, ly, 'V/S', `${vSpeed.toFixed(1)} m/s`, vsColor);
  ly += lineH;

  // Horizontal speed
  const hsColor = Math.abs(hSpeed) > config.landingMaxHSpeed * 2 ? COL_DANGER :
                   Math.abs(hSpeed) > config.landingMaxHSpeed ? COL_WARNING : COL_HUD;
  drawLabel(ctx, lx, ly, 'H/S', `${hSpeed.toFixed(1)} m/s`, hsColor);
  ly += lineH;

  // Speed
  drawLabel(ctx, lx, ly, 'SPD', `${speed.toFixed(1)} m/s`, COL_HUD);
  ly += lineH;

  // Pitch
  const pitchColor = Math.abs(ship.angle) > config.landingMaxAngle * 2 ? COL_DANGER :
                      Math.abs(ship.angle) > config.landingMaxAngle ? COL_WARNING : COL_HUD;
  drawLabel(ctx, lx, ly, 'PIT', `${pitchDeg.toFixed(1)}°`, pitchColor);
  ly += lineH;

  // Throttle + mode
  const thrMode = ship.gearDeployed ? 'LND' : 'CRZ';
  const thrModeColor = ship.gearDeployed ? COL_SUCCESS : COL_HUD;
  drawLabel(ctx, lx, ly, 'THR', `${(ship.throttle * 100).toFixed(0)}% ${thrMode}`, thrModeColor);
  ly += lineH;

  // Gear
  const gearColor = ship.gearDeployed ? COL_SUCCESS : COL_HUD_DIM;
  drawLabel(ctx, lx, ly, 'GEAR', ship.gearDeployed ? 'DOWN' : 'UP', gearColor);
  ly += lineH;

  // --- Throttle bar ---
  const barX = lx;
  const barY = ly + 10;
  const barW = 20;
  const barH = 100;
  const barColor = ship.gearDeployed ? '#00ccff' : COL_HUD;
  const barDimColor = ship.gearDeployed ? '#005566' : COL_HUD_DIM;
  ctx.strokeStyle = barDimColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = barColor;
  const fillH = barH * ship.throttle;
  ctx.fillRect(barX, barY + barH - fillH, barW, fillH);

  // Hover throttle tick mark
  const hoverThrottle = Math.min(1, config.gravity / config.mainEngineAccel);
  const hoverY = barY + barH - barH * hoverThrottle;
  ctx.strokeStyle = COL_WARNING;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(barX - 4, hoverY);
  ctx.lineTo(barX + barW + 4, hoverY);
  ctx.stroke();
  ctx.fillStyle = COL_WARNING;
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HOV', barX + barW + 6, hoverY + 3);

  // Throttle label
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('THR', barX, barY + barH + 14);

  // --- Warnings ---
  const warnings: { text: string; color: string }[] = [];

  // Terrain warning
  if (vSpeed < -1 && (ship.throttle < 0.05 || altitude > 100)) {
    const reactionTime = 1.0;
    const worstAngle = Math.PI / 4;
    const availDecel = config.mainEngineAccel * Math.cos(worstAngle) - config.gravity;

    if (availDecel > 0) {
      const fallSpeed = Math.abs(vSpeed);
      const reactionFall = fallSpeed * reactionTime + 0.5 * config.gravity * reactionTime * reactionTime;
      const vyAfter = fallSpeed + config.gravity * reactionTime;
      const brakingDist = (vyAfter * vyAfter) / (2 * availDecel);
      const totalNeeded = (reactionFall + brakingDist) * 1.3;

      if (totalNeeded >= altitude) {
        warnings.push({ text: '⚠ TERRAIN - FULL BURN', color: COL_DANGER });
      }
    }
  }

  if (altitude < 80 && !ship.gearDeployed) {
    warnings.push({ text: '⚠ GEAR', color: COL_WARNING });
  }
  if (altitude < 100 && Math.abs(ship.angle) > config.landingMaxAngle) {
    warnings.push({ text: '⚠ ATTITUDE', color: COL_WARNING });
  }

  if (warnings.length > 0) {
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    const now = Date.now();
    for (let i = 0; i < warnings.length; i++) {
      const w = warnings[i];
      const isDanger = w.color === COL_DANGER;
      const flash = isDanger
        ? Math.sin(now * 0.015) > -0.3
        : Math.sin(now * 0.008) > 0;
      if (flash) {
        ctx.fillStyle = w.color;
        ctx.fillText(w.text, W / 2, 30 + i * 24);
      }
    }
  }

  // --- State overlays ---
  if (state === 'landed' && landingScore) {
    drawLandedOverlay(ctx, W, H, landingScore, level);
  }
  if (state === 'crashed') {
    drawCrashedOverlay(ctx, W, H);
  }

  // --- Controls hint ---
  if (state === 'flying') {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_HUD_DIM;
    ctx.fillText('W/S: Throttle  A/D: Pitch  G: Gear  SPACE: Hover  Q: Level  R: Restart  L: Levels  F2: Dev', W / 2, H - 15);
  }

  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  label: string, value: string, color: string,
): void {
  ctx.fillStyle = '#558855';
  ctx.fillText(label, x, y);
  ctx.fillStyle = color;
  ctx.fillText(value, x + 50, y);
}

export interface LandingScore {
  vSpeed: number;
  hSpeed: number;
  angle: number;
  distFromCenter: number;
  rating: 'PERFECT' | 'GOOD' | 'HARD';
}

export function calculateLandingScore(ship: ShipState, terrain: TerrainData): LandingScore {
  const vSpeed = Math.abs(ship.vy);
  const hSpeed = Math.abs(ship.vx);
  const angle = Math.abs(ship.angle);
  const distFromCenter = Math.abs(ship.x - terrain.pad.centerX);

  let rating: LandingScore['rating'] = 'HARD';
  if (vSpeed < 1 && hSpeed < 0.5 && angle < 0.05 && distFromCenter < 5) {
    rating = 'PERFECT';
  } else if (vSpeed < 2 && hSpeed < 1 && angle < 0.1 && distFromCenter < 15) {
    rating = 'GOOD';
  }

  return { vSpeed, hSpeed, angle, distFromCenter, rating };
}

function drawLandedOverlay(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  score: LandingScore, level: LevelDef,
): void {
  ctx.fillStyle = 'rgba(0, 20, 0, 0.6)';
  ctx.fillRect(W / 2 - 200, H / 2 - 120, 400, 240);
  ctx.strokeStyle = COL_SUCCESS;
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 200, H / 2 - 120, 400, 240);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_SUCCESS;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('LANDED', W / 2, H / 2 - 80);

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText(level.name, W / 2, H / 2 - 58);

  const ratingColors = { PERFECT: '#00ffff', GOOD: '#00ff88', HARD: '#ffaa00' };
  ctx.fillStyle = ratingColors[score.rating];
  ctx.font = 'bold 22px monospace';
  ctx.fillText(score.rating, W / 2, H / 2 - 30);

  ctx.font = '14px monospace';
  ctx.fillStyle = COL_HUD;
  ctx.fillText(`V/Speed: ${score.vSpeed.toFixed(1)} m/s`, W / 2, H / 2 + 0);
  ctx.fillText(`H/Speed: ${score.hSpeed.toFixed(1)} m/s`, W / 2, H / 2 + 20);
  ctx.fillText(`Angle: ${(score.angle * 180 / Math.PI).toFixed(1)}°`, W / 2, H / 2 + 40);
  ctx.fillText(`Offset: ${score.distFromCenter.toFixed(1)} m`, W / 2, H / 2 + 60);

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText('R: Fly again  |  L: Choose level', W / 2, H / 2 + 100);
}

function drawCrashedOverlay(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.fillStyle = 'rgba(20, 0, 0, 0.6)';
  ctx.fillRect(W / 2 - 200, H / 2 - 60, 400, 120);
  ctx.strokeStyle = COL_DANGER;
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 200, H / 2 - 60, 400, 120);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_DANGER;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('CRASHED', W / 2, H / 2 - 15);

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText('R: Try again  |  L: Choose level', W / 2, H / 2 + 25);
}
