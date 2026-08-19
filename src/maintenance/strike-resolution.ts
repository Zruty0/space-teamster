import { componentFaults, MAINTENANCE_COMPONENTS } from './catalog';
import { componentMaxHp } from './grades';
import { cloneRigState, severityForHp } from './rig-state';
import { calculateTelemetryWeights } from './telemetry';
import type {
  CareerRigState,
  MaintenanceLedger,
  MaintenanceSystemId,
  MaintenanceTelemetryAccumulator,
  MissionTelemetryContext,
  PendingMaintenanceSettlement,
  StrikeLedgerEntry,
} from './types';
import { MAINTENANCE_SYSTEM_IDS } from './types';

class MaintenanceRng {
  state: number;
  constructor(state: number) {
    this.state = state >>> 0 || 0x6d2b79f5;
  }
  next(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0 || 0x6d2b79f5;
    return this.state / 0x1_0000_0000;
  }
}

function poissonChunk(mean: number, rng: MaintenanceRng, rolls: number[]): number {
  const limit = Math.exp(-mean);
  let product = 1;
  let count = 0;
  do {
    count++;
    const roll = rng.next();
    rolls.push(roll);
    product *= roll;
  } while (product > limit);
  return count - 1;
}

function poisson(mean: number, rng: MaintenanceRng, rolls: number[]): number {
  let remaining = Math.max(0, mean);
  let total = 0;
  while (remaining > 20) {
    total += poissonChunk(20, rng, rolls);
    remaining -= 20;
  }
  return total + poissonChunk(remaining, rng, rolls);
}

function weightedSystem(weights: Record<MaintenanceSystemId, number>, roll: number): MaintenanceSystemId {
  const total = MAINTENANCE_SYSTEM_IDS.reduce((sum, id) => sum + weights[id], 0);
  let cursor = roll * total;
  for (const id of MAINTENANCE_SYSTEM_IDS) {
    cursor -= weights[id];
    if (cursor <= 0 && weights[id] > 0) return id;
  }
  return MAINTENANCE_SYSTEM_IDS.find(id => weights[id] > 0) ?? 'body-frame';
}

export function currentMaintenanceLedger(
  raw: MaintenanceTelemetryAccumulator,
  context: MissionTelemetryContext,
  rig: CareerRigState,
  retryNote?: string,
): MaintenanceLedger {
  const weights = calculateTelemetryWeights(raw, context, rig);
  return {
    id: `${context.missionId}:${context.attempt}:current`,
    status: 'current',
    context: { ...context },
    raw: { ...raw },
    ...weights,
    rngStateBefore: rig.rngState >>> 0,
    rngStateAfter: rig.rngState >>> 0,
    poissonRolls: [],
    strikeCount: 0,
    strikes: [],
    retryNote,
  };
}

export function resolveMaintenanceSettlement(
  raw: MaintenanceTelemetryAccumulator,
  context: MissionTelemetryContext,
  rig: CareerRigState,
  completionWorldTime: number,
): PendingMaintenanceSettlement {
  const resultingRig = cloneRigState(rig);
  const rng = new MaintenanceRng(rig.rngState);
  const rngStateBefore = rng.state;
  const weights = calculateTelemetryWeights(raw, context, rig);
  const poissonRolls: number[] = [];
  const strikeCount = weights.mean > 0 ? poisson(weights.mean, rng, poissonRolls) : 0;
  const strikes: StrikeLedgerEntry[] = [];

  for (let index = 0; index < strikeCount; index++) {
    const systemRoll = rng.next();
    const systemId = weightedSystem(weights.adjustedSystemWeights, systemRoll);
    const components = MAINTENANCE_COMPONENTS.filter(component => component.systemId === systemId && resultingRig.components[component.id]?.installed);
    if (!components.length) continue;
    const componentRoll = rng.next();
    const component = components[Math.min(components.length - 1, Math.floor(componentRoll * components.length))];
    const state = resultingRig.components[component.id];
    const hpBefore = state.hp;
    const apBefore = state.ap;
    const maxHp = componentMaxHp(component, state.grade);
    const apHitProbability = (5 * state.ap) / (5 * state.ap + maxHp);
    const apHpRoll = rng.next();
    if (state.ap > 0 && apHpRoll < apHitProbability) state.ap--;
    else state.hp = Math.max(0, state.hp - 1);

    let crossedThreshold: StrikeLedgerEntry['crossedThreshold'];
    let faultId: string | undefined;
    let faultName: string | undefined;
    let locationId: string | undefined;
    const beforeSeverity = severityForHp(component.id, hpBefore);
    const afterSeverity = severityForHp(component.id, state.hp);
    if (state.hp < hpBefore && afterSeverity && afterSeverity !== beforeSeverity) {
      crossedThreshold = afterSeverity;
      if (afterSeverity !== 'total') {
        const faults = componentFaults(component, afterSeverity);
        if (faults.length) {
          const faultRoll = rng.next();
          const fault = faults[Math.min(faults.length - 1, Math.floor(faultRoll * faults.length))];
          faultId = fault.id;
          faultName = fault.name;
        }
        if (component.locations.length) {
          const locationRoll = rng.next();
          locationId = component.locations[Math.min(component.locations.length - 1, Math.floor(locationRoll * component.locations.length))];
        }
      }
      state.fault = {
        severity: afterSeverity,
        faultId,
        locationId,
        diagnosis: 'unknown',
        generatedMission: rig.completedMaintenanceMissions + 1,
        generatedStrike: index + 1,
      };
    }

    strikes.push({
      index: index + 1,
      systemRoll,
      systemId,
      componentRoll,
      componentId: component.id,
      apHitProbability,
      apHpRoll,
      hpBefore,
      hpAfter: state.hp,
      apBefore,
      apAfter: state.ap,
      crossedThreshold,
      faultId,
      faultName,
      locationId,
    });
  }

  resultingRig.rngState = rng.state;
  resultingRig.completedMaintenanceMissions = rig.completedMaintenanceMissions + 1;
  const ledger: MaintenanceLedger = {
    id: `${context.missionId}:${context.attempt}:${resultingRig.completedMaintenanceMissions}`,
    status: 'pending',
    context: { ...context },
    completionWorldTime,
    raw: { ...raw },
    ...weights,
    rngStateBefore,
    rngStateAfter: rng.state,
    poissonRolls,
    strikeCount,
    strikes,
  };
  return { ledger, resultingRig };
}
