import { clusterMemberForPoi, clusterTemplateForPoiId, type ClusterLevel } from './cluster';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { type Placement, type WorldNode } from './content/types';
import { type EstellaTransferOption } from './estella-mission';
import { bodyById, type BodyDef } from './world';

export interface MissionCostBreakdownItem {
  label: string;
  dv: number;
}

export interface MissionCostQuote {
  sourceId: string;
  destinationId: string;
  cargoLabel: string;
  cargoMassTons: number;
  loadedMassTons: number;
  parDv: number;
  fuelPricePerTonMps: number;
  parFuelCost: number;
  generosity: number;
  grossPay: number;
  expectedMargin: number;
  breakdown: MissionCostBreakdownItem[];
}

const SHIP_DRY_MASS_TONS = 120;
const CONTAINER_TARE_TONS = 8;
const FUEL_PRICE_PER_TON_MPS = 1;
const DEFAULT_GENEROSITY = 1.5;
const CLUSTER_TRANSFER_SPEED = 200;
const CLUSTER_SHIP_HIT_RADIUS = 900;
const CLUSTER_AVOIDANCE_DV = 50;
const CLUSTER_SLOPPINESS_FACTOR = 1.2;

const CARGO_CLASSES = [
  { label: 'Light sealed freight', minMass: 8, maxMass: 15 },
  { label: 'Standard container freight', minMass: 18, maxMass: 32 },
  { label: 'Dense machine parts', minMass: 35, maxMass: 55 },
  { label: 'Shielded dense cargo', minMass: 55, maxMass: 70 },
] as const;

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number): number {
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 10000) / 10000;
}

function cargoForRoute(sourceId: string, destinationId: string): { label: string; mass: number } {
  const seed = hashString(`${sourceId}->${destinationId}`);
  const roll = seededUnit(seed);
  const cls = roll < 0.18 ? CARGO_CLASSES[0]
    : roll < 0.78 ? CARGO_CLASSES[1]
      : roll < 0.95 ? CARGO_CLASSES[2]
        : CARGO_CLASSES[3];
  const massRoll = seededUnit(seed ^ 0x9e3779b9);
  return { label: cls.label, mass: Math.round(cls.minMass + (cls.maxMass - cls.minMass) * massRoll) };
}

function nodeName(id: string): string {
  const node = ESTELLA_NODES_BY_ID.get(id);
  return node?.name ?? id;
}

function chainToRoot(nodeId: string): WorldNode[] {
  const chain: WorldNode[] = [];
  let current = ESTELLA_NODES_BY_ID.get(nodeId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current = current.placement?.parentId ? ESTELLA_NODES_BY_ID.get(current.placement.parentId) : undefined;
  }
  return chain;
}

function lowestCommonAncestor(a: WorldNode[], b: WorldNode[]): WorldNode | undefined {
  const bIds = new Set(b.map(node => node.id));
  return a.find(node => bIds.has(node.id));
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

function safeBody(bodyId: string | undefined): BodyDef | undefined {
  if (!bodyId) return undefined;
  try { return bodyById(bodyId); }
  catch { return undefined; }
}

function addBreakdown(out: MissionCostBreakdownItem[], label: string, dv: number): void {
  if (!Number.isFinite(dv) || dv <= 0) return;
  out.push({ label, dv: Math.round(dv) });
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clusterExpectedAvoidances(level: ClusterLevel, travelLength: number): number {
  const corridorWidth = CLUSTER_SHIP_HIT_RADIUS * 4;
  const clusterArea = Math.PI * level.rx * level.ry;
  if (clusterArea <= 0) return 0;
  return level.rockCount * travelLength * corridorWidth / clusterArea;
}

function clusterTravelParDv(level: ClusterLevel, travelLength: number): number {
  const baseDv = CLUSTER_TRANSFER_SPEED * 2;
  const avoidanceDv = clusterExpectedAvoidances(level, travelLength) * CLUSTER_AVOIDANCE_DV;
  return roundToNearest((baseDv + avoidanceDv) * CLUSTER_SLOPPINESS_FACTOR, 10);
}

function clusterExitEntryTravelLength(level: ClusterLevel): number {
  return (level.rx + level.ry) * 0.5;
}

function clusterTravelDistanceForPois(sourceId: string, destinationId: string): { level: ClusterLevel; distance: number } | null {
  const level = clusterTemplateForPoiId(sourceId) ?? clusterTemplateForPoiId(destinationId);
  if (!level) return null;
  const sourceMember = clusterMemberForPoi(level, sourceId);
  const destMember = clusterMemberForPoi(level, destinationId);
  if (!sourceMember || !destMember) return null;
  return { level, distance: Math.hypot(destMember.x - sourceMember.x, destMember.y - sourceMember.y) };
}

function sourceLegParDv(node: WorldNode, placement: Placement | undefined): { label: string; dv: number } | null {
  if (!placement) return null;
  if (placement.kind === 'aboard') return { label: `Undock: ${nodeName(node.id)}`, dv: 15 };
  if (placement.kind === 'cluster-member') return null;
  if (placement.kind === 'orbit') return { label: `Clear local orbit: ${nodeName(node.id)}`, dv: 45 };
  if (placement.kind === 'surface') {
    const body = safeBody(placement.parentId);
    const base = body?.orbitalDefaults.fuelDeltaV ?? 900;
    const atmoFactor = body?.atmosphere ? 0.42 : 0.72;
    return { label: `Launch: ${nodeName(node.id)}`, dv: base * atmoFactor };
  }
  return null;
}

function destinationLegParDv(node: WorldNode, placement: Placement | undefined): { label: string; dv: number } | null {
  if (!placement) return null;
  if (placement.kind === 'aboard') return { label: `Dock: ${nodeName(node.id)}`, dv: 18 };
  if (placement.kind === 'cluster-member') return null;
  if (placement.kind === 'orbit') return { label: `Rendezvous: ${nodeName(node.id)}`, dv: 55 };
  if (placement.kind === 'surface') {
    const body = safeBody(placement.parentId);
    const base = body?.orbitalDefaults.fuelDeltaV ?? 900;
    const atmoFactor = body?.atmosphere ? 0.20 : 0.50;
    const landingReserve = body?.atmosphere ? 70 : 45;
    return { label: `Descent/landing: ${nodeName(node.id)}`, dv: base * atmoFactor + landingReserve };
  }
  return null;
}

function destinationUsesAtmosphere(destinationId: string): boolean {
  const bodyId = bodyNodeIdForLocation(destinationId);
  const body = safeBody(bodyId);
  return !!body?.atmosphere;
}

function sourceIsCluster(sourceId: string): boolean {
  const bodyId = bodyNodeIdForLocation(sourceId);
  const node = bodyId ? ESTELLA_NODES_BY_ID.get(bodyId) : undefined;
  return node?.kind === 'cluster';
}

function destinationIsSurface(destinationId: string): boolean {
  const node = ESTELLA_NODES_BY_ID.get(destinationId);
  return node?.placement?.kind === 'surface';
}

export function estimateEstellaMissionCost(
  sourceId: string,
  destinationId: string,
  selectedTransfer?: EstellaTransferOption,
  generosity: number = DEFAULT_GENEROSITY,
): MissionCostQuote {
  const cargo = cargoForRoute(sourceId, destinationId);
  const loadedMassTons = SHIP_DRY_MASS_TONS + CONTAINER_TARE_TONS + cargo.mass;
  const breakdown: MissionCostBreakdownItem[] = [];
  const sameClusterTravel = clusterTravelDistanceForPois(sourceId, destinationId);

  const srcChain = chainToRoot(sourceId);
  const dstChain = chainToRoot(destinationId);
  const lca = lowestCommonAncestor(srcChain, dstChain);
  const lcaId = lca?.id;
  const up = lcaId ? srcChain.slice(0, srcChain.findIndex(node => node.id === lcaId)) : srcChain;
  const down = lcaId ? dstChain.slice(0, dstChain.findIndex(node => node.id === lcaId)).reverse() : dstChain.slice().reverse();

  for (const node of up) {
    const leg = sourceLegParDv(node, node.placement);
    if (leg) addBreakdown(breakdown, leg.label, leg.dv);
  }

  if (sameClusterTravel) {
    addBreakdown(breakdown, 'Cluster local transfer', clusterTravelParDv(sameClusterTravel.level, sameClusterTravel.distance));
  }

  if (selectedTransfer) {
    const transferSourceCluster = sourceIsCluster(sourceId);
    const clusterSourceLevel = transferSourceCluster ? clusterTemplateForPoiId(sourceId) : undefined;
    const depDv = transferSourceCluster && clusterSourceLevel
      ? clusterTravelParDv(clusterSourceLevel, clusterExitEntryTravelLength(clusterSourceLevel)) + selectedTransfer.departureVInf
      : selectedTransfer.departureVInf * 1.18 + 45;
    addBreakdown(breakdown, transferSourceCluster ? 'Cluster exit + escape vector' : 'SOI escape insertion', depDv);
    addBreakdown(breakdown, 'Midcourse correction reserve', Math.max(8, selectedTransfer.totalDeltaV * 0.03));

    const atmoArrival = destinationUsesAtmosphere(destinationId) && destinationIsSurface(destinationId);
    const arrDv = atmoArrival
      ? 12 + selectedTransfer.arrivalVInf * 0.06
      : 35 + selectedTransfer.arrivalVInf * 0.55;
    addBreakdown(breakdown, atmoArrival ? 'Atmospheric entry targeting' : 'Arrival/capture reserve', arrDv);
  } else if (bodyNodeIdForLocation(sourceId) !== bodyNodeIdForLocation(destinationId)) {
    addBreakdown(breakdown, 'Transfer reserve', 120);
  }

  for (const node of down) {
    const leg = destinationLegParDv(node, node.placement);
    if (leg) addBreakdown(breakdown, leg.label, leg.dv);
  }

  const parDv = Math.round(breakdown.reduce((sum, item) => sum + item.dv, 0));
  const parFuelCost = Math.round(parDv * loadedMassTons * FUEL_PRICE_PER_TON_MPS);
  const grossPay = Math.round(parFuelCost * generosity);
  const expectedMargin = grossPay - parFuelCost;

  return {
    sourceId,
    destinationId,
    cargoLabel: cargo.label,
    cargoMassTons: cargo.mass,
    loadedMassTons,
    parDv,
    fuelPricePerTonMps: FUEL_PRICE_PER_TON_MPS,
    parFuelCost,
    generosity,
    grossPay,
    expectedMargin,
    breakdown,
  };
}

export function actualFuelCostForQuote(quote: MissionCostQuote, actualDv: number): number {
  return Math.round(actualDv * quote.loadedMassTons * quote.fuelPricePerTonMps);
}

export function formatCredits(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.round(value));
  return `${sign}${abs.toLocaleString('en-US')} cr`;
}

export function formatMissionResultLine(quote: MissionCostQuote, actualDv: number): string {
  const actualFuel = actualFuelCostForQuote(quote, actualDv);
  const net = quote.grossPay - actualFuel;
  return `PAR ${quote.parDv.toFixed(0)} m/s | ACTUAL ${actualDv.toFixed(0)} m/s | FUEL ${formatCredits(actualFuel)}\nPAY ${formatCredits(quote.grossPay)} | NET ${formatCredits(net)}`;
}
