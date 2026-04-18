// Keyboard + gamepad input handling.
// Returns a normalized InputState each frame.

export interface InputState {
  pitch: number;           // -1 (CCW/left) to 1 (CW/right)
  throttleUp: boolean;
  throttleDown: boolean;
  stopAssist: boolean;
  killRotation: boolean;
  toggleGear: boolean;     // edge-triggered (true only on press frame)
  reset: boolean;          // edge-triggered
  toggleDevPanel: boolean; // edge-triggered
  levelSelect: boolean;    // edge-triggered (L key)
  levelPick: number;       // 0 = none, 1-9 = level number (edge-triggered)
  // Menu navigation
  menuUp: boolean;         // edge-triggered
  menuDown: boolean;       // edge-triggered
  menuConfirm: boolean;    // edge-triggered (Enter/Space)
  // Approach controls
  toggleWings: boolean;    // G edge-triggered (deploy/retract wings)
  wingAngleUp: boolean;    // E held (increase wing angle)
  wingAngleDown: boolean;  // Q held (decrease wing angle)
  toggleHeatShield: boolean; // H edge-triggered
  // Orbital controls
  warpUp: boolean;           // ] edge-triggered
  warpDown: boolean;         // [ edge-triggered
  toggleHighThrust: boolean; // Space edge-triggered (orbital)
}

const keys: Set<string> = new Set();
const justPressed: Set<string> = new Set();

window.addEventListener('keydown', (e) => {
  if (!keys.has(e.code)) {
    justPressed.add(e.code);
  }
  keys.add(e.code);
  // Prevent browser scroll on space/arrows
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function readInput(): InputState {
  // --- Keyboard ---
  let pitch = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) pitch -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) pitch += 1;

  const throttleUp = keys.has('KeyW') || keys.has('ArrowUp');
  const throttleDown = keys.has('KeyS') || keys.has('ArrowDown');

  const stopAssist = keys.has('Space');
  const killRotation = keys.has('KeyQ');

  const toggleGear = justPressed.has('KeyG');
  const reset = justPressed.has('KeyR');
  const toggleDevPanel = justPressed.has('F2') || justPressed.has('Backquote');
  const levelSelect = justPressed.has('KeyL');
  let levelPick = 0;
  for (let n = 1; n <= 9; n++) {
    if (justPressed.has(`Digit${n}`)) levelPick = n;
  }

  // Menu navigation
  const menuUp = justPressed.has('ArrowUp') || justPressed.has('KeyW');
  const menuDown = justPressed.has('ArrowDown') || justPressed.has('KeyS');
  const menuConfirm = justPressed.has('Enter') || justPressed.has('Space');

  // Approach controls
  const toggleWings = justPressed.has('KeyG');
  const wingAngleUp = keys.has('KeyE');
  const wingAngleDown = keys.has('KeyQ');
  const toggleHeatShield = justPressed.has('KeyH');

  // Orbital controls
  const warpUp = justPressed.has('BracketRight');
  const warpDown = justPressed.has('BracketLeft');
  const toggleHighThrust = justPressed.has('ShiftLeft') || justPressed.has('ShiftRight');

  // --- Gamepad ---
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0] ?? null;
  if (gp) {
    const deadzone = 0.15;
    const lx = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
    pitch = clamp(pitch + lx, -1, 1);

    // Right trigger (axis 5 or button 7) = throttle up
    // Left trigger (axis 4 or button 6) = throttle down
    // Map triggers: some browsers use axes, some use buttons
    const rt = gp.buttons[7]?.value ?? 0;
    const lt = gp.buttons[6]?.value ?? 0;
    // We'll handle gamepad throttle as direct in ship update later
    // For now, treat trigger > 0.1 as boolean
    if (rt > 0.1) (pitch as any); // TODO: gamepad direct throttle

    if (gp.buttons[0]?.pressed) (stopAssist as any); // A
    if (gp.buttons[1]?.pressed) (killRotation as any); // B
  }

  // Clear edge-triggered keys
  justPressed.clear();

  return {
    pitch,
    throttleUp,
    throttleDown,
    stopAssist,
    killRotation,
    toggleGear,
    reset,
    toggleDevPanel,
    levelSelect,
    levelPick,
    menuUp,
    menuDown,
    menuConfirm,
    toggleWings,
    wingAngleUp,
    wingAngleDown,
    toggleHeatShield,
    warpUp,
    warpDown,
    toggleHighThrust,
  };
}
