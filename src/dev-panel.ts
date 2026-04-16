// Dev tuning panel: HTML overlay with sliders for all config values.
// Toggle with F1 or backtick key.

import { config } from './config';

let panel: HTMLElement | null = null;
let visible = false;

interface ParamDef {
  key: keyof typeof config;
  label: string;
  min: number;
  max: number;
  step: number;
}

const sections: { title: string; params: ParamDef[] }[] = [
  {
    title: 'Physics',
    params: [
      { key: 'gravity', label: 'Gravity', min: 0, max: 20, step: 0.1 },
    ],
  },
  {
    title: 'Main Engine',
    params: [
      { key: 'mainEngineAccel', label: 'Thrust (m/s²)', min: 5, max: 60, step: 0.5 },
      { key: 'gimbalMaxAngle', label: 'Gimbal Max (rad)', min: 0.05, max: 0.5, step: 0.01 },
      { key: 'gimbalSlewRate', label: 'Gimbal Rate (rad/s)', min: 0.1, max: 1.0, step: 0.01 },
      { key: 'gimbalTorqueEfficiency', label: 'Gimbal Torque Eff', min: 0.1, max: 1.5, step: 0.05 },
      { key: 'throttleRate', label: 'Throttle Rate (/s)', min: 0.5, max: 5, step: 0.1 },
    ],
  },
  {
    title: 'RCS',
    params: [
      { key: 'rcsAngularAccel', label: 'Rot Accel (rad/s²)', min: 0.5, max: 10, step: 0.1 },
      { key: 'rcsTranslationAccel', label: 'Trans Accel (m/s²)', min: 0.2, max: 5, step: 0.1 },
    ],
  },
  {
    title: 'Drag',
    params: [
      { key: 'dragCoeff', label: 'Drag Coeff', min: 0, max: 0.01, step: 0.0001 },
      { key: 'angularDrag', label: 'Angular Drag', min: 0, max: 10, step: 0.1 },
    ],
  },
  {
    title: 'Wind',
    params: [
      { key: 'windStrength', label: 'Strength (m/s²)', min: 0, max: 10, step: 0.1 },
      { key: 'windFrequency', label: 'Frequency', min: 0.01, max: 0.5, step: 0.01 },
    ],
  },
  {
    title: 'Landing',
    params: [
      { key: 'landingMaxVSpeed', label: 'Max V/S (m/s)', min: 0.5, max: 10, step: 0.1 },
      { key: 'landingMaxHSpeed', label: 'Max H/S (m/s)', min: 0.5, max: 10, step: 0.1 },
      { key: 'landingMaxAngle', label: 'Max Angle (rad)', min: 0.05, max: 0.5, step: 0.01 },
    ],
  },
  {
    title: 'Camera',
    params: [
      { key: 'cameraSmoothing', label: 'Smoothing', min: 0.5, max: 10, step: 0.1 },
      { key: 'cameraLeadFactor', label: 'Lead Factor', min: 0, max: 1, step: 0.05 },
      { key: 'minZoom', label: 'Min Zoom (px/m)', min: 0.5, max: 5, step: 0.1 },
      { key: 'maxZoom', label: 'Max Zoom (px/m)', min: 1, max: 10, step: 0.1 },
    ],
  },
  {
    title: 'Start Conditions',
    params: [
      { key: 'startX', label: 'Start X', min: 0, max: 2000, step: 10 },
      { key: 'startY', label: 'Start Y', min: 50, max: 600, step: 10 },
      { key: 'startVX', label: 'Start VX', min: -50, max: 50, step: 1 },
      { key: 'startVY', label: 'Start VY', min: -50, max: 50, step: 1 },
    ],
  },
];

export function createDevPanel(): void {
  panel = document.getElementById('dev-panel');
  if (!panel) return;

  let html = '<h3 style="margin-top:0">⚙ DEV PANEL</h3>';

  for (const section of sections) {
    html += `<h3>${section.title}</h3>`;

    for (const p of section.params) {
      const val = config[p.key];
      html += `
        <label>
          <span>${p.label}</span>
          <input type="range" id="dev-${p.key}"
            min="${p.min}" max="${p.max}" step="${p.step}"
            value="${val}">
          <span class="val" id="dev-${p.key}-val">${Number(val).toFixed(getDecimals(p.step))}</span>
        </label>
      `;
    }
  }

  // Wind toggle
  html += `
    <h3>Wind</h3>
    <label>
      <span>Wind Enabled</span>
      <input type="checkbox" id="dev-windEnabled" ${config.windEnabled ? 'checked' : ''}>
    </label>
  `;

  html += '<button id="dev-reset-defaults">Reset Defaults</button>';

  panel.innerHTML = html;

  // Bind events
  for (const section of sections) {
    for (const p of section.params) {
      const slider = document.getElementById(`dev-${p.key}`) as HTMLInputElement;
      const valSpan = document.getElementById(`dev-${p.key}-val`)!;
      if (slider) {
        slider.addEventListener('input', () => {
          const v = parseFloat(slider.value);
          (config as any)[p.key] = v;
          valSpan.textContent = v.toFixed(getDecimals(p.step));
        });
      }
    }
  }

  // Wind toggle
  const windCheck = document.getElementById('dev-windEnabled') as HTMLInputElement;
  if (windCheck) {
    windCheck.addEventListener('change', () => {
      config.windEnabled = windCheck.checked;
    });
  }

  // Reset defaults button
  const resetBtn = document.getElementById('dev-reset-defaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reload page to reset
      window.location.reload();
    });
  }
}

function getDecimals(step: number): number {
  const s = step.toString();
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : s.length - dot - 1;
}

export function isDevPanelVisible(): boolean {
  return visible;
}

export function toggleDevPanel(): void {
  visible = !visible;
  if (panel) {
    panel.style.display = visible ? 'block' : 'none';
  }
}
