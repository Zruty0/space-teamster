export type RegionId = 'hearth' | 'camps' | 'belt' | 'wells' | 'reach';

export type WorldNodeKind =
  | 'star'
  | 'planet'
  | 'moon'
  | 'dwarf-planet'
  | 'gas-giant'
  | 'asteroid'
  | 'comet-fragment'
  | 'station'
  | 'atmospheric-station'
  | 'cluster'
  | 'poi';

export type Placement =
  | {
      kind: 'orbit';
      parentId: string;
      orbitClass?: 'stellar' | 'planetary' | 'moon' | 'low' | 'high' | 'very-inner' | 'eccentric' | 'co-orbital' | 'outer' | 'swarm';
      radius?: number;
      period?: number;
      epochAngle?: number;
      epochTime?: number;
      orbitSense?: 1 | -1;
      altitude?: number;
      notes?: string;
    }
  | {
      kind: 'surface';
      parentId: string;
      angle?: number;
      altitude?: number;
      side?: 'day' | 'night' | 'terminator' | 'polar' | 'equatorial' | 'unspecified';
      notes?: string;
    }
  | {
      kind: 'cluster-member';
      parentId: string;
      x: number;
      y: number;
      notes?: string;
    }
  | {
      kind: 'aboard';
      parentId: string;
      localX?: number;
      localY?: number;
      zoneId?: string;
      notes?: string;
    };

export interface NodeCapabilities {
  hasGravityWell?: boolean;
  hasSOI?: boolean;
  hasSurface?: boolean;
  hasAtmosphere?: boolean;
  landable?: boolean;
  dockable?: boolean;
  dockOnly?: boolean;
  clusterNavigation?: boolean;
  atmosphericPlatform?: boolean;
  skimOnly?: boolean;
}

export type AccessPointKind =
  | 'landing-pad'
  | 'docking-berth'
  | 'hangar-bay'
  | 'cargo-bay'
  | 'airlock'
  | 'tractor-zone'
  | 'highliner-berth'
  | 'surface-ramp';

export interface AccessPoint {
  id: string;
  name: string;
  kind: AccessPointKind;
  localX: number;
  localY: number;
  angle: number;
  sizeClass?: 'small' | 'medium' | 'large' | 'highliner';
  servesPoiIds?: string[];
  tags?: string[];
}

export interface AtmosphereModel {
  kind:
    | 'none'
    | 'breathable'
    | 'venuslike-toxic'
    | 'thin-co2'
    | 'thick-cold'
    | 'thin-so2'
    | 'methane-nitrogen'
    | 'thin-nitrogen'
    | 'gas-giant';
  playableEntry?: boolean;
  notes?: string;
}

export interface WorldNode {
  id: string;
  catalogId?: string;
  name: string;
  kind: WorldNodeKind;
  regionId?: RegionId;
  placement?: Placement;
  layoutId?: string;
  accessPoints?: AccessPoint[];
  capabilities?: NodeCapabilities;
  atmosphere?: AtmosphereModel;
  tags?: string[];
  economyTags?: string[];
  gameplayTags?: string[];
  summary?: string;
}

export interface InstitutionDef {
  id: string;
  name: string;
  tags: string[];
  summary: string;
  services?: string[];
  constraints?: string[];
}

export interface HighlinerSeedDef {
  id: string;
  name: string;
  role: string;
  notes: string;
  cargoBias?: string[];
  factionTags?: string[];
}

export interface WorldValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
}

export function validateWorldTree(nodes: readonly WorldNode[]): WorldValidationIssue[] {
  const issues: WorldValidationIssue[] = [];
  const byId = new Map<string, WorldNode>();
  const catalogIds = new Map<string, string>();
  const childCounts = new Map<string, number>();

  for (const node of nodes) {
    if (byId.has(node.id)) {
      issues.push({ severity: 'error', message: `Duplicate node id: ${node.id}`, nodeId: node.id });
    }
    byId.set(node.id, node);

    if (node.catalogId) {
      const existing = catalogIds.get(node.catalogId);
      if (existing) {
        issues.push({ severity: 'error', message: `Duplicate catalog id ${node.catalogId}: ${existing} and ${node.id}`, nodeId: node.id });
      }
      catalogIds.set(node.catalogId, node.id);
    }

    if (node.placement) {
      childCounts.set(node.placement.parentId, (childCounts.get(node.placement.parentId) ?? 0) + 1);
    }
  }

  for (const node of nodes) {
    if (node.placement && !byId.has(node.placement.parentId)) {
      issues.push({ severity: 'error', message: `Missing parent ${node.placement.parentId}`, nodeId: node.id });
    }

    for (const ap of node.accessPoints ?? []) {
      for (const poiId of ap.servesPoiIds ?? []) {
        const poi = byId.get(poiId);
        if (!poi) {
          issues.push({ severity: 'error', message: `Access point ${ap.id} serves missing POI ${poiId}`, nodeId: node.id });
        } else if (poi.kind !== 'poi') {
          issues.push({ severity: 'warning', message: `Access point ${ap.id} serves non-POI node ${poiId}`, nodeId: node.id });
        }
      }
    }
  }

  for (const node of nodes) {
    const hasChildren = (childCounts.get(node.id) ?? 0) > 0;
    if (!hasChildren && node.kind !== 'poi' && !(node.gameplayTags ?? []).includes('unexpanded-container')) {
      issues.push({ severity: 'warning', message: `Leaf node is not a POI: ${node.id}`, nodeId: node.id });
    }
    if (node.kind === 'poi' && hasChildren) {
      issues.push({ severity: 'warning', message: `POI has children: ${node.id}`, nodeId: node.id });
    }
  }

  return issues;
}

export function parentChain(nodes: readonly WorldNode[], nodeId: string): WorldNode[] {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const chain: WorldNode[] = [];
  let current = byId.get(nodeId);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    chain.push(current);
    current = current.placement ? byId.get(current.placement.parentId) : undefined;
  }
  return chain;
}
