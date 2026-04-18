// Dev tuning panel: HTML overlay with sliders.
// Landing mode: config params. Approach mode: starting position.

import { config } from './config';
import { APPROACH_LEVELS } from './approach';

let panel: HTMLElement | null = null;
let visible = false;
let currentMode: 'landing' | 'approach' = 'landing';
let onApproachRestart: (() => void) | null = null;

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  get: () => number;
  set: (v: number) => void;
}

// --- Landing params (existing) ---

const landingSections: { title: string; params: ParamDef[] }[] = [
  {
    title: 'Physics',
    params: [
      { key: 'gravity', label: 'Gravity', min: 0, max: 20, step: 0.1, get: () => config.gravity, set: v => config.gravity = v },
    ],
  },
  {
    title: 'Main Engine',
    params: [
      { key: 'mainEngineAccel', label: 'Thrust (m/s²)', min: 5, max: 60, step: 0.5, get: () => config.mainEngineAccel, set: v => config.mainEngineAccel = v },
      { key: 'gimbalMaxAngle', label: 'Gimbal Max (rad)', min: 0.05, max: 0.5, step: 0.01, get: () => config.gimbalMaxAngle, set: v => config.gimbalMaxAngle = v },
      { key: 'gimbalSlewRate', label: 'Gimbal Rate (rad/s)', min: 0.1, max: 1.0, step: 0.01, get: () => config.gimbalSlewRate, set: v => config.gimbalSlewRate = v },
      { key: 'throttleRate', label: 'Throttle Rate (/s)', min: 0.5, max: 5, step: 0.1, get: () => config.throttleRate, set: v => config.throttleRate = v },
    ],
  },
  {
    title: 'RCS',
    params: [
      { key: 'rcsAngularAccel', label: 'Rot Accel (rad/s²)', min: 0.5, max: 10, step: 0.1, get: () => config.rcsAngularAccel, set: v => config.rcsAngularAccel = v },
      { key: 'rcsTranslationAccel', label: 'Trans Accel (m/s²)', min: 0.2, max: 5, step: 0.1, get: () => config.rcsTranslationAccel, set: v => config.rcsTranslationAccel = v },
    ],
  },
  {
    title: 'Landing',
    params: [
      { key: 'landingMaxVSpeed', label: 'Max V/S (m/s)', min: 0.5, max: 10, step: 0.1, get: () => config.landingMaxVSpeed, set: v => config.landingMaxVSpeed = v },
      { key: 'landingMaxHSpeed', label: 'Max H/S (m/s)', min: 0.5, max: 10, step: 0.1, get: () => config.landingMaxHSpeed, set: v => config.landingMaxHSpeed = v },
      { key: 'landingMaxAngle', label: 'Max Angle (rad)', min: 0.05, max: 0.5, step: 0.01, get: () => config.landingMaxAngle, set: v => config.landingMaxAngle = v },
    ],
  },
];

// --- Approach params (start position + target) ---

function getApproachLevel() { return APPROACH_LEVELS[0]; }

const approachSections: { title: string; params: ParamDef[] }[] = [
  {
    title: 'Start Position',
    params: [
      { key: 'startY', label: 'Altitude (m)', min: 5000, max: 60000, step: 500, get: () => getApproachLevel().startY, set: v => getApproachLevel().startY = v },
      { key: 'startVX', label: 'H Speed (m/s)', min: 0, max: 2000, step: 50, get: () => getApproachLevel().startVX, set: v => getApproachLevel().startVX = v },
      { key: 'startVY', label: 'V Speed (m/s)', min: -500, max: 100, step: 10, get: () => getApproachLevel().startVY, set: v => getApproachLevel().startVY = v },
      { key: 'startX', label: 'Start X (m)', min: -80000, max: 40000, step: 1000, get: () => getApproachLevel().startX, set: v => getApproachLevel().startX = v },
    ],
  },
  {
    title: 'Target',
    params: [
      { key: 'gateX', label: 'Target X (m)', min: 0, max: 100000, step: 1000, get: () => getApproachLevel().gateX, set: v => getApproachLevel().gateX = v },
      { key: 'gateY', label: 'Target Height (m)', min: 500, max: 5000, step: 100, get: () => getApproachLevel().gateY, set: v => getApproachLevel().gateY = v },
      { key: 'gateRadius', label: 'Target Width (m)', min: 200, max: 5000, step: 100, get: () => getApproachLevel().gateRadius, set: v => getApproachLevel().gateRadius = v },
      { key: 'gateMaxSpeed', label: 'Max Speed (m/s)', min: 30, max: 300, step: 5, get: () => getApproachLevel().gateMaxSpeed, set: v => getApproachLevel().gateMaxSpeed = v },
    ],
  },
  {
    title: 'Atmosphere & Heat',
    params: [
      { key: 'heatCoeff', label: 'Heat Coeff (×1e5)', min: 0.1, max: 10, step: 0.1,
        get: () => getApproachLevel().heatCoeff * 1e5,
        set: v => getApproachLevel().heatCoeff = v * 1e-5 },
      { key: 'dissipation', label: 'Dissipation', min: 0.01, max: 0.2, step: 0.01, get: () => getApproachLevel().dissipation, set: v => getApproachLevel().dissipation = v },
      { key: 'gravity', label: 'Gravity', min: 1, max: 15, step: 0.1, get: () => getApproachLevel().gravity, set: v => getApproachLevel().gravity = v },
      { key: 'fuelSeconds', label: 'Fuel (seconds)', min: 5, max: 200, step: 5, get: () => getApproachLevel().fuelSeconds, set: v => getApproachLevel().fuelSeconds = v },
    ],
  },
];

function getDecimals(step: number): number {
  const s = step.toString();
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : s.length - dot - 1;
}

function buildPanel(sections: { title: string; params: ParamDef[] }[], mode: string): string {
  let html = `<h3 style="margin-top:0">⚙ DEV — ${mode.toUpperCase()}</h3>`;
  for (const section of sections) {
    html += `<h3>${section.title}</h3>`;
    for (const p of section.params) {
      const val = p.get();
      html += `
        <label>
          <span>${p.label}</span>
          <input type="range" id="dev-${p.key}"
            min="${p.min}" max="${p.max}" step="${p.step}"
            value="${val}">
          <span class="val" id="dev-${p.key}-val">${val.toFixed(getDecimals(p.step))}</span>
        </label>
      `;
    }
  }
  if (mode === 'approach') {
    html += '<button id="dev-apply-restart">Apply & Restart</button>';
  }
  return html;
}

function bindSliders(sections: { title: string; params: ParamDef[] }[]): void {
  for (const section of sections) {
    for (const p of section.params) {
      const slider = document.getElementById(`dev-${p.key}`) as HTMLInputElement;
      const valSpan = document.getElementById(`dev-${p.key}-val`)!;
      if (slider) {
        slider.addEventListener('input', () => {
          const v = parseFloat(slider.value);
          p.set(v);
          valSpan.textContent = v.toFixed(getDecimals(p.step));
        });
      }
    }
  }
}

export function createDevPanel(): void {
  panel = document.getElementById('dev-panel');
}

export function setDevPanelMode(mode: 'landing' | 'approach', restartFn?: () => void): void {
  currentMode = mode;
  onApproachRestart = restartFn ?? null;
  if (panel && visible) rebuildPanel();
}

function rebuildPanel(): void {
  if (!panel) return;
  const sections = currentMode === 'approach' ? approachSections : landingSections;
  panel.innerHTML = buildPanel(sections, currentMode);
  bindSliders(sections);

  if (currentMode === 'approach') {
    const btn = document.getElementById('dev-apply-restart');
    if (btn) btn.addEventListener('click', () => { if (onApproachRestart) onApproachRestart(); });
  }
}

export function isDevPanelVisible(): boolean {
  return visible;
}

export function toggleDevPanel(): void {
  visible = !visible;
  if (panel) {
    panel.style.display = visible ? 'block' : 'none';
    if (visible) rebuildPanel();
  }
}
