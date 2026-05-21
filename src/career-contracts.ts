import { ESTELLA_NODES_BY_ID } from './content/estella';
import { estellaDisplayPath, estellaSelectableNavTargets } from './content/estella/navigation';
import { type EstellaTransferOption, generateEstellaMission } from './estella-mission';
import { COL_HUD, COL_HUD_DIM, COL_SUCCESS, COL_TITLE, COL_WARNING } from './hud-layout';
import { estimateEstellaMissionCost, formatCredits, type MissionCostQuote } from './mission-cost';

export type CareerContractClass = 'local' | 'moderate' | 'long';

export interface CareerContract {
  id: string;
  sourceId: string;
  destinationId: string;
  destinationName: string;
  destinationPath: string;
  routeClass: CareerContractClass;
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

function makeContract(sourceId: string, destinationId: string, routeClass: CareerContractClass, index: number): CareerContract {
  const mission = generateEstellaMission(sourceId, destinationId);
  const selectedTransfer = preferredContractTransfer(mission.transferOptions);
  const quote = estimateEstellaMissionCost(sourceId, destinationId, selectedTransfer);
  const target = estellaSelectableNavTargets().find(row => row.id === destinationId);
  return {
    id: `${sourceId}->${destinationId}:${index}`,
    sourceId,
    destinationId,
    destinationName: target?.name ?? ESTELLA_NODES_BY_ID.get(destinationId)?.name ?? destinationId,
    destinationPath: target?.path ?? estellaDisplayPath(destinationId),
    routeClass,
    quote,
    selectedTransfer,
  };
}

export function generateCareerContracts(sourceId: string): CareerContract[] {
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
      contracts.push(makeContract(sourceId, destinationId, routeClass, contracts.length));
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
      contracts.push(makeContract(sourceId, destinationId, classifyRoute(sourceId, destinationId), contracts.length));
    }
  }

  return contracts;
}

export function careerContractClassLabel(routeClass: CareerContractClass): string {
  if (routeClass === 'local') return 'LOCAL';
  if (routeClass === 'moderate') return 'MOD';
  return 'LONG';
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 3))}...`;
}

export function drawCareerContractBoard(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sourceId: string,
  contracts: CareerContract[],
  selectedIndex: number,
  money: number = 0,
): void {
  const W = canvas.width;
  const H = canvas.height;
  const sourcePath = estellaDisplayPath(sourceId);
  const selected = contracts[selectedIndex];
  const resetSelected = selectedIndex === contracts.length;

  ctx.fillStyle = '#030611';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_TITLE;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('TEAMSTERS\' GUILD CONTRACT BBS', W / 2, 42);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '13px monospace';
  ctx.fillText(`LOCAL BOARD: ${truncate(sourcePath, 84)}   CASH: ${formatCredits(money)}`, W / 2, 66);

  const margin = 28;
  const listW = Math.min(650, Math.max(470, W * 0.55));
  const detailX = margin + listW + 18;
  const detailW = Math.max(280, W - detailX - margin);
  const panelY = 92;
  const panelH = H - 142;

  ctx.fillStyle = 'rgba(0, 120, 120, 0.04)';
  ctx.strokeStyle = '#1b4a4a';
  ctx.fillRect(margin, panelY, listW, panelH);
  ctx.strokeRect(margin, panelY, listW, panelH);

  const rowH = Math.min(58, Math.max(48, Math.floor((panelH - 24) / Math.max(1, contracts.length + 1))));
  ctx.textAlign = 'left';
  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];
    const quote = contract.quote;
    const y = panelY + 24 + i * rowH;
    const isSelected = i === selectedIndex;
    if (isSelected) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.fillRect(margin + 8, y - 17, listW - 16, rowH - 4);
      ctx.strokeStyle = COL_SUCCESS;
      ctx.strokeRect(margin + 8, y - 17, listW - 16, rowH - 4);
    }

    ctx.fillStyle = isSelected ? COL_SUCCESS : COL_HUD;
    ctx.font = isSelected ? 'bold 13px monospace' : '13px monospace';
    ctx.fillText(`${isSelected ? '▶' : ' '} ${careerContractClassLabel(contract.routeClass).padEnd(5)} TO: ${truncate(contract.destinationName, 48)}`, margin + 18, y);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '11px monospace';
    ctx.fillText(`  CARGO: ${truncate(quote.cargoLabel, 34)}, ${quote.cargoMassTons}t`, margin + 18, y + 16);
    ctx.fillStyle = COL_HUD;
    ctx.fillText(`  PAY: ${formatCredits(quote.grossPay)}   PAR: ${quote.parDv} m/s   NET: ~${formatCredits(quote.expectedMargin)}`, margin + 18, y + 32);
  }

  const resetY = panelY + 24 + contracts.length * rowH;
  if (resetSelected) {
    ctx.fillStyle = 'rgba(255, 170, 0, 0.12)';
    ctx.fillRect(margin + 8, resetY - 17, listW - 16, rowH - 4);
    ctx.strokeStyle = COL_WARNING;
    ctx.strokeRect(margin + 8, resetY - 17, listW - 16, rowH - 4);
  }
  ctx.fillStyle = resetSelected ? COL_WARNING : COL_HUD_DIM;
  ctx.font = resetSelected ? 'bold 13px monospace' : '13px monospace';
  ctx.fillText(`${resetSelected ? '▶' : ' '} RESET CAREER PROFILE`, margin + 18, resetY);
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '11px monospace';
  ctx.fillText('  Return to Caravanserai and clear money to 0 cr.', margin + 18, resetY + 16);

  ctx.fillStyle = 'rgba(0, 255, 170, 0.05)';
  ctx.strokeStyle = '#1b4a4a';
  ctx.fillRect(detailX, panelY, detailW, panelH);
  ctx.strokeRect(detailX, panelY, detailW, panelH);

  ctx.fillStyle = COL_SUCCESS;
  ctx.font = 'bold 15px monospace';
  ctx.fillText('CONTRACT DETAIL', detailX + 18, panelY + 30);

  if (resetSelected) {
    ctx.fillStyle = COL_WARNING;
    ctx.font = 'bold 15px monospace';
    ctx.fillText('RESET CAREER', detailX + 18, panelY + 72);
    ctx.fillStyle = COL_HUD;
    ctx.font = '13px monospace';
    ctx.fillText('Press Enter to reset location and money.', detailX + 18, panelY + 102);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '12px monospace';
    ctx.fillText('Location: Caravanserai Main Commercial Dock', detailX + 18, panelY + 130);
    ctx.fillText('Money: 0 cr', detailX + 18, panelY + 148);
  } else if (selected) {
    const q = selected.quote;
    const lines = [
      ['Origin', truncate(sourcePath, 54)],
      ['Destination', truncate(selected.destinationPath, 54)],
      ['Class', careerContractClassLabel(selected.routeClass)],
      ['Cargo', `${q.cargoLabel}, ${q.cargoMassTons}t`],
      ['Loaded mass', `${q.loadedMassTons}t`],
      ['Par ΔV', `${q.parDv} m/s`],
      ['Est. fuel', formatCredits(q.parFuelCost)],
      ['Pay', formatCredits(q.grossPay)],
      ['Expected net', formatCredits(q.expectedMargin)],
    ];
    let y = panelY + 62;
    for (const [label, value] of lines) {
      ctx.fillStyle = COL_HUD_DIM;
      ctx.font = '11px monospace';
      ctx.fillText(label.toUpperCase(), detailX + 18, y);
      ctx.fillStyle = label === 'Pay' ? COL_SUCCESS : label === 'Expected net' ? COL_WARNING : COL_HUD;
      ctx.font = label === 'Pay' || label === 'Expected net' ? 'bold 13px monospace' : '13px monospace';
      ctx.fillText(value, detailX + 18, y + 16);
      y += 42;
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '13px monospace';
  ctx.fillText('W/S: select   Enter: accept/reset   A or Backspace: main menu   L: missions', W / 2, H - 24);
}
