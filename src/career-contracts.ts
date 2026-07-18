import { ESTELLA_NODES_BY_ID } from './content/estella';
import { estellaDisplayPath, estellaSelectableNavTargets } from './content/estella/navigation';
import { type EstellaTransferOption, generateEstellaMission } from './estella-mission';
import { estimateEstellaMissionCost, generateGenericCargoForRoute, type MissionCargoSpec, type MissionCostQuote } from './mission-cost';

export type CareerContractClass = 'local' | 'moderate' | 'long';

export interface CareerContract {
  id: string;
  sourceId: string;
  destinationId: string;
  destinationName: string;
  destinationPath: string;
  routeClass: CareerContractClass;
  cargo: MissionCargoSpec;
  quote: MissionCostQuote;
  selectedTransfer?: EstellaTransferOption;
}

const CONTRACT_CLASS_COUNTS: Record<CareerContractClass, number> = {
  local: 5,
  moderate: 3,
  long: 2,
};

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rand(seed: number): number {
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 0xffffffff;
}

function shuffled<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand(seed + i * 0x9e3779b9) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function bodyNodeIdForLocation(nodeId: string): string | undefined {
  let current = ESTELLA_NODES_BY_ID.get(nodeId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.kind === 'cluster') return current.id;
    if (current.kind === 'planet' || current.kind === 'moon' || current.kind === 'dwarf-planet' || current.kind === 'gas-giant') return current.id;
    current = current.placement?.parentId ? ESTELLA_NODES_BY_ID.get(current.placement.parentId) : undefined;
  }
  return undefined;
}

function parentBodyId(bodyId: string | undefined): string | undefined {
  if (!bodyId) return undefined;
  return ESTELLA_NODES_BY_ID.get(bodyId)?.placement?.parentId;
}

function isDisallowedSameSiteDelivery(sourceId: string, destinationId: string): boolean {
  const sourcePlacement = ESTELLA_NODES_BY_ID.get(sourceId)?.placement;
  const destPlacement = ESTELLA_NODES_BY_ID.get(destinationId)?.placement;
  if (!sourcePlacement || !destPlacement) return false;
  if (sourcePlacement.kind === 'surface' && destPlacement.kind === 'surface' && sourcePlacement.parentId === destPlacement.parentId) return true;
  if (sourcePlacement.kind === 'aboard' && destPlacement.kind === 'aboard' && sourcePlacement.parentId === destPlacement.parentId) return true;
  return false;
}

function classifyRoute(sourceId: string, destinationId: string): CareerContractClass {
  const source = ESTELLA_NODES_BY_ID.get(sourceId);
  const dest = ESTELLA_NODES_BY_ID.get(destinationId);
  const sourceBody = bodyNodeIdForLocation(sourceId);
  const destBody = bodyNodeIdForLocation(destinationId);
  const sourceParent = parentBodyId(sourceBody);
  const destParent = parentBodyId(destBody);

  if (sourceBody && destBody && (
    sourceBody === destBody
    || sourceParent === destBody
    || destParent === sourceBody
    || (sourceParent !== undefined && sourceParent !== 'estella' && sourceParent === destParent)
  )) return 'local';

  if (source?.regionId && dest?.regionId && source.regionId === dest.regionId) return 'moderate';
  return 'long';
}

export function preferredContractTransfer(options: EstellaTransferOption[]): EstellaTransferOption | undefined {
  return options.find(option => option.id === 'soon') ?? options[1] ?? options[0];
}

function makeContract(sourceId: string, destinationId: string, routeClass: CareerContractClass, index: number, startWorldTime: number): CareerContract {
  const mission = generateEstellaMission(sourceId, destinationId, startWorldTime);
  const selectedTransfer = preferredContractTransfer(mission.transferOptions);
  const cargo = generateGenericCargoForRoute(sourceId, destinationId);
  const quote = estimateEstellaMissionCost(sourceId, destinationId, cargo, selectedTransfer);
  const target = estellaSelectableNavTargets().find(row => row.id === destinationId);
  return {
    id: `${sourceId}->${destinationId}:${index}`,
    sourceId,
    destinationId,
    destinationName: target?.name ?? ESTELLA_NODES_BY_ID.get(destinationId)?.name ?? destinationId,
    destinationPath: target?.path ?? estellaDisplayPath(destinationId),
    routeClass,
    cargo,
    quote,
    selectedTransfer,
  };
}

export function generateCareerContracts(sourceId: string, startWorldTime: number = 0): CareerContract[] {
  const seed = hashString(`career-board:${sourceId}`);
  const targets = estellaSelectableNavTargets().filter(target => target.id !== sourceId && !isDisallowedSameSiteDelivery(sourceId, target.id));
  const byClass: Record<CareerContractClass, string[]> = { local: [], moderate: [], long: [] };
  for (const target of targets) byClass[classifyRoute(sourceId, target.id)].push(target.id);

  const picked = new Set<string>();
  const contracts: CareerContract[] = [];
  const takeFrom = (routeClass: CareerContractClass, count: number): void => {
    for (const destinationId of shuffled(byClass[routeClass].filter(id => !picked.has(id)), seed ^ hashString(routeClass))) {
      if (contracts.length >= 10 || count <= 0) break;
      picked.add(destinationId);
      contracts.push(makeContract(sourceId, destinationId, routeClass, contracts.length, startWorldTime));
      count--;
    }
  };

  takeFrom('local', CONTRACT_CLASS_COUNTS.local);
  takeFrom('moderate', CONTRACT_CLASS_COUNTS.moderate);
  takeFrom('long', CONTRACT_CLASS_COUNTS.long);

  if (contracts.length < 10) {
    const leftovers = shuffled(targets.map(target => target.id).filter(id => !picked.has(id)), seed ^ 0xa5a5a5a5);
    for (const destinationId of leftovers) {
      if (contracts.length >= 10) break;
      picked.add(destinationId);
      contracts.push(makeContract(sourceId, destinationId, classifyRoute(sourceId, destinationId), contracts.length, startWorldTime));
    }
  }

  return contracts;
}

export function careerContractClassLabel(routeClass: CareerContractClass): string {
  if (routeClass === 'local') return 'LOCAL';
  if (routeClass === 'moderate') return 'MOD';
  return 'LONG';
}
