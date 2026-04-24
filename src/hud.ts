// HUD overlay: speed, altitude, pitch, throttle, warnings, level select.

import { config } from './config';
import { ShipState } from './ship';
import { TerrainData, getTerrainHeight } from './terrain';
import { LEVELS, LevelDef } from './levels';
import { APPROACH_LEVELS } from './approach';
import { ORBITAL_LEVELS } from './orbital';
import { DOCKING_LEVELS } from './docking';
import { MISSIONS } from './missions';

const COL_HUD = '#00ff88';
const COL_HUD_DIM = '#007744';
const COL_WARNING = '#ffaa00';
const COL_DANGER = '#ff3333';
const COL_SUCCESS = '#00ffcc';
const COL_TITLE = '#00ccff';

export type GameState = 'flying' | 'landed' | 'crashed' | 'levelSelect';

// --- Mission select screen ---
export function drawLevelSelect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  selectedIndex: number,
): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  // MISSIONS menu
  const mLineH = 52;
  const mStartY = 120;

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 36px monospace';
  ctx.fillText('SPACE TEAMSTER', W / 2, 50);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '16px monospace';
  ctx.fillText('Select Mission', W / 2, 80);

  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i];
    const y = mStartY + i * mLineH;
    const sel = selectedIndex === i;

    if (sel) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(W / 2 - 280, y - 16, 560, mLineH - 4);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', W / 2 - 270, y);
    }

    ctx.fillStyle = sel ? COL_TITLE : COL_HUD_DIM;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${m.id}]`, W / 2 - 250, y);

    const nameCol = m.stub ? COL_HUD_DIM : (sel ? '#ffffff' : COL_HUD);
    ctx.fillStyle = nameCol;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(m.name, W / 2 - 230, y);

    if (m.stub) {
      ctx.font = 'bold 18px monospace';
      const nameW = ctx.measureText(m.name).width;
      ctx.fillStyle = '#444444';
      ctx.font = '11px monospace';
      ctx.fillText('[COMING SOON]', W / 2 - 230 + nameW + 14, y);
    }

    ctx.fillStyle = m.stub ? '#333333' : COL_HUD_DIM;
    ctx.font = '12px monospace';
    ctx.fillText(m.subtitle, W / 2 - 230, y + 18);
  }

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓: Select  Enter: Launch  (or press 1-7)', W / 2, mStartY + MISSIONS.length * mLineH + 30);
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
  completionText: string = '',
  launchGuidance?: { targetAltitude: number; orbitDir: 1 | -1 },
  phaseDvUsed: number = 0,
  missionDvUsed: number = 0,
  suppressStateOverlays = false,
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

  if (launchGuidance) {
    drawLabel(ctx, lx, ly, 'DIR', launchGuidance.orbitDir > 0 ? '→ RIGHT' : '← LEFT', COL_SUCCESS);
    ly += lineH;
  }

  drawLabel(ctx, lx, ly, 'PH ΔV', `${phaseDvUsed.toFixed(0)} m/s`, COL_HUD);
  ly += lineH;
  drawLabel(ctx, lx, ly, 'MIS ΔV', `${missionDvUsed.toFixed(0)} m/s`, COL_HUD);
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

  if (launchGuidance && altitude < launchGuidance.targetAltitude && vSpeed < 5) {
    warnings.push({ text: `CLIMB TO above ${launchGuidance.targetAltitude.toFixed(0)}m`, color: COL_SUCCESS });
  }

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
  if (!suppressStateOverlays && state === 'landed' && landingScore) {
    drawLandedOverlay(ctx, W, H, landingScore, level, completionText);
  }
  if (!suppressStateOverlays && state === 'crashed') {
    drawCrashedOverlay(ctx, W, H);
  }

  // --- Controls hint ---
  if (state === 'flying') {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_HUD_DIM;
    ctx.fillText('W/S: Throttle  A/D: Pitch  G: Gear  SPACE: Hover  Q: Level  BACKSPACE: Restart  L: Levels  F2: Dev', W / 2, H - 15);
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
  score: LandingScore, level: LevelDef, completionText: string,
): void {
  const boxH = completionText ? 300 : 240;
  ctx.fillStyle = 'rgba(0, 20, 0, 0.6)';
  ctx.fillRect(W / 2 - 250, H / 2 - 130, 500, boxH);
  ctx.strokeStyle = COL_SUCCESS;
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 250, H / 2 - 130, 500, boxH);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_SUCCESS;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('LANDED', W / 2, H / 2 - 95);

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText(level.name, W / 2, H / 2 - 73);

  const ratingColors = { PERFECT: '#00ffff', GOOD: '#00ff88', HARD: '#ffaa00' };
  ctx.fillStyle = ratingColors[score.rating];
  ctx.font = 'bold 22px monospace';
  ctx.fillText(score.rating, W / 2, H / 2 - 45);

  ctx.font = '13px monospace';
  ctx.fillStyle = COL_HUD;
  ctx.fillText(`V/S: ${score.vSpeed.toFixed(1)}  H/S: ${score.hSpeed.toFixed(1)}  Angle: ${(score.angle * 180 / Math.PI).toFixed(1)}°  Offset: ${score.distFromCenter.toFixed(1)}m`, W / 2, H / 2 - 20);

  if (completionText) {
    ctx.fillStyle = '#88aa88';
    ctx.font = '12px monospace';
    const maxW = 440;
    const words = completionText.split(' ');
    let line = '';
    let ly = H / 2 + 10;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, W / 2, ly);
        line = word;
        ly += 16;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, W / 2, ly);
  }

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText('BACKSPACE: Fly again  |  L: Missions', W / 2, H / 2 - 130 + boxH - 15);
}

export function drawPhaseCompleteOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  title: string,
  phaseDvUsed: number,
  missionDvUsed: number,
  completionText: string = '',
  ratingText: string = '',
  ratingColor: string = COL_SUCCESS,
  detailText: string = '',
): void {
  const W = canvas.width;
  const H = canvas.height;
  const boxH = ratingText || detailText ? (completionText ? 290 : 220) : (completionText ? 250 : 170);
  const top = H / 2 - boxH / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 20, 0, 0.78)';
  ctx.fillRect(W / 2 - 280, top, 560, boxH);
  ctx.strokeStyle = COL_SUCCESS;
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 280, top, 560, boxH);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_SUCCESS;
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`${title}: success`, W / 2, top + 32);

  ctx.font = '15px monospace';
  ctx.fillStyle = COL_SUCCESS;
  ctx.fillText(`DeltaV used this phase: ${phaseDvUsed.toFixed(0)} m/s`, W / 2, top + 70);
  ctx.fillText(`DeltaV used this mission: ${missionDvUsed.toFixed(0)} m/s`, W / 2, top + 96);

  let y = top + 126;
  if (ratingText) {
    ctx.fillStyle = ratingColor;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(ratingText, W / 2, y);
    y += 24;
  }
  if (detailText) {
    ctx.fillStyle = COL_HUD;
    ctx.font = '13px monospace';
    ctx.fillText(detailText, W / 2, y);
    y += 22;
  }

  if (completionText) {
    ctx.fillStyle = '#88aa88';
    ctx.font = '12px monospace';
    const maxW = 500;
    const words = completionText.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, W / 2, y);
        line = word;
        y += 16;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, W / 2, y);
  }

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText('Backspace - retry phase    Enter - continue', W / 2, top + boxH - 18);
  ctx.restore();
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
  ctx.fillText('BACKSPACE: Try again  |  L: Choose level', W / 2, H / 2 + 25);
}
