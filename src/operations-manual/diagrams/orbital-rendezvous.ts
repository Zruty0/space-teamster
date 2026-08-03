import { COL_HUD, COL_HUD_DIM, COL_TITLE, COL_WARNING, wrapHudText } from '../../hud-layout';
import type { ManualDiagramId } from '../types';

const CLOSEST_PASS_EXPLANATION = 'The closest-pass circle is where the target will be when your predicted orbit passes nearest to it. The beginning of the connecting line is where your rig will be at that same moment; the line’s length is the predicted separation. Orange means the pass remains outside capture range. Adjust the orbit until the circle and line turn cyan, then coast to the close pass before matching velocity.';

function drawWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  ctx.fillStyle = COL_HUD;
  for (const line of wrapHudText(ctx, text, maxWidth)) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function drawDiagramArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(angle - 0.55) * 8, y2 - Math.sin(angle - 0.55) * 8);
  ctx.lineTo(x2 - Math.cos(angle + 0.55) * 8, y2 - Math.sin(angle + 0.55) * 8);
  ctx.closePath();
  ctx.fill();
}

function drawOrbitalRendezvousDiagram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  part: 'phasing' | 'closest-pass',
): number {
  const gap = 14;
  const panelH = 270;
  const height = panelH * 2 + gap;
  const panelW = (width - gap) * 0.5;
  const innerR = 58;
  const outerR = 88;

  const panel = (index: number, title: string, subtitle: string): { x: number; y: number; cx: number; cy: number } => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const px = x + col * (panelW + gap);
    const py = y + row * (panelH + gap);
    ctx.fillStyle = 'rgba(0, 120, 120, 0.035)';
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.24)';
    ctx.lineWidth = 1;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeRect(px, py, panelW, panelH);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = COL_TITLE;
    ctx.fillText(title, px + panelW * 0.5, py + 18);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COL_WARNING;
    ctx.fillText(subtitle, px + panelW * 0.5, py + 34);
    return { x: px, y: py, cx: px + panelW * 0.5, cy: py + 146 };
  };

  const planet = (cx: number, cy: number): void => {
    ctx.fillStyle = '#31506a';
    ctx.strokeStyle = '#6f9fbd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  const orbitalPoint = (cx: number, cy: number, radius: number, angle: number): [number, number] => [
    cx + Math.cos(angle) * radius,
    cy - Math.sin(angle) * radius,
  ];

  const orbit = (cx: number, cy: number, radius: number, color: string, dashed = false, arrowAngle = -2.35): void => {
    ctx.strokeStyle = color;
    ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const [ax, ay] = orbitalPoint(cx, cy, radius, arrowAngle);
    const tx = Math.sin(arrowAngle);
    const ty = Math.cos(arrowAngle);
    drawDiagramArrow(ctx, ax - tx * 7, ay - ty * 7, ax + tx * 7, ay + ty * 7, 'rgba(180, 220, 235, 0.42)');
  };

  const transferOrbit = (cx: number, cy: number, startRadius: number, endRadius: number, startAngle: number): void => {
    const centerOffset = (startRadius - endRadius) * 0.5;
    const centerX = cx + Math.cos(startAngle) * centerOffset;
    const centerY = cy - Math.sin(startAngle) * centerOffset;
    const rx = (startRadius + endRadius) * 0.5;
    const ry = Math.sqrt(startRadius * endRadius);
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.74)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, rx, ry, -startAngle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-startAngle);
    drawDiagramArrow(ctx, -8, -ry, 8, -ry, 'rgba(255, 200, 90, 0.5)');
    ctx.restore();
  };

  const station = (px: number, py: number): void => {
    const size = 8;
    ctx.strokeStyle = '#ccbbff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px - size * 0.5, py - size * 0.5, size, size);
    ctx.beginPath();
    ctx.moveTo(px - size * 1.5, py);
    ctx.lineTo(px - size * 0.5, py);
    ctx.moveTo(px + size * 0.5, py);
    ctx.lineTo(px + size * 1.5, py);
    ctx.stroke();
  };

  const rig = (px: number, py: number, orbitAngle: number): void => {
    const size = 8;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI - orbitAngle);
    ctx.fillStyle = '#102010';
    ctx.fillRect(-size * 0.28, size * 0.12, size * 0.56, size * 0.74);
    ctx.strokeStyle = 'rgba(68, 170, 102, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size * 0.28, size * 0.12, size * 0.56, size * 0.74);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size * 0.42, -size * 0.04, size * 0.84, size * 1.06);
    ctx.beginPath();
    ctx.moveTo(-size * 0.22, -size * 0.82);
    ctx.lineTo(size * 0.22, -size * 0.82);
    ctx.lineTo(size * 0.34, -size * 0.32);
    ctx.lineTo(-size * 0.34, -size * 0.32);
    ctx.closePath();
    ctx.fillStyle = '#0a140a';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.13, -size * 0.58);
    ctx.lineTo(0, -size * 0.68);
    ctx.lineTo(size * 0.13, -size * 0.58);
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  const rendezvousPoint = (px: number, py: number, color = '#ffaa00'): void => {
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawClosestPassDiagram = (diagramY: number): number => {
    const diagramH = 250;
    const cx = x + width * 0.5;
    const cy = diagramY + 137;
    const rigOrbitR = 62;
    const targetOrbitR = 86;
    const rigAngle = -2.4;
    const targetAngle = -0.58;
    const [rigX, rigY] = orbitalPoint(cx, cy, rigOrbitR, rigAngle);
    const [targetX, targetY] = orbitalPoint(cx, cy, targetOrbitR, targetAngle);
    ctx.fillStyle = 'rgba(0, 120, 120, 0.035)';
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.24)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, diagramY, width, diagramH);
    ctx.strokeRect(x, diagramY, width, diagramH);

    ctx.textAlign = 'center';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = COL_TITLE;
    ctx.fillText('READING THE CLOSEST-PASS DISPLAY', cx, diagramY + 22);

    orbit(cx, cy, targetOrbitR, 'rgba(80, 140, 255, 0.55)', false, -3.1);
    orbit(cx, cy, rigOrbitR, 'rgba(0, 255, 100, 0.58)', true, -4.2);
    planet(cx, cy);

    ctx.strokeStyle = '#ffaa00';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(rigX, rigY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    rendezvousPoint(targetX, targetY, '#ffaa00');

    const lineMidX = (rigX + targetX) * 0.5;
    const lineMidY = (rigY + targetY) * 0.5;
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('CLOSEST-PASS LINE', lineMidX, lineMidY - 11);

    ctx.fillStyle = '#00ff88';
    ctx.fillText('YOUR RIG AT CLOSEST PASS', rigX - 112, rigY + 17);
    drawDiagramArrow(ctx, rigX - 28, rigY + 11, rigX - 5, rigY + 2, 'rgba(0, 255, 136, 0.68)');

    ctx.fillStyle = '#ffaa00';
    ctx.fillText('TARGET AT CLOSEST PASS', targetX + 112, targetY - 5);
    drawDiagramArrow(ctx, targetX + 31, targetY - 5, targetX + 8, targetY - 1, 'rgba(255, 170, 0, 0.74)');

    ctx.font = '10px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('YOUR PREDICTED ORBIT', cx - 118, diagramY + 225);
    ctx.fillStyle = 'rgba(100, 160, 255, 0.9)';
    ctx.fillText('TARGET ORBIT', cx + 118, diagramY + 225);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('ORANGE = PASS OUTSIDE CAPTURE RANGE', cx, diagramY + 242);
    return diagramY + diagramH + 22;
  };

  if (part === 'closest-pass') {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '13px monospace';
    let nextY = drawWrapped(ctx, CLOSEST_PASS_EXPLANATION, x, y, width, 18);
    nextY += 14;
    nextY = drawClosestPassDiagram(nextY);
    ctx.restore();
    return nextY;
  }

  ctx.save();
  ctx.lineWidth = 1.25;

  const insideStationAngle = 0.35;
  const insideRigAngle = 1.35;
  const progradeFarRadius = outerR + 18;
  const progradeP = 2 * innerR * progradeFarRadius / (innerR + progradeFarRadius);
  const progradeE = (progradeFarRadius - innerR) / (progradeFarRadius + innerR);
  const progradeDelta = Math.acos(Math.max(-1, Math.min(1, (progradeP / outerR - 1) / progradeE)));
  const progradeMeetAngle = insideRigAngle - progradeDelta;

  const inside = panel(0, '1. RIG INSIDE — CATCHING UP', 'TIME TO MAKE A PROGRADE BURN');
  orbit(inside.cx, inside.cy, outerR, 'rgba(80, 140, 255, 0.55)', false, -0.7);
  orbit(inside.cx, inside.cy, innerR, 'rgba(0, 255, 100, 0.58)', true, -2.4);
  planet(inside.cx, inside.cy);
  const insideStation = orbitalPoint(inside.cx, inside.cy, outerR, insideStationAngle);
  const insideRig = orbitalPoint(inside.cx, inside.cy, innerR, insideRigAngle);
  station(insideStation[0], insideStation[1]);
  rig(insideRig[0], insideRig[1], insideRigAngle);
  ctx.font = '10px monospace';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText('LOWER ORBIT = FASTER', inside.cx, inside.y + 252);

  const prograde = panel(1, '2. AFTER THE PROGRADE BURN', 'SAME POSITIONS — RENDEZVOUS POINT AHEAD');
  orbit(prograde.cx, prograde.cy, outerR, 'rgba(80, 140, 255, 0.55)', false, -0.7);
  orbit(prograde.cx, prograde.cy, innerR, 'rgba(0, 255, 100, 0.34)', true, -2.4);
  transferOrbit(prograde.cx, prograde.cy, innerR, progradeFarRadius, insideRigAngle);
  planet(prograde.cx, prograde.cy);
  const progradeStation = orbitalPoint(prograde.cx, prograde.cy, outerR, insideStationAngle);
  const progradeRig = orbitalPoint(prograde.cx, prograde.cy, innerR, insideRigAngle);
  const progradeMeet = orbitalPoint(prograde.cx, prograde.cy, outerR, progradeMeetAngle);
  station(progradeStation[0], progradeStation[1]);
  rig(progradeRig[0], progradeRig[1], insideRigAngle);
  rendezvousPoint(progradeMeet[0], progradeMeet[1], '#00ffcc');
  ctx.font = '9px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.fillText('FUTURE RENDEZVOUS', progradeMeet[0], progradeMeet[1] - 11);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '10px monospace';
  ctx.fillText('TRANSFER CROSSES TARGET ORBIT BEFORE APOAPSIS', prograde.cx, prograde.y + 252);

  const outsideRigAngle = 0.35;
  const outsideStationAngle = 1.35;
  const retrogradeFarRadius = innerR - 14;
  const retrogradeP = 2 * outerR * retrogradeFarRadius / (outerR + retrogradeFarRadius);
  const retrogradeE = (outerR - retrogradeFarRadius) / (outerR + retrogradeFarRadius);
  const retrogradeDelta = Math.acos(Math.max(-1, Math.min(1, (1 - retrogradeP / innerR) / retrogradeE)));
  const retrogradeMeetAngle = outsideRigAngle - retrogradeDelta;

  const outside = panel(2, '3. RIG OUTSIDE — TARGET CATCHING UP', 'TIME TO MAKE A RETROGRADE BURN');
  orbit(outside.cx, outside.cy, innerR, 'rgba(80, 140, 255, 0.55)', false, -0.7);
  orbit(outside.cx, outside.cy, outerR, 'rgba(0, 255, 100, 0.58)', true, -2.4);
  planet(outside.cx, outside.cy);
  const outsideRig = orbitalPoint(outside.cx, outside.cy, outerR, outsideRigAngle);
  const outsideStation = orbitalPoint(outside.cx, outside.cy, innerR, outsideStationAngle);
  rig(outsideRig[0], outsideRig[1], outsideRigAngle);
  station(outsideStation[0], outsideStation[1]);
  ctx.font = '10px monospace';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText('HIGHER ORBIT = SLOWER', outside.cx, outside.y + 252);

  const retrograde = panel(3, '4. AFTER THE RETROGRADE BURN', 'SAME POSITIONS — RENDEZVOUS POINT AHEAD');
  orbit(retrograde.cx, retrograde.cy, innerR, 'rgba(80, 140, 255, 0.55)', false, -0.7);
  orbit(retrograde.cx, retrograde.cy, outerR, 'rgba(0, 255, 100, 0.34)', true, -2.4);
  transferOrbit(retrograde.cx, retrograde.cy, outerR, retrogradeFarRadius, outsideRigAngle);
  planet(retrograde.cx, retrograde.cy);
  const retrogradeRig = orbitalPoint(retrograde.cx, retrograde.cy, outerR, outsideRigAngle);
  const retrogradeStation = orbitalPoint(retrograde.cx, retrograde.cy, innerR, outsideStationAngle);
  const retrogradeMeet = orbitalPoint(retrograde.cx, retrograde.cy, innerR, retrogradeMeetAngle);
  rig(retrogradeRig[0], retrogradeRig[1], outsideRigAngle);
  station(retrogradeStation[0], retrogradeStation[1]);
  rendezvousPoint(retrogradeMeet[0], retrogradeMeet[1], '#00ffcc');
  ctx.font = '9px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.fillText('FUTURE RENDEZVOUS', retrogradeMeet[0], retrogradeMeet[1] - 11);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '10px monospace';
  ctx.fillText('TRANSFER CROSSES TARGET ORBIT BEFORE PERIAPSIS', retrograde.cx, retrograde.y + 252);

  ctx.restore();
  return y + height + 22;
}

export function manualDiagramHeight(ctx: CanvasRenderingContext2D, diagram: ManualDiagramId, contentW: number): number {
  if (diagram === 'orbital-rendezvous-phasing') return 576;
  ctx.font = '13px monospace';
  return wrapHudText(ctx, CLOSEST_PASS_EXPLANATION, contentW).length * 18 + 14 + 272;
}

export function drawArticleDiagram(ctx: CanvasRenderingContext2D, diagram: ManualDiagramId, x: number, y: number, width: number): number {
  return drawOrbitalRendezvousDiagram(ctx, x, y, width, diagram === 'orbital-rendezvous-phasing' ? 'phasing' : 'closest-pass');
}
