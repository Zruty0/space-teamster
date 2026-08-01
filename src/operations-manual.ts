import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING, wrapHudText } from './hud-layout';

export type OperationsManualArticleId = 'local-transfer' | 'docking-undocking' | 'surface-flight' | 'orbit-deorbit';

export interface ManualControl {
  keys: string[];
  action: string;
  description: string;
  modeSpecific?: boolean;
}

export interface OperationsManualArticle {
  id: OperationsManualArticleId;
  title: string;
  introduction: string;
  controls: ManualControl[];
  tips: string[];
  procedure: string[];
  hud: { label: string; description: string }[];
}

export const LOCAL_TRANSFER_ARTICLE: OperationsManualArticle = {
  id: 'local-transfer',
  title: 'Local Transfer',
  introduction: 'Local Transfer mode covers flight between stations, asteroids, and other facilities inside a shared traffic volume. There is no useful drag: once moving, your rig will continue moving until you brake. Follow the cyan target marker, then enter the destination’s dashed intercept circle below the displayed REL V limit to begin docking.',
  controls: [
    {
      keys: ['W', 'A', 'S', 'D'],
      action: 'LATERAL THRUST',
      description: '',
      modeSpecific: true,
    },
    { keys: ['SHIFT'], action: 'HIGH THRUST', description: 'Hold with a thrust key to accelerate faster.' },
    { keys: ['T'], action: 'BRAKING SAS', description: 'Toggle automatic braking and return time warp to 1×.' },
    { keys: ['[', ']'], action: 'TIME WARP', description: 'Decrease or increase time acceleration.' },
    { keys: ['ESC'], action: 'FLIGHT MENU', description: 'Pause the flight and open mission controls.' },
    { keys: ['BACKSPACE'], action: 'RESTART STAGE', description: 'Restart the current flight stage.' },
  ],
  tips: [
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

export const SURFACE_FLIGHT_ARTICLE: OperationsManualArticle = {
  id: 'surface-flight',
  title: 'Surface Landing and Takeoff',
  introduction: 'Surface Flight mode covers final descent to a landing pad and departure from the surface. To land, touch down on the assigned pad with the landing gear deployed and remain within the displayed vertical- and horizontal-speed limits. To depart, climb above the displayed altitude and build horizontal speed in the indicated direction.',
  controls: [
    {
      keys: ['W', 'A', 'S', 'D'],
      action: 'LATERAL THRUST — GEAR UP',
      description: 'Apply direct translational thrust while the landing gear is retracted.',
      modeSpecific: true,
    },
    {
      keys: ['W', 'S'],
      action: 'VERTICAL THROTTLE — GEAR DOWN',
      description: 'Increase or decrease the persistent vertical-thrust setting.',
      modeSpecific: true,
    },
    {
      keys: ['A', 'D'],
      action: 'LATERAL THRUST — GEAR DOWN',
      description: 'Make fine horizontal corrections. Hold Shift for full lateral thrust.',
      modeSpecific: true,
    },
    {
      keys: ['SPACE'],
      action: 'HOVER THROTTLE — GEAR DOWN',
      description: 'Return the throttle to local gravity compensation. Hover is available only with the landing gear deployed.',
      modeSpecific: true,
    },
    { keys: ['Q', 'E'], action: 'ROTATE', description: 'Manually override the rig’s automatic rotation.' },
    { keys: ['G'], action: 'LANDING GEAR', description: 'Deploy or retract the landing gear.' },
    { keys: ['SHIFT'], action: 'HIGH THRUST', description: 'Hold with a thrust control for maximum output.' },
    { keys: ['T'], action: 'BRAKING SAS', description: 'Toggle automatic translational braking.' },
    { keys: ['ESC'], action: 'FLIGHT MENU', description: 'Pause the flight and open mission controls.' },
    { keys: ['BACKSPACE'], action: 'RESTART STAGE', description: 'Restart the current flight stage.' },
  ],
  procedure: [
    'Landing: deploy the landing gear before final descent.',
    'Press Space to establish hover.',
    'Use W/S to adjust your descent rate. Press Space to return to an unaccelerated descent. Use A/D to position the rig over the pad and cancel horizontal drift.',
    'Touch down inside the pad with low vertical speed and low horizontal speed.',
    'Takeoff: with the gear deployed, press Space and then increase throttle with W to begin climbing.',
    'Once safely clear of the surface, retract the gear and use direct thrust to climb above the displayed altitude while building horizontal speed in the indicated direction.',
  ],
  tips: [
    'Press Space often to return the throttle to local gravity compensation before making the next adjustment.',
    'Fly smoothly. Make small corrections early so they do not become large corrections close to the ground.',
    'Let the rig manage its own rotation. It will turn itself as needed unless you override it with Q/E.',
    'Practice gentle touchdowns. Fragile cargo can impose handling penalties after a hard landing.',
  ],
  hud: [
    { label: 'ALT', description: 'Height above the local surface' },
    { label: 'V/S', description: 'Vertical speed' },
    { label: 'H/S', description: 'Horizontal speed' },
    { label: 'SPD', description: 'Total speed' },
    { label: 'CFG', description: 'Landing-gear configuration' },
    { label: 'THR', description: 'Current throttle' },
    { label: 'SAS', description: 'Automatic braking status' },
    { label: 'PAD', description: 'Distance from the assigned landing-pad center' },
    { label: 'DIR', description: 'Required departure direction' },
    { label: 'ΔV', description: 'Fuel expended during the flight' },
  ],
};

export const ORBIT_DEORBIT_ARTICLE: OperationsManualArticle = {
  id: 'orbit-deorbit',
  title: 'Orbit and Deorbit',
  introduction: 'Orbital flight is controlled by changing velocity rather than steering directly toward a destination. Prograde thrust adds orbital energy; retrograde thrust removes it. For a surface arrival, lower your periapsis into the displayed approach corridor, then coast to the handoff.',
  controls: [
    {
      keys: ['W', 'S'],
      action: 'PROGRADE / RETROGRADE THRUST',
      description: '',
      modeSpecific: true,
    },
    {
      keys: ['A', 'D'],
      action: 'SIDEWAYS THRUST',
      description: '',
      modeSpecific: true,
    },
    { keys: ['SHIFT'], action: 'HIGH THRUST', description: 'Hold with a thrust control for maximum output.' },
    { keys: ['[', ']'], action: 'TIME WARP', description: 'Decrease or increase time acceleration. Any thrust returns warp to 1×.' },
    { keys: ['ESC'], action: 'FLIGHT MENU', description: 'Pause the flight and open mission controls.' },
    { keys: ['BACKSPACE'], action: 'RESTART STAGE', description: 'Restart the current flight stage.' },
  ],
  procedure: [
    'Read the projected orbit and note the current PeA and the destination’s required PeA.',
    'Apply retrograde thrust until PeA falls below the displayed approach threshold, while keeping the projected path clear of the surface.',
    'Release the controls and coast around the orbit. Use time warp while the projected route is safe.',
    'Make short corrections as needed rather than holding a long burn.',
    'Cross the low point of the orbit below the displayed transition altitude to enter the destination approach.',
  ],
  tips: [
    'A burn changes the whole orbit. Prograde thrust generally raises the opposite side; retrograde thrust generally lowers it.',
    'Most orbital flight is coasting. Burn briefly, then stop and inspect the new trajectory before correcting again.',
    'Use high thrust sparingly near the deorbit threshold. A small excess can turn an approach into an impact trajectory.',
  ],
  hud: [
    { label: 'ALT', description: 'Current altitude above the surface' },
    { label: 'SPD', description: 'Current orbital speed' },
    { label: 'PeA', description: 'Periapsis altitude — the lowest point of the orbit' },
    { label: 'ApA', description: 'Apoapsis altitude — the highest point of the orbit' },
    { label: 'ECC', description: 'Orbital eccentricity' },
    { label: 'THR', description: 'Low or high thrust setting' },
    { label: 'WARP', description: 'Current time acceleration' },
    { label: 'ΔV', description: 'Fuel expended during the flight' },
  ],
};

export const DOCKING_UNDOCKING_ARTICLE: OperationsManualArticle = {
  id: 'docking-undocking',
  title: 'Docking and Undocking',
  introduction: 'Docking and Undocking mode covers close maneuvering around stations and other berthing facilities. When departing, clear the station beyond the displayed safe distance. When arriving, bring the container to the assigned bay, align the rig, and let the station tractor beam complete the capture.',
  controls: [
    {
      keys: ['W', 'A', 'S', 'D'],
      action: 'LATERAL THRUST',
      description: '',
      modeSpecific: true,
    },
    {
      keys: ['Q', 'E'],
      action: 'ROTATE',
      description: '',
      modeSpecific: true,
    },
    { keys: ['SHIFT'], action: 'HIGH THRUST', description: 'Hold with a thrust key to accelerate faster.' },
    { keys: ['T'], action: 'BRAKING SAS', description: 'Toggle automatic translation and rotation braking.' },
    { keys: ['ESC'], action: 'FLIGHT MENU', description: 'Pause the flight and open mission controls.' },
    { keys: ['BACKSPACE'], action: 'RESTART STAGE', description: 'Restart the current flight stage.' },
  ],
  procedure: [
    'When undocking, use low thrust to clear the berth and nearby station structure.',
    'Continue away from the station until STN exceeds the displayed clearance distance.',
    'When docking, approach the assigned bay at low speed and brake before entering tractor range.',
    'Rotate the tug so the container faces the bay opening, then bring DIST and ALIGN within their displayed limits.',
    'Release the controls and hold alignment while the tractor beam pulls the container into the berth.',
  ],
  tips: [
    'Use high thrust sparingly near a station. A small correction can become a collision before SAS has time to cancel it.',
  ],
  hud: [
    { label: 'SPD', description: 'Current speed' },
    { label: 'ANG', description: 'Current rig angle' },
    { label: 'THR', description: 'Low or high thrust setting' },
    { label: 'SAS', description: 'Automatic braking status' },
    { label: 'DIST', description: 'Distance to the assigned bay and tractor-beam range' },
    { label: 'ALIGN', description: 'Angular error and maximum permitted for tractor capture' },
    { label: 'STN', description: 'Distance from the station and required undocking clearance' },
    { label: 'ΔV', description: 'Fuel expended during the flight' },
  ],
};

export const OPERATIONS_MANUAL_ARTICLES: OperationsManualArticle[] = [
  DOCKING_UNDOCKING_ARTICLE,
  LOCAL_TRANSFER_ARTICLE,
  SURFACE_FLIGHT_ARTICLE,
  ORBIT_DEORBIT_ARTICLE,
];

export function operationsManualArticleById(id: OperationsManualArticleId): OperationsManualArticle {
  return OPERATIONS_MANUAL_ARTICLES.find(article => article.id === id) ?? LOCAL_TRANSFER_ARTICLE;
}

interface ManualGeometry {
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  contentX: number;
  contentW: number;
  viewportY: number;
  viewportH: number;
}

function manualGeometry(canvas: HTMLCanvasElement): ManualGeometry {
  const W = canvas.width;
  const H = canvas.height;
  const outerPad = Math.max(20, Math.min(52, W * 0.04));
  const panelW = Math.min(980, W - outerPad * 2);
  const panelX = (W - panelW) * 0.5;
  const panelY = 84;
  const panelH = H - panelY - 58;
  return {
    panelX,
    panelY,
    panelW,
    panelH,
    contentX: panelX + 30,
    contentW: panelW - 60,
    viewportY: panelY + 18,
    viewportH: panelH - 36,
  };
}

function wrappedHeight(ctx: CanvasRenderingContext2D, text: string, width: number, lineHeight: number): number {
  return wrapHudText(ctx, text, width).length * lineHeight;
}

function controlCardHeight(ctx: CanvasRenderingContext2D, control: ManualControl, contentW: number): number {
  const keyColumnW = Math.min(260, contentW * 0.34);
  ctx.font = '12px monospace';
  return Math.max(58, 30 + wrappedHeight(ctx, control.description, contentW - keyColumnW - 34, 16));
}

function measureArticleContent(ctx: CanvasRenderingContext2D, article: OperationsManualArticle, contentW: number): number {
  let height = 0;
  ctx.font = '13px monospace';
  height += wrappedHeight(ctx, article.introduction, contentW, 18) + 22;
  height += 30;
  for (const control of article.controls) height += controlCardHeight(ctx, control, contentW) + 10;
  height += 18 + 30;
  ctx.font = '12px monospace';
  for (const step of article.procedure) height += wrappedHeight(ctx, step, contentW - 34, 17) + 10;
  height += 14 + 30;
  for (const tip of article.tips) height += wrappedHeight(ctx, tip, contentW, 17) + 12;
  height += 14 + 30;
  for (const item of article.hud) height += wrappedHeight(ctx, item.description, contentW - 100, 16) + 10;
  return height + 20;
}

export function operationsManualArticleScrollLimit(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  article: OperationsManualArticle,
): number {
  const geometry = manualGeometry(canvas);
  const contentHeight = measureArticleContent(ctx, article, geometry.contentW);
  return Math.max(0, contentHeight - geometry.viewportH);
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
  return y + 30;
}

function drawKeyCaps(ctx: CanvasRenderingContext2D, keys: string[], x: number, y: number, modeSpecific: boolean): void {
  ctx.font = 'bold 12px monospace';
  for (const key of keys) {
    const width = Math.max(32, ctx.measureText(key).width + 18);
    ctx.fillStyle = modeSpecific ? 'rgba(255, 170, 0, 0.16)' : 'rgba(0, 255, 204, 0.10)';
    ctx.strokeStyle = modeSpecific ? COL_WARNING : COL_SUCCESS;
    ctx.lineWidth = 1.25;
    ctx.fillRect(x, y - 16, width, 25);
    ctx.strokeRect(x, y - 16, width, 25);
    ctx.fillStyle = modeSpecific ? COL_WARNING : COL_SUCCESS;
    ctx.textAlign = 'center';
    ctx.fillText(key, x + width * 0.5, y + 1);
    x += width + 7;
  }
  ctx.textAlign = 'left';
}

function drawControlCard(
  ctx: CanvasRenderingContext2D,
  control: ManualControl,
  x: number,
  y: number,
  width: number,
): number {
  const height = controlCardHeight(ctx, control, width);
  const modeSpecific = control.modeSpecific === true;
  const keyColumnW = Math.min(260, width * 0.34);
  ctx.fillStyle = modeSpecific ? 'rgba(255, 170, 0, 0.055)' : 'rgba(0, 120, 120, 0.035)';
  ctx.strokeStyle = modeSpecific ? 'rgba(255, 170, 0, 0.62)' : 'rgba(0, 255, 204, 0.24)';
  ctx.lineWidth = modeSpecific ? 1.75 : 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  drawKeyCaps(ctx, control.keys, x + 14, y + 31, modeSpecific);
  const textX = x + keyColumnW;
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = modeSpecific ? COL_WARNING : COL_TITLE;
  ctx.fillText(control.action, textX, y + 22);
  if (modeSpecific) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COL_WARNING;
    ctx.textAlign = 'right';
    ctx.fillText('MODE-SPECIFIC', x + width - 12, y + 20);
    ctx.textAlign = 'left';
  }
  ctx.font = '12px monospace';
  drawWrapped(ctx, control.description, textX, y + 43, width - keyColumnW - 20, 16, COL_HUD);
  return y + height + 10;
}

export function drawOperationsManualArticle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  article: OperationsManualArticle,
  tutorialSplash: boolean,
  requestedScrollOffset: number,
): void {
  const W = canvas.width;
  const H = canvas.height;
  const geometry = manualGeometry(canvas);
  const contentHeight = measureArticleContent(ctx, article, geometry.contentW);
  const maxScroll = Math.max(0, contentHeight - geometry.viewportH);
  const scrollOffset = Math.max(0, Math.min(maxScroll, requestedScrollOffset));

  ctx.fillStyle = '#030611';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = tutorialSplash ? COL_WARNING : COL_TITLE;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(tutorialSplash ? 'TUTORIAL' : 'TEAMSTER OPERATIONS HANDBOOK', W / 2, 28);
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.fillText(article.title.toUpperCase(), W / 2, 60);

  ctx.fillStyle = 'rgba(0, 120, 120, 0.045)';
  ctx.strokeStyle = tutorialSplash ? 'rgba(255, 170, 0, 0.55)' : 'rgba(0, 255, 204, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(geometry.panelX, geometry.panelY, geometry.panelW, geometry.panelH);
  ctx.strokeRect(geometry.panelX, geometry.panelY, geometry.panelW, geometry.panelH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(geometry.panelX + 1, geometry.viewportY, geometry.panelW - 2, geometry.viewportH);
  ctx.clip();
  ctx.textAlign = 'left';

  let y = geometry.viewportY + 10 - scrollOffset;
  ctx.font = '13px monospace';
  y = drawWrapped(ctx, article.introduction, geometry.contentX, y, geometry.contentW, 18);
  y += 22;

  y = drawHeading(ctx, 'Controls', geometry.contentX, y);
  for (const control of article.controls) y = drawControlCard(ctx, control, geometry.contentX, y, geometry.contentW);

  y += 18;
  y = drawHeading(ctx, 'Recommended Procedure', geometry.contentX, y);
  article.procedure.forEach((step, index) => {
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = COL_SUCCESS;
    ctx.fillText(`${index + 1}.`, geometry.contentX, y);
    ctx.font = '12px monospace';
    y = drawWrapped(ctx, step, geometry.contentX + 34, y, geometry.contentW - 34, 17);
    y += 10;
  });

  y += 14;
  y = drawHeading(ctx, 'Tips', geometry.contentX, y);
  ctx.font = '12px monospace';
  for (const tip of article.tips) {
    y = drawWrapped(ctx, tip, geometry.contentX, y, geometry.contentW, 17);
    y += 12;
  }

  y += 14;
  y = drawHeading(ctx, 'HUD', geometry.contentX, y);
  for (const item of article.hud) {
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = COL_SUCCESS;
    ctx.fillText(item.label, geometry.contentX, y);
    ctx.font = '12px monospace';
    y = drawWrapped(ctx, item.description, geometry.contentX + 100, y, geometry.contentW - 100, 16, COL_HUD);
    y += 10;
  }
  ctx.restore();

  if (maxScroll > 0) {
    const trackX = geometry.panelX + geometry.panelW - 10;
    const trackY = geometry.viewportY + 4;
    const trackH = geometry.viewportH - 8;
    const thumbH = Math.max(30, trackH * (geometry.viewportH / contentHeight));
    const thumbY = trackY + (trackH - thumbH) * (scrollOffset / maxScroll);
    ctx.fillStyle = 'rgba(0, 255, 204, 0.12)';
    ctx.fillRect(trackX, trackY, 3, trackH);
    ctx.fillStyle = tutorialSplash ? COL_WARNING : COL_SUCCESS;
    ctx.fillRect(trackX - 1, thumbY, 5, thumbH);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '13px monospace';
  const returnControl = tutorialSplash ? 'Enter/Space: Begin flight' : 'Enter/Space/Esc: Return to TOH';
  if (tutorialSplash) {
    ctx.fillText('This article is available anytime in the Teamster Operations Handbook (TOH).', W / 2, H - 36);
  }
  ctx.fillText(`W/S or ↑↓: Scroll   ${returnControl}`, W / 2, H - 18);
}
