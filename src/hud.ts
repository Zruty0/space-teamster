// HUD overlay: speed, altitude, pitch, throttle, warnings, start menu.

import { config } from './config';
import { ShipState } from './ship';
import { TerrainData, getTerrainHeight } from './terrain';
import { LevelDef } from './levels';
import { COL_DANGER, COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING, drawHudInfoPanel, drawHudLabel } from './hud-layout';

export type GameState = 'flying' | 'landed' | 'crashed';

// --- Start menu ---
export function drawStartMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  selectedIndex: number,
): void {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  const lineH = 58;
  const startY = 150;

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 36px monospace';
  ctx.fillText('SPACE TEAMSTER', W / 2, 58);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '16px monospace';
  ctx.fillText('Start Menu', W / 2, 88);

  const rows = [
    { label: 'Continue / Begin Campaign', detail: 'Open the current contract BBS at your saved career location.' },
    { label: 'Restart as a New Teamster', detail: 'Reset career location, money, and world time; then open the BBS.' },
    { label: 'New Game+', detail: 'Locked until a completed career exists.', disabled: true },
    { label: 'Fly a custom mission', detail: 'Open the Estella navigation browser and choose exact-authored source and destination.' },
  ];

  for (let i = 0; i < rows.length; i++) {
    const y = startY + i * lineH;
    const selected = selectedIndex === i;
    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(W / 2 - 310, y - 20, 620, lineH - 4);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', W / 2 - 295, y);
    }

    ctx.fillStyle = rows[i].disabled ? '#33504a' : (selected ? COL_TITLE : COL_HUD_DIM);
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${i + 1}]`, W / 2 - 270, y);

    ctx.fillStyle = rows[i].disabled ? '#446058' : (selected ? '#ffffff' : COL_HUD);
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(rows[i].label, W / 2 - 245, y);

    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '12px monospace';
    ctx.fillText(rows[i].detail, W / 2 - 245, y + 20);
  }

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓: Select  Enter: Select  |  1-4: Select', W / 2, startY + rows.length * lineH + 40);
}

export function drawFlightMenu(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  selectedIndex: number,
): void {
  const W = canvas.width;
  const H = canvas.height;
  const rows = [
    { label: 'Return to Flying', detail: 'Close this menu and resume the current stage.' },
    { label: 'Restart Current Stage', detail: 'Retry from the start of this phase; mission attempts are free.' },
    { label: 'Restart Whole Mission', detail: 'Retry the accepted route from its initial departure.' },
    { label: 'Shipboard Terminal', detail: 'Read-only ship status terminal. Not installed yet.', disabled: true },
    { label: 'Quit to Start Menu', detail: 'Abandon this attempt without changing career money or location.' },
  ];

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.45)';
  ctx.lineWidth = 2;
  const boxW = 700;
  const boxH = 390;
  const x = W / 2 - boxW / 2;
  const y = H / 2 - boxH / 2;
  ctx.fillStyle = 'rgba(5, 12, 20, 0.96)';
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeRect(x, y, boxW, boxH);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('FLIGHT MENU', W / 2, y + 44);

  const lineH = 55;
  const startY = y + 92;
  for (let i = 0; i < rows.length; i++) {
    const rowY = startY + i * lineH;
    const selected = selectedIndex === i;
    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(x + 32, rowY - 21, boxW - 64, lineH - 5);
      ctx.fillStyle = COL_HUD;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('▸', x + 62, rowY);
    }

    ctx.fillStyle = rows[i].disabled ? '#446058' : (selected ? '#ffffff' : COL_HUD);
    ctx.font = 'bold 19px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${i + 1}] ${rows[i].label}`, x + 82, rowY);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '12px monospace';
    ctx.fillText(rows[i].detail, x + 82, rowY + 19);
  }

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑↓: Select  Enter: Select  A/← or L: Return', W / 2, y + boxH - 22);
  ctx.restore();
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
  destinationName: string | undefined,
  destinationLocation: string | undefined,
  launchGuidance?: { targetAltitude: number; orbitDir: 1 | -1 },
  phaseDvUsed: number = 0,
  missionDvUsed: number = 0,
  missionParDv: number = 0,
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
  const padOffset = Math.abs(ship.x - level.padCenterX);

  ctx.save();

  // --- Level name (top right) ---
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText(`${level.name}  [g=${level.gravity.toFixed(1)}]`, W - 20, 24);

  // --- Left panel: ship state ---
  const lx = 20;
  let ly = 30;
  const lineH = 20;

  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';

  drawHudLabel(ctx, lx, ly, 'ALT', `${altitude.toFixed(1)} m`, COL_HUD);
  ly += lineH;

  const vsColor = Math.abs(vSpeed) > config.landingMaxVSpeed * 2 ? COL_DANGER :
                   Math.abs(vSpeed) > config.landingMaxVSpeed ? COL_WARNING : COL_HUD;
  drawHudLabel(ctx, lx, ly, 'V/S', `${vSpeed.toFixed(1)} m/s`, vsColor);
  ly += lineH;

  const hsColor = Math.abs(hSpeed) > config.landingMaxHSpeed * 2 ? COL_DANGER :
                   Math.abs(hSpeed) > config.landingMaxHSpeed ? COL_WARNING : COL_HUD;
  drawHudLabel(ctx, lx, ly, 'H/S', `${hSpeed.toFixed(1)} m/s`, hsColor);
  ly += lineH;

  drawHudLabel(ctx, lx, ly, 'SPD', `${speed.toFixed(1)} m/s`, COL_HUD);
  ly += lineH;

  const pitchColor = Math.abs(ship.angle) > config.landingMaxAngle * 2 ? COL_DANGER :
                      Math.abs(ship.angle) > config.landingMaxAngle ? COL_WARNING : COL_HUD;
  drawHudLabel(ctx, lx, ly, 'ATT', `${pitchDeg.toFixed(1)}°`, pitchColor);
  ly += lineH;

  drawHudLabel(ctx, lx, ly, 'CFG', ship.gearDeployed ? 'GEAR DOWN' : 'GEAR UP', ship.gearDeployed ? COL_SUCCESS : COL_HUD_DIM);
  ly += lineH;

  drawHudLabel(ctx, lx, ly, 'THR', `${(ship.throttle * 100).toFixed(0)}%`, COL_HUD);
  ly += lineH;

  drawHudLabel(ctx, lx, ly, 'SAS', ship.sas ? 'ON' : 'OFF', ship.sas ? COL_SUCCESS : COL_HUD_DIM);
  ly += lineH;

  drawHudLabel(ctx, lx, ly, 'PH ΔV', `${phaseDvUsed.toFixed(0)} m/s`, COL_HUD);
  ly += lineH;
  drawHudLabel(ctx, lx, ly, 'MIS ΔV', `${missionDvUsed.toFixed(0)} m/s`, COL_HUD);
  ly += lineH;
  if (missionParDv > 0) {
    drawHudLabel(ctx, lx, ly, 'PAR ΔV', `${missionParDv.toFixed(0)} m/s`, missionDvUsed <= missionParDv ? COL_SUCCESS : COL_WARNING);
    ly += lineH;
  }

  const landingGuidance = launchGuidance
    ? (altitude < launchGuidance.targetAltitude
      ? `Climb above ${(launchGuidance.targetAltitude / 1000).toFixed(1)} km and build horizontal speed.`
      : 'Build horizontal speed for orbital handoff.')
    : 'Settle near the pad with low speed and low angle.';

  drawHudInfoPanel(ctx, canvas, {
    title: 'DESTINATION',
    name: destinationName ?? (launchGuidance ? `${level.body.name} Orbit` : level.name),
    subtitle: destinationLocation,
    rows: launchGuidance
      ? [
          { label: 'ALT', value: `${(altitude / 1000).toFixed(1)} km > ${(launchGuidance.targetAltitude / 1000).toFixed(1)} km`, color: altitude >= launchGuidance.targetAltitude ? COL_SUCCESS : COL_HUD },
          { label: 'DIR', value: launchGuidance.orbitDir > 0 ? 'RIGHT' : 'LEFT', color: COL_SUCCESS },
        ]
      : [
          { label: 'PAD', value: `${padOffset.toFixed(1)} m < ${level.padHalfWidth.toFixed(0)} m`, color: padOffset <= level.padHalfWidth ? COL_SUCCESS : COL_WARNING },
          { label: 'V/S', value: `${Math.abs(vSpeed).toFixed(1)} m/s < ${level.landingMaxVSpeed.toFixed(1)} m/s`, color: Math.abs(vSpeed) <= level.landingMaxVSpeed ? COL_SUCCESS : COL_WARNING },
          { label: 'H/S', value: `${Math.abs(hSpeed).toFixed(1)} m/s < ${level.landingMaxHSpeed.toFixed(1)} m/s`, color: Math.abs(hSpeed) <= level.landingMaxHSpeed ? COL_SUCCESS : COL_WARNING },
          { label: 'ATT', value: `${Math.abs(pitchDeg).toFixed(1)}° < ${(level.landingMaxAngle * 180 / Math.PI).toFixed(1)}°`, color: Math.abs(ship.angle) <= level.landingMaxAngle ? COL_SUCCESS : COL_WARNING },
        ],
    guidance: landingGuidance,
  });

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
    const controls = ship.gearDeployed
      ? 'GEAR DOWN: W/S Throttle  A/D 5% Lateral  SHIFT+A/D Max Lateral  Q/E Rotate  SPACE Hover  G Gear  T SAS  BACKSPACE Restart'
      : 'GEAR UP: WASD Thrust  SHIFT Max Thrust  Q/E Rotate  G Gear  T SAS  BACKSPACE Restart';
    ctx.fillText(controls, W / 2, H - 15);
  }

  ctx.restore();
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
  ctx.fillText('BACKSPACE: Fly again  |  L: Flight Menu', W / 2, H / 2 - 130 + boxH - 15);
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
  tone: 'success' | 'transition' = 'success',
): void {
  const W = canvas.width;
  const H = canvas.height;
  const detailLines = detailText ? detailText.split('\n').length : 0;
  const extraDetailH = Math.max(0, detailLines - 1) * 18;
  const boxH = (ratingText || detailText ? (completionText ? 290 : 220) : (completionText ? 250 : 170)) + extraDetailH;
  const top = H / 2 - boxH / 2;

  const accent = tone === 'transition' ? COL_WARNING : COL_SUCCESS;
  const fill = tone === 'transition' ? 'rgba(28, 18, 0, 0.82)' : 'rgba(0, 20, 0, 0.78)';

  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(W / 2 - 280, top, 560, boxH);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 280, top, 560, boxH);

  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 22px monospace';
  ctx.fillText(tone === 'transition' ? title : `${title}: success`, W / 2, top + 32);

  ctx.font = '15px monospace';
  ctx.fillStyle = accent;
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
    for (const line of detailText.split('\n')) {
      ctx.fillText(line, W / 2, y);
      y += 18;
    }
    y += 4;
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
  ctx.fillText('BACKSPACE: Try again  |  L: Flight Menu', W / 2, H / 2 + 25);
}
