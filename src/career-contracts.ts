import type { TeamsterCertificationId } from './career-state';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { generateFactionContactContractCandidates, generateFactionContractCandidates, type FactionContractCandidate } from './content/estella/faction-contracts';
import { estellaDisplayPath, estellaSelectableNavTargets } from './content/estella/navigation';
import { type EstellaTransferOption, generateEstellaMission } from './estella-mission';
import { localDirectoryEntryById, localTerminalScopeIds } from './local-directory';
import { estimateEstellaMissionCost, makePayTerms, type MissionCargoSpec, type MissionCostQuote } from './mission-cost';
import { bodyById } from './world';

export type CareerContractClass = 'local' | 'moderate' | 'long';

export interface CareerContract {
  id: string;
  sourceId: string;
  sourceName: string;
  sourcePath: string;
  destinationId: string;
  destinationName: string;
  destinationPath: string;
  routeClass: CareerContractClass;
  title: string;
  factionId?: string;
  issuerId?: string;
  issuerName?: string;
  issuerTag?: string;
  templateId?: string;
  category?: 'freight' | 'passenger' | 'certification';
  certificationOnSuccess?: TeamsterCertificationId;
  travelMode?: 'old-nell';
  scheduledStartWorldTime?: number;
  cargo: MissionCargoSpec;
  quote: MissionCostQuote;
  selectedTransfer?: EstellaTransferOption;
  completionMessage: string;
}

const MAX_FACTION_CONTRACTS = 10;
const MAX_CONTRACTS = 10;

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

function weightedPick<T extends { likelihood: number }>(items: T[], count: number, seed: number): T[] {
  const pool = items.filter(item => item.likelihood > 0);
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((sum, item) => sum + item.likelihood, 0);
    let roll = rand(seed + i * 0x7f4a7c15) * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      roll -= pool[idx].likelihood;
      if (roll <= 0) break;
    }
    const [item] = pool.splice(Math.min(idx, pool.length - 1), 1);
    picked.push(item);
  }
  return picked;
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

function contractTarget(destinationId: string): { name: string; path: string } {
  const target = estellaSelectableNavTargets().find(row => row.id === destinationId);
  return {
    name: target?.name ?? ESTELLA_NODES_BY_ID.get(destinationId)?.name ?? destinationId,
    path: target?.path ?? estellaDisplayPath(destinationId),
  };
}

function contractTitleDestination(destinationId: string): string {
  return ESTELLA_NODES_BY_ID.get(destinationId)?.name ?? contractTarget(destinationId).name;
}

function positiveAngle(angle: number): number {
  const turn = Math.PI * 2;
  return ((angle % turn) + turn) % turn;
}

function scheduledStartForDestinationLead(candidate: FactionContractCandidate, notBeforeWorldTime: number): number | undefined {
  const leadAngle = candidate.destinationLeadAngleFromSource;
  if (leadAngle === undefined) return undefined;
  const sourcePlacement = ESTELLA_NODES_BY_ID.get(candidate.sourceId)?.placement;
  const destinationPlacement = ESTELLA_NODES_BY_ID.get(candidate.destinationId)?.placement;
  if (sourcePlacement?.kind !== 'surface' || destinationPlacement?.kind !== 'aboard') return undefined;
  const stationPlacement = ESTELLA_NODES_BY_ID.get(destinationPlacement.parentId)?.placement;
  if (stationPlacement?.kind !== 'orbit' || !stationPlacement.orbit) return undefined;
  const orbit = stationPlacement.orbit;
  if (orbit.kind !== 'circular' || stationPlacement.parentId !== sourcePlacement.parentId) return undefined;
  const body = bodyById(sourcePlacement.parentId);
  const angularSpeed = Math.sqrt(body.gm / (orbit.radius ** 3));
  if (!Number.isFinite(angularSpeed) || angularSpeed <= 0) return undefined;
  const sense = orbit.orbitSense;
  const currentAngle = orbit.epochAngle + sense * angularSpeed * (notBeforeWorldTime - orbit.epochTime);
  const targetAngle = (sourcePlacement.angle ?? 0) + sense * leadAngle;
  const remainingAlongOrbit = positiveAngle((targetAngle - currentAngle) * sense);
  return notBeforeWorldTime + remainingAlongOrbit / angularSpeed;
}

function makeFactionContract(candidate: FactionContractCandidate, index: number, startWorldTime: number): CareerContract {
  const scheduledStartWorldTime = scheduledStartForDestinationLead(candidate, startWorldTime);
  const mission = generateEstellaMission(candidate.sourceId, candidate.destinationId, scheduledStartWorldTime ?? startWorldTime);
  const selectedTransfer = preferredContractTransfer(mission.transferOptions);
  const pay = makePayTerms({
    generosity: candidate.generosity,
    flatReward: candidate.flatReward,
    compensationRatio: candidate.compensationRatio,
    maxCompAllowance: candidate.maxCompAllowance,
  });
  const quote = estimateEstellaMissionCost(candidate.sourceId, candidate.destinationId, candidate.cargo, selectedTransfer, pay);
  const source = contractTarget(candidate.sourceId);
  const target = contractTarget(candidate.destinationId);
  return {
    id: `${candidate.factionId}:${candidate.templateId}:${candidate.sourceId}->${candidate.destinationId}:${index}`,
    sourceId: candidate.sourceId,
    sourceName: source.name,
    sourcePath: source.path,
    destinationId: candidate.destinationId,
    destinationName: target.name,
    destinationPath: target.path,
    routeClass: classifyRoute(candidate.sourceId, candidate.destinationId),
    title: candidate.title ?? `${candidate.category === 'passenger' ? 'Transport' : 'Deliver'} ${candidate.cargo.label} to ${contractTitleDestination(candidate.destinationId)}`,
    factionId: candidate.factionId,
    issuerId: candidate.issuerId ?? candidate.factionId,
    issuerName: candidate.issuerName ?? candidate.factionName,
    issuerTag: candidate.factionTag,
    templateId: candidate.templateId,
    category: candidate.category ?? 'freight',
    certificationOnSuccess: candidate.certificationOnSuccess,
    travelMode: candidate.travelMode,
    scheduledStartWorldTime,
    cargo: candidate.cargo,
    quote,
    selectedTransfer,
    completionMessage: candidate.completionMessage ?? `${candidate.issuerName ?? candidate.factionName} thanks you for successfully completing this contract.`,
  };
}

export function generateCareerContracts(sourceId: string, startWorldTime: number = 0): CareerContract[] {
  const seed = hashString(`career-board:${sourceId}:${Math.floor(startWorldTime / 86_400)}`);
  const boardSourceIds = localTerminalScopeIds(sourceId);
  const targetIds = new Set(estellaSelectableNavTargets().map(target => target.id));
  const contracts: CareerContract[] = [];

  const factionCandidates = boardSourceIds.flatMap(routeSourceId => generateFactionContractCandidates({ sourceId: routeSourceId, worldTime: startWorldTime }))
    .filter(candidate => (candidate.category ?? 'freight') === 'freight')
    .filter(candidate => boardSourceIds.includes(candidate.sourceId) && targetIds.has(candidate.destinationId) && !isDisallowedSameSiteDelivery(candidate.sourceId, candidate.destinationId));
  const factionCount = Math.min(MAX_FACTION_CONTRACTS, factionCandidates.length);
  for (const candidate of weightedPick(factionCandidates, factionCount, seed ^ 0x51f15eed)) {
    if (contracts.length >= MAX_CONTRACTS) continue;
    contracts.push(makeFactionContract(candidate, contracts.length, startWorldTime));
  }

  return contracts;
}

export function generateDirectoryEntryContracts(entryId: string, sourceId: string, startWorldTime: number, certifications: readonly TeamsterCertificationId[]): CareerContract[] {
  const entry = localDirectoryEntryById(entryId);
  if (!entry?.factionId || !entry.missionTags?.length) return [];
  const availableSourceIds = localTerminalScopeIds(sourceId);
  const targetIds = new Set(estellaSelectableNavTargets().map(target => target.id));
  return generateFactionContactContractCandidates({
    sourceId,
    worldTime: startWorldTime,
    availableSourceIds,
    progress: {
      basicTeamsterCertification: ['basic-1', 'basic-2', 'basic-3'].filter(id => certifications.includes(id as TeamsterCertificationId)).length,
      basic1: certifications.includes('basic-1') ? 1 : 0,
      basic2: certifications.includes('basic-2') ? 1 : 0,
      basic3: certifications.includes('basic-3') ? 1 : 0,
    },
    issuer: {
      id: entry.id,
      name: entry.name,
      factionId: entry.factionId,
      missionTags: entry.missionTags,
    },
  })
    .filter(candidate => availableSourceIds.includes(candidate.sourceId) && targetIds.has(candidate.destinationId) && !isDisallowedSameSiteDelivery(candidate.sourceId, candidate.destinationId))
    .map((candidate, index) => makeFactionContract(candidate, index, startWorldTime));
}

const MAX_PASSENGER_CONTRACTS = 18;

export function generatePassengerContracts(sourceId: string, startWorldTime: number = 0): CareerContract[] {
  const seed = hashString(`passenger-board:${sourceId}:${Math.floor(startWorldTime / 86_400)}`);
  const boardSourceIds = localTerminalScopeIds(sourceId);
  const targetIds = new Set(estellaSelectableNavTargets().map(target => target.id));
  const candidates = boardSourceIds.flatMap(routeSourceId => generateFactionContractCandidates({ sourceId: routeSourceId, worldTime: startWorldTime }))
    .filter(candidate => candidate.category === 'passenger')
    .filter(candidate => boardSourceIds.includes(candidate.sourceId) && targetIds.has(candidate.destinationId) && !isDisallowedSameSiteDelivery(candidate.sourceId, candidate.destinationId));
  return weightedPick(candidates, MAX_PASSENGER_CONTRACTS, seed ^ 0x9a55e67).map((candidate, index) => makeFactionContract(candidate, index, startWorldTime));
}

export function careerContractClassLabel(routeClass: CareerContractClass): string {
  if (routeClass === 'local') return 'LOCAL';
  if (routeClass === 'moderate') return 'MOD';
  return 'LONG';
}
