import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING, wrapHudText } from './hud-layout';

export type OperationsManualArticleId = 'local-transfer';

export interface OperationsManualArticle {
  id: OperationsManualArticleId;
  title: string;
  introduction: string;
  controls: { control: string; action: string }[];
  flyingParagraphs: string[];
  procedure: string[];
  hud: { label: string; description: string }[];
}

export const LOCAL_TRANSFER_ARTICLE: OperationsManualArticle = {
  id: 'local-transfer',
  title: 'Local Transfer',
  introduction: 'Local Transfer mode covers flight between stations, asteroids, and other facilities inside a shared traffic volume. There is no useful drag: once moving, your rig will continue moving until you brake. Follow the cyan target marker, then enter the destination’s dashed intercept circle below the displayed REL V limit to begin docking.',
  controls: [
    { control: 'W A S D', action: 'Thrust up, left, down, or right on the map' },
    { control: 'Hold Shift', action: 'High thrust' },
    { control: 'T', action: 'Toggle braking SAS' },
    { control: '[ / ]', action: 'Decrease/increase time warp' },
    { control: 'Esc', action: 'Open the Flight Menu' },
    { control: 'Backspace', action: 'Restart the current flight stage' },
  ],
  flyingParagraphs: [
    'Use thrust to build velocity toward the cyan destination marker, then release the controls and coast. Start braking well before arrival.',
    'You can use high thrust to accelerate faster, but remember: all the speed you build up will later have to be cancelled.',
  ],
  procedure: [
    'Accelerate toward the destination.',
    'Coast toward it, using time warp while the route is clear.',
    'Adjust course as needed to avoid collisions.',
    'As you approach the destination, begin braking. Alternatively, turn on SAS to brake automatically.',
    'Enter the dashed intercept circle and decelerate below the displayed speed limit.',
  ],
  hud: [
    { label: 'RANGE', description: 'Distance to the destination' },
    { label: 'REL V', description: 'Current speed and maximum permitted for handoff' },
    { label: 'SPD', description: 'Current speed' },
    { label: 'SAS', description: 'Automatic braking status' },
    { label: 'WARP', description: 'Current time acceleration' },
    { label: 'ΔV', description: 'Fuel expended during the flight' },
  ],
};

export const OPERATIONS_MANUAL_ARTICLES: OperationsManualArticle[] = [LOCAL_TRANSFER_ARTICLE];

export function operationsManualArticleById(id: OperationsManualArticleId): OperationsManualArticle {
  return OPERATIONS_MANUAL_ARTICLES.find(article => article.id === id) ?? LOCAL_TRANSFER_ARTICLE;
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color = COL_HUD,
): number {
  ctx.fillStyle = color;
  for (const line of wrapHudText(ctx, text, maxWidth)) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function drawHeading(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): number {
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 15px monospace';
  ctx.fillText(text.toUpperCase(), x, y);
  return y + 24;
}

export function drawOperationsManualArticle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  article: OperationsManualArticle,
  tutorialSplash: boolean,
): void {
  const W = canvas.width;
  const H = canvas.height;
  const pad = Math.max(24, Math.min(52, W * 0.04));
  const panelX = pad;
  const panelY = 84;
  const panelW = W - pad * 2;
  const panelH = H - panelY - 58;

  ctx.fillStyle = '#030611';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = tutorialSplash ? COL_WARNING : COL_TITLE;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(tutorialSplash ? 'TUTORIAL' : 'TEAMSTER OPERATING MANUAL', W / 2, 28);
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.fillText(article.title.toUpperCase(), W / 2, 60);

  ctx.fillStyle = 'rgba(0, 120, 120, 0.045)';
  ctx.strokeStyle = tutorialSplash ? 'rgba(255, 170, 0, 0.55)' : 'rgba(0, 255, 204, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX + 1, panelY + 1, panelW - 2, panelH - 2);
  ctx.clip();
  ctx.textAlign = 'left';
  ctx.font = '13px monospace';
  let y = drawWrapped(ctx, article.introduction, panelX + 22, panelY + 28, panelW - 44, 18);
  y += 12;

  const gap = 34;
  const columnW = (panelW - 44 - gap) / 2;
  const leftX = panelX + 22;
  const rightX = leftX + columnW + gap;
  let leftY = y;
  let rightY = y;

  leftY = drawHeading(ctx, 'Controls', leftX, leftY);
  const controlWidth = Math.min(125, columnW * 0.3);
  for (const control of article.controls) {
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = COL_SUCCESS;
    ctx.fillText(control.control, leftX, leftY);
    ctx.font = '12px monospace';
    leftY = drawWrapped(ctx, control.action, leftX + controlWidth, leftY, columnW - controlWidth, 16, COL_HUD);
    leftY += 7;
  }

  leftY += 8;
  leftY = drawHeading(ctx, 'Flying the Transfer', leftX, leftY);
  ctx.font = '12px monospace';
  for (const paragraph of article.flyingParagraphs) {
    leftY = drawWrapped(ctx, paragraph, leftX, leftY, columnW, 17);
    leftY += 9;
  }

  rightY = drawHeading(ctx, 'Recommended Procedure', rightX, rightY);
  ctx.font = '12px monospace';
  article.procedure.forEach((step, index) => {
    ctx.fillStyle = COL_SUCCESS;
    ctx.fillText(`${index + 1}.`, rightX, rightY);
    rightY = drawWrapped(ctx, step, rightX + 26, rightY, columnW - 26, 17);
    rightY += 8;
  });

  rightY += 8;
  rightY = drawHeading(ctx, 'HUD', rightX, rightY);
  for (const item of article.hud) {
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = COL_SUCCESS;
    ctx.fillText(item.label, rightX, rightY);
    ctx.font = '12px monospace';
    rightY = drawWrapped(ctx, item.description, rightX + 70, rightY, columnW - 70, 16, COL_HUD);
    rightY += 6;
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '14px monospace';
  ctx.fillText(tutorialSplash ? 'Enter/Space: Begin local transfer' : 'Enter/Space/Esc: Return to manual', W / 2, H - 20);
}
