import { type WorldNode } from '../types';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_REGION_NAMES, ESTELLA_PLACEMENTS } from './index';

export interface EstellaNavTarget {
  id: string;
  name: string;
  path: string;
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
