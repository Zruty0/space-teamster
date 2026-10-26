import { ESTELLA_NODES_BY_ID } from './content/estella';
import { canonicalEstellaLocationId, estellaLocationScopeIds } from './content/estella/location-aliases';
import { estellaSelectableNavTargets } from './content/estella/navigation';

const SHARED_PARENT_KINDS = new Set(['station', 'atmospheric-station', 'asteroid', 'comet-fragment']);
export function sharedTerminalParentId(locationId: string): string | undefined {
  const node = ESTELLA_NODES_BY_ID.get(locationId);
  if (!node) return undefined;
  if (SHARED_PARENT_KINDS.has(node.kind)) return node.id;
  if (node.placement?.kind !== 'aboard') return undefined;
  const parent = ESTELLA_NODES_BY_ID.get(node.placement.parentId);
  return parent && SHARED_PARENT_KINDS.has(parent.kind) ? parent.id : undefined;
}
export function physicalTerminalId(locationId: string): string {
  const canonical = canonicalEstellaLocationId(locationId);
  return sharedTerminalParentId(canonical) ?? canonical;
}
/** Shared stations and consolidated city districts; never free surface/orbit travel. */
export function localTerminalScopeIds(locationId: string): string[] {
  const city = estellaLocationScopeIds(locationId);
  if (city.length > 1) return city;
  const parentId = sharedTerminalParentId(locationId);
  if (!parentId) return [locationId];
  const selectableIds = new Set(estellaSelectableNavTargets().map(target => target.id));
  const siblings = [...ESTELLA_NODES_BY_ID.values()]
    .filter(node => node.kind === 'poi' && node.placement?.kind === 'aboard' && node.placement.parentId === parentId && selectableIds.has(node.id))
    .map(node => node.id);
  const ordered = [...(selectableIds.has(locationId) ? [locationId] : []), ...siblings.filter(id => id !== locationId)];
  return ordered.length ? ordered : [locationId];
}
