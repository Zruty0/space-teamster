import type { CareerContract } from './career-contracts';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { deriveRestrictions } from './maintenance/rig-state';
import type { CareerRigState, RigRestrictionId } from './maintenance/types';
import { playerRestrictionLabel } from './ship-status';

function bodyNodeIdForLocation(locationId: string): string | undefined {
  let current = ESTELLA_NODES_BY_ID.get(locationId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.kind === 'planet' || current.kind === 'moon' || current.kind === 'dwarf-planet' || current.kind === 'gas-giant') return current.id;
    current = current.placement?.parentId ? ESTELLA_NODES_BY_ID.get(current.placement.parentId) : undefined;
  }
  return undefined;
}

function destinationRestrictionIds(contract: CareerContract): Set<RigRestrictionId> {
  const required = new Set<RigRestrictionId>(['grounded']);
  if (contract.travelMode === 'old-nell') return new Set();

  if (contract.category === 'passenger') required.add('passenger-unavailable');
  else if ((contract.category ?? 'freight') === 'freight') required.add('freight-unavailable');

  const destination = ESTELLA_NODES_BY_ID.get(contract.destinationId);
  if (destination?.placement?.kind === 'surface') {
    required.add('surface-landing-unavailable');
    const bodyId = bodyNodeIdForLocation(contract.destinationId);
    if (bodyId && ESTELLA_NODES_BY_ID.get(bodyId)?.capabilities?.hasAtmosphere) {
      required.add('atmospheric-work-unavailable');
    }
  } else if (destination?.placement?.kind === 'aboard') {
    required.add('station-docking-unavailable');
  }
  return required;
}

export function contractEquipmentRestrictionLabels(contract: CareerContract, rig: CareerRigState): string[] {
  const required = destinationRestrictionIds(contract);
  if (!required.size) return [];
  const seen = new Set<RigRestrictionId>();
  return deriveRestrictions(rig).flatMap(restriction => {
    if (!required.has(restriction.id) || seen.has(restriction.id)) return [];
    seen.add(restriction.id);
    return [playerRestrictionLabel(restriction.id)];
  });
}
