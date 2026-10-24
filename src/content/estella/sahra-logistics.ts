import { ESTELLA_NODES_BY_ID } from './index';
import { SAHRA_SURFACE_SITES, SUHAIL } from './sahra-sites';
import { GAIA_SURFACE_SITES, RICHELIEU } from './gaia-logistics';
import { DAHAI_ORBITAL, DAHAI_SURFACE_SITES } from './dahai-sites';
import { CAMPS_TRADE_WORLDS } from './camps-sites';
import { BALOR_TRADE_SITES } from './balor-logistics';
import { canonicalEstellaLocationId } from './location-aliases';
import type { FactionContractCandidate, FactionContractContext } from './faction-contracts';

export function isSahraSurface(id: string): boolean { return (SAHRA_SURFACE_SITES as readonly string[]).includes(id); }
function local(id: string): boolean {
  let n = ESTELLA_NODES_BY_ID.get(id);
  if (n?.placement?.kind === 'aboard') n = ESTELLA_NODES_BY_ID.get(n.placement.parentId);
  return n?.placement?.parentId === 'estella-ix';
}
function externalKey(id: string): string {
  id = canonicalEstellaLocationId(id);
  if (id === RICHELIEU || (GAIA_SURFACE_SITES as readonly string[]).includes(id)) return 'gaia-trade';
  if (id === DAHAI_ORBITAL || (DAHAI_SURFACE_SITES as readonly string[]).includes(id)) return 'dahai-trade';
  if ((BALOR_TRADE_SITES as readonly string[]).includes(id)) return 'balor-trade';
  return CAMPS_TRADE_WORLDS.find(w => id === w.hub || (w.sites as readonly string[]).includes(id))?.bodyId ?? id;
}
export function sahraDispatchUsesTerminal(key: string, time: number): boolean {
  const day = Math.floor(time / 86400);
  let h = 2166136261;
  for (const ch of `sahra:${key}:${Math.floor(day / 2)}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return (day & 1) === 0 ? (h & 1) === 0 : (h & 1) !== 0;
}
function route(c: FactionContractCandidate, time: number): FactionContractCandidate {
  const outbound = isSahraSurface(c.sourceId), inbound = isSahraSurface(c.destinationId);
  if (outbound === inbound || c.category === 'certification' || c.travelMode || c.destinationLeadAngleFromSource !== undefined) return c;
  const external = outbound ? c.destinationId : c.sourceId;
  if (local(external)) return c;
  const site = outbound ? c.sourceId : c.destinationId;
  const key = c.sahraDispatchKey ?? c.campsDispatchKey ?? c.dahaiDispatchKey ?? c.gaiaDispatchKey
    ?? `${c.factionId}:${site}:${externalKey(external)}:${outbound ? 'out' : 'in'}:${c.category ?? 'freight'}`;
  const via = sahraDispatchUsesTerminal(key, time);
  return {
    ...c,
    sourceId: via && outbound ? SUHAIL : c.sourceId,
    destinationId: via && inbound ? SUHAIL : c.destinationId,
    details: [c.details, `${outbound ? 'Originating' : 'Receiving'} Sahra site: ${ESTELLA_NODES_BY_ID.get(site)?.name ?? site}. ${via ? 'Suhail Anchorage consolidation; local transport arranged by the issuer.' : 'Direct Sahra surface handling.'}`].filter(Boolean).join(' '),
    completionMessage: via && inbound ? `${c.issuerName ?? c.factionName} thanks you for successfully completing this contract.` : c.completionMessage,
  };
}

/** Applied after other worlds, before quotes. Native Suhail and Raqib activity,
 * local Institute shuttles, timed/contact work and accepted orders stay intact. */
export function generateSahraRoutedContracts(ctx: FactionContractContext, raw: (ctx: FactionContractContext) => FactionContractCandidate[]): FactionContractCandidate[] {
  const sources = ctx.sourceId === SUHAIL ? [SUHAIL, ...SAHRA_SURFACE_SITES] : [ctx.sourceId];
  return sources.flatMap(sourceId => raw({ ...ctx, sourceId })).flatMap(c => {
    const dispatched = route(c, ctx.worldTime);
    return dispatched.sourceId === ctx.sourceId ? [dispatched] : [];
  });
}
