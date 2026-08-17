import type { OperationsManualArticle, OperationsManualEntry } from './types';

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
  tips: {
    items: [
      'You can use high thrust to accelerate faster, but remember: all the speed you build up will later have to be cancelled.',
    ],
  },
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

export const AIRLESS_APPROACH_ARTICLE: OperationsManualArticle = {
  id: 'airless-approach',
  title: 'Airless Approach',
  introduction: 'Airless Approach mode carries the rig from orbit to a surface target area. There is no drag to slow you down: every unit of arrival speed must be removed with thrust before the landing handoff.',
  controls: [
    { keys: ['W', 'S'], action: 'MAIN / RETRO THRUST', description: 'Thrust along or against the tug’s nose.', modeSpecific: true },
    { keys: ['A', 'D'], action: 'ROTATE', description: 'Point the rig for the next burn.', modeSpecific: true },
    { keys: ['SHIFT'], action: 'HIGH THRUST', description: 'Hold with a thrust control for maximum output.' },
    { keys: ['[', ']'], action: 'TIME WARP', description: 'Decrease or increase time acceleration. Thrust or rotation returns warp to 1×.' },
    { keys: ['ESC'], action: 'FLIGHT MENU', description: 'Pause the flight and open mission controls.' },
    { keys: ['BACKSPACE'], action: 'RESTART STAGE', description: 'Restart the current flight stage.' },
  ],
  procedure: [
    'Point toward the target area and use short burns to place the predicted trajectory through it.',
    'Favor a steep descent instead of a long, shallow approach close to the terrain.',
    'Brake early enough to enter the target area inside the displayed speed band.',
  ],
  tips: {
    items: [
      'During deorbit, favor a steeper approach. It costs about the same energy as a shallow descent, but gets you to the surface faster.',
    ],
  },
  hud: [
    { label: 'ALT', description: 'Altitude above the surface' },
    { label: 'H/S', description: 'Horizontal speed' },
    { label: 'V/S', description: 'Vertical speed' },
    { label: 'SPD', description: 'Total speed and target-area speed status' },
    { label: 'DIST', description: 'Distance to the target area' },
    { label: 'WARP', description: 'Current time acceleration' },
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
      description: 'W immediately selects full vertical thrust; S selects idle. The setting persists.',
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
    'Use brief W/S selections to adjust your descent rate. Press Space to return to an unaccelerated descent. Use A/D to position the rig over the pad and cancel horizontal drift.',
    'Touch down inside the pad with low vertical speed and low horizontal speed.',
    'Takeoff: with the gear deployed, press Space and then select full throttle with W to begin climbing.',
    'Once safely clear of the surface, retract the gear and use direct thrust to climb above the displayed altitude while building horizontal speed in the indicated direction.',
  ],
  tips: {
    items: [
      'Press Space often to return the throttle to local gravity compensation before making the next adjustment.',
      'Fly smoothly. Make small corrections early so they do not become large corrections close to the ground.',
      'Let the rig manage its own rotation. It will turn itself as needed unless you override it with Q/E.',
      'Practice gentle touchdowns. Fragile cargo can impose handling penalties after a hard landing.',
    ],
  },
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
  tips: {
    items: [
      'A burn changes the whole orbit. Prograde thrust raises the opposite side; retrograde thrust lowers it.',
      'Most orbital flight is coasting. Burn briefly—high thrust is often helpful—then stop and inspect the new trajectory before correcting again.',
      'For gradual circularization, approach the apoapsis marker, use a short prograde burn to push it ahead, coast toward it, and repeat while keeping some distance from the moving marker.',
    ],
  },
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
        'Use short burns to adjust the predicted pass until the closest-pass marker and connecting line turn cyan.',
        'Once the marker is cyan, stop correcting and coast—using time warp as needed—until you reach the close pass.',
      ],
      diagram: 'orbital-rendezvous-phasing',
    },
    {
      title: 'Match and Capture',
      steps: [
        'At the close pass, use short burns to match the station’s velocity and reduce REL before closing the remaining DIST.',
        'When rendezvous zoom begins, use screen-relative WASD thrust for the final approach.',
        'Enter the capture radius with REL below the displayed limit to begin docking.',
      ],
    },
  ],
  tips: {
    items: [
      'The lower your orbit, the faster you travel around the body. Lower it to catch a target ahead; raise it to slow down and let a target behind catch you.',
      'Do not aim at where the station is now. Rendezvous is a timing problem: arrange for both paths to reach the same place together.',
      'Distance alone is not enough. A close pass at high relative speed is still a miss.',
      'The more similar your orbit is to the target’s orbit, the slower the flyby speed will be.',
      'There is no penalty for pressing Backspace to retry the phasing stage if you need another attempt.',
      'Use high thrust for large orbital changes, then make the final velocity corrections smoothly.',
    ],
    diagram: 'orbital-rendezvous-closest-pass',
  },
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
    'Release the controls. The tractor beam gently centers and finishes aligning the rig as it pulls the container into the berth.',
  ],
  tips: {
    items: [
      'Use high thrust sparingly near a station. A small correction can become a collision before SAS has time to cancel it.',
    ],
  },
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


export const OPERATIONS_MANUAL_ENTRIES = [
  { article: DOCKING_UNDOCKING_ARTICLE, menuSummary: 'Close maneuvering around stations and berthing facilities.' },
  { article: LOCAL_TRANSFER_ARTICLE, menuSummary: 'Flying between facilities inside a shared traffic volume.' },
  { article: AIRLESS_APPROACH_ARTICLE, menuSummary: 'Powered descent from orbit to a target area without atmospheric braking.' },
  { article: SURFACE_FLIGHT_ARTICLE, menuSummary: 'Landing-pad descent, touchdown, and departure from the surface.' },
  { article: ORBIT_DEORBIT_ARTICLE, menuSummary: 'Changing an orbit and entering a surface approach corridor.' },
  { article: ORBITAL_RENDEZVOUS_ARTICLE, menuSummary: 'Phasing with a station, matching velocity, and entering capture.' },
] as const satisfies readonly OperationsManualEntry[];

export const OPERATIONS_MANUAL_ARTICLES: readonly OperationsManualArticle[] = OPERATIONS_MANUAL_ENTRIES.map(entry => entry.article);

export function isOperationsManualArticleId(value: string): value is OperationsManualArticle['id'] {
  return OPERATIONS_MANUAL_ARTICLES.some(article => article.id === value);
}

export function operationsManualArticleById(id: OperationsManualArticle['id']): OperationsManualArticle {
  return OPERATIONS_MANUAL_ARTICLES.find(article => article.id === id) ?? LOCAL_TRANSFER_ARTICLE;
}
