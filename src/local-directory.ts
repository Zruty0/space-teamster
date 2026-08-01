import { ESTELLA_NODES_BY_ID } from './content/estella';
import { estellaSelectableNavTargets } from './content/estella/navigation';

export interface LocalDirectoryActionDef {
  id: string;
  label: string;
  detail: string;
  tag?: string;
  contactId?: string;
}

interface LocalDirectoryEntryBase {
  id: string;
  name: string;
  organizationName?: string;
  factionId?: string;
  missionTags?: string[];
  locationIds: string[];
  summary: string;
  /** False when remote access must be initiated through an office rather than the general directory. */
  listedRemotely?: boolean;
  actions: LocalDirectoryActionDef[];
}

export interface LocalOfficeDef extends LocalDirectoryEntryBase {
  kind: 'office';
  description: string;
}

export type ContactCommsRange = 'local' | 'cluster' | 'body' | 'region';

export interface LocalContactDef extends LocalDirectoryEntryBase {
  kind: 'contact';
  title: string;
  description: string;
  dialogue: string[];
  commsRange: ContactCommsRange;
}

export type LocalDirectoryEntryDef = LocalOfficeDef | LocalContactDef;

const SHARED_TERMINAL_PARENT_KINDS = new Set(['station', 'atmospheric-station', 'asteroid']);

function sharedTerminalParentId(locationId: string): string | undefined {
  const node = ESTELLA_NODES_BY_ID.get(locationId);
  if (!node) return undefined;
  if (SHARED_TERMINAL_PARENT_KINDS.has(node.kind)) return node.id;
  if (node.placement?.kind !== 'aboard') return undefined;
  const parent = ESTELLA_NODES_BY_ID.get(node.placement.parentId);
  return parent && SHARED_TERMINAL_PARENT_KINDS.has(parent.kind) ? parent.id : undefined;
}

function ancestorIdOfKind(locationId: string, kinds: Set<string>): string | undefined {
  let node = ESTELLA_NODES_BY_ID.get(locationId);
  const seen = new Set<string>();
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    if (kinds.has(node.kind)) return node.id;
    node = node.placement?.parentId ? ESTELLA_NODES_BY_ID.get(node.placement.parentId) : undefined;
  }
  return undefined;
}

const BODY_KINDS = new Set(['planet', 'moon', 'dwarf-planet', 'gas-giant']);
const CLUSTER_KINDS = new Set(['cluster']);

function withinContactRange(currentLocationId: string, contactLocationId: string, range: ContactCommsRange): boolean {
  if (range === 'local') return false;
  if (range === 'cluster') {
    const currentCluster = ancestorIdOfKind(currentLocationId, CLUSTER_KINDS);
    return currentCluster !== undefined && currentCluster === ancestorIdOfKind(contactLocationId, CLUSTER_KINDS);
  }
  if (range === 'body') {
    const currentBody = ancestorIdOfKind(currentLocationId, BODY_KINDS);
    return currentBody !== undefined && currentBody === ancestorIdOfKind(contactLocationId, BODY_KINDS);
  }
  const currentRegion = ESTELLA_NODES_BY_ID.get(currentLocationId)?.regionId;
  return currentRegion !== undefined && currentRegion === ESTELLA_NODES_BY_ID.get(contactLocationId)?.regionId;
}

/** POIs sharing the current physical station or asteroid terminal. Surface sites remain separate. */
export function localTerminalScopeIds(locationId: string): string[] {
  const parentId = sharedTerminalParentId(locationId);
  if (!parentId) return [locationId];
  const selectableIds = new Set(estellaSelectableNavTargets().map(target => target.id));
  const siblingPoiIds = [...ESTELLA_NODES_BY_ID.values()]
    .filter(node => node.kind === 'poi' && node.placement?.kind === 'aboard' && node.placement.parentId === parentId && selectableIds.has(node.id))
    .map(node => node.id);
  const ordered = [
    ...(selectableIds.has(locationId) ? [locationId] : []),
    ...siblingPoiIds.filter(id => id !== locationId),
  ];
  return ordered.length ? ordered : [locationId];
}

export const GIDEON_BELL: LocalContactDef = {
  kind: 'contact',
  id: 'gideon-gid-bell',
  name: 'Gideon “Gid” Bell',
  title: 'Senior Certification Officer',
  organizationName: 'Teamsters’ Guild',
  factionId: 'teamsters-guild',
  missionTags: ['certification-basic'],
  locationIds: ['still-guild-hq'],
  summary: 'The Guild examiner responsible for basic Teamster certification.',
  listedRemotely: false,
  commsRange: 'cluster',
  description: 'A broad, silver-bearded older Teamster leans toward the camera in a faded Guild work shirt. Laugh lines crowd his eyes; one scarred hand cradles a steaming mug while the other rests on a battered checkride clipboard.',
  dialogue: [
    '“Hello there! Gideon Bell—Gid to everybody who isn’t filing paperwork. Good to meet you.”',
    '“I’m sure you already know how to handle the Teamster rig, but, you know, regulations. Every new Guild number needs a witnessed checkride in the ledger before Dispatch can turn you loose on contract work.”',
    '“Keeps the insurers calm, keeps Council inspectors out of our hair, and every so often catches somebody who thought stopping was optional.”',
    '“When you’re ready, visit me at Guild HQ and we’ll get your checkride out of the way.”',
  ],
  actions: [],
};

export const TEAMSTERS_GUILD_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'teamsters-guild-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['caravanserai-certification-authority'],
  summary: 'Guild licensing and practical-flight administration for working Teamsters.',
  description: 'The certification office occupies a low-ceilinged suite behind the Caravanserai traffic hall. Scuffed maneuver plots and framed rig licenses cover the walls; old acceleration couches serve as waiting-room seats.',
  actions: [
    {
      id: 'start-basic-certification',
      label: 'Start Guild certification',
      detail: 'Open a call with the Guild officer responsible for the basic checkride.',
      tag: 'TUTORIAL',
      contactId: GIDEON_BELL.id,
    },
  ],
};

export const LOCAL_DIRECTORY_ENTRIES: LocalDirectoryEntryDef[] = [
  TEAMSTERS_GUILD_CERTIFICATION_OFFICE,
  GIDEON_BELL,
];

export type LocalDirectoryAccess = 'local' | 'remote';

export function localDirectoryEntryAccess(entry: LocalDirectoryEntryDef, locationId: string): LocalDirectoryAccess | undefined {
  const scope = new Set(localTerminalScopeIds(locationId));
  if (entry.locationIds.some(id => scope.has(id))) return 'local';
  if (entry.kind === 'contact' && entry.locationIds.some(id => withinContactRange(locationId, id, entry.commsRange))) return 'remote';
  return undefined;
}

export function localDirectoryEntriesAt(locationId: string): LocalDirectoryEntryDef[] {
  return LOCAL_DIRECTORY_ENTRIES.filter(entry => {
    const access = localDirectoryEntryAccess(entry, locationId);
    return access !== undefined && (access === 'local' || entry.listedRemotely !== false);
  });
}

export function localDirectoryEntryById(id: string): LocalDirectoryEntryDef | undefined {
  return LOCAL_DIRECTORY_ENTRIES.find(entry => entry.id === id);
}
