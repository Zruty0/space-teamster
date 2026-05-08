import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';
import { type EstellaNavTarget } from './content/estella/navigation';

export type EstellaNavPanel = 'source' | 'destination';

export interface EstellaNavPhaseState {
  sourceIndex: number;
  destinationIndex: number;
  activePanel: EstellaNavPanel;
  routeText: string;
}

export function createEstellaNavState(targetCount: number): EstellaNavPhaseState {
  return {
    sourceIndex: 0,
    destinationIndex: Math.min(1, Math.max(0, targetCount - 1)),
    activePanel: 'source',
    routeText: '',
  };
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function moveEstellaSelection(state: EstellaNavPhaseState, delta: number, targetCount: number): void {
  if (state.activePanel === 'source') state.sourceIndex = clampIndex(state.sourceIndex + delta, targetCount);
  else state.destinationIndex = clampIndex(state.destinationIndex + delta, targetCount);
}

export function toggleEstellaPanel(state: EstellaNavPhaseState): void {
  state.activePanel = state.activePanel === 'source' ? 'destination' : 'source';
}

function drawTargetList(
  ctx: CanvasRenderingContext2D,
  title: string,
  targets: readonly EstellaNavTarget[],
  selectedIndex: number,
  active: boolean,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.strokeStyle = active ? COL_SUCCESS : '#1b4a4a';
  ctx.lineWidth = active ? 2 : 1;
  ctx.fillStyle = active ? 'rgba(0, 255, 136, 0.06)' : 'rgba(0, 120, 120, 0.04)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = active ? COL_SUCCESS : COL_HUD_DIM;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 14, y + 26);

  if (targets.length === 0) {
    ctx.fillStyle = COL_WARNING;
    ctx.font = '14px monospace';
    ctx.fillText('No exact-authored Estella POIs yet.', x + 14, y + 60);
    return;
  }

  const visible = Math.min(9, targets.length);
  let start = Math.max(0, selectedIndex - Math.floor(visible / 2));
  start = Math.min(start, Math.max(0, targets.length - visible));
  const rowH = 42;
  for (let i = 0; i < visible; i++) {
    const idx = start + i;
    const target = targets[idx];
    const rowY = y + 54 + i * rowH;
    const sel = idx === selectedIndex;
    if (sel) {
      ctx.fillStyle = active ? 'rgba(0, 255, 136, 0.16)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x + 8, rowY - 16, w - 16, rowH - 4);
    }
    ctx.fillStyle = sel ? '#ffffff' : COL_HUD;
    ctx.font = sel ? 'bold 13px monospace' : '13px monospace';
    ctx.fillText(target.name, x + 16, rowY);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '11px monospace';
    const path = target.path.length > 62 ? `${target.path.slice(0, 59)}...` : target.path;
    ctx.fillText(path, x + 16, rowY + 16);
  }
}

export function drawEstellaNavigation(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: EstellaNavPhaseState,
  targets: readonly EstellaNavTarget[],
): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#030611';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 30px monospace';
  ctx.fillText('ESTELLA TRANSFER', W / 2, 44);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText('Prototype navigation: selectable POIs require exact-authored placement chains.', W / 2, 68);

  const panelW = Math.min(520, W / 2 - 48);
  const panelH = Math.max(300, H - 190);
  const leftX = W / 2 - panelW - 16;
  const rightX = W / 2 + 16;
  const panelY = 98;

  drawTargetList(ctx, 'SOURCE', targets, state.sourceIndex, state.activePanel === 'source', leftX, panelY, panelW, panelH);
  drawTargetList(ctx, 'DESTINATION', targets, state.destinationIndex, state.activePanel === 'destination', rightX, panelY, panelW, panelH);

  const src = targets[state.sourceIndex];
  const dst = targets[state.destinationIndex];
  const footerY = panelY + panelH + 34;
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('←/→ or A/D: choose panel   ↑/↓ or W/S: select   Enter/Space: set route   Backspace: clear   L: missions', W / 2, footerY);

  if (src && dst) {
    ctx.fillStyle = state.routeText ? COL_SUCCESS : COL_HUD;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`ROUTE: ${src.name}  →  ${dst.name}`, W / 2, footerY + 28);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '12px monospace';
    const detail = `${src.detail}  /  ${dst.detail}`;
    ctx.fillText(detail.length > 120 ? `${detail.slice(0, 117)}...` : detail, W / 2, footerY + 48);
  }

  if (state.routeText) {
    ctx.fillStyle = COL_SUCCESS;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(state.routeText, W / 2, H - 22);
  }
}
