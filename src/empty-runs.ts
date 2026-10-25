import type { CareerProfile } from './career-state';
import { classifyRoute, preferredContractTransfer, type CareerContract } from './career-contracts';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from './content/estella';
import type { WorldNode } from './content/types';
import { canonicalEstellaLocationId } from './content/estella/location-aliases';
import { emptyTravelAccess } from './content/estella/empty-travel-access';
import { estellaDisplayPath, estellaFolderEntries, estellaSelectableNavTargets, navigationOrbitRadius, type EstellaFolderKey, type EstellaNavEntry } from './content/estella/navigation';
import { knownMissionContacts, contactSummary } from './contact-knowledge';
import { localTerminalScopeIds, sharedTerminalParentId } from './local-directory';
import { generateEstellaMission } from './estella-mission';
import { estimateEstellaMissionCost, makePayTerms } from './mission-cost';

export function emptyRunDestinationIds(profile: Pick<CareerProfile, 'locationId' | 'knownContactIds'>): Set<string> {
  const local = new Set(localTerminalScopeIds(profile.locationId));
  const contacts = new Set(knownMissionContacts(profile).flatMap(contact => contact.locationIds.map(canonicalEstellaLocationId)));
  return new Set(estellaSelectableNavTargets().filter(target => canonicalEstellaLocationId(target.id) === target.id && !local.has(target.id)
    && emptyTravelAccess(target.id) !== 'contract-only'
    && (emptyTravelAccess(target.id) === 'public' || contacts.has(target.id))).map(target => target.id));
}
export function canTravelEmpty(profile: Pick<CareerProfile, 'locationId' | 'knownContactIds'>, destinationId: string): boolean {
  return emptyRunDestinationIds(profile).has(destinationId);
}
function insideFolder(locationId: string, folder: EstellaFolderKey): boolean {
  if (folder === 'root') return true;
  if (folder.startsWith('region:')) return ESTELLA_NODES_BY_ID.get(locationId)?.regionId === folder.slice(7);
  let node = ESTELLA_NODES_BY_ID.get(locationId);
  const seen = new Set<string>();
  while (node && !seen.has(node.id)) {
    if (`node:${node.id}` === folder) return true;
    seen.add(node.id);
    node = node.placement?.parentId ? ESTELLA_NODES_BY_ID.get(node.placement.parentId) : undefined;
  }
  return false;
}
/** Present physical terminals, not their internal receiving-dock POIs. */
export function emptyRunLocationId(locationId: string): string {
  locationId = canonicalEstellaLocationId(locationId);
  return sharedTerminalParentId(locationId) ?? locationId;
}

function isNavigationMoon(node: WorldNode): boolean {
  return node.kind === 'moon' || (node.kind === 'asteroid' && node.placement?.kind === 'orbit' && node.placement.usage === 'moon');
}

/** Short player-facing types; orbital numbers still determine sorting, not prose. */
export function emptyRunLocationType(locationId: string): string {
  const node = ESTELLA_NODES_BY_ID.get(emptyRunLocationId(locationId));
  if (!node) return 'Destination';
  if (node.kind === 'atmospheric-station') return 'Atmospheric station';
  if (node.placement?.kind === 'surface') return 'Surface site';
  if (isNavigationMoon(node)) {
    const moons = ESTELLA_NODES.filter(sibling => isNavigationMoon(sibling)
      && sibling.placement?.parentId === node.placement?.parentId && navigationOrbitRadius(sibling) !== undefined)
      .sort((a, b) => navigationOrbitRadius(a)! - navigationOrbitRadius(b)! || a.id.localeCompare(b.id));
    const index = moons.findIndex(moon => moon.id === node.id);
    // Stable across access/discovery changes. Inner half (rounded up) is near.
    return moons.length > 1 && index >= 0 ? index < Math.ceil(moons.length / 2) ? 'Near moon' : 'Far moon' : 'Moon';
  }
  switch (node.kind) {
    case 'planet': return 'Planet';
    case 'dwarf-planet': return 'Dwarf planet';
    case 'gas-giant': return 'Gas giant';
    case 'station': {
      const usage = node.placement?.kind === 'orbit' ? node.placement.usage : undefined;
      if (usage === 'low' || usage === 'very-inner') return 'Low orbit station';
      if (usage === 'high' || usage === 'outer') return 'High orbit station';
      return 'Station'; // Cluster stations are not fictitious planetary orbits.
    }
    case 'cluster': return node.tags?.includes('comet-swarm') ? 'Comet swarm'
      : node.tags?.includes('arkfall') ? 'Debris field' : 'Asteroid field';
    case 'asteroid': return 'Asteroid';
    case 'comet-fragment': return 'Comet fragment';
    case 'star': return 'Star';
    default: return 'Destination';
  }
}

export function emptyRunDirectory(profile: Pick<CareerProfile, 'locationId' | 'knownContactIds'>, folder: EstellaFolderKey): Array<EstellaNavEntry & { contacts?: string }> {
  const allowed = emptyRunDestinationIds(profile);
  const known = knownMissionContacts(profile);
  const targets = estellaSelectableNavTargets();
  return estellaFolderEntries(folder, allowed).map(entry => {
    const destinations = new Set([...allowed].filter(id => entry.kind === 'target'
      ? entry.target?.id === id : !!entry.key && insideFolder(id, entry.key)));
    const contacts = contactSummary(known.filter(contact => contact.locationIds.some(id => destinations.has(canonicalEstellaLocationId(id)))));
    const count = new Set([...destinations].map(emptyRunLocationId)).size;
    const countText = `${count} available destination${count === 1 ? '' : 's'}`;
    const nodeId = entry.target?.id ?? (entry.key?.startsWith('node:') ? entry.key.slice(5) : undefined);
    const detail = nodeId ? `${countText} · ${emptyRunLocationType(nodeId)}` : countText;
    if (nodeId && sharedTerminalParentId(nodeId) === nodeId) {
      const docks = localTerminalScopeIds(nodeId).filter(id => allowed.has(id));
      // Prefer the public receiving entrance; never select a restricted sibling
      // merely because another dock at this physical terminal is authorized.
      const dockId = docks.find(id => emptyTravelAccess(id) === 'public') ?? docks[0];
      const target = targets.find(target => target.id === dockId);
      if (target) return {
        kind: 'target' as const, label: entry.label, detail, contacts,
        target: { ...target, name: entry.label, path: estellaDisplayPath(nodeId) },
      };
    }
    return { ...entry, detail, contacts };
  });
}

/** Generated on selection, not advertised on any commercial board. */
export function createEmptyRun(profile: Pick<CareerProfile, 'locationId' | 'worldTime' | 'knownContactIds'>, destinationId: string): CareerContract {
  if (!canTravelEmpty(profile, destinationId)) throw new Error('Destination unavailable for empty travel');
  const sourceId = canonicalEstellaLocationId(profile.locationId);
  if (!estellaSelectableNavTargets().some(target => target.id === sourceId)) throw new Error('Departure location is not playable');
  const mission = generateEstellaMission(sourceId, destinationId, profile.worldTime);
  const selectedTransfer = preferredContractTransfer(mission.transferOptions);
  const cargo = { label: 'Empty run', massTons: 0 };
  const quote = estimateEstellaMissionCost(sourceId, destinationId, cargo, selectedTransfer,
    makePayTerms({ generosity: 0, compensationRatio: 0, flatReward: 0, maxCompAllowance: 0 }));
  const destinationLocation = emptyRunLocationId(destinationId);
  const sourceLocation = emptyRunLocationId(sourceId);
  const destinationName = ESTELLA_NODES_BY_ID.get(destinationLocation)!.name;
  return {
    id: `empty:${sourceId}->${destinationId}:${profile.worldTime}`, templateId: 'empty-run', category: 'empty',
    sourceId, destinationId, sourceName: ESTELLA_NODES_BY_ID.get(sourceLocation)!.name, destinationName,
    sourcePath: estellaDisplayPath(sourceLocation), destinationPath: estellaDisplayPath(destinationLocation),
    routeClass: classifyRoute(sourceId, destinationId), title: `Empty run to ${destinationName}`,
    cargo, quote, selectedTransfer, requiredCertification: 'basic-3',
    details: 'No cargo, pay or fuel reimbursement. Normal fuel costs, flight time and rig wear apply.',
    completionMessage: `Empty run completed at ${destinationName}.`,
  };
}
