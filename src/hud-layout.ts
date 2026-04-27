export const COL_HUD = '#00ff88';
export const COL_HUD_DIM = '#007744';
export const COL_WARNING = '#ffaa00';
export const COL_DANGER = '#ff3333';
export const COL_SUCCESS = '#00ffcc';
export const COL_TITLE = '#00ccff';

const PANEL_FILL = 'rgba(0, 18, 10, 0.55)';
const PANEL_STROKE = 'rgba(0, 255, 136, 0.28)';
const LABEL_X = 58;

export interface HudRow {
  label: string;
  value: string;
  color?: string;
}

export interface HudInfoPanel {
  title: string;
  name: string;
  rows?: HudRow[];
  guidance?: string;
  accentColor?: string;
  width?: number;
}

export function drawHudLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  color: string,
): void {
  ctx.fillStyle = '#558855';
  ctx.fillText(label, x, y);
  ctx.fillStyle = color;
  ctx.fillText(value, x + LABEL_X, y);
}

export function wrapHudText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawHudInfoPanel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  panel: HudInfoPanel,
): void {
  const W = canvas.width;
  const width = panel.width ?? 300;
  const x = W - 20 - width;
  const y = 34;
  const rows = panel.rows ?? [];
  const accent = panel.accentColor ?? COL_SUCCESS;

  ctx.save();
  ctx.font = '14px "Courier New", monospace';
  const guidanceLines = panel.guidance
    ? wrapHudText(ctx, panel.guidance, width - 24)
    : [];
  const headerH = 16;
  const nameH = 22;
  const nextLabelH = guidanceLines.length > 0 ? 14 : 0;
  const guidanceTextH = guidanceLines.length * 14;
  const rowH = 20;
  const valuesLabelH = rows.length > 0 ? 14 : 0;
  const sepCount = (guidanceLines.length > 0 ? 1 : 0) + (rows.length > 0 ? 1 : 0);
  const sepH = sepCount * 14;
  const height = 14 + headerH + 4 + nameH + 8 + nextLabelH + guidanceTextH + sepH + valuesLabelH + rows.length * rowH + 10;

  ctx.fillStyle = PANEL_FILL;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = PANEL_STROKE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  let cy = y + 16;
  ctx.textAlign = 'left';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '12px monospace';
  ctx.fillText(panel.title, x + 12, cy);

  cy += 18;
  ctx.fillStyle = accent;
  ctx.font = 'bold 16px monospace';
  ctx.fillText(panel.name, x + 12, cy);

  if (guidanceLines.length > 0) {
    cy += 10;
    ctx.strokeStyle = PANEL_STROKE;
    ctx.beginPath();
    ctx.moveTo(x + 12, cy);
    ctx.lineTo(x + width - 12, cy);
    ctx.stroke();
    cy += 14;
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '12px monospace';
    ctx.fillText('NEXT', x + 12, cy);
    cy += 14;
    ctx.fillStyle = COL_SUCCESS;
    for (const line of guidanceLines) {
      ctx.fillText(line, x + 12, cy);
      cy += 14;
    }
  }

  if (rows.length > 0) {
    cy += 2;
    ctx.strokeStyle = PANEL_STROKE;
    ctx.beginPath();
    ctx.moveTo(x + 12, cy);
    ctx.lineTo(x + width - 12, cy);
    ctx.stroke();
    cy += 14;
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '12px monospace';
    ctx.fillText('PHASE', x + 12, cy);
    cy += 14;
    ctx.font = '14px "Courier New", monospace';
    for (const row of rows) {
      drawHudLabel(ctx, x + 12, cy, row.label, row.value, row.color ?? COL_HUD);
      cy += rowH;
    }
  }

  ctx.restore();
}
