import { ESTELLA_NODES_BY_ID } from './index';
import { DAHAI_ORBITAL, DAHAI_SURFACE_SITES, DAHAI_SITE_NAMES, type DahaiSurfaceSite } from './dahai-sites';
import { GAIA_SURFACE_SITES, RICHELIEU } from './gaia-logistics';
import { BALOR_TRADE_SITES } from './balor-logistics';
import { canonicalEstellaLocationId } from './location-aliases';
import type { FactionContractCandidate, FactionContractContext } from './faction-contracts';

export function isDahaiSurface(id: string): id is DahaiSurfaceSite {
  return (DAHAI_SURFACE_SITES as readonly string[]).includes(id);
}
function isDahaiLocal(id: string): boolean {
  let node = ESTELLA_NODES_BY_ID.get(id);
  if (node?.placement?.kind === 'aboard') node = ESTELLA_NODES_BY_ID.get(node.placement.parentId);
  return node?.placement?.parentId === 'estella-iv';
}
export function dahaiDispatchUsesTerminal(key: string, worldTime: number): boolean {
  const day = Math.floor(worldTime / 86400);
  let h = 2166136261;
  for (const ch of `dahai:${key}:${Math.floor(day / 2)}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return (day & 1) === 0 ? (h & 1) === 0 : (h & 1) !== 0;
}
function route(c: FactionContractCandidate, time: number): FactionContractCandidate {
  const outbound = isDahaiSurface(c.sourceId), inbound = isDahaiSurface(c.destinationId);
  if (outbound === inbound || c.category === 'certification' || c.travelMode || c.destinationLeadAngleFromSource !== undefined) return c;
  const external = outbound ? c.destinationId : c.sourceId;
  if (isDahaiLocal(external)) return c;
  const site = (outbound ? c.sourceId : c.destinationId) as DahaiSurfaceSite;
  const canonicalExternal = canonicalEstellaLocationId(external);
  // Gaia has already dispatched its end. Normalize its gateway choice, and
  // Balor's, so neither planet can change Dahai's paired dispatch identity.
  const externalKey = canonicalExternal === RICHELIEU || (GAIA_SURFACE_SITES as readonly string[]).includes(canonicalExternal)
    ? 'gaia-trade' : (BALOR_TRADE_SITES as readonly string[]).includes(external) ? 'balor-trade' : external;
  const key = c.dahaiDispatchKey ?? `${c.factionId}:${site}:${externalKey}:${outbound ? 'out' : 'in'}:${c.category ?? 'freight'}`;
  const via = dahaiDispatchUsesTerminal(key, time);
  return {
    ...c,
    sourceId: via && outbound ? DAHAI_ORBITAL : c.sourceId,
    destinationId: via && inbound ? DAHAI_ORBITAL : c.destinationId,
    details: [c.details, `${outbound ? 'Originating' : 'Receiving'} Dahai site: ${DAHAI_SITE_NAMES[site]}. ${via ? 'Dahai Main Orbital Station consolidation; local transport arranged by the issuer.' : 'Direct Dahai surface handling.'}`].filter(Boolean).join(' '),
    completionMessage: via && inbound ? `${c.issuerName ?? c.factionName} thanks you for successfully completing this contract.` : c.completionMessage,
  };
}

/** Outer adapter: query Gaia's adapter for each Dahai source, then dispatch
 * Dahai's end. Native orbital/local/timed/contact work stays at its real site.
 * Only new public candidates are touched, before pricing or acceptance. */
export function generateDahaiRoutedContracts(ctx: FactionContractContext, raw: (ctx: FactionContractContext) => FactionContractCandidate[]): FactionContractCandidate[] {
  const sources = ctx.sourceId === DAHAI_ORBITAL ? [DAHAI_ORBITAL, ...DAHAI_SURFACE_SITES] : [ctx.sourceId];
  return sources.flatMap(sourceId => raw({ ...ctx, sourceId })).flatMap(c => {
    const dispatched = route(c, ctx.worldTime);
    return dispatched.sourceId === ctx.sourceId ? [dispatched] : [];
  });
}
