import { componentFaultById, MAINTENANCE_COMPONENTS, MAINTENANCE_SYSTEMS } from './maintenance/catalog';
import { componentMaxHp, componentReplacementCost, componentServicedAp, SHOP_GRADES } from './maintenance/grades';
import { systemStatus } from './maintenance/rig-state';
import type { MaintenanceDebugSnapshot, MaintenanceLedger } from './maintenance/types';

let panel: HTMLElement | null = null;
let visible = false;
let selectedTab: 'mechanic' | 'ledger' = 'mechanic';
let snapshotProvider: (() => MaintenanceDebugSnapshot) | undefined;
let lastRefresh = 0;
let dirty = true;
let selectedLedgerId = 'current';

export function createDevPanel(provider?: () => MaintenanceDebugSnapshot): void {
  panel = document.getElementById('dev-panel');
  snapshotProvider = provider;
  if (panel) {
    panel.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const tab = target.closest<HTMLElement>('[data-dev-tab]')?.dataset.devTab;
      if (tab === 'mechanic' || tab === 'ledger') {
        selectedTab = tab;
        dirty = true;
        rebuildPanel();
      }
    });
    panel.addEventListener('change', event => {
      const target = event.target as HTMLSelectElement;
      if (target.dataset.ledgerSelect !== undefined) {
        selectedLedgerId = target.value;
        dirty = true;
        rebuildPanel();
      }
    });
  }
}

export function setDevPanelSnapshotProvider(provider: () => MaintenanceDebugSnapshot): void {
  snapshotProvider = provider;
  dirty = true;
}

export function setDevPanelMode(_mode: 'landing' | 'approach', _restartFn?: () => void): void {
  dirty = true;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function num(value: number, digits = 3): string {
  return Number.isFinite(value) ? value.toFixed(digits).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1') : '—';
}

function renderMechanic(snapshot: MaintenanceDebugSnapshot): string {
  const restrictionByComponent = new Map<string, string[]>();
  for (const restriction of snapshot.restrictions) {
    const key = restriction.componentId ?? '__rig__';
    const list = restrictionByComponent.get(key) ?? [];
    list.push(restriction.reason);
    restrictionByComponent.set(key, list);
  }
  const sections = MAINTENANCE_SYSTEMS.map(system => {
    const rows = system.componentIds.map(componentId => {
      const component = MAINTENANCE_COMPONENTS.find(candidate => candidate.id === componentId)!;
      const state = snapshot.rig.components[componentId];
      if (!state?.installed) {
        return `<tr class="dev-absent"><td>${escapeHtml(component.name)}<small>${escapeHtml(component.id)}</small></td><td colspan="8">NOT INSTALLED</td></tr>`;
      }
      const maxHp = componentMaxHp(component, state.grade);
      const fault = state.fault;
      const faultDefinition = componentFaultById(component, fault?.faultId);
      const serviceValues = SHOP_GRADES.map(shop => `${shop}:${componentServicedAp(component, state.grade, shop)}`).join(' ');
      const multipliers = component.faultMultipliers.map(effect => `${effect.sourceIds === 'all' ? 'all' : effect.sourceIds.join('+')}→${effect.targetSystemId} ${effect.minor}×/${effect.major}×`).join('; ') || 'none';
      const restrictions = restrictionByComponent.get(componentId)?.join('; ') ?? 'none';
      return `<tr>
        <td>${escapeHtml(component.name)}<small>${escapeHtml(component.id)}</small></td>
        <td>${state.grade}</td>
        <td>${state.hp}/${maxHp}</td>
        <td>${state.ap}<small>${escapeHtml(serviceValues)}</small></td>
        <td>Mi ${component.minorThreshold}<br>Ma ${component.majorThreshold}<br>To 0</td>
        <td>${fault ? `${fault.severity.toUpperCase()}<small>${escapeHtml(faultDefinition?.name ?? fault.faultId ?? 'replacement required')}${fault.locationId ? ` @ ${escapeHtml(fault.locationId)}` : ''}</small>` : 'none'}</td>
        <td>${state.lastServiceMission ?? '—'}<small>${state.lastServiceWorldTime === undefined ? 'time —' : `${num(state.lastServiceWorldTime / 86400, 2)}d`}</small></td>
        <td>${componentReplacementCost(component, state.grade).toLocaleString()} cr</td>
        <td><small>${escapeHtml(restrictions)}<br>${escapeHtml(multipliers)}</small></td>
      </tr>`;
    }).join('');
    return `<section class="dev-system">
      <h3>${escapeHtml(system.name)} <span class="dev-status dev-${systemStatus(snapshot.rig, system.id)}">${systemStatus(snapshot.rig, system.id).toUpperCase()}</span></h3>
      <table><thead><tr><th>Component</th><th>Gr</th><th>HP</th><th>AP / shop AP</th><th>Thresholds</th><th>Fault / location</th><th>Service</th><th>Replacement</th><th>Restrictions / multipliers</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`;
  }).join('');
  const globalRestrictions = snapshot.restrictions.length
    ? snapshot.restrictions.map(item => `<li>${escapeHtml(item.reason)}</li>`).join('')
    : '<li>none</li>';
  const warnings = snapshot.validationWarnings.length
    ? `<div class="dev-warning"><strong>VALIDATION WARNINGS</strong><ul>${snapshot.validationWarnings.map(item => `<li>${escapeHtml(item.path)} — ${escapeHtml(item.message)}</li>`).join('')}</ul></div>`
    : '<p class="dev-ok">Catalog and rig state valid.</p>';
  return `<div class="dev-summary"><strong>Rig RNG</strong> ${snapshot.rig.rngState >>> 0} &nbsp; <strong>Committed missions</strong> ${snapshot.rig.completedMaintenanceMissions}<br><strong>Restrictions</strong><ul>${globalRestrictions}</ul></div>${warnings}${sections}`;
}

function ledgerLabel(ledger: MaintenanceLedger): string {
  return `${ledger.status.toUpperCase()} — ${ledger.context.title} — ${ledger.context.missionId}`;
}

function renderLedgerSummary(ledger: MaintenanceLedger): string {
  return `<div class="dev-summary">
    <strong>${escapeHtml(ledger.context.title)}</strong><br>
    ${escapeHtml(ledger.context.sourceId ?? '—')} → ${escapeHtml(ledger.context.destinationId ?? '—')} &nbsp; attempt ${ledger.context.attempt}<br>
    status ${ledger.status} &nbsp; mean ${num(ledger.mean, 6)} &nbsp; strikes ${ledger.strikeCount}<br>
    RNG ${ledger.rngStateBefore >>> 0} → ${ledger.rngStateAfter >>> 0}
  </div><p>Detailed telemetry instrumentation is not active yet.</p>`;
}

function renderLedger(snapshot: MaintenanceDebugSnapshot): string {
  const choices: { id: string; ledger: MaintenanceLedger }[] = [];
  if (snapshot.currentLedger) choices.push({ id: 'current', ledger: snapshot.currentLedger });
  if (snapshot.pendingLedger) choices.push({ id: 'pending', ledger: snapshot.pendingLedger });
  snapshot.committedLedgers.forEach((ledger, index) => choices.push({ id: `committed:${index}`, ledger }));
  if (!choices.length) return '<p>No active, pending, or committed maintenance ledger.</p>';
  if (!choices.some(choice => choice.id === selectedLedgerId)) selectedLedgerId = choices[0].id;
  const selected = choices.find(choice => choice.id === selectedLedgerId) ?? choices[0];
  return `<label class="dev-ledger-select">Ledger <select data-ledger-select>${choices.map(choice => `<option value="${escapeHtml(choice.id)}"${choice.id === selected.id ? ' selected' : ''}>${escapeHtml(ledgerLabel(choice.ledger))}</option>`).join('')}</select></label>${renderLedgerSummary(selected.ledger)}`;
}

function rebuildPanel(): void {
  if (!panel) return;
  const snapshot = snapshotProvider?.();
  panel.innerHTML = `
    <div class="dev-panel-header"><h2>RIG DEVELOPMENT</h2><span>TILDE / F2</span></div>
    <div class="dev-tabs">
      <button data-dev-tab="mechanic" class="${selectedTab === 'mechanic' ? 'active' : ''}">Mechanic</button>
      <button data-dev-tab="ledger" class="${selectedTab === 'ledger' ? 'active' : ''}">Telemetry Ledger</button>
    </div>
    <div class="dev-content">${snapshot ? (selectedTab === 'mechanic' ? renderMechanic(snapshot) : renderLedger(snapshot)) : '<p>No maintenance snapshot provider.</p>'}</div>
  `;
  dirty = false;
  lastRefresh = performance.now();
}

export function markDevPanelDirty(): void {
  dirty = true;
}

export function updateDevPanel(): void {
  if (!visible || !panel) return;
  if (dirty || performance.now() - lastRefresh >= 500) rebuildPanel();
}

export function isDevPanelVisible(): boolean {
  return visible;
}

export function toggleDevPanel(): void {
  visible = !visible;
  if (panel) {
    panel.style.display = visible ? 'block' : 'none';
    if (visible) {
      dirty = true;
      rebuildPanel();
    }
  }
}
