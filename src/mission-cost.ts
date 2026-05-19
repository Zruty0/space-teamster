import { clusterMemberForPoi, clusterTemplateForPoiId, type ClusterLevel } from './cluster';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { ESTELLA_SURFACE_FLIGHT_PROFILES, type EstellaSurfaceFlightProfile } from './content/estella/flight-profiles';
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
const ORBIT_TRANSFER_SLOP = 1.4;
const ESCAPE_CAPTURE_SLOP = 1.1;

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

function clusterAvoidanceDv(level: ClusterLevel, travelLength: number): number {
  return clusterExpectedAvoidances(level, travelLength) * CLUSTER_AVOIDANCE_DV;
}

function clusterTravelParDv(level: ClusterLevel, travelLength: number): number {
  const baseDv = CLUSTER_TRANSFER_SPEED * 2;
  const avoidanceDv = clusterAvoidanceDv(level, travelLength);
  return roundToNearest((baseDv + avoidanceDv) * CLUSTER_SLOPPINESS_FACTOR, 10);
}

function clusterEscapeParDv(level: ClusterLevel, escapeSpeed: number): number {
  const avoidanceDv = clusterAvoidanceDv(level, clusterExitEntryTravelLength(level));
  return roundToNearest((escapeSpeed + avoidanceDv) * CLUSTER_SLOPPINESS_FACTOR, 10);
}

function clusterEntryParDv(level: ClusterLevel, arrivalVInf: number): number {
  const avoidanceDv = clusterAvoidanceDv(level, clusterExitEntryTravelLength(level));
  return roundToNearest((arrivalVInf + CLUSTER_TRANSFER_SPEED + avoidanceDv) * CLUSTER_SLOPPINESS_FACTOR, 10);
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

function defaultDepartureParProfile(body: BodyDef | undefined): EstellaSurfaceFlightProfile['departurePar'] {
  if (!body?.atmosphere) return { speedMultiplier: 1.03, fixedAllowanceDv: 10 };
  if (body.atmosphere.surfaceDensity > 1.2) return { speedMultiplier: 1.05, fixedAllowanceDv: 250 };
  if (body.atmosphere.surfaceDensity > 0.25) return { speedMultiplier: 1.05, fixedAllowanceDv: 180 };
  return { speedMultiplier: 1.05, fixedAllowanceDv: 90 };
}

function surfaceProfileForBody(bodyId: string): { nodeId: string; profile: EstellaSurfaceFlightProfile } | undefined {
  for (const [nodeId, profile] of Object.entries(ESTELLA_SURFACE_FLIGHT_PROFILES)) {
    const node = ESTELLA_NODES_BY_ID.get(nodeId);
    if (node?.placement?.kind === 'surface' && node.placement.parentId === bodyId && profile) return { nodeId, profile };
  }
  return undefined;
}

function parkingOrbitAltitude(body: BodyDef): number {
  const profile = surfaceProfileForBody(body.id)?.profile;
  const altitude = profile?.departurePar.targetOrbitAltitude ?? profile?.departureProfile.targetOrbitAltitude;
  if (altitude !== undefined) return altitude;
  if (body.atmosphere) return Math.max(body.atmosphere.height + 10_000, body.orbitalDefaults.transitionAltitude * 2);
  return Math.max(body.orbitalDefaults.transitionAltitude * 2, body.radius * 0.15, 10_000);
}

function parkingOrbitRadius(body: BodyDef): number {
  return body.radius + parkingOrbitAltitude(body);
}

function circularOrbitSpeed(body: BodyDef, radius: number): number {
  return Math.sqrt(body.gm / Math.max(1, radius));
}

function hohmannOrbitTransferDv(body: BodyDef, r1: number, r2: number): number {
  if (!Number.isFinite(r1) || !Number.isFinite(r2) || r1 <= 0 || r2 <= 0) return 0;
  if (Math.abs(r1 - r2) < 1) return 0;
  const a = (r1 + r2) * 0.5;
  const v1 = circularOrbitSpeed(body, r1);
  const v2 = circularOrbitSpeed(body, r2);
  const vt1 = Math.sqrt(body.gm * (2 / r1 - 1 / a));
  const vt2 = Math.sqrt(body.gm * (2 / r2 - 1 / a));
  return (Math.abs(vt1 - v1) + Math.abs(v2 - vt2)) * ORBIT_TRANSFER_SLOP;
}

function parkingEscapeOrCaptureDv(body: BodyDef, vInf: number): number {
  const rp = parkingOrbitRadius(body);
  const vCirc = circularOrbitSpeed(body, rp);
  const vHyp = Math.sqrt(vInf * vInf + 2 * body.gm / rp);
  return Math.max(0, vHyp - vCirc) * ESCAPE_CAPTURE_SLOP;
}

function departureToOrbitParDv(nodeId: string, body: BodyDef | undefined, surfaceAltitude = 0): number {
  if (!body) return 0;
  const surfaceProfile = ESTELLA_SURFACE_FLIGHT_PROFILES[nodeId];
  const departureProfile = surfaceProfile?.departureProfile;
  const parProfile = surfaceProfile?.departurePar ?? defaultDepartureParProfile(body);
  const targetOrbitAltitude = parProfile.targetOrbitAltitude ?? departureProfile?.targetOrbitAltitude ?? parkingOrbitAltitude(body);
  const r0 = body.radius + Math.max(0, surfaceAltitude);
  const ra = body.radius + Math.max(surfaceAltitude + 1, targetOrbitAltitude);
  const verticalBurn = Math.sqrt(Math.max(0, 2 * body.gm * (1 / r0 - 1 / ra)));
  const circularSpeed = Math.sqrt(body.gm / ra);
  const vacuumClimbAndCircularizeDv = verticalBurn + circularSpeed;
  return vacuumClimbAndCircularizeDv * parProfile.speedMultiplier + parProfile.fixedAllowanceDv;
}

function sourceLegParDv(node: WorldNode, placement: Placement | undefined): { label: string; dv: number } | null {
  if (!placement) return null;
  if (placement.kind === 'aboard') return { label: `Undock: ${nodeName(node.id)}`, dv: 15 };
  if (placement.kind === 'cluster-member') return null;
  if (placement.kind === 'orbit') return { label: `Clear local orbit: ${nodeName(node.id)}`, dv: 45 };
  if (placement.kind === 'surface') {
    const body = safeBody(placement.parentId);
    return { label: `Launch: ${nodeName(node.id)}`, dv: departureToOrbitParDv(node.id, body, placement.altitude ?? 0) };
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

function directPlacement(nodeId: string): Placement | undefined {
  return ESTELLA_NODES_BY_ID.get(nodeId)?.placement;
}

function locationSurface(nodeId: string): { nodeId: string; bodyId: string; altitude: number } | null {
  const node = ESTELLA_NODES_BY_ID.get(nodeId);
  if (node?.placement?.kind === 'surface') return { nodeId, bodyId: node.placement.parentId, altitude: node.placement.altitude ?? 0 };
  return null;
}

function locationOrbit(nodeId: string): { nodeId: string; bodyId: string; radius: number } | null {
  let current = ESTELLA_NODES_BY_ID.get(nodeId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const placement = current.placement;
    if (placement?.kind === 'orbit' && placement.orbit?.kind === 'circular') {
      return { nodeId: current.id, bodyId: placement.parentId, radius: placement.orbit.radius };
    }
    current = placement?.parentId ? ESTELLA_NODES_BY_ID.get(placement.parentId) : undefined;
  }
  return null;
}

function isAboardLocation(nodeId: string): boolean {
  return directPlacement(nodeId)?.kind === 'aboard';
}

function descentLandingParDv(destinationId: string): number {
  const surface = locationSurface(destinationId);
  const body = safeBody(surface?.bodyId);
  if (!surface || !body) return 0;
  const surfaceProfile = ESTELLA_SURFACE_FLIGHT_PROFILES[destinationId];
  const r0 = body.radius + Math.max(0, surface.altitude);
  const rp = parkingOrbitRadius(body);
  const circularSpeed = circularOrbitSpeed(body, rp);
  const vacuumFallSpeed = Math.sqrt(Math.max(0, 2 * body.gm * (1 / r0 - 1 / rp)));
  const atmosphericFallSpeedCap = body.atmosphere ? surfaceProfile?.landingPar?.atmosphericFallSpeedCap : undefined;
  const fallSpeed = atmosphericFallSpeedCap !== undefined ? Math.min(vacuumFallSpeed, atmosphericFallSpeedCap) : vacuumFallSpeed;
  const surfaceGravity = body.gm / (r0 * r0);
  const finalLandingSeconds = surfaceProfile?.landingPar?.finalLandingSeconds ?? 30;
  const fixedAllowanceDv = surfaceProfile?.landingPar?.fixedAllowanceDv ?? 0;
  return circularSpeed + fallSpeed + surfaceGravity * finalLandingSeconds + fixedAllowanceDv;
}

function hohmannParts(body: BodyDef, r1: number, r2: number): { dv1: number; dv2: number; vt1: number; vt2: number; v1: number; v2: number } {
  if (Math.abs(r1 - r2) < 1) {
    const v = circularOrbitSpeed(body, r1);
    return { dv1: 0, dv2: 0, vt1: v, vt2: v, v1: v, v2: v };
  }
  const a = (r1 + r2) * 0.5;
  const v1 = circularOrbitSpeed(body, r1);
  const v2 = circularOrbitSpeed(body, r2);
  const vt1 = Math.sqrt(body.gm * (2 / r1 - 1 / a));
  const vt2 = Math.sqrt(body.gm * (2 / r2 - 1 / a));
  return { dv1: Math.abs(vt1 - v1), dv2: Math.abs(v2 - vt2), vt1, vt2, v1, v2 };
}

function bodyParentId(bodyId: string): string | undefined {
  return safeBody(bodyId)?.orbit?.parentBodyId;
}

function addDestinationFromParking(
  breakdown: MissionCostBreakdownItem[],
  destinationId: string,
  body: BodyDef,
  destOrbit: { bodyId: string; radius: number } | null,
  destSurface: { bodyId: string } | null,
): void {
  const parkR = parkingOrbitRadius(body);
  if (destOrbit?.bodyId === body.id) addBreakdown(breakdown, 'Orbit transfer to destination', hohmannOrbitTransferDv(body, parkR, destOrbit.radius));
  if (destSurface?.bodyId === body.id) addBreakdown(breakdown, `Descent/landing: ${nodeName(destinationId)}`, descentLandingParDv(destinationId));
}

function addParentChildTransfer(
  breakdown: MissionCostBreakdownItem[],
  sourceId: string,
  destinationId: string,
  sourceSurface: { bodyId: string; altitude: number } | null,
  destSurface: { bodyId: string } | null,
  sourceOrbit: { bodyId: string; radius: number } | null,
  destOrbit: { bodyId: string; radius: number } | null,
): boolean {
  const sourceBodyId = sourceSurface?.bodyId ?? sourceOrbit?.bodyId;
  const destBodyId = destSurface?.bodyId ?? destOrbit?.bodyId;
  if (!sourceBodyId || !destBodyId || sourceBodyId === destBodyId) return false;
  const sourceBody = safeBody(sourceBodyId);
  const destBody = safeBody(destBodyId);
  if (!sourceBody || !destBody) return false;

  // Parent body -> child moon/body: stage in parent parking orbit, transfer to the child's orbit,
  // arrive with child-frame v∞, then capture into child parking orbit.
  if (bodyParentId(destBodyId) === sourceBodyId && destBody.orbit) {
    const parent = sourceBody;
    const child = destBody;
    const childOrbit = destBody.orbit;
    const parentParkR = parkingOrbitRadius(parent);
    if (sourceSurface?.bodyId === parent.id) addBreakdown(breakdown, `Launch to parking orbit: ${nodeName(sourceId)}`, departureToOrbitParDv(sourceId, parent, sourceSurface.altitude));
    if (sourceOrbit?.bodyId === parent.id) addBreakdown(breakdown, 'Orbit transfer to parking', hohmannOrbitTransferDv(parent, sourceOrbit.radius, parentParkR));
    const transfer = hohmannParts(parent, parentParkR, childOrbit.radius);
    addBreakdown(breakdown, 'Parent-frame transfer to child', transfer.dv1 * ORBIT_TRANSFER_SLOP);
    const childVInf = Math.abs(transfer.vt2 - transfer.v2);
    addBreakdown(breakdown, 'Capture to child parking orbit', parkingEscapeOrCaptureDv(child, childVInf));
    addDestinationFromParking(breakdown, destinationId, child, destOrbit, destSurface);
    return true;
  }

  // Child moon/body -> parent body: get to child parking, escape with the parent-frame transfer v∞,
  // match parent parking orbit, then transfer locally to destination.
  if (bodyParentId(sourceBodyId) === destBodyId && sourceBody.orbit) {
    const child = sourceBody;
    const childOrbit = sourceBody.orbit;
    const parent = destBody;
    const childParkR = parkingOrbitRadius(child);
    const parentParkR = parkingOrbitRadius(parent);
    if (sourceSurface?.bodyId === child.id) addBreakdown(breakdown, `Launch to parking orbit: ${nodeName(sourceId)}`, departureToOrbitParDv(sourceId, child, sourceSurface.altitude));
    if (sourceOrbit?.bodyId === child.id) addBreakdown(breakdown, 'Orbit transfer to parking', hohmannOrbitTransferDv(child, sourceOrbit.radius, childParkR));
    const transfer = hohmannParts(parent, childOrbit.radius, parentParkR);
    const departureVInf = Math.abs(transfer.vt1 - transfer.v1);
    addBreakdown(breakdown, 'Escape from child parking orbit', parkingEscapeOrCaptureDv(child, departureVInf));
    addBreakdown(breakdown, 'Parent-frame capture to parking', transfer.dv2 * ORBIT_TRANSFER_SLOP);
    addDestinationFromParking(breakdown, destinationId, parent, destOrbit, destSurface);
    return true;
  }

  return false;
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
  const sourceSurface = locationSurface(sourceId);
  const destSurface = locationSurface(destinationId);
  const sourceOrbit = locationOrbit(sourceId);
  const destOrbit = locationOrbit(destinationId);

  if (isAboardLocation(sourceId)) addBreakdown(breakdown, `Undock: ${nodeName(sourceId)}`, 15);

  if (sameClusterTravel) {
    addBreakdown(breakdown, 'Cluster local transfer', clusterTravelParDv(sameClusterTravel.level, sameClusterTravel.distance));
  } else if (selectedTransfer) {
    const transferSourceCluster = sourceIsCluster(sourceId);
    const clusterSourceLevel = transferSourceCluster ? clusterTemplateForPoiId(sourceId) : undefined;
    if (transferSourceCluster && clusterSourceLevel) {
      addBreakdown(breakdown, 'Cluster exit + escape vector', clusterEscapeParDv(clusterSourceLevel, selectedTransfer.departureVInf));
    } else {
      const sourceBody = safeBody(selectedTransfer.sourceBodyId);
      if (sourceBody) {
        const sourceParkingR = parkingOrbitRadius(sourceBody);
        if (sourceSurface?.bodyId === selectedTransfer.sourceBodyId) {
          addBreakdown(breakdown, `Launch to parking orbit: ${nodeName(sourceId)}`, departureToOrbitParDv(sourceId, sourceBody, sourceSurface.altitude));
        } else if (sourceOrbit?.bodyId === selectedTransfer.sourceBodyId) {
          addBreakdown(breakdown, 'Orbit transfer to parking', hohmannOrbitTransferDv(sourceBody, sourceOrbit.radius, sourceParkingR));
        }
        addBreakdown(breakdown, 'Escape from parking orbit', parkingEscapeOrCaptureDv(sourceBody, selectedTransfer.departureVInf));
      } else {
        addBreakdown(breakdown, 'SOI escape insertion', selectedTransfer.departureVInf * 1.18 + 45);
      }
    }

    addBreakdown(breakdown, 'Midcourse correction reserve', Math.max(8, selectedTransfer.totalDeltaV * 0.03));

    const clusterDestLevel = clusterTemplateForPoiId(destinationId);
    if (clusterDestLevel) {
      addBreakdown(breakdown, 'Cluster entry + local approach', clusterEntryParDv(clusterDestLevel, selectedTransfer.arrivalVInf));
    } else {
      const destBody = safeBody(selectedTransfer.destinationBodyId);
      if (destBody) {
        const destParkingR = parkingOrbitRadius(destBody);
        addBreakdown(breakdown, 'Capture to parking orbit', parkingEscapeOrCaptureDv(destBody, selectedTransfer.arrivalVInf));
        if (destOrbit?.bodyId === selectedTransfer.destinationBodyId) {
          addBreakdown(breakdown, 'Orbit transfer to destination', hohmannOrbitTransferDv(destBody, destParkingR, destOrbit.radius));
        } else if (destSurface?.bodyId === selectedTransfer.destinationBodyId) {
          addBreakdown(breakdown, `Descent/landing: ${nodeName(destinationId)}`, descentLandingParDv(destinationId));
        }
      } else {
        addBreakdown(breakdown, 'Arrival/capture reserve', 35 + selectedTransfer.arrivalVInf * 0.55);
      }
    }
  } else {
    const sourceBodyId = sourceSurface?.bodyId ?? sourceOrbit?.bodyId;
    const destBodyId = destSurface?.bodyId ?? destOrbit?.bodyId;
    const body = sourceBodyId && sourceBodyId === destBodyId ? safeBody(sourceBodyId) : undefined;
    if (body) {
      const parkR = parkingOrbitRadius(body);
      if (sourceSurface) addBreakdown(breakdown, `Launch to parking orbit: ${nodeName(sourceId)}`, departureToOrbitParDv(sourceId, body, sourceSurface.altitude));
      if (sourceOrbit) addBreakdown(breakdown, 'Orbit transfer to parking', hohmannOrbitTransferDv(body, sourceOrbit.radius, parkR));
      if (destOrbit) addBreakdown(breakdown, 'Orbit transfer to destination', hohmannOrbitTransferDv(body, parkR, destOrbit.radius));
      if (destSurface) addBreakdown(breakdown, `Descent/landing: ${nodeName(destinationId)}`, descentLandingParDv(destinationId));
    } else if (!addParentChildTransfer(breakdown, sourceId, destinationId, sourceSurface, destSurface, sourceOrbit, destOrbit)
      && bodyNodeIdForLocation(sourceId) !== bodyNodeIdForLocation(destinationId)) {
      addBreakdown(breakdown, 'Transfer reserve', 120);
    }
  }

  if (isAboardLocation(destinationId)) addBreakdown(breakdown, `Dock: ${nodeName(destinationId)}`, 18);

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
