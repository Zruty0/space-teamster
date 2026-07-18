import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';

export interface InteractiveSceneOption {
  label: string;
  detail?: string;
  disabled?: boolean;
  action: string;
}

export interface InteractiveScene {
  title: string;
  subtitle?: string;
  bodyLines?: string[];
  options: InteractiveSceneOption[];
  footer?: string;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 3))}...`;
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
    ctx.fillText(truncate(scene.subtitle, 100), W / 2, 66);
  }

  const boxW = Math.min(860, W - 80);
  const x = W / 2 - boxW / 2;
  const bodyY = 96;
  const bodyLines = scene.bodyLines ?? [];
  const bodyH = bodyLines.length ? Math.min(230, 26 + bodyLines.length * 20) : 0;

  if (bodyLines.length) {
    ctx.fillStyle = 'rgba(0, 120, 120, 0.04)';
    ctx.strokeStyle = '#1b4a4a';
    ctx.fillRect(x, bodyY, boxW, bodyH);
    ctx.strokeRect(x, bodyY, boxW, bodyH);
    ctx.textAlign = 'left';
    ctx.font = '13px monospace';
    for (let i = 0; i < bodyLines.length; i++) {
      const line = bodyLines[i];
      ctx.fillStyle = line.startsWith('!') ? COL_WARNING : COL_HUD;
      ctx.fillText(line.startsWith('!') ? line.slice(1) : line, x + 22, bodyY + 26 + i * 20);
    }
  }

  const listY = bodyY + bodyH + (bodyH ? 22 : 0);
  const listH = H - listY - 70;
  ctx.fillStyle = 'rgba(0, 120, 120, 0.035)';
  ctx.strokeStyle = '#1b4a4a';
  ctx.fillRect(x, listY, boxW, listH);
  ctx.strokeRect(x, listY, boxW, listH);

  const rowCount = Math.max(1, scene.options.length);
  const rowH = Math.min(58, Math.max(42, Math.floor((listH - 22) / rowCount)));
  ctx.textAlign = 'left';
  for (let i = 0; i < scene.options.length; i++) {
    const option = scene.options[i];
    const y = listY + 24 + i * rowH;
    const selected = i === selectedIndex;
    if (selected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.12)';
      ctx.fillRect(x + 10, y - 17, boxW - 20, rowH - 4);
      ctx.strokeStyle = option.disabled ? COL_WARNING : COL_SUCCESS;
      ctx.strokeRect(x + 10, y - 17, boxW - 20, rowH - 4);
    }
    ctx.fillStyle = option.disabled ? '#446058' : (selected ? COL_SUCCESS : COL_HUD);
    ctx.font = selected ? 'bold 15px monospace' : '15px monospace';
    ctx.fillText(`${selected ? '▶' : ' '} ${option.label}`, x + 22, y);
    if (option.detail) {
      ctx.fillStyle = COL_HUD_DIM;
      ctx.font = '12px monospace';
      ctx.fillText(truncate(option.detail, 110), x + 44, y + 18);
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText(scene.footer ?? 'W/S or ↑↓: select   Enter: choose   Esc: start menu', W / 2, H - 24);
}
