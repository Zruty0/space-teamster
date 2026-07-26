// Cheat panel placeholder. Toggled by ` / F2.
// Reserved for future campaign/testing cheats; no live cheats are installed yet.

let panel: HTMLElement | null = null;
let visible = false;

export function createDevPanel(): void {
  panel = document.getElementById('dev-panel');
}

export function setDevPanelMode(_mode: 'landing' | 'approach', _restartFn?: () => void): void {
  // The old tuning sliders were intentionally removed. Keep this hook so flight phases can
  // continue to report context when this becomes a real cheat panel later.
}

function rebuildPanel(): void {
  if (!panel) return;
  panel.innerHTML = `
    <h3 style="margin-top:0">CHEATS</h3>
    <p style="margin:6px 0;color:#9fc;font-size:12px;line-height:1.35">
      Reserved for future testing/campaign cheats.
    </p>
    <p style="margin:6px 0;color:#7a8;font-size:12px;line-height:1.35">
      No cheats are installed yet.
    </p>
  `;
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
