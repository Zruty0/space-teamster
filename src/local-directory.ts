import { ESTELLA_NODES_BY_ID } from './content/estella';
import { estellaSelectableNavTargets } from './content/estella/navigation';

export interface LocalDirectoryActionDef {
  id: string;
  label: string;
  detail: string;
}

interface LocalDirectoryEntryBase {
  id: string;
  name: string;
  organizationName?: string;
  locationIds: string[];
  summary: string;
  actions: LocalDirectoryActionDef[];
}

export interface LocalOfficeDef extends LocalDirectoryEntryBase {
  kind: 'office';
}

export interface LocalContactDef extends LocalDirectoryEntryBase {
  kind: 'contact';
  title: string;
  description: string;
  welcomeText: string;
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
  locationIds: ['caravanserai-certification-authority'],
  summary: 'The Guild examiner responsible for basic Teamster certification.',
  description: 'A broad, silver-bearded former fuel hauler with a booming laugh. Gid treats nervous applicants like junior crewmates, forgives honest mistakes, and becomes quietly immovable wherever safety is concerned.',
  welcomeText: '“There you are! Come in, come in. If you can dock without bending my station, we’re already friends.”',
  actions: [
    {
      id: 'basic-certification',
      label: 'Ask about basic certification',
      detail: 'Review the three practical flights required of a new Teamster.',
    },
  ],
};

export const LOCAL_DIRECTORY_ENTRIES: LocalDirectoryEntryDef[] = [
  GIDEON_BELL,
];

export function localDirectoryEntriesAt(locationId: string): LocalDirectoryEntryDef[] {
  const scope = new Set(localTerminalScopeIds(locationId));
  return LOCAL_DIRECTORY_ENTRIES.filter(entry => entry.locationIds.some(id => scope.has(id)));
}

export function localDirectoryEntryById(id: string): LocalDirectoryEntryDef | undefined {
  return LOCAL_DIRECTORY_ENTRIES.find(entry => entry.id === id);
}
