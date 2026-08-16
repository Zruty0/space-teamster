import { COL_DANGER, COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';

export type InteractiveTone = 'normal' | 'primary' | 'back' | 'disabled' | 'danger' | 'warning' | 'success' | 'story' | 'muted';

export interface InteractiveTextSegment {
  text: string;
  tone?: InteractiveTone;
}

export type InteractiveSceneBodyRow =
  | { kind: 'text'; text: string; tone?: InteractiveTone }
  | { kind: 'kv'; label: string; value: string; valueSegments?: InteractiveTextSegment[]; tone?: InteractiveTone; valueLineCount?: 1 | 2 }
  | { kind: 'separator' };

export interface InteractiveSceneOption {
  label: string;
  labelLineCount?: 1 | 2;
  detail?: string;
  detailLineCount?: 1 | 2;
  disabled?: boolean;
  action: string;
  tone?: InteractiveTone;
  tag?: string;
  tagTone?: InteractiveTone;
  /** Reserve the issuer-tag gutter even when this row has no tag; status appears below the tag. */
  tagColumn?: boolean;
  rightText?: string;
  rightDetail?: string;
  /** Independent availability marker; does not replace semantic tags or row tone. */
  statusText?: string;
  /** Small semantic icon at the far left of the issuer-tag gutter. */
  leftIcon?: 'fragile';
}

export interface InteractiveScene {
  title: string;
  subtitle?: string;
  bodyLines?: string[];
  bodyRows?: InteractiveSceneBodyRow[];
  bodyMaxHeight?: number;
  options: InteractiveSceneOption[];
  footer?: string;
}

function toneColor(tone: InteractiveTone | undefined, selected = false): string {
  if (tone === 'primary' || tone === 'success') return selected ? '#ffffff' : COL_SUCCESS;
  if (tone === 'warning') return COL_WARNING;
  if (tone === 'story') return '#c58cff';
  if (tone === 'danger') return COL_DANGER;
  if (tone === 'back' || tone === 'muted') return selected ? COL_HUD : COL_HUD_DIM;
  if (tone === 'disabled') return '#446058';
  return selected ? '#ffffff' : COL_HUD;
}

function toneAccent(tone: InteractiveTone | undefined): string {
  if (tone === 'primary' || tone === 'success') return COL_SUCCESS;
  if (tone === 'warning') return COL_WARNING;
  if (tone === 'story') return '#c58cff';
  if (tone === 'danger') return COL_DANGER;
  if (tone === 'back' || tone === 'muted') return '#4e6f70';
  if (tone === 'disabled') return '#446058';
  return COL_SUCCESS;
}

function toneFill(tone: InteractiveTone | undefined): string {
  if (tone === 'primary' || tone === 'success') return 'rgba(0, 255, 136, 0.13)';
  if (tone === 'warning') return 'rgba(255, 170, 0, 0.12)';
  if (tone === 'story') return 'rgba(197, 140, 255, 0.12)';
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

function drawRichTextSegments(
  ctx: CanvasRenderingContext2D,
  segments: readonly InteractiveTextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  maxLines: 1 | 2,
): void {
  let line = 0;
  let cursorX = x;
  for (const segment of segments) {
    const tokens = segment.text.split(/(\s+)/).filter(Boolean);
    for (const token of tokens) {
      const width = ctx.measureText(token).width;
      if (cursorX > x && cursorX + width > x + maxWidth && line + 1 < maxLines) {
        line++;
        cursorX = x;
      }
      if (line >= maxLines || cursorX + width > x + maxWidth) return;
      ctx.fillStyle = toneColor(segment.tone);
      ctx.fillText(token, cursorX, y + line * 18);
      cursorX += width;
    }
  }
}

function drawFragileIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COL_WARNING;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x + 0.5, y - 10.5, 11, 13);
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 10);
  ctx.lineTo(x + 5, y - 6);
  ctx.lineTo(x + 8, y - 3);
  ctx.lineTo(x + 5, y + 2);
  ctx.stroke();
  ctx.restore();
}

function bodyRows(scene: InteractiveScene): InteractiveSceneBodyRow[] {
  if (scene.bodyRows) return scene.bodyRows;
  return (scene.bodyLines ?? []).map(line => line.startsWith('!')
    ? { kind: 'text', text: line.slice(1), tone: 'warning' }
    : { kind: 'text', text: line });
}

function sceneBodyMetrics(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scene: InteractiveScene,
): { contentHeight: number; viewportHeight: number } {
  const boxW = Math.min(920, canvas.width - 80);
  const rows = bodyRows(scene);
  ctx.font = '13px monospace';
  const contentHeight = rows.reduce((height, row) => {
    if (row.kind === 'separator') return height + 14;
    if (row.kind === 'kv') return height + (row.valueLineCount === 2 ? 40 : 22);
    return height + wrapText(ctx, row.text, boxW - 44).length * 18 + 2;
  }, 0);
  const requestedHeight = rows.length ? Math.min(scene.bodyMaxHeight ?? 260, 24 + contentHeight) : 0;
  const viewportHeight = Math.min(requestedHeight, Math.max(80, canvas.height - 282));
  return { contentHeight, viewportHeight };
}

export function interactiveSceneBodyScrollLimit(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scene: InteractiveScene,
): number {
  const { contentHeight, viewportHeight } = sceneBodyMetrics(ctx, canvas, scene);
  return Math.max(0, contentHeight + 24 - viewportHeight);
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
  requestedBodyScrollOffset = 0,
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
  const labelW = 165;
  const { contentHeight: bodyContentH, viewportHeight: bodyH } = sceneBodyMetrics(ctx, canvas, scene);
  const maxBodyScroll = Math.max(0, bodyContentH + 24 - bodyH);
  const bodyScrollOffset = Math.max(0, Math.min(maxBodyScroll, requestedBodyScrollOffset));

  if (rows.length) {
    ctx.fillStyle = 'rgba(0, 120, 120, 0.045)';
    ctx.strokeStyle = '#1b4a4a';
    ctx.fillRect(x, bodyY, boxW, bodyH);
    ctx.strokeRect(x, bodyY, boxW, bodyH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, bodyY + 1, boxW - 2, bodyH - 2);
    ctx.clip();

    let y = bodyY + 27 - bodyScrollOffset;
    const bottom = bodyY + bodyH - 12;
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
        const valueWidth = boxW - labelW - 54;
        if (row.valueSegments) {
          drawRichTextSegments(ctx, row.valueSegments, x + 22 + labelW, y, valueWidth, row.valueLineCount ?? 1);
          y += row.valueLineCount === 2 ? 40 : 22;
        } else if (row.valueLineCount === 2) {
          const wrapped = wrapText(ctx, row.value, valueWidth);
          const valueLines = wrapped.slice(0, 2);
          if (wrapped.length > 2) valueLines[1] = middleEllipsis(ctx, `${valueLines[1]}…`, valueWidth);
          valueLines.forEach((line, index) => ctx.fillText(line, x + 22 + labelW, y + index * 18));
          y += 40;
        } else {
          ctx.fillText(middleEllipsis(ctx, row.value, valueWidth), x + 22 + labelW, y);
          y += 22;
        }
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
    if (bodyScrollOffset > 0) drawScrollHint(ctx, x, bodyY + 13, boxW, 'PgUp: earlier detail');
    if (bodyScrollOffset < maxBodyScroll) drawScrollHint(ctx, x, bodyY + bodyH - 3, boxW, 'PgDn: more detail');
  }

  const listY = bodyY + bodyH + (bodyH ? 18 : 0);
  const listH = H - listY - 68;
  ctx.fillStyle = 'rgba(0, 120, 120, 0.035)';
  ctx.strokeStyle = '#1b4a4a';
  ctx.fillRect(x, listY, boxW, listH);
  ctx.strokeRect(x, listY, boxW, listH);

  const rowH = 58
    + (scene.options.some(option => option.labelLineCount === 2) ? 18 : 0)
    + (scene.options.some(option => option.detailLineCount === 2) ? 14 : 0);
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
    if (option.leftIcon === 'fragile') drawFragileIcon(ctx, x + 13, y);
    const hasTagColumn = !!option.tag || option.tagColumn === true;
    let textX = labelX;
    if (option.tag) {
      ctx.fillStyle = toneAccent(option.tagTone ?? tone);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[${option.tag}]`, textX, y);
    }
    if (hasTagColumn) textX += 82;
    ctx.fillStyle = toneColor(tone, selected);
    ctx.font = selected ? 'bold 15px monospace' : '15px monospace';
    const rightTextWidth = option.rightText ? 300 : 190;
    const labelWidth = boxW - (textX - x) - rightTextWidth;
    const labelPrefix = selected ? '▶ ' : '  ';
    const labelLines = option.labelLineCount === 2
      ? wrapText(ctx, `${labelPrefix}${option.label}`, labelWidth).slice(0, 2)
      : [`${labelPrefix}${middleEllipsis(ctx, option.label, labelWidth - ctx.measureText(labelPrefix).width)}`];
    if (option.labelLineCount === 2) {
      const allLabelLines = wrapText(ctx, `${labelPrefix}${option.label}`, labelWidth);
      if (allLabelLines.length > 2) labelLines[1] = middleEllipsis(ctx, `${labelLines[1]}…`, labelWidth);
    }
    labelLines.forEach((line, lineIndex) => ctx.fillText(line, textX, y + lineIndex * 18));
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
    if (option.statusText) {
      ctx.fillStyle = COL_WARNING;
      ctx.font = 'bold 11px monospace';
      if (option.tagColumn) {
        ctx.textAlign = 'left';
        ctx.fillText(`[${option.statusText}]`, labelX, y + 19);
      } else {
        ctx.textAlign = 'right';
        const statusY = option.rightText ? y + (option.rightDetail ? 38 : 19) : y;
        ctx.fillText(`[${option.statusText}]`, x + boxW - 24, statusY);
        ctx.textAlign = 'left';
      }
    }
    if (option.detail) {
      ctx.fillStyle = COL_HUD_DIM;
      ctx.font = '12px monospace';
      const detailX = option.tagColumn ? textX : x + 46;
      const detailIndent = detailX - (x + 46);
      const detailWidth = (option.rightText ? boxW - 360 : boxW - 66) - detailIndent;
      const maxLines = option.detailLineCount ?? 1;
      const detailY = y + 19 + (option.labelLineCount === 2 ? 18 : 0);
      const wrapped = wrapText(ctx, option.detail, detailWidth);
      const detailLines = wrapped.slice(0, maxLines);
      if (wrapped.length > maxLines) {
        detailLines[maxLines - 1] = middleEllipsis(ctx, `${detailLines[maxLines - 1]}…`, detailWidth);
      }
      for (let lineIndex = 0; lineIndex < detailLines.length; lineIndex++) {
        ctx.fillText(detailLines[lineIndex], detailX, detailY + lineIndex * 15);
      }
    }
  }
  ctx.restore();

  if (start > 0) drawScrollHint(ctx, x, listY + 14, boxW, '↑ more');
  if (end < scene.options.length) drawScrollHint(ctx, x, listY + listH - 4, boxW, '↓ more');

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  const footer = scene.footer ?? 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu';
  ctx.fillText(maxBodyScroll > 0 ? `PgUp/PgDn: details   ${footer}` : footer, W / 2, H - 24);
}
