import type { CareerProfile } from './career-state';
import { classifyRoute, preferredContractTransfer, type CareerContract } from './career-contracts';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { emptyTravelAccess } from './content/estella/empty-travel-access';
import { estellaDisplayPath, estellaFolderEntries, estellaSelectableNavTargets, type EstellaFolderKey, type EstellaNavEntry } from './content/estella/navigation';
import { knownMissionContacts, contactSummary } from './contact-knowledge';
import { localTerminalScopeIds } from './local-directory';
import { generateEstellaMission } from './estella-mission';
import { estimateEstellaMissionCost, makePayTerms } from './mission-cost';

export function emptyRunDestinationIds(profile: Pick<CareerProfile, 'locationId' | 'knownContactIds'>): Set<string> {
  const local = new Set(localTerminalScopeIds(profile.locationId));
  const contacts = new Set(knownMissionContacts(profile).flatMap(contact => contact.locationIds));
  return new Set(estellaSelectableNavTargets().filter(target => !local.has(target.id)
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
export function emptyRunDirectory(profile: Pick<CareerProfile, 'locationId' | 'knownContactIds'>, folder: EstellaFolderKey): Array<EstellaNavEntry & { contacts?: string }> {
  const allowed = emptyRunDestinationIds(profile);
  const known = knownMissionContacts(profile);
  return estellaFolderEntries(folder, allowed).map(entry => ({
    ...entry,
    detail: entry.detail.replace('exact-authored POI', 'available destination'),
    contacts: contactSummary(known.filter(contact => contact.locationIds.some(id => allowed.has(id)
      && (entry.kind === 'target' ? entry.target?.id === id : !!entry.key && insideFolder(id, entry.key))))),
  }));
}

/** Generated on selection, not advertised on any commercial board. */
export function createEmptyRun(profile: Pick<CareerProfile, 'locationId' | 'worldTime' | 'knownContactIds'>, destinationId: string): CareerContract {
  if (!canTravelEmpty(profile, destinationId)) throw new Error('Destination unavailable for empty travel');
  const sourceId = profile.locationId;
  if (!estellaSelectableNavTargets().some(target => target.id === sourceId)) throw new Error('Departure location is not playable');
  const mission = generateEstellaMission(sourceId, destinationId, profile.worldTime);
  const selectedTransfer = preferredContractTransfer(mission.transferOptions);
  const cargo = { label: 'Empty run', massTons: 0 };
  const quote = estimateEstellaMissionCost(sourceId, destinationId, cargo, selectedTransfer,
    makePayTerms({ generosity: 0, compensationRatio: 0, flatReward: 0, maxCompAllowance: 0 }));
  const destinationName = ESTELLA_NODES_BY_ID.get(destinationId)!.name;
  return {
    id: `empty:${sourceId}->${destinationId}:${profile.worldTime}`, templateId: 'empty-run', category: 'empty',
    sourceId, destinationId, sourceName: ESTELLA_NODES_BY_ID.get(sourceId)!.name, destinationName,
    sourcePath: estellaDisplayPath(sourceId), destinationPath: estellaDisplayPath(destinationId),
    routeClass: classifyRoute(sourceId, destinationId), title: `Empty run to ${destinationName}`,
    cargo, quote, selectedTransfer, requiredCertification: 'basic-3',
    details: 'No cargo, pay or fuel reimbursement. Normal fuel costs, flight time and rig wear apply.',
    completionMessage: `Empty run completed at ${destinationName}.`,
  };
}
