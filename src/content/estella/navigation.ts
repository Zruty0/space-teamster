import { type RegionId, type WorldNode } from '../types';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_REGION_NAMES, ESTELLA_PLACEMENTS } from './index';

export interface EstellaNavTarget {
  id: string;
  name: string;
  path: string;
  detail: string;
}

export type EstellaFolderKey = 'root' | `region:${RegionId}` | `node:${string}`;

export interface EstellaNavEntry {
  kind: 'folder' | 'target';
  key?: EstellaFolderKey;
  target?: EstellaNavTarget;
  label: string;
  detail: string;
}

function exactPlacementProvided(node: WorldNode): boolean {
  if (!node.placement) return node.kind === 'star';
  if (node.placement.kind === 'aboard') return true;
  return !!ESTELLA_PLACEMENTS[node.id];
}

function hasExactPlacementChain(node: WorldNode): boolean {
  let current: WorldNode | undefined = node;
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) return false;
    seen.add(current.id);
    if (!exactPlacementProvided(current)) return false;
    const parentId: string | undefined = current.placement?.parentId;
    current = parentId ? ESTELLA_NODES_BY_ID.get(parentId) : undefined;
  }
  return true;
}

function displayName(node: WorldNode): string {
  return node.catalogId && node.catalogId !== node.name ? `${node.catalogId} ${node.name}` : node.name;
}

function pathName(node: WorldNode): string {
  if (node.kind === 'poi' && node.catalogId) return node.catalogId;
  return displayName(node);
}

export function estellaDisplayPath(nodeId: string): string {
  const chain: WorldNode[] = [];
  let current = ESTELLA_NODES_BY_ID.get(nodeId);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    chain.push(current);
    current = current.placement?.parentId ? ESTELLA_NODES_BY_ID.get(current.placement.parentId) : undefined;
  }
  chain.reverse();
  const leaf = ESTELLA_NODES_BY_ID.get(nodeId);
  const region = leaf?.regionId ? ESTELLA_REGION_NAMES[leaf.regionId] : undefined;
  const parts = chain
    .filter(node => node.kind !== 'star')
    .map(pathName);
  return [region, ...parts].filter(Boolean).join(' -> ');
}

function placementDetail(node: WorldNode): string {
  const placement = node.placement;
  if (!placement) return 'System root';
  if (placement.kind === 'aboard') return `Aboard ${ESTELLA_NODES_BY_ID.get(placement.parentId)?.name ?? placement.parentId}`;
  if (placement.kind === 'surface') {
    const angle = placement.angle === undefined ? 'angle pending' : `${(placement.angle * 180 / Math.PI).toFixed(1)}°`;
    return `Surface site, ${angle}`;
  }
  if (placement.kind === 'cluster-member') return `Cluster coordinates (${placement.x.toFixed(0)}, ${placement.y.toFixed(0)})`;
  if (placement.kind === 'orbit') {
    if (!placement.orbit) return `${placement.usage ?? 'orbit'} orbit, params pending`;
    if (placement.orbit.kind === 'circular') return `${placement.usage ?? 'orbit'} circular orbit, r=${(placement.orbit.radius / 1000).toFixed(0)}km`;
    return `${placement.usage ?? 'orbit'} Keplerian orbit, a=${(placement.orbit.semiMajorAxis / 1000).toFixed(0)}km e=${placement.orbit.eccentricity.toFixed(2)}`;
  }
  return 'Placement pending';
}

export function estellaSelectableNavTargets(): EstellaNavTarget[] {
  return ESTELLA_NODES
    .filter(node => node.kind === 'poi' && hasExactPlacementChain(node))
    .map(node => ({
      id: node.id,
      name: displayName(node),
      path: estellaDisplayPath(node.id),
      detail: placementDetail(node),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

const SELECTABLE_TARGET_IDS = () => new Set(estellaSelectableNavTargets().map(target => target.id));

function nodeHasSelectableDescendant(nodeId: string, selectableIds: Set<string>): boolean {
  if (selectableIds.has(nodeId)) return true;
  const stack = ESTELLA_NODES.filter(node => node.placement?.parentId === nodeId);
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    if (selectableIds.has(node.id)) return true;
    stack.push(...ESTELLA_NODES.filter(child => child.placement?.parentId === node.id));
  }
  return false;
}

function targetForNode(node: WorldNode): EstellaNavTarget | undefined {
  return estellaSelectableNavTargets().find(target => target.id === node.id);
}

function regionOfKey(key: EstellaFolderKey): RegionId | undefined {
  return key.startsWith('region:') ? key.slice('region:'.length) as RegionId : undefined;
}

function nodeIdOfKey(key: EstellaFolderKey): string | undefined {
  return key.startsWith('node:') ? key.slice('node:'.length) : undefined;
}

export function estellaFolderTitle(folder: EstellaFolderKey): string {
  if (folder === 'root') return 'Estella';
  const regionId = regionOfKey(folder);
  if (regionId) return ESTELLA_REGION_NAMES[regionId];
  const nodeId = nodeIdOfKey(folder);
  return nodeId ? displayName(ESTELLA_NODES_BY_ID.get(nodeId) ?? { id: nodeId, name: nodeId, kind: 'poi' } as WorldNode) : folder;
}

export function estellaParentFolder(folder: EstellaFolderKey): EstellaFolderKey | null {
  if (folder === 'root') return null;
  const regionId = regionOfKey(folder);
  if (regionId) return 'root';
  const nodeId = nodeIdOfKey(folder);
  const node = nodeId ? ESTELLA_NODES_BY_ID.get(nodeId) : undefined;
  if (!node?.placement?.parentId) return 'root';
  const parent = ESTELLA_NODES_BY_ID.get(node.placement.parentId);
  if (!parent || parent.kind === 'star') return node.regionId ? `region:${node.regionId}` as EstellaFolderKey : 'root';
  return `node:${parent.id}`;
}

export function estellaFolderEntries(folder: EstellaFolderKey): EstellaNavEntry[] {
  const selectableIds = SELECTABLE_TARGET_IDS();

  if (folder === 'root') {
    const regions = Object.keys(ESTELLA_REGION_NAMES) as RegionId[];
    return regions
      .map(regionId => {
        const count = estellaSelectableNavTargets().filter(target => ESTELLA_NODES_BY_ID.get(target.id)?.regionId === regionId).length;
        return { regionId, count };
      })
      .filter(row => row.count > 0)
      .map(row => ({
        kind: 'folder' as const,
        key: `region:${row.regionId}` as EstellaFolderKey,
        label: ESTELLA_REGION_NAMES[row.regionId],
        detail: `${row.count} exact-authored POI${row.count === 1 ? '' : 's'}`,
      }));
  }

  const regionId = regionOfKey(folder);
  if (regionId) {
    return ESTELLA_NODES
      .filter(node => node.regionId === regionId && node.placement?.parentId === 'estella' && nodeHasSelectableDescendant(node.id, selectableIds))
      .map(node => ({
        kind: 'folder' as const,
        key: `node:${node.id}` as EstellaFolderKey,
        label: displayName(node),
        detail: placementDetail(node),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  const nodeId = nodeIdOfKey(folder);
  if (!nodeId) return [];
  return ESTELLA_NODES
    .filter(node => node.placement?.parentId === nodeId && nodeHasSelectableDescendant(node.id, selectableIds))
    .map(node => {
      const target = node.kind === 'poi' ? targetForNode(node) : undefined;
      if (target) {
        return {
          kind: 'target' as const,
          target,
          label: target.name,
          detail: target.detail,
        };
      }
      return {
        kind: 'folder' as const,
        key: `node:${node.id}` as EstellaFolderKey,
        label: displayName(node),
        detail: placementDetail(node),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
