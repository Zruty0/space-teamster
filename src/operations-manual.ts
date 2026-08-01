import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING, wrapHudText } from './hud-layout';

export type OperationsManualArticleId = 'local-transfer' | 'docking-undocking' | 'surface-flight' | 'orbit-deorbit' | 'orbital-rendezvous';
export type ManualDiagramId = 'orbital-rendezvous';

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
  diagram?: ManualDiagramId;
  controls: ManualControl[];
  tips: string[];
  procedure?: string[];
  procedureSections?: { title: string; steps: string[] }[];
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
  introduction: 'Orbital flight is controlled by changing velocity rather than steering directly toward a destination. Prograde thrust adds orbital energy; retrograde thrust removes it. For a surface arrival, lower the orbit into the approach corridor. For a departure, raise and circularize the orbit before continuing.',
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
  procedureSections: [
    {
      title: 'Deorbit',
      steps: [
        'Apply retrograde thrust until the predicted trajectory shows an impact.',
        'Use short prograde and retrograde corrections to fine-tune the predicted impact point.',
        'Release the controls and coast. Use time warp as needed while the projected route remains safe.',
      ],
    },
    {
      title: 'Establish Orbit',
      steps: [
        'Apply prograde thrust to raise the opposite side of the orbit.',
        'Use high thrust if necessary to add enough orbital energy.',
        'Near apoapsis, apply smooth prograde thrust until PeA and ApA are close together and the orbit is circular.',
      ],
    },
  ],
  tips: [
    'A burn changes the whole orbit. Prograde thrust raises the opposite side; retrograde thrust lowers it.',
    'Most orbital flight is coasting. Burn briefly—high thrust is often helpful—then stop and inspect the new trajectory before correcting again.',
    'For gradual circularization, approach the apoapsis marker, use a short prograde burn to push it ahead, coast toward it, and repeat while keeping some distance from the moving marker.',
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

export const ORBITAL_RENDEZVOUS_ARTICLE: OperationsManualArticle = {
  id: 'orbital-rendezvous',
  title: 'Orbital Rendezvous',
  introduction: 'Rendezvous means matching both position and velocity with a moving station. Steering directly toward the station usually produces a fast crossing or a long chase. First change your orbit to control when your paths meet; then match velocity and close slowly for capture.',
  diagram: 'orbital-rendezvous',
  controls: [
    {
      keys: ['W', 'S'],
      action: 'PROGRADE / RETROGRADE THRUST',
      description: 'Used while shaping the intercept orbit.',
      modeSpecific: true,
    },
    {
      keys: ['A', 'D'],
      action: 'SIDEWAYS THRUST',
      description: 'Used while shaping the intercept orbit.',
      modeSpecific: true,
    },
    {
      keys: ['W', 'A', 'S', 'D'],
      action: 'LATERAL THRUST — RENDEZVOUS ZOOM',
      description: 'Close to the station, thrust becomes screen-relative for final approach.',
      modeSpecific: true,
    },
    { keys: ['SHIFT'], action: 'HIGH THRUST', description: 'Hold with a thrust control for maximum output.' },
    { keys: ['[', ']'], action: 'TIME WARP', description: 'Decrease or increase time acceleration. Rendezvous zoom and thrust return warp to 1×.' },
    { keys: ['ESC'], action: 'FLIGHT MENU', description: 'Pause the flight and open mission controls.' },
    { keys: ['BACKSPACE'], action: 'RESTART STAGE', description: 'Restart the current flight stage.' },
  ],
  procedureSections: [
    {
      title: 'Phase and Intercept',
      steps: [
        'Compare the station’s position with your own. If it is ahead, use a slightly lower orbit to gain on it; if it is behind, use a slightly higher orbit and let it catch up.',
        'Coast and use time warp while the separation closes. Adjust the orbit rather than thrusting directly at the station.',
        'Return toward the station’s orbital altitude as the two paths converge.',
      ],
    },
    {
      title: 'Match and Capture',
      steps: [
        'Use short burns to match the station’s velocity and reduce REL before closing the remaining DIST.',
        'When rendezvous zoom begins, use screen-relative WASD thrust for the final approach.',
        'Enter the capture radius with REL below the displayed limit to begin docking.',
      ],
    },
  ],
  tips: [
    'The lower your orbit, the faster you travel around the body. Lower it to catch a target ahead; raise it to slow down and let a target behind catch you.',
    'Do not aim at where the station is now. Rendezvous is a timing problem: arrange for both paths to reach the same place together.',
    'Distance alone is not enough. A close pass at high relative speed is still a miss.',
    'Use high thrust for large orbital changes, then make the final velocity corrections smoothly.',
  ],
  hud: [
    { label: 'ALT', description: 'Current altitude above the surface' },
    { label: 'SPD', description: 'Current orbital speed' },
    { label: 'PeA', description: 'Periapsis altitude — the lowest point of the orbit' },
    { label: 'ApA', description: 'Apoapsis altitude — the highest point of the orbit' },
    { label: 'DIST', description: 'Distance to the station and required capture radius' },
    { label: 'REL', description: 'Velocity relative to the station and maximum capture speed' },
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
  ORBITAL_RENDEZVOUS_ARTICLE,
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

function articleProcedureSections(article: OperationsManualArticle): { title?: string; steps: string[] }[] {
  if (article.procedureSections?.length) return article.procedureSections;
  return [{ steps: article.procedure ?? [] }];
}

function measureArticleContent(ctx: CanvasRenderingContext2D, article: OperationsManualArticle, contentW: number): number {
  let height = 0;
  ctx.font = '13px monospace';
  height += wrappedHeight(ctx, article.introduction, contentW, 18) + 22;
  if (article.diagram) height += 440;
  height += 30;
  for (const control of article.controls) height += controlCardHeight(ctx, control, contentW) + 10;
  height += 18 + 30;
  ctx.font = '12px monospace';
  const procedureSections = articleProcedureSections(article);
  for (const section of procedureSections) {
    if (section.title) height += 24;
    for (const step of section.steps) height += wrappedHeight(ctx, step, contentW - 34, 17) + 10;
    height += 8;
  }
  height += 6 + 30;
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
): number {
  const gap = 14;
  const panelH = 202;
  const height = panelH * 2 + gap;
  const panelW = (width - gap) * 0.5;
  const innerR = 42;
  const outerR = 62;

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
    return { x: px, y: py, cx: px + panelW * 0.5, cy: py + 112 };
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

  const orbit = (cx: number, cy: number, radius: number, color: string, dashed = false): void => {
    ctx.strokeStyle = color;
    ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const station = (px: number, py: number): void => {
    ctx.fillStyle = COL_TITLE;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  };

  const rig = (px: number, py: number): void => {
    ctx.fillStyle = COL_WARNING;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  ctx.save();
  ctx.lineWidth = 1.25;

  const inside = panel(0, '1. RIG ON THE INSIDE', 'RIG IS CATCHING UP — BURN PROGRADE');
  orbit(inside.cx, inside.cy, outerR, 'rgba(0, 255, 204, 0.5)');
  orbit(inside.cx, inside.cy, innerR, 'rgba(255, 170, 0, 0.62)', true);
  planet(inside.cx, inside.cy);
  const insideStationAngle = -0.45;
  const insideRigAngle = -1.45;
  station(inside.cx + Math.cos(insideStationAngle) * outerR, inside.cy + Math.sin(insideStationAngle) * outerR);
  rig(inside.cx + Math.cos(insideRigAngle) * innerR, inside.cy + Math.sin(insideRigAngle) * innerR);
  ctx.font = '10px monospace';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText('LOWER ORBIT = FASTER', inside.cx, inside.y + 188);

  const prograde = panel(1, '2. AFTER PROGRADE BURN', 'RENDEZVOUS POINT AHEAD');
  orbit(prograde.cx, prograde.cy, outerR, 'rgba(0, 255, 204, 0.5)');
  ctx.strokeStyle = 'rgba(255, 170, 0, 0.72)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse(prograde.cx + 10, prograde.cy, 52, 47, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  planet(prograde.cx, prograde.cy);
  const proBurnX = prograde.cx - innerR;
  const proMeetX = prograde.cx + outerR;
  rig(proBurnX, prograde.cy);
  station(proMeetX, prograde.cy);
  drawDiagramArrow(ctx, proBurnX, prograde.cy - 19, proBurnX, prograde.cy + 17, COL_WARNING);
  ctx.font = '9px monospace';
  ctx.fillStyle = COL_WARNING;
  ctx.fillText('PROGRADE', proBurnX - 26, prograde.cy + 33);
  ctx.fillStyle = COL_TITLE;
  ctx.fillText('MEET', proMeetX - 2, prograde.cy + 24);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '10px monospace';
  ctx.fillText('TRANSFER ORBIT REACHES TARGET ORBIT', prograde.cx, prograde.y + 188);

  const outside = panel(2, '3. RIG ON THE OUTSIDE', 'TARGET IS CATCHING UP — BURN RETROGRADE');
  orbit(outside.cx, outside.cy, innerR, 'rgba(0, 255, 204, 0.5)');
  orbit(outside.cx, outside.cy, outerR, 'rgba(255, 170, 0, 0.62)', true);
  planet(outside.cx, outside.cy);
  const outsideRigAngle = -0.45;
  const outsideStationAngle = -1.45;
  rig(outside.cx + Math.cos(outsideRigAngle) * outerR, outside.cy + Math.sin(outsideRigAngle) * outerR);
  station(outside.cx + Math.cos(outsideStationAngle) * innerR, outside.cy + Math.sin(outsideStationAngle) * innerR);
  ctx.font = '10px monospace';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText('HIGHER ORBIT = SLOWER', outside.cx, outside.y + 188);

  const retrograde = panel(3, '4. AFTER RETROGRADE BURN', 'RENDEZVOUS POINT AHEAD');
  orbit(retrograde.cx, retrograde.cy, innerR, 'rgba(0, 255, 204, 0.5)');
  ctx.strokeStyle = 'rgba(255, 170, 0, 0.72)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse(retrograde.cx - 10, retrograde.cy, 52, 47, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  planet(retrograde.cx, retrograde.cy);
  const retroBurnX = retrograde.cx - outerR;
  const retroMeetX = retrograde.cx + innerR;
  rig(retroBurnX, retrograde.cy);
  station(retroMeetX, retrograde.cy);
  drawDiagramArrow(ctx, retroBurnX, retrograde.cy + 19, retroBurnX, retrograde.cy - 17, COL_WARNING);
  ctx.font = '9px monospace';
  ctx.fillStyle = COL_WARNING;
  ctx.fillText('RETROGRADE', retroBurnX - 30, retrograde.cy + 33);
  ctx.fillStyle = COL_TITLE;
  ctx.fillText('MEET', retroMeetX, retrograde.cy + 24);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '10px monospace';
  ctx.fillText('TRANSFER ORBIT REACHES TARGET ORBIT', retrograde.cx, retrograde.y + 188);

  ctx.restore();
  return y + height + 22;
}

function drawArticleDiagram(
  ctx: CanvasRenderingContext2D,
  diagram: ManualDiagramId,
  x: number,
  y: number,
  width: number,
): number {
  if (diagram === 'orbital-rendezvous') return drawOrbitalRendezvousDiagram(ctx, x, y, width);
  return y;
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
  if (article.diagram) y = drawArticleDiagram(ctx, article.diagram, geometry.contentX, y, geometry.contentW);

  y = drawHeading(ctx, 'Controls', geometry.contentX, y);
  for (const control of article.controls) y = drawControlCard(ctx, control, geometry.contentX, y, geometry.contentW);

  y += 18;
  const procedureSections = articleProcedureSections(article);
  y = drawHeading(ctx, procedureSections.length > 1 ? 'Recommended Procedures' : 'Recommended Procedure', geometry.contentX, y);
  for (const section of procedureSections) {
    if (section.title) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = COL_WARNING;
      ctx.fillText(section.title.toUpperCase(), geometry.contentX, y);
      y += 24;
    }
    section.steps.forEach((step, index) => {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = COL_SUCCESS;
      ctx.fillText(`${index + 1}.`, geometry.contentX, y);
      ctx.font = '12px monospace';
      y = drawWrapped(ctx, step, geometry.contentX + 34, y, geometry.contentW - 34, 17);
      y += 10;
    });
    y += 8;
  }

  y += 6;
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
