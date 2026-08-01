import { COL_DANGER, COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';

export type InteractiveTone = 'normal' | 'primary' | 'back' | 'disabled' | 'danger' | 'warning' | 'success' | 'muted';

export type InteractiveSceneBodyRow =
  | { kind: 'text'; text: string; tone?: InteractiveTone }
  | { kind: 'kv'; label: string; value: string; tone?: InteractiveTone }
  | { kind: 'separator' };

export interface InteractiveSceneOption {
  label: string;
  detail?: string;
  detailLineCount?: 1 | 2;
  disabled?: boolean;
  action: string;
  tone?: InteractiveTone;
  tag?: string;
  rightText?: string;
  rightDetail?: string;
}

export interface InteractiveScene {
  title: string;
  subtitle?: string;
  bodyLines?: string[];
  bodyRows?: InteractiveSceneBodyRow[];
  options: InteractiveSceneOption[];
  footer?: string;
}

function toneColor(tone: InteractiveTone | undefined, selected = false): string {
  if (tone === 'primary' || tone === 'success') return selected ? '#ffffff' : COL_SUCCESS;
  if (tone === 'warning') return COL_WARNING;
  if (tone === 'danger') return COL_DANGER;
  if (tone === 'back' || tone === 'muted') return selected ? COL_HUD : COL_HUD_DIM;
  if (tone === 'disabled') return '#446058';
  return selected ? '#ffffff' : COL_HUD;
}

function toneAccent(tone: InteractiveTone | undefined): string {
  if (tone === 'primary' || tone === 'success') return COL_SUCCESS;
  if (tone === 'warning') return COL_WARNING;
  if (tone === 'danger') return COL_DANGER;
  if (tone === 'back' || tone === 'muted') return '#4e6f70';
  if (tone === 'disabled') return '#446058';
  return COL_SUCCESS;
}

function toneFill(tone: InteractiveTone | undefined): string {
  if (tone === 'primary' || tone === 'success') return 'rgba(0, 255, 136, 0.13)';
  if (tone === 'warning') return 'rgba(255, 170, 0, 0.12)';
  if (tone === 'danger') return 'rgba(255, 60, 60, 0.12)';
  if (tone === 'back' || tone === 'muted') return 'rgba(120, 170, 170, 0.08)';
  return 'rgba(0, 255, 136, 0.10)';
}

function truncateEnd(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 3))}...`;
}

function middleEllipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  if (text.length <= 6) return text;
  let left = Math.ceil(text.length / 2);
  let right = Math.floor(text.length / 2);
  while (left > 1 && right < text.length - 1) {
    const candidate = `${text.slice(0, left)}...${text.slice(right)}`;
    if (ctx.measureText(candidate).width <= maxWidth) return candidate;
    if (left > text.length - right) left--;
    else right++;
  }
  return truncateEnd(text, Math.max(3, Math.floor(maxWidth / 8)));
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (ctx.measureText(line).width > maxWidth) {
      lines.push(middleEllipsis(ctx, line, maxWidth));
      line = '';
    }
  }
  if (line) lines.push(line);
  return lines;
}

function bodyRows(scene: InteractiveScene): InteractiveSceneBodyRow[] {
  if (scene.bodyRows) return scene.bodyRows;
  return (scene.bodyLines ?? []).map(line => line.startsWith('!')
    ? { kind: 'text', text: line.slice(1), tone: 'warning' }
    : { kind: 'text', text: line });
}

function drawScrollHint(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x + 1, y - 12, w - 2, 16);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y);
}

export function drawInteractiveScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scene: InteractiveScene,
  selectedIndex: number,
): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#030611';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.fillText(scene.title, W / 2, 42);
  if (scene.subtitle) {
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '13px monospace';
    ctx.fillText(middleEllipsis(ctx, scene.subtitle, W - 80), W / 2, 66);
  }

  const boxW = Math.min(920, W - 80);
  const x = W / 2 - boxW / 2;
  const bodyY = 92;
  const rows = bodyRows(scene);
  ctx.font = '13px monospace';
  const bodyContentH = rows.reduce((height, row) => {
    if (row.kind === 'separator') return height + 14;
    if (row.kind === 'kv') return height + 22;
    return height + wrapText(ctx, row.text, boxW - 44).length * 18 + 2;
  }, 0);
  const bodyH = rows.length ? Math.min(260, 24 + bodyContentH) : 0;

  if (rows.length) {
    ctx.fillStyle = 'rgba(0, 120, 120, 0.045)';
    ctx.strokeStyle = '#1b4a4a';
    ctx.fillRect(x, bodyY, boxW, bodyH);
    ctx.strokeRect(x, bodyY, boxW, bodyH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, bodyY + 1, boxW - 2, bodyH - 2);
    ctx.clip();

    let y = bodyY + 27;
    const bottom = bodyY + bodyH - 12;
    const labelW = 165;
    for (const row of rows) {
      if (y > bottom) break;
      if (row.kind === 'separator') {
        ctx.strokeStyle = '#244d4d';
        ctx.beginPath();
        ctx.moveTo(x + 20, y - 8);
        ctx.lineTo(x + boxW - 20, y - 8);
        ctx.stroke();
        y += 14;
        continue;
      }
      if (row.kind === 'kv') {
        ctx.textAlign = 'left';
        ctx.font = '11px monospace';
        ctx.fillStyle = COL_HUD_DIM;
        ctx.fillText(row.label.toUpperCase(), x + 22, y);
        ctx.font = row.tone === 'primary' || row.tone === 'success' || row.tone === 'warning' ? 'bold 13px monospace' : '13px monospace';
        ctx.fillStyle = toneColor(row.tone);
        ctx.fillText(middleEllipsis(ctx, row.value, boxW - labelW - 54), x + 22 + labelW, y);
        y += 22;
        continue;
      }
      ctx.textAlign = 'left';
      ctx.font = '13px monospace';
      ctx.fillStyle = toneColor(row.tone);
      for (const line of wrapText(ctx, row.text, boxW - 44)) {
        if (y > bottom) break;
        ctx.fillText(line, x + 22, y);
        y += 18;
      }
      y += 2;
    }
    ctx.restore();
    if (bodyContentH + 24 > bodyH) drawScrollHint(ctx, x, bodyY + bodyH - 3, boxW, '↓ more detail');
  }

  const listY = bodyY + bodyH + (bodyH ? 18 : 0);
  const listH = H - listY - 68;
  ctx.fillStyle = 'rgba(0, 120, 120, 0.035)';
  ctx.strokeStyle = '#1b4a4a';
  ctx.fillRect(x, listY, boxW, listH);
  ctx.strokeRect(x, listY, boxW, listH);

  const rowH = scene.options.some(option => option.detailLineCount === 2) ? 72 : 58;
  const visibleRows = Math.max(1, Math.floor((listH - 30) / rowH));
  const maxStart = Math.max(0, scene.options.length - visibleRows);
  const start = Math.max(0, Math.min(maxStart, selectedIndex - Math.floor(visibleRows / 2)));
  const end = Math.min(scene.options.length, start + visibleRows);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, listY + 1, boxW - 2, listH - 2);
  ctx.clip();
  ctx.textAlign = 'left';
  for (let i = start; i < end; i++) {
    const option = scene.options[i];
    const tone: InteractiveTone = option.disabled ? 'disabled' : (option.tone ?? 'normal');
    const y = listY + 28 + (i - start) * rowH;
    const selected = i === selectedIndex;
    if (selected) {
      ctx.fillStyle = toneFill(tone);
      ctx.fillRect(x + 10, y - 18, boxW - 20, rowH - 5);
      ctx.strokeStyle = toneAccent(tone);
      ctx.strokeRect(x + 10, y - 18, boxW - 20, rowH - 5);
    }

    const labelX = x + 28;
    let textX = labelX;
    if (option.tag) {
      ctx.fillStyle = toneAccent(tone);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[${option.tag}]`, textX, y);
      textX += 82;
    }
    ctx.fillStyle = toneColor(tone, selected);
    ctx.font = selected ? 'bold 15px monospace' : '15px monospace';
    const rightTextWidth = option.rightText ? 300 : 190;
    ctx.fillText(`${selected ? '▶ ' : '  '}${middleEllipsis(ctx, option.label, boxW - (textX - x) - rightTextWidth)}`, textX, y);
    if (option.rightText) {
      ctx.fillStyle = toneColor(tone, selected);
      ctx.font = selected ? 'bold 14px monospace' : '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(middleEllipsis(ctx, option.rightText, 280), x + boxW - 24, y);
      if (option.rightDetail) {
        ctx.fillStyle = toneColor(tone, selected);
        ctx.font = selected ? 'bold 12px monospace' : '12px monospace';
        ctx.fillText(middleEllipsis(ctx, option.rightDetail, 280), x + boxW - 24, y + 19);
      }
      ctx.textAlign = 'left';
    }
    if (option.detail) {
      ctx.fillStyle = COL_HUD_DIM;
      ctx.font = '12px monospace';
      const detailWidth = option.rightText ? boxW - 360 : boxW - 66;
      const maxLines = option.detailLineCount ?? 1;
      const wrapped = wrapText(ctx, option.detail, detailWidth);
      const detailLines = wrapped.slice(0, maxLines);
      if (wrapped.length > maxLines) {
        detailLines[maxLines - 1] = middleEllipsis(ctx, `${detailLines[maxLines - 1]}…`, detailWidth);
      }
      for (let lineIndex = 0; lineIndex < detailLines.length; lineIndex++) {
        ctx.fillText(detailLines[lineIndex], x + 46, y + 19 + lineIndex * 15);
      }
    }
  }
  ctx.restore();

  if (start > 0) drawScrollHint(ctx, x, listY + 14, boxW, '↑ more');
  if (end < scene.options.length) drawScrollHint(ctx, x, listY + listH - 4, boxW, '↓ more');

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText(scene.footer ?? 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu', W / 2, H - 24);
}
