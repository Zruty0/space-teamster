import { componentFaultById, MAINTENANCE_COMPONENTS, MAINTENANCE_SYSTEMS } from './maintenance/catalog';
import { COMPONENT_GRADES, componentMaxHp, componentReplacementCost } from './maintenance/grades';
import type { MechanicOperation } from './maintenance/maintenance-service';
import { systemStatus } from './maintenance/rig-state';
import type { ComponentGrade, MaintenanceDebugSnapshot, MaintenanceLedger, MaintenanceSystemId } from './maintenance/types';

let panel: HTMLElement | null = null;
let visible = false;
let selectedTab: 'mechanic' | 'ledger' = 'mechanic';
let snapshotProvider: (() => MaintenanceDebugSnapshot) | undefined;
let mechanicActionHandler: ((systemId: MaintenanceSystemId, operation: MechanicOperation, grade: ComponentGrade) => void) | undefined;
let mechanicRemoveHandler: ((systemId: MaintenanceSystemId) => void) | undefined;
let pendingMechanicAction: { systemId: MaintenanceSystemId; operation: MechanicOperation } | undefined;
let lastRefresh = 0;
let dirty = true;
let selectedLedgerId = 'current';

export function createDevPanel(
  provider?: () => MaintenanceDebugSnapshot,
  onMechanicAction?: (systemId: MaintenanceSystemId, operation: MechanicOperation, grade: ComponentGrade) => void,
  onMechanicRemove?: (systemId: MaintenanceSystemId) => void,
): void {
  panel = document.getElementById('dev-panel');
  snapshotProvider = provider;
  mechanicActionHandler = onMechanicAction;
  mechanicRemoveHandler = onMechanicRemove;
  if (panel) {
    panel.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const removeButton = target.closest<HTMLButtonElement>('[data-mechanic-remove]');
      if (removeButton) {
        const systemId = removeButton.dataset.systemId as MaintenanceSystemId | undefined;
        if (systemId) mechanicRemoveHandler?.(systemId);
        pendingMechanicAction = undefined;
        dirty = true;
        rebuildPanel();
        return;
      }
      const actionButton = target.closest<HTMLButtonElement>('[data-mechanic-action]');
      if (actionButton && !actionButton.disabled) {
        const systemId = actionButton.dataset.systemId as MaintenanceSystemId | undefined;
        const operation = actionButton.dataset.mechanicAction as MechanicOperation | undefined;
        if (systemId && operation) {
          pendingMechanicAction = { systemId, operation };
          dirty = true;
          rebuildPanel();
        }
        return;
      }
      const gradeButton = target.closest<HTMLButtonElement>('[data-mechanic-grade]');
      if (gradeButton && pendingMechanicAction) {
        const grade = gradeButton.dataset.mechanicGrade;
        const pending = pendingMechanicAction;
        pendingMechanicAction = undefined;
        if (grade !== 'cancel' && COMPONENT_GRADES.includes(grade as ComponentGrade)) {
          mechanicActionHandler?.(pending.systemId, pending.operation, grade as ComponentGrade);
        }
        dirty = true;
        rebuildPanel();
        return;
      }
      const tab = target.closest<HTMLElement>('[data-dev-tab]')?.dataset.devTab;
      if (tab === 'mechanic' || tab === 'ledger') {
        selectedTab = tab;
        pendingMechanicAction = undefined;
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

function renderMechanicControls(systemId: MaintenanceSystemId): string {
  if (pendingMechanicAction?.systemId === systemId) {
    const operationLabel = pendingMechanicAction.operation === 'repair' ? 'Repair' : pendingMechanicAction.operation === 'service' ? 'Service' : 'Exchange';
    return `<span class="dev-mechanic-controls" title="${operationLabel}: choose grade; X cancels">${COMPONENT_GRADES.map(grade => `<button data-mechanic-grade="${grade}">${grade}</button>`).join('')}<button data-mechanic-grade="cancel">X</button></span>`;
  }
  return `<span class="dev-mechanic-controls">
    <button data-mechanic-action="repair" data-system-id="${systemId}" title="Repair and service system; selected grade is shop grade">R</button>
    <button data-mechanic-action="service" data-system-id="${systemId}" title="Service system; selected grade is shop grade">S</button>
    <button data-mechanic-action="exchange" data-system-id="${systemId}" title="Exchange system components without service; selected grade is component grade">X</button>
    ${systemId === 'atmospheric-package' ? `<button data-mechanic-remove data-system-id="${systemId}" title="Remove the complete Atmospheric Package">REMOVE</button>` : ''}
  </span>`;
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
        return `<tr class="dev-absent"><td>${escapeHtml(component.name)}</td><td colspan="7">NOT INSTALLED</td></tr>`;
      }
      const maxHp = componentMaxHp(component, state.grade);
      const fault = state.fault;
      const faultDefinition = componentFaultById(component, fault?.faultId);
      const activeMultipliers = fault && fault.severity !== 'total'
        ? component.faultMultipliers.flatMap(effect => {
          const value = fault.severity === 'minor' ? effect.minor : effect.major;
          return value === 1 ? [] : [`${effect.sourceIds === 'all' ? 'all' : effect.sourceIds.join('+')}→${effect.targetSystemId} ${value}×`];
        })
        : [];
      const activeEffects = [...(restrictionByComponent.get(componentId) ?? []), ...activeMultipliers];
      return `<tr>
        <td>${escapeHtml(component.name)}</td>
        <td>${state.grade}</td>
        <td>${state.hp}/${maxHp}</td>
        <td>${state.ap}/${component.baseAp}</td>
        <td>${fault ? `${fault.severity.toUpperCase()}<small>${escapeHtml(faultDefinition?.name ?? fault.faultId ?? 'replacement required')}${fault.locationId ? ` @ ${escapeHtml(fault.locationId)}` : ''}</small>` : 'none'}</td>
        <td>${state.lastServiceMission ?? '—'}<small>${state.lastServiceWorldTime === undefined ? 'time —' : `${num(state.lastServiceWorldTime / 86400, 2)}d`}</small></td>
        <td>${componentReplacementCost(component, state.grade).toLocaleString()} cr</td>
        <td><small>${activeEffects.map(escapeHtml).join('<br>')}</small></td>
      </tr>`;
    }).join('');
    return `<section class="dev-system">
      <h3>${escapeHtml(system.name)} <span class="dev-status dev-${systemStatus(snapshot.rig, system.id)}">${systemStatus(snapshot.rig, system.id).toUpperCase()}</span> ${renderMechanicControls(system.id)}</h3>
      <table><thead><tr><th>Component</th><th>Gr</th><th>HP</th><th>AP / Base AP</th><th>Fault / location</th><th>Service</th><th>Replacement</th><th>Active restrictions / multipliers</th></tr></thead><tbody>${rows}</tbody></table>
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
  const rawRows = Object.entries(ledger.raw).map(([channel, value]) => `<tr><td>${escapeHtml(channel)}</td><td>${typeof value === 'number' ? num(value, 6) : escapeHtml(value)}</td></tr>`).join('');
  const normalizedRows = Object.entries(ledger.normalized.sourceUnits).map(([source, units]) => `<tr><td>${escapeHtml(source)}</td><td>${num(units, 6)}</td></tr>`).join('');
  const contributionRows = ledger.contributions
    .filter(row => row.coefficient !== 0)
    .map(row => `<tr><td>${escapeHtml(row.sourceId)}</td><td>${escapeHtml(row.systemId)}</td><td>${num(row.units, 6)}</td><td>${num(row.coefficient, 3)}</td><td>${num(row.baseWeight, 6)}</td><td>${num(row.multiplier, 4)}×</td><td>${num(row.adjustedWeight, 6)}</td></tr>`)
    .join('');
  const systemRows = MAINTENANCE_SYSTEMS.map(system => `<tr><td>${escapeHtml(system.name)}</td><td>${num(ledger.baseSystemWeights[system.id], 6)}</td><td>${num(ledger.adjustedSystemWeights[system.id], 6)}</td></tr>`).join('');
  const strikeRows = ledger.strikes.length ? ledger.strikes.map(strike => `<tr>
    <td>${strike.index}</td><td>${num(strike.systemRoll, 8)}<small>${escapeHtml(strike.systemId)}</small></td>
    <td>${num(strike.componentRoll, 8)}<small>${escapeHtml(strike.componentId)}</small></td>
    <td>${num(strike.apHitProbability, 6)}<small>roll ${num(strike.apHpRoll, 8)}</small></td>
    <td>HP ${strike.hpBefore}→${strike.hpAfter}<br>AP ${strike.apBefore}→${strike.apAfter}</td>
    <td>${escapeHtml(strike.crossedThreshold ?? '—')}<small>${strike.faultRoll === undefined ? '' : `fault roll ${num(strike.faultRoll, 8)} · `}${escapeHtml(strike.faultName ?? strike.faultId ?? '')}${strike.locationRoll === undefined ? '' : `<br>location roll ${num(strike.locationRoll, 8)} · `}${strike.locationId ? escapeHtml(strike.locationId) : ''}</small></td>
  </tr>`).join('') : '<tr><td colspan="6">No strikes.</td></tr>';
  return `<div class="dev-summary">
    <strong>${escapeHtml(ledger.context.title)}</strong><br>
    mission ${escapeHtml(ledger.context.missionId)} &nbsp; ${escapeHtml(ledger.context.sourceId ?? '—')} → ${escapeHtml(ledger.context.destinationId ?? '—')}<br>
    attempt ${ledger.context.attempt} &nbsp; manifest ${escapeHtml(ledger.context.manifestKind)} ${num(ledger.context.manifestMassTons, 2)} t<br>
    start ${num(ledger.context.startWorldTime, 3)} &nbsp; completion ${ledger.completionWorldTime === undefined ? '—' : num(ledger.completionWorldTime, 3)} &nbsp; status <strong>${ledger.status.toUpperCase()}</strong><br>
    ${ledger.retryNote ? `<span class="dev-warning">${escapeHtml(ledger.retryNote)}</span><br>` : ''}
    mean ${num(ledger.mean, 9)} &nbsp; strikes ${ledger.strikeCount} &nbsp; RNG ${ledger.rngStateBefore >>> 0} → ${ledger.rngStateAfter >>> 0}
  </div>
  <h3>Raw telemetry</h3><div class="dev-table-scroll"><table class="dev-compact"><thead><tr><th>Channel</th><th>Raw value</th></tr></thead><tbody>${rawRows}</tbody></table></div>
  <h3>Normalized units</h3><div class="dev-table-scroll"><table class="dev-compact"><thead><tr><th>Source</th><th>Units</th></tr></thead><tbody>${normalizedRows}</tbody></table></div>
  <h3>Source contributions and active-fault multipliers</h3><div class="dev-table-scroll"><table><thead><tr><th>Source</th><th>System</th><th>Units</th><th>Coefficient</th><th>Base</th><th>Multiplier</th><th>Adjusted</th></tr></thead><tbody>${contributionRows}</tbody></table></div>
  <h3>System weights</h3><div class="dev-table-scroll"><table class="dev-compact"><thead><tr><th>System</th><th>Base</th><th>Adjusted</th></tr></thead><tbody>${systemRows}<tr><td><strong>MISSION MEAN</strong></td><td></td><td><strong>${num(ledger.mean, 9)}</strong></td></tr></tbody></table></div>
  <h3>Poisson resolution</h3><p>${ledger.poissonRolls.length ? ledger.poissonRolls.map(value => num(value, 8)).join(' · ') : 'Not rolled for current telemetry.'}</p>
  <h3>Strike resolution</h3><div class="dev-table-scroll"><table><thead><tr><th>#</th><th>System roll</th><th>Component roll</th><th>AP probability / roll</th><th>Transition</th><th>Threshold / fault / location</th></tr></thead><tbody>${strikeRows}</tbody></table></div>`;
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
  const focused = document.activeElement;
  if (focused instanceof HTMLSelectElement && panel.contains(focused)) return;
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
