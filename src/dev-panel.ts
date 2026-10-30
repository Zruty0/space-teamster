import { componentFaultById, MAINTENANCE_COMPONENTS, MAINTENANCE_SYSTEMS } from './maintenance/catalog';
import { COMPONENT_GRADES, componentMaxHp, componentReplacementCost } from './maintenance/grades';
import type { MechanicDamagePool, MechanicOperation } from './maintenance/maintenance-service';
import { systemStatus } from './maintenance/rig-state';
import type { ComponentGrade, MaintenanceDebugSnapshot, MaintenanceLedger, MaintenanceSystemId } from './maintenance/types';

import { REPUTATION_TRACKS, isReputationId, reputationStanding, type ReputationEditResult, type ReputationState } from './reputation';

let panel: HTMLElement | null = null;
let visible = false;
let selectedTab: 'mechanic' | 'ledger' | 'reputation' = 'mechanic';
let reputationProvider: (() => ReputationState) | undefined;
let reputationHandler: ((id: string, value: number) => ReputationEditResult) | undefined;
let reputationMessage = '';
let snapshotProvider: (() => MaintenanceDebugSnapshot) | undefined;
let mechanicActionHandler: ((systemId: MaintenanceSystemId, operation: MechanicOperation, grade: ComponentGrade) => void) | undefined;
let mechanicRemoveHandler: ((systemId: MaintenanceSystemId) => void) | undefined;
let mechanicDamageHandler: ((componentId: string, pool: MechanicDamagePool) => void) | undefined;
let pendingMechanicAction: { systemId: MaintenanceSystemId; operation: MechanicOperation } | undefined;
let lastRefresh = 0;
let dirty = true;
let selectedLedgerId = 'current';

export function createDevPanel(
  provider?: () => MaintenanceDebugSnapshot,
  onMechanicAction?: (systemId: MaintenanceSystemId, operation: MechanicOperation, grade: ComponentGrade) => void,
  onMechanicRemove?: (systemId: MaintenanceSystemId) => void,
  onMechanicDamage?: (componentId: string, pool: MechanicDamagePool) => void,
  reputationSnapshot?: () => ReputationState,
  onReputationChange?: (id: string, value: number) => ReputationEditResult,
): void {
  panel = document.getElementById('dev-panel');
  snapshotProvider = provider;
  mechanicActionHandler = onMechanicAction;
  mechanicRemoveHandler = onMechanicRemove;
  mechanicDamageHandler = onMechanicDamage;
  reputationProvider = reputationSnapshot;
  reputationHandler = onReputationChange;
  reputationMessage = '';
  dirty = true;
  if (panel) {
    // Replace handlers when a Game is recreated; never double-apply developer edits.
    panel.onclick = event => {
      const target = event.target as HTMLElement;
      const rankButton = target.closest<HTMLButtonElement>('[data-reputation-set]');
      if (rankButton) {
        applyReputationEdit(rankButton.dataset.reputationId ?? '', Number(rankButton.dataset.reputationSet));
        return;
      }
      const damageButton = target.closest<HTMLButtonElement>('[data-mechanic-damage]');
      if (damageButton && !damageButton.disabled) {
        const componentId = damageButton.dataset.componentId;
        const pool = damageButton.dataset.mechanicDamage as MechanicDamagePool | undefined;
        if (componentId && (pool === 'hp' || pool === 'ap')) mechanicDamageHandler?.(componentId, pool);
        pendingMechanicAction = undefined;
        dirty = true;
        rebuildPanel();
        return;
      }
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
      if (tab === 'mechanic' || tab === 'ledger' || tab === 'reputation') {
        selectedTab = tab;
        pendingMechanicAction = undefined;
        dirty = true;
        rebuildPanel();
        panel?.querySelector<HTMLButtonElement>(`[data-dev-tab="${selectedTab}"]`)?.focus({ preventScroll: true });
      }
    };
    panel.onsubmit = event => {
      const form = event.target as HTMLFormElement;
      if (!form.matches('[data-reputation-form]')) return;
      event.preventDefault();
      const input = form.querySelector<HTMLInputElement>('[data-reputation-value]');
      applyReputationEdit(form.dataset.reputationForm ?? '', input?.valueAsNumber ?? NaN);
    };
    panel.onchange = event => {
      const target = event.target as HTMLSelectElement;
      if (target.dataset.ledgerSelect !== undefined) {
        selectedLedgerId = target.value;
        dirty = true;
        rebuildPanel();
      }
    };
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

function renderComponentDamageControls(componentId: string, hp: number, ap: number, installed: boolean): string {
  return `<span class="dev-component-damage">
    <button data-mechanic-damage="hp" data-component-id="${componentId}" title="Remove 1 HP and roll a threshold fault" ${!installed || hp <= 0 ? 'disabled' : ''}>-1HP</button>
    <button data-mechanic-damage="ap" data-component-id="${componentId}" title="Remove 1 AP" ${!installed || ap <= 0 ? 'disabled' : ''}>-1AP</button>
  </span>`;
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
        return `<tr class="dev-absent"><td>${escapeHtml(component.name)} ${renderComponentDamageControls(component.id, 0, 0, false)}</td><td colspan="7">NOT INSTALLED</td></tr>`;
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
        <td>${escapeHtml(component.name)} ${renderComponentDamageControls(component.id, state.hp, state.ap, true)}</td>
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
    <td>${num(strike.apHitProbability, 6)}<small>roll ${strike.hpAfter < strike.hpBefore ? `<span class="dev-hp-hit">${num(strike.apHpRoll, 8)}</span>` : num(strike.apHpRoll, 8)}</small></td>
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

function applyReputationEdit(id: string, value: number): void {
  if (!isReputationId(id) || !Number.isFinite(value) || value < 0 || value > 3) {
    reputationMessage = 'Enter a finite rank progress value from 0 to 3.';
  } else {
    const result = reputationHandler?.(id, value);
    reputationMessage = result === 'saved' ? `${REPUTATION_TRACKS.find(track => track.id === id)!.name}: saved.`
      : result === 'unchanged' ? 'Already at that value; no change saved.'
      : result === 'save-failed' ? 'Rank change could not be saved. No standing was changed.'
      : 'Rank editor unavailable or invalid value.';
  }
  dirty = true;
  rebuildPanel();
  if (isReputationId(id)) panel?.querySelector<HTMLInputElement>(`[data-reputation-form="${id}"] input`)?.focus({ preventScroll: true });
}

function renderReputations(): string {
  const state = reputationProvider?.();
  if (!state || !reputationHandler) return '<p>No career rank provider.</p>';
  return `<p class="dev-summary">Persistent career ranks only; no gameplay effects or automatic gains. Set a whole rank with 0–3, or enter partial progress (for example 1.5). A partial next bar does not promote the rank.</p>
    <p class="dev-rank-message" role="status" aria-live="polite">${escapeHtml(reputationMessage)}</p>
    ${REPUTATION_TRACKS.map(track => {
      const standing = reputationStanding(state, track.id);
      return `<section class="dev-rank" data-reputation-id="${track.id}">
        <h3>${escapeHtml(track.name)}</h3>
        <div class="dev-rank-title">${escapeHtml(standing.title)} — Level ${standing.level}/3</div>
        <div class="dev-rank-bars" role="img" aria-label="${escapeHtml(track.name)}: ${standing.progress} of 3 bars">${standing.bars.map(fill => `<span><i style="width:${fill * 100}%"></i></span>`).join('')}</div>
        <form data-reputation-form="${track.id}">
          ${[0, 1, 2, 3].map(level => `<button type="button" data-reputation-id="${track.id}" data-reputation-set="${level}" title="${escapeHtml(track.titles[level])}">${level}</button>`).join('')}
          <label>Progress <input data-reputation-value type="number" min="0" max="3" step="any" required value="${standing.progress}" aria-label="${escapeHtml(track.name)} progress"></label>
          <button type="submit">Apply</button>
        </form>
      </section>`;
    }).join('')}`;
}

function rebuildPanel(): void {
  if (!panel) return;
  const snapshot = selectedTab === 'reputation' ? undefined : snapshotProvider?.();
  panel.innerHTML = `
    <div class="dev-panel-header"><h2>DEVELOPMENT</h2><span>TILDE / F2</span></div>
    <div class="dev-tabs">
      <button data-dev-tab="mechanic" class="${selectedTab === 'mechanic' ? 'active' : ''}">Mechanic</button>
      <button data-dev-tab="ledger" class="${selectedTab === 'ledger' ? 'active' : ''}">Telemetry Ledger</button>
      <button data-dev-tab="reputation" class="${selectedTab === 'reputation' ? 'active' : ''}">Ranks</button>
    </div>
    <div class="dev-content">${selectedTab === 'reputation' ? renderReputations() : snapshot ? (selectedTab === 'mechanic' ? renderMechanic(snapshot) : renderLedger(snapshot)) : '<p>No maintenance snapshot provider.</p>'}</div>
  `;
  dirty = false;
  lastRefresh = performance.now();
}

export function markDevPanelDirty(): void {
  // Career replacement (including a new career) invalidates old editor notices.
  reputationMessage = '';
  dirty = true;
}

export function updateDevPanel(): void {
  if (!visible || !panel) return;
  if (dirty) {
    rebuildPanel();
    return;
  }
  // Replacing the whole panel while a pointer is over it can remove a button between
  // pointer-down and click. Mechanic state changes only through explicit actions, so it
  // needs no polling. Keep ledger telemetry live only while the panel is not in use.
  if (selectedTab === 'ledger'
    && !panel.matches(':hover')
    && performance.now() - lastRefresh >= 500) rebuildPanel();
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
      panel.querySelector<HTMLButtonElement>(`[data-dev-tab="${selectedTab}"]`)?.focus({ preventScroll: true });
    }
  }
}
