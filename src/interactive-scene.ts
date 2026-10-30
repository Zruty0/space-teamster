import { COL_DANGER, COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';
import { wrapMenuText as wrapText, visibleMenuRange } from './menu-layout';

export type InteractiveTone = 'normal' | 'primary' | 'back' | 'disabled' | 'danger' | 'warning' | 'success' | 'story' | 'muted' | 'person' | 'contact';

export interface InteractiveTextSegment {
  text: string;
  tone?: InteractiveTone;
}

export interface InteractiveMarkedText {
  text: string;
  segments: InteractiveTextSegment[];
}

export function parseInteractiveTextMarkup(markup: string): InteractiveMarkedText {
  const segments: InteractiveTextSegment[] = [];
  const pattern = /\[(person|contact)\]([\s\S]*?)\[\/\1\]/g;
  let text = '';
  let cursor = 0;
  for (let match = pattern.exec(markup); match; match = pattern.exec(markup)) {
    const leading = markup.slice(cursor, match.index);
    if (leading) segments.push({ text: leading });
    segments.push({ text: match[2], tone: match[1] as 'person' | 'contact' });
    text += leading + match[2];
    cursor = match.index + match[0].length;
  }
  const trailing = markup.slice(cursor);
  if (trailing) segments.push({ text: trailing });
  text += trailing;
  return { text, segments };
}

export type InteractiveIcon = 'fragile' | 'passenger' | 'lock' | 'wrench' | 'warning' | 'alert';

export type InteractiveSceneBodyRow =
  | { kind: 'text'; text: string; segments?: InteractiveTextSegment[]; tone?: InteractiveTone }
  | { kind: 'kv'; label: string; value: string; valueSegments?: InteractiveTextSegment[]; icon?: InteractiveIcon; valueIcon?: InteractiveIcon; tone?: InteractiveTone; labelLineCount?: 1 | 2 | 3; valueLineCount?: 1 | 2 | 3 | 4 | 5 | 6; fullWidthValue?: boolean; bars?: readonly number[] }
  | { kind: 'separator' };

export interface InteractiveSceneOption {
  label: string;
  /** Minimum spacing only; text automatically wraps beyond this count. */
  labelLineCount?: 1 | 2;
  detail?: string;
  /** Minimum spacing only; never a truncation limit. */
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
  /** Small semantic icon at the far left of the issuer-tag gutter. */
  leftIcon?: InteractiveIcon;
  /** Contract markers arranged left-to-right on the second row of the tag gutter. */
  secondRowIcons?: InteractiveIcon[];
}

export interface InteractiveScene {
  title: string;
  subtitle?: string;
  bodyLines?: string[];
  bodyRows?: InteractiveSceneBodyRow[];
  bodyMaxHeight?: number;
  bodyLabelWidth?: number;
  options: InteractiveSceneOption[];
  footer?: string;
}

function toneColor(tone: InteractiveTone | undefined, selected = false): string {
  if (tone === 'primary' || tone === 'success') return selected ? '#ffffff' : COL_SUCCESS;
  if (tone === 'warning' || tone === 'person') return COL_WARNING;
  if (tone === 'contact') return '#4ddcff';
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

export function interactiveOptionLayout(ctx: CanvasRenderingContext2D, boxW: number, option: InteractiveSceneOption) {
  const labelX = option.leftIcon ? 31 : 28;
  const hasTagColumn = !!option.tag || option.tagColumn === true;
  ctx.font = 'bold 12px monospace';
  const tagWidth = hasTagColumn ? Math.max(82, ctx.measureText(option.tag ? `[${option.tag}]` : '').width + 12) : 0;
  ctx.font = 'bold 15px monospace';
  const textX = labelX + tagWidth + ctx.measureText('▶ ').width;
  ctx.font = 'bold 14px monospace';
  const rightLabelWidth = ctx.measureText(option.rightText ?? '').width;
  ctx.font = 'bold 12px monospace';
  const rightDetailWidth = ctx.measureText(option.rightDetail ?? '').width;
  const rightWidth = option.rightText || option.rightDetail
    ? Math.min(Math.max(rightLabelWidth, rightDetailWidth), boxW * 0.35) : 0;
  const textRight = boxW - 24 - (rightWidth ? rightWidth + 20 : 0);
  ctx.font = 'bold 15px monospace';
  const labelLines = wrapText(ctx, option.label, textRight - textX);
  const labelCount = Math.max(labelLines.length, option.labelLineCount ?? 1);
  const detailX = hasTagColumn ? textX : option.leftIcon ? 49 : 46;
  ctx.font = '12px monospace';
  const detailLines = option.detail ? wrapText(ctx, option.detail, textRight - detailX) : [];
  const detailCount = option.detail ? Math.max(detailLines.length, option.detailLineCount ?? 1) : 0;
  ctx.font = 'bold 14px monospace';
  const rightLines = option.rightText ? wrapText(ctx, option.rightText, rightWidth) : [];
  ctx.font = 'bold 12px monospace';
  const rightDetailLines = option.rightDetail ? wrapText(ctx, option.rightDetail, rightWidth) : [];
  const detailY = 19 + (labelCount - 1) * 18;
  const rightDetailY = rightLines.length ? 19 + (rightLines.length - 1) * 18 : 0;
  const lastBaseline = Math.max(
    (labelCount - 1) * 18,
    detailCount ? detailY + (detailCount - 1) * 15 : 0,
    Math.max(0, rightLines.length - 1) * 18,
    rightDetailLines.length ? rightDetailY + (rightDetailLines.length - 1) * 15 : 0,
    option.secondRowIcons?.length ? 19 : 0,
  );
  return { labelX, textX, detailX, textRight, rightWidth, labelLines, detailLines, detailY, rightLines, rightDetailLines, rightDetailY, height: Math.max(58, lastBaseline + 39) };
}

function drawRichTextSegments(
  ctx: CanvasRenderingContext2D,
  segments: readonly InteractiveTextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  maxLines: number,
): void {
  const lines = wrapText(ctx, segments.map(segment => segment.text).join(''), maxWidth);
  const glyphs = segments.flatMap(segment => Array.from(segment.text).filter(char => !/\s/.test(char)).map(char => ({ char, tone: segment.tone })));
  let cursor = 0;
  lines.slice(0, maxLines).forEach((line, index) => {
    let cursorX = x, run = '';
    let tone: InteractiveTone | undefined;
    const flush = () => {
      if (!run) return;
      ctx.fillStyle = toneColor(tone);
      ctx.fillText(run, cursorX, y + index * 18);
      cursorX += ctx.measureText(run).width;
      run = '';
    };
    for (const char of line) {
      const nextTone = /\s/.test(char) ? tone : glyphs[cursor++]?.tone;
      if (nextTone !== tone) flush();
      tone = nextTone;
      run += char;
    }
    flush();
  });
}

function drawFragileIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = '#4ddcff';
  ctx.lineWidth = 1.25;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  // Schematic wineglass: rim, tapered bowl, stem, and base.
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x + 12, y - 11);
  ctx.moveTo(x + 1, y - 10);
  ctx.lineTo(x + 3, y - 5);
  ctx.lineTo(x + 6, y - 3);
  ctx.lineTo(x + 9, y - 5);
  ctx.lineTo(x + 11, y - 10);
  ctx.moveTo(x + 6, y - 3);
  ctx.lineTo(x + 6, y + 2);
  ctx.moveTo(x + 2, y + 2);
  ctx.lineTo(x + 10, y + 2);
  ctx.stroke();

  // Crack through the bowl.
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 10);
  ctx.lineTo(x + 5, y - 8);
  ctx.lineTo(x + 7, y - 6);
  ctx.lineTo(x + 5, y - 4);
  ctx.stroke();
  ctx.restore();
}

function drawPassengerIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = '#4ddcff';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';

  // MSN-style schematic bust: circular head over one shoulder arc.
  ctx.beginPath();
  ctx.arc(x + 6, y - 8, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 6, y + 3, 6, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawLockIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COL_WARNING;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(x + 6, y - 7, 4, Math.PI, 0);
  ctx.lineTo(x + 10, y - 3);
  ctx.moveTo(x + 2, y - 3);
  ctx.lineTo(x + 2, y - 7);
  ctx.stroke();
  ctx.strokeRect(x + 1, y - 3, 10, 7);
  ctx.restore();
}

// Exact 512×512 path from the operator-provided wrench.svg, scaled to the UI glyph box.
const WRENCH_ICON_PATH_DATA = 'M511.804,133.197c-0.521-10.112-6.946-18.97-16.393-22.596c-2.987-1.143-6.093-1.707-9.173-1.707c-6.673,0-13.218,2.611-18.116,7.509l-59.81,59.861l-60.868-11.58l-11.571-60.911l59.81-59.861c7.151-7.159,9.421-17.86,5.803-27.307c-3.627-9.446-12.467-15.88-22.571-16.41C376.397,0.068,373.871,0,371.345,0c-37.743,0-73.037,14.515-99.379,40.875c-41.728,41.762-52.582,103.518-29.295,156.169L75.537,364.314L33.51,406.374c-17.63,17.647-54.323,54.366-18.108,90.615C27.801,509.397,40.747,512,49.425,512c23.415,0,41.003-17.604,56.525-33.135l209.186-209.357c17.783,7.808,37.06,11.878,56.704,11.878c37.521,0,72.798-14.618,99.319-41.156C499.08,212.292,513.894,173.278,511.804,133.197zM453.052,222.106c-22.443,22.46-51.814,33.656-81.212,33.656c-21.367,0-42.743-5.914-61.483-17.715C230.4,318.071,125.064,423.484,87.834,460.74c-12.809,12.817-25.609,25.634-38.417,25.634c-5.299,0-10.607-2.202-15.915-7.509c-18.108-18.125,0-36.25,18.108-54.366C88.84,387.243,194.167,281.83,274.133,201.805C246.127,157.252,251.307,97.792,290.065,59c22.451-22.468,51.84-33.365,81.271-33.365c2.082,0,4.156,0.051,6.238,0.162l-69.393,69.444l17.357,91.366l91.298,17.374l69.393-69.453C487.876,166.025,477.09,198.042,453.052,222.106z';
let wrenchIconPath: Path2D | undefined;

function drawWrenchIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  wrenchIconPath ??= new Path2D(WRENCH_ICON_PATH_DATA);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 2, y - 13, 16, 16);
  ctx.clip();
  ctx.translate(x - 10, y - 13);
  ctx.scale(3 / 64, 3 / 64);
  ctx.fillStyle = '#4ddcff';
  ctx.fill(wrenchIconPath);
  ctx.restore();
}

function drawStatusTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, alert: boolean): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 12);
  ctx.lineTo(x + 13, y + 2);
  ctx.lineTo(x - 1, y + 2);
  ctx.closePath();
  ctx.fillStyle = alert ? '#e32636' : '#050706';
  ctx.strokeStyle = alert ? '#e32636' : COL_WARNING;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = alert ? '#ffffff' : COL_WARNING;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('!', x + 6, y);
  ctx.restore();
}

function drawInteractiveIcon(ctx: CanvasRenderingContext2D, icon: InteractiveIcon, x: number, y: number): void {
  if (icon === 'fragile') drawFragileIcon(ctx, x, y);
  else if (icon === 'passenger') drawPassengerIcon(ctx, x, y);
  else if (icon === 'lock') drawLockIcon(ctx, x, y);
  else if (icon === 'wrench') drawWrenchIcon(ctx, x, y);
  else drawStatusTriangle(ctx, x, y, icon === 'alert');
}

function bodyRows(scene: InteractiveScene): InteractiveSceneBodyRow[] {
  if (scene.bodyRows) return scene.bodyRows;
  return (scene.bodyLines ?? []).map(line => line.startsWith('!')
    ? { kind: 'text', text: line.slice(1), tone: 'warning' }
    : { kind: 'text', text: line });
}

function sceneBodyTop(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, scene: InteractiveScene): number {
  ctx.font = '13px monospace';
  return 92 + (scene.subtitle ? wrapText(ctx, scene.subtitle, canvas.width - 80).length - 1 : 0) * 16;
}

function sceneBodyMetrics(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scene: InteractiveScene,
): { contentHeight: number; viewportHeight: number } {
  const boxW = Math.min(920, canvas.width - 80);
  const labelW = scene.bodyLabelWidth ?? 165;
  const rows = bodyRows(scene);
  ctx.font = '13px monospace';
  const contentHeight = rows.reduce((height, row) => {
    if (row.kind === 'separator') return height + 14;
    if (row.kind === 'kv') {
      ctx.font = '11px monospace';
      const labelWidth = labelW - (row.icon ? 18 : 0);
      const labelLineCount = row.fullWidthValue ? 1 : wrapText(ctx, row.label.toUpperCase(), labelWidth).length;
      ctx.font = '13px monospace';
      const valueIconWidth = row.valueIcon ? 20 : 0;
      const valueWidth = boxW - (row.fullWidthValue ? 54 : labelW + 54) - valueIconWidth;
      const valueLineCount = wrapText(ctx, row.value, valueWidth).length;
      return height + 22 + (Math.max(labelLineCount, valueLineCount) - 1) * 18 + (row.bars?.length ? 20 : 0);
    }
    ctx.font = '13px monospace';
    return height + wrapText(ctx, row.text, boxW - 44).length * 18 + 2;
  }, 0);
  const requestedHeight = rows.length ? Math.min(scene.bodyMaxHeight ?? 260, 24 + contentHeight) : 0;
  const tallestOption = Math.max(58, ...scene.options.map(option => interactiveOptionLayout(ctx, boxW, option).height));
  const viewportHeight = Math.min(requestedHeight, Math.max(0, canvas.height - sceneBodyTop(ctx, canvas, scene) - 18 - 68 - 30 - tallestOption));
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
  let titleSize = 28;
  ctx.font = `bold ${titleSize}px monospace`;
  while (titleSize > 12 && ctx.measureText(scene.title).width > W - 40) {
    titleSize--;
    ctx.font = `bold ${titleSize}px monospace`;
  }
  ctx.fillText(scene.title, W / 2, 42);
  if (scene.subtitle) {
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '13px monospace';
    wrapText(ctx, scene.subtitle, W - 80).forEach((line, index) => ctx.fillText(line, W / 2, 66 + index * 16));
  }

  const boxW = Math.min(920, W - 80);
  const x = W / 2 - boxW / 2;
  const bodyY = sceneBodyTop(ctx, canvas, scene);
  const rows = bodyRows(scene);
  const labelW = scene.bodyLabelWidth ?? 165;
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
        if (row.icon) drawInteractiveIcon(ctx, row.icon, x + 22, y);
        const labelWidth = labelW - (row.icon ? 18 : 0);
        const labelLines = wrapText(ctx, row.label.toUpperCase(), labelWidth);
        labelLines.forEach((line, index) => ctx.fillText(line, x + (row.icon ? 40 : 22), y + index * 18));
        ctx.font = row.tone === 'primary' || row.tone === 'success' || row.tone === 'warning' ? 'bold 13px monospace' : '13px monospace';
        ctx.fillStyle = toneColor(row.tone);
        const valueX = x + 22 + (row.fullWidthValue ? 0 : labelW);
        const valueIconWidth = row.valueIcon ? 20 : 0;
        const valueWidth = boxW - (row.fullWidthValue ? 54 : labelW + 54) - valueIconWidth;
        if (row.valueIcon) drawInteractiveIcon(ctx, row.valueIcon, valueX, y);
        const valueTextX = valueX + valueIconWidth;
        const wrappedValue = wrapText(ctx, row.value, valueWidth);
        const valueLineCount = wrappedValue.length;
        if (row.valueSegments) {
          drawRichTextSegments(ctx, row.valueSegments, valueTextX, y, valueWidth, valueLineCount);
        } else {
          wrappedValue.forEach((line, index) => ctx.fillText(line, valueTextX, y + index * 18));
        }
        const textHeight = (Math.max(Math.max(1, labelLines.length), valueLineCount) - 1) * 18;
        if (row.bars?.length) {
          const gap = 5;
          const width = Math.min(30, (valueWidth - gap * (row.bars.length - 1)) / row.bars.length);
          row.bars.forEach((value, index) => {
            const bx = valueTextX + index * (width + gap), by = y + textHeight + 7;
            const fill = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
            ctx.fillStyle = '#102c2c';
            ctx.fillRect(bx, by, width, 11);
            ctx.fillStyle = '#4ddcff';
            if (fill > 0) ctx.fillRect(bx, by, width * fill, 11);
            ctx.strokeStyle = '#397579';
            ctx.strokeRect(bx + 0.5, by + 0.5, width - 1, 10);
          });
        }
        y += 22 + textHeight + (row.bars?.length ? 20 : 0);
        continue;
      }
      ctx.textAlign = 'left';
      ctx.font = '13px monospace';
      ctx.fillStyle = toneColor(row.tone);
      const textWidth = boxW - 44;
      const wrappedLines = wrapText(ctx, row.text, textWidth);
      if (row.segments) {
        drawRichTextSegments(ctx, row.segments, x + 22, y, textWidth, wrappedLines.length);
        y += wrappedLines.length * 18;
      } else {
        for (const line of wrappedLines) {
          if (y > bottom) break;
          ctx.fillText(line, x + 22, y);
          y += 18;
        }
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

  const layouts = scene.options.map(option => interactiveOptionLayout(ctx, boxW, option));
  const { start, end } = visibleMenuRange(layouts.map(layout => layout.height), selectedIndex, listH - 30);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, listY + 1, boxW - 2, listH - 2);
  ctx.clip();
  ctx.textAlign = 'left';
  let rowOffset = 0;
  for (let i = start; i < end; i++) {
    const option = scene.options[i];
    const tone: InteractiveTone = option.disabled ? 'disabled' : (option.tone ?? 'normal');
    const layout = layouts[i];
    const rowH = layout.height;
    const y = listY + 28 + rowOffset;
    rowOffset += rowH;
    const selected = i === selectedIndex;
    if (selected) {
      ctx.fillStyle = toneFill(tone);
      ctx.fillRect(x + 10, y - 18, boxW - 20, rowH - 5);
      ctx.strokeStyle = toneAccent(tone);
      ctx.strokeRect(x + 10, y - 18, boxW - 20, rowH - 5);
    }

    const labelX = x + layout.labelX;
    if (option.leftIcon) drawInteractiveIcon(ctx, option.leftIcon, x + 13, y);
    const textX = x + layout.textX;
    if (option.tag) {
      ctx.fillStyle = toneAccent(option.tagTone ?? tone);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[${option.tag}]`, labelX, y);
    }
    ctx.fillStyle = toneColor(tone, selected);
    ctx.font = selected ? 'bold 15px monospace' : '15px monospace';
    const cursorWidth = ctx.measureText('▶ ').width;
    if (selected) ctx.fillText('▶', textX - cursorWidth, y);
    layout.labelLines.forEach((line, lineIndex) => ctx.fillText(line, textX, y + lineIndex * 18));
    if (option.rightText || option.rightDetail) {
      ctx.fillStyle = toneColor(tone, selected);
      ctx.font = selected ? 'bold 14px monospace' : '14px monospace';
      ctx.textAlign = 'right';
      layout.rightLines.forEach((line, index) => ctx.fillText(line, x + boxW - 24, y + index * 18));
      if (option.rightDetail) {
        ctx.fillStyle = toneColor(tone, selected);
        ctx.font = selected ? 'bold 12px monospace' : '12px monospace';
        layout.rightDetailLines.forEach((line, index) => ctx.fillText(line, x + boxW - 24, y + layout.rightDetailY + index * 15));
      }
      ctx.textAlign = 'left';
    }
    if (option.secondRowIcons?.length) {
      option.secondRowIcons.forEach((icon, iconIndex) => drawInteractiveIcon(ctx, icon, labelX + iconIndex * 20, y + 19));
    }
    if (option.detail) {
      ctx.fillStyle = COL_HUD_DIM;
      ctx.font = '12px monospace';
      layout.detailLines.forEach((line, index) => ctx.fillText(line, x + layout.detailX, y + layout.detailY + index * 15));
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
