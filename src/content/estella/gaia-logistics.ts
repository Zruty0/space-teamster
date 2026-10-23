import { ESTELLA_NODES_BY_ID } from './index';
import { canonicalEstellaLocationId, estellaLocationScopeIds } from './location-aliases';
import { BALOR_TRADE_SITES } from './balor-logistics';
import type { FactionContractCandidate, FactionContractContext } from './faction-contracts/index';

export const RICHELIEU = 'estella-iii-main-customs';
export const GAIA_SURFACE_SITES = [
  'estella-iii-capital-city', 'estella-iii-high-tech-city', 'estella-iii-agricultural-region',
  'estella-iii-coastal-resort', 'estella-iii-polar-science',
] as const;
const surface = new Set<string>(GAIA_SURFACE_SITES);

export function isGaiaSurface(id: string): boolean { return surface.has(canonicalEstellaLocationId(id)); }

/** A surface dispatch may consolidate at Richelieu. Native orbital services and
 * local Gaia surface/orbit trips retain their actual endpoints. Celeste is offworld.
 */
function isGaiaLocal(id: string): boolean {
  let node = ESTELLA_NODES_BY_ID.get(id);
  if (node?.placement?.kind === 'aboard') node = ESTELLA_NODES_BY_ID.get(node.placement.parentId);
  return node?.placement?.parentId === 'estella-iii';
}

function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return h >>> 0;
}

export function gaiaDispatchUsesTerminal(key: string, worldTime: number): boolean {
  const day = Math.floor(worldTime / 86400);
  const firstUsesTerminal = (hash(`gaia:${key}:${Math.floor(day / 2)}`) & 1) === 0;
  return (day & 1) === 0 ? firstUsesTerminal : !firstUsesTerminal;
}

function routeCandidate(c: FactionContractCandidate, time: number): FactionContractCandidate {
  const outbound = isGaiaSurface(c.sourceId);
  const inbound = isGaiaSurface(c.destinationId);
  if (outbound === inbound || c.category === 'certification' || c.travelMode || c.destinationLeadAngleFromSource !== undefined) return c;
  const external = outbound ? c.destinationId : c.sourceId;
  if (isGaiaLocal(external)) return c;
  const site = outbound ? c.sourceId : c.destinationId;
  // Stable across rotating daily cargo labels and Balor's independent gateway
  // selection. New authored orders may supply their own stable dispatch key.
  const externalKey = (BALOR_TRADE_SITES as readonly string[]).includes(external) ? 'balor-trade' : external;
  const key = c.gaiaDispatchKey ?? `${c.factionId}:${canonicalEstellaLocationId(site)}:${externalKey}:${outbound ? 'out' : 'in'}:${c.category ?? 'freight'}`;
  const via = gaiaDispatchUsesTerminal(key, time);
  const siteName = ESTELLA_NODES_BY_ID.get(canonicalEstellaLocationId(site))?.name ?? site;
  const handling = `${outbound ? 'Originating' : 'Receiving'} site: ${siteName}. ${via ? 'Richelieu Orbital Terminal consolidation; local transport arranged by the issuer.' : 'Direct Gaia surface handling.'}`;
  return {
    ...c,
    sourceId: via && outbound ? RICHELIEU : c.sourceId,
    destinationId: via && inbound ? RICHELIEU : c.destinationId,
    details: [c.details, handling].filter(Boolean).join(' '),
    // A provider's direct-arrival prose can stage unloading inside the city.
    // Consolidated receipts instead acknowledge the contracted terminal leg.
    completionMessage: via && inbound ? `${c.issuerName ?? c.factionName} thanks you for successfully completing this contract.` : c.completionMessage,
  };
}

/** Apply only to newly generated public postings, before costs are quoted.
 * Query all historic city scopes at the hub so redirected departures are not
 * lost. Never touch accepted contracts, saves, contact work or provider rosters.
 */
export function generateGaiaRoutedContracts(
  ctx: FactionContractContext,
  raw: (ctx: FactionContractContext) => FactionContractCandidate[],
): FactionContractCandidate[] {
  const sourceIds = ctx.sourceId === RICHELIEU
    ? [RICHELIEU, ...GAIA_SURFACE_SITES.flatMap(estellaLocationScopeIds)]
    : [ctx.sourceId];
  const seen = new Set<string>();
  return sourceIds.flatMap(sourceId => raw({ ...ctx, sourceId })).flatMap(c => {
    const routed = routeCandidate(c, ctx.worldTime);
    if (routed.sourceId !== ctx.sourceId) return [];
    // Old Orselle district scopes can contain identical orders. They used to
    // deduplicate at the city board; preserve that when collected at the hub.
    if (routed !== c) {
      const key = JSON.stringify(routed);
      if (seen.has(key)) return [];
      seen.add(key);
    }
    return [routed];
  });
}
