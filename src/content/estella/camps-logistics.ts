import { ESTELLA_NODES_BY_ID } from './index';
import { CAMPS_TRADE_WORLDS } from './camps-sites';
import { GAIA_SURFACE_SITES, RICHELIEU } from './gaia-logistics';
import { DAHAI_ORBITAL, DAHAI_SURFACE_SITES } from './dahai-sites';
import { BALOR_TRADE_SITES } from './balor-logistics';
import { canonicalEstellaLocationId } from './location-aliases';
import type { FactionContractCandidate, FactionContractContext } from './faction-contracts';

type TradeWorld = typeof CAMPS_TRADE_WORLDS[number];
function surface(world: TradeWorld, id: string): boolean { return (world.sites as readonly string[]).includes(id); }
function local(world: TradeWorld, id: string): boolean {
  let n = ESTELLA_NODES_BY_ID.get(id);
  if (n?.placement?.kind === 'aboard') n = ESTELLA_NODES_BY_ID.get(n.placement.parentId);
  return n?.placement?.parentId === world.bodyId;
}
function externalKey(id: string): string {
  id = canonicalEstellaLocationId(id);
  if (id === RICHELIEU || (GAIA_SURFACE_SITES as readonly string[]).includes(id)) return 'gaia-trade';
  if (id === DAHAI_ORBITAL || (DAHAI_SURFACE_SITES as readonly string[]).includes(id)) return 'dahai-trade';
  if ((BALOR_TRADE_SITES as readonly string[]).includes(id)) return 'balor-trade';
  const camps = CAMPS_TRADE_WORLDS.find(w => id === w.hub || surface(w, id));
  return camps?.bodyId ?? id;
}
export function campsDispatchUsesTerminal(bodyId: string, key: string, worldTime: number): boolean {
  const day = Math.floor(worldTime / 86400);
  let h = 2166136261;
  for (const ch of `${bodyId}:${key}:${Math.floor(day / 2)}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return (day & 1) === 0 ? (h & 1) === 0 : (h & 1) !== 0;
}
function route(c: FactionContractCandidate, world: TradeWorld, time: number): FactionContractCandidate {
  // Pike's authored strip-to-refinery lift is a facility-bound process leg,
  // not an ordinary export sale to be diverted to a customs warehouse.
  if (c.factionId === 'pike-mining-companies' && c.templateId.includes(':strip-to-cinderhook:')) return c;
  const outbound = surface(world, c.sourceId), inbound = surface(world, c.destinationId);
  if (outbound === inbound || c.category === 'certification' || c.travelMode || c.destinationLeadAngleFromSource !== undefined) return c;
  const external = outbound ? c.destinationId : c.sourceId;
  if (local(world, external)) return c;
  const site = outbound ? c.sourceId : c.destinationId;
  const key = c.campsDispatchKey ?? `${c.factionId}:${site}:${externalKey(external)}:${outbound ? 'out' : 'in'}:${c.category ?? 'freight'}`;
  const via = campsDispatchUsesTerminal(world.bodyId, key, time);
  return {
    ...c,
    sourceId: via && outbound ? world.hub : c.sourceId,
    destinationId: via && inbound ? world.hub : c.destinationId,
    details: [c.details, `${outbound ? 'Originating' : 'Receiving'} ${world.name} site: ${ESTELLA_NODES_BY_ID.get(site)?.name ?? site}. ${via ? `${world.hubName} consolidation; local transport arranged by the issuer.` : `Direct ${world.name} surface handling.`}`].filter(Boolean).join(' '),
    completionMessage: via && inbound ? `${c.issuerName ?? c.factionName} thanks you for successfully completing this contract.` : c.completionMessage,
  };
}

/** Outermost adapter, after existing Gaia/Dahai dispatch. Hartwell and Tessera
 * can both occur in one order and choose independently. Kuznia, Kalyna, Pike,
 * Svarog, local station services, reserves and accepted contracts are untouched. */
export function generateCampsRoutedContracts(ctx: FactionContractContext, raw: (ctx: FactionContractContext) => FactionContractCandidate[]): FactionContractCandidate[] {
  const world = CAMPS_TRADE_WORLDS.find(w => w.hub === ctx.sourceId);
  const sources = world ? [ctx.sourceId, ...world.sites] : [ctx.sourceId];
  return sources.flatMap(sourceId => raw({ ...ctx, sourceId })).flatMap(c => {
    const dispatched = CAMPS_TRADE_WORLDS.reduce((candidate, w) => route(candidate, w, ctx.worldTime), c);
    return dispatched.sourceId === ctx.sourceId ? [dispatched] : [];
  });
}
