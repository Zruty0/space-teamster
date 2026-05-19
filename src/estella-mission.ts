import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { estellaDisplayPath } from './content/estella/navigation';
import { type Placement, type WorldNode } from './content/types';
import { circularBodyStateInFrame, lambertVelocity } from './lambert';
import { estimateEstellaMissionCost, formatCredits } from './mission-cost';
import { bodyById, type BodyDef } from './world';

export interface EstellaMissionLeg {
  title: string;
  detail: string;
}

export interface EstellaTransferOption {
  id: 'now' | 'soon' | 'best';
  label: string;
  waitTime: number;
  transferTime: number;
  departureVInf: number;
  departureVInfAngle: number;
  arrivalVInf: number;
  totalDeltaV: number;
  sourceBodyId: string;
  destinationBodyId: string;
}

export interface EstellaGeneratedMissionState {
  sourceId: string;
  destinationId: string;
  title: string;
  subtitle: string;
  legs: EstellaMissionLeg[];
  transferOptions: EstellaTransferOption[];
  selectedTransferOption: number;
}

function nodeName(id: string): string {
  const node = ESTELLA_NODES_BY_ID.get(id);
  if (!node) return id;
  return node.catalogId && node.catalogId !== node.name ? `${node.catalogId} ${node.name}` : node.name;
}

function chainToRoot(nodeId: string): WorldNode[] {
  const chain: WorldNode[] = [];
  let current = ESTELLA_NODES_BY_ID.get(nodeId);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) break;
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

function placementVerbUp(node: WorldNode, placement: Placement | undefined): EstellaMissionLeg {
  if (!placement) return { title: `Depart ${nodeName(node.id)}`, detail: 'Leave current location.' };
  if (placement.kind === 'aboard') {
    return { title: `Undock from ${nodeName(node.id)}`, detail: `Exit ${nodeName(placement.parentId)} local map.` };
  }
  if (placement.kind === 'surface') {
    return { title: `Launch from ${nodeName(node.id)}`, detail: `Depart surface of ${nodeName(placement.parentId)}.` };
  }
  if (placement.kind === 'cluster-member') {
    return { title: `Leave ${nodeName(node.id)}`, detail: `Navigate local cluster space toward ${nodeName(placement.parentId)}.` };
  }
  return { title: `Depart orbit of ${nodeName(node.id)}`, detail: `Enter transfer context around ${nodeName(placement.parentId)}.` };
}

function placementVerbDown(node: WorldNode, placement: Placement | undefined): EstellaMissionLeg {
  if (!placement) return { title: `Arrive at ${nodeName(node.id)}`, detail: 'Arrive at target location.' };
  if (placement.kind === 'aboard') {
    return { title: `Dock at ${nodeName(node.id)}`, detail: `Access point aboard ${nodeName(placement.parentId)}.` };
  }
  if (placement.kind === 'surface') {
    const angle = placement.angle === undefined ? 'authored surface site' : `${(placement.angle * 180 / Math.PI).toFixed(1)}° radial site`;
    return { title: `Land at ${nodeName(node.id)}`, detail: `Descend to ${angle} on ${nodeName(placement.parentId)}.` };
  }
  if (placement.kind === 'cluster-member') {
    return { title: `Cluster-hop to ${nodeName(node.id)}`, detail: `Approach local coordinates (${placement.x.toFixed(0)}, ${placement.y.toFixed(0)}) in ${nodeName(placement.parentId)}.` };
  }
  if (placement.orbit?.kind === 'circular') {
    return { title: `Rendezvous with ${nodeName(node.id)}`, detail: `${placement.usage ?? 'orbital'} circular orbit, r=${(placement.orbit.radius / 1000).toFixed(0)}km.` };
  }
  if (placement.orbit?.kind === 'keplerian') {
    return { title: `Intercept ${nodeName(node.id)}`, detail: `${placement.usage ?? 'orbital'} Keplerian orbit, a=${(placement.orbit.semiMajorAxis / 1000).toFixed(0)}km, e=${placement.orbit.eccentricity.toFixed(2)}.` };
  }
  return { title: `Rendezvous with ${nodeName(node.id)}`, detail: `${placement.usage ?? 'orbital'} orbit.` };
}

function dedupeConsecutive(legs: EstellaMissionLeg[]): EstellaMissionLeg[] {
  const out: EstellaMissionLeg[] = [];
  for (const leg of legs) {
    const prev = out[out.length - 1];
    if (prev && prev.title === leg.title && prev.detail === leg.detail) continue;
    out.push(leg);
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

function bodyPathToRoot(bodyId: string): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = bodyId;
  while (current && !seen.has(current)) {
    seen.add(current);
    path.push(current);
    current = bodyById(current).orbit?.parentBodyId;
  }
  return path;
}

function transferBodyPair(sourceId: string, destinationId: string): { source: BodyDef; destination: BodyDef; parent: BodyDef } | null {
  const sourceBodyId = bodyNodeIdForLocation(sourceId);
  const destinationBodyId = bodyNodeIdForLocation(destinationId);
  if (!sourceBodyId || !destinationBodyId || sourceBodyId === destinationBodyId) return null;
  const sourcePath = bodyPathToRoot(sourceBodyId);
  const destinationPath = bodyPathToRoot(destinationBodyId);
  for (const sourceCandidate of sourcePath) {
    const source = bodyById(sourceCandidate);
    const sourceParentId = source.orbit?.parentBodyId;
    if (!sourceParentId) continue;
    for (const destinationCandidate of destinationPath) {
      if (sourceCandidate === destinationCandidate) continue;
      const destination = bodyById(destinationCandidate);
      if (destination.orbit?.parentBodyId === sourceParentId) {
        return { source, destination, parent: bodyById(sourceParentId) };
      }
    }
  }
  return null;
}

function transferEstimate(source: BodyDef, destination: BodyDef, parent: BodyDef, waitTime: number, tof: number): EstellaTransferOption | null {
  const s0 = circularBodyStateInFrame(source.id, parent.id, waitTime);
  const d1 = circularBodyStateInFrame(destination.id, parent.id, waitTime + tof);
  if (!s0 || !d1) return null;
  const lambert = lambertVelocity(s0, d1, tof, parent.gm);
  if (!lambert) return null;
  const depVx = lambert.v1x - s0.vx;
  const depVy = lambert.v1y - s0.vy;
  const departureVInf = Math.hypot(depVx, depVy);
  const departureVInfAngle = Math.atan2(depVy, depVx);
  const arrivalVInf = Math.hypot(lambert.v2x - d1.vx, lambert.v2y - d1.vy);
  const totalDeltaV = departureVInf + arrivalVInf;
  if (!Number.isFinite(totalDeltaV)) return null;
  return { id: 'now', label: 'Depart now', waitTime, transferTime: tof, departureVInf, departureVInfAngle, arrivalVInf, totalDeltaV, sourceBodyId: source.id, destinationBodyId: destination.id };
}

function computeTransferOptions(sourceId: string, destinationId: string): EstellaTransferOption[] {
  const pair = transferBodyPair(sourceId, destinationId);
  if (!pair || !pair.source.orbit || !pair.destination.orbit) return [];
  const { source, destination, parent } = pair;
  const sourceOrbit = source.orbit!;
  const destinationOrbit = destination.orbit!;
  const r1 = sourceOrbit.radius;
  const r2 = destinationOrbit.radius;
  const hohmannTime = Math.PI * Math.sqrt((((r1 + r2) * 0.5) ** 3) / parent.gm);
  const n1 = Math.sqrt(parent.gm / (r1 ** 3));
  const n2 = Math.sqrt(parent.gm / (r2 ** 3));
  const synodic = Math.PI * 2 / Math.max(1e-9, Math.abs(n1 - n2));
  const maxWait = Math.min(Math.max(synodic * 1.15, 14 * 86_400), 140 * 86_400);
  const minTof = Math.max(0.35 * hohmannTime, 12 * 3_600);
  const maxTof = Math.max(2.4 * hohmannTime, minTof * 1.5);

  const bestForWait = (waitTime: number): EstellaTransferOption | null => {
    let best: EstellaTransferOption | null = null;
    for (let i = 0; i <= 40; i++) {
      const tof = minTof + (maxTof - minTof) * i / 40;
      const est = transferEstimate(source, destination, parent, waitTime, tof);
      if (est && (!best || est.totalDeltaV < best.totalDeltaV)) best = est;
    }
    return best;
  };

  const now = bestForWait(0);
  let best = now;
  const samples: EstellaTransferOption[] = [];
  for (let i = 0; i <= 48; i++) {
    const wait = maxWait * i / 48;
    const est = bestForWait(wait);
    if (!est) continue;
    samples.push(est);
    if (!best || est.totalDeltaV < best.totalDeltaV) best = est;
  }
  if (!best) return [];
  let soon = now ?? best;
  const threshold = best.totalDeltaV * 2;
  for (const sample of samples) {
    if (sample.totalDeltaV <= threshold) {
      soon = sample;
      break;
    }
  }

  const withMeta = (option: EstellaTransferOption, id: EstellaTransferOption['id'], label: string): EstellaTransferOption => ({ ...option, id, label });
  const raw = [
    now ? withMeta(now, 'now', 'Depart now') : null,
    withMeta(soon, 'soon', 'Earliest <2x best'),
    withMeta(best, 'best', 'Lowest ΔV'),
  ].filter((option): option is EstellaTransferOption => !!option);
  const deduped: EstellaTransferOption[] = [];
  for (const option of raw) {
    if (deduped.some(existing => Math.abs(existing.waitTime - option.waitTime) < 60 && Math.abs(existing.totalDeltaV - option.totalDeltaV) < 1)) continue;
    deduped.push(option);
  }
  return deduped;
}

export function generateEstellaMission(sourceId: string, destinationId: string): EstellaGeneratedMissionState {
  const srcChain = chainToRoot(sourceId);
  const dstChain = chainToRoot(destinationId);
  const lca = lowestCommonAncestor(srcChain, dstChain);
  const lcaId = lca?.id;
  const up = lcaId ? srcChain.slice(0, srcChain.findIndex(node => node.id === lcaId)) : srcChain;
  const down = lcaId ? dstChain.slice(0, dstChain.findIndex(node => node.id === lcaId)).reverse() : dstChain.slice().reverse();

  const legs: EstellaMissionLeg[] = [
    { title: `START: ${nodeName(sourceId)}`, detail: estellaDisplayPath(sourceId) },
    ...up.map(node => placementVerbUp(node, node.placement)),
    ...(lca ? [{ title: `Transfer context: ${nodeName(lca.id)}`, detail: 'Route crosses this common parent in the Estella hierarchy.' }] : []),
    ...down.map(node => placementVerbDown(node, node.placement)),
    { title: `END: ${nodeName(destinationId)}`, detail: estellaDisplayPath(destinationId) },
  ];

  return {
    sourceId,
    destinationId,
    title: `Generated Mission: ${nodeName(sourceId)} → ${nodeName(destinationId)}`,
    subtitle: 'Prototype generated from Estella hierarchy and exact-authored placements.',
    legs: dedupeConsecutive(legs),
    transferOptions: computeTransferOptions(sourceId, destinationId),
    selectedTransferOption: 0,
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 3_600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}h`;
  return `${(seconds / 86_400).toFixed(1)}d`;
}

export function drawEstellaGeneratedMission(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mission: EstellaGeneratedMissionState,
): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#030611';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('ESTELLA GENERATED MISSION', W / 2, 42);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '13px monospace';
  ctx.fillText(mission.subtitle, W / 2, 66);

  const x = Math.max(36, W / 2 - 460);
  const y = 94;
  const w = Math.min(920, W - 72);
  const h = H - 150;
  ctx.fillStyle = 'rgba(0, 120, 120, 0.05)';
  ctx.strokeStyle = '#1b4a4a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.textAlign = 'left';
  ctx.fillStyle = COL_SUCCESS;
  ctx.font = 'bold 15px monospace';
  ctx.fillText(mission.title, x + 18, y + 28);

  const selectedTransfer = mission.transferOptions[mission.selectedTransferOption];
  const quote = estimateEstellaMissionCost(mission.sourceId, mission.destinationId, selectedTransfer);
  const optionBlockH = mission.transferOptions.length ? 112 : 0;
  const quoteY = y + 46;
  const quoteBlockH = 68;
  ctx.fillStyle = 'rgba(0, 255, 170, 0.06)';
  ctx.fillRect(x + 18, quoteY - 14, w - 36, quoteBlockH);
  ctx.strokeStyle = COL_SUCCESS;
  ctx.strokeRect(x + 18, quoteY - 14, w - 36, quoteBlockH);
  ctx.fillStyle = COL_SUCCESS;
  ctx.font = 'bold 13px monospace';
  ctx.fillText('CONTRACT COST ESTIMATE', x + 28, quoteY + 2);
  ctx.fillStyle = COL_HUD;
  ctx.font = '12px monospace';
  ctx.fillText(`Cargo: ${quote.cargoLabel}, ${quote.cargoMassTons}t   Loaded mass: ${quote.loadedMassTons}t   Par ΔV: ${quote.parDv.toFixed(0)}m/s`, x + 28, quoteY + 24);
  ctx.fillText(`Par fuel: ${formatCredits(quote.parFuelCost)}   Pay @ ${quote.generosity.toFixed(2)}x: ${formatCredits(quote.grossPay)}   Expected margin: ${formatCredits(quote.expectedMargin)}`, x + 28, quoteY + 44);

  const transferCostLabels = new Set(['Cluster exit + escape vector', 'Cluster entry + local approach', 'SOI escape insertion', 'Escape from parking orbit', 'Capture to parking orbit', 'Midcourse correction reserve', 'Atmospheric entry targeting', 'Arrival/capture reserve', 'Transfer reserve']);
  const transferItems = quote.breakdown.filter(item => transferCostLabels.has(item.label));
  const localItems = quote.breakdown.filter(item => !transferCostLabels.has(item.label));
  const transferLegIndex = mission.legs.findIndex(leg => leg.title.startsWith('Transfer context:'));
  const legCostLines = new Map<number, string[]>();
  const stageLegIndices = mission.legs
    .map((leg, index) => ({ leg, index }))
    .filter(({ leg, index }) => index !== 0 && index !== mission.legs.length - 1 && index !== transferLegIndex)
    .map(({ index }) => index);
  for (let i = 0; i < Math.min(localItems.length, stageLegIndices.length); i++) {
    const item = localItems[i];
    legCostLines.set(stageLegIndices[i], [`Par cost: ${item.dv.toFixed(0)} m/s — ${item.label}`]);
  }
  if (transferLegIndex >= 0 && transferItems.length) {
    legCostLines.set(transferLegIndex, transferItems.map(item => `${item.label} ${item.dv.toFixed(0)}m/s`));
  }

  const rowH = 60;
  const rowStartY = quoteY + quoteBlockH + 24;
  const maxRows = Math.floor((y + h - optionBlockH - 16 - rowStartY) / rowH);
  for (let i = 0; i < Math.min(maxRows, mission.legs.length); i++) {
    const leg = mission.legs[i];
    const rowY = rowStartY + i * rowH;
    ctx.fillStyle = i === 0 || i === mission.legs.length - 1 ? COL_WARNING : COL_HUD;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${(i + 1).toString().padStart(2, '0')}. ${leg.title}`, x + 24, rowY);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '11px monospace';
    const detail = leg.detail.length > 118 ? `${leg.detail.slice(0, 115)}...` : leg.detail;
    ctx.fillText(detail, x + 54, rowY + 16);
    const costLines = legCostLines.get(i);
    if (costLines?.length) {
      ctx.fillStyle = COL_SUCCESS;
      const costText = costLines.join('  |  ');
      ctx.fillText(costText.length > 118 ? `${costText.slice(0, 115)}...` : costText, x + 54, rowY + 34);
    }
  }

  if (mission.transferOptions.length) {
    const optY = y + h - optionBlockH + 16;
    ctx.fillStyle = COL_SUCCESS;
    ctx.font = 'bold 13px monospace';
    ctx.fillText('TRANSFER WINDOW OPTIONS', x + 24, optY);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '11px monospace';
    ctx.fillText('A/D: choose departure time. Estimates use approximate Lambert/porkchop sampling.', x + 250, optY);
    for (let i = 0; i < mission.transferOptions.length; i++) {
      const opt = mission.transferOptions[i];
      const selected = i === mission.selectedTransferOption;
      const rowY = optY + 24 + i * 22;
      ctx.fillStyle = selected ? 'rgba(0, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(x + 18, rowY - 13, w - 36, 18);
      ctx.strokeStyle = selected ? COL_SUCCESS : '#1b4a4a';
      ctx.strokeRect(x + 18, rowY - 13, w - 36, 18);
      ctx.fillStyle = selected ? COL_SUCCESS : COL_HUD;
      ctx.font = selected ? 'bold 12px monospace' : '12px monospace';
      const text = `${selected ? '▶' : ' '} ${opt.label.padEnd(18)} wait ${formatDuration(opt.waitTime).padStart(6)}  TOF ${formatDuration(opt.transferTime).padStart(6)}  ΔV ${(opt.totalDeltaV).toFixed(0)}m/s  dep ${(opt.departureVInf).toFixed(0)}  arr ${(opt.arrivalVInf).toFixed(0)}`;
      ctx.fillText(text, x + 28, rowY);
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '13px monospace';
  ctx.fillText('Enter: start flying generated mission   L: missions', W / 2, H - 24);
}
