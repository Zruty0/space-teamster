import { ESTELLA_NODES_BY_ID } from '../content/estella';
import { canonicalEstellaLocationId } from '../content/estella/location-aliases';
import { emptyTravelAccess } from '../content/estella/empty-travel-access';
import { estellaDisplayPath } from '../content/estella/navigation';
import { localTerminalScopeIds, physicalTerminalId } from '../physical-terminals';
import { MAINTENANCE_SHOPS, type MaintenanceShopDef } from './shops';
import { MAINTENANCE_NETWORK } from './referral-network';

const network = new Map(MAINTENANCE_NETWORK.map(site => [site.physicalId, site]));
const landmarkNames: Record<string, string> = {
  'estella-iii-high-tech-city': 'Rochefort Precision Service',
  'estella-via-drydock': 'Svarog Visiting-Rig Service',
  'estella-viii-high-station': 'Bruckner Central Service Hall',
  'estella-xie-outer-spec-drydock-station': 'Serrat Domain Civil Refit Office',
  'estella-v-transit-station': 'Roadstead Rig Works',
  'estella-i-low-orbit-station': 'Balor Orbital Service Works',
  'estella-iii-main-customs-station': 'Richelieu Fleet Service',
  'estella-xiii-main-port-station': 'Anchorage Community Workshop',
  'estella-xid-main-port-station': 'Vilar’s Outfitter at Cadiz Highport',
};
export interface MaintenanceReferral { physicalId: string; entranceId: string; name: string; location: string; path: string; eliteAlternative: boolean }
/** Informational only. References to approved future shops do not activate them. */
export function maintenanceReferrals(shop: MaintenanceShopDef): MaintenanceReferral[] {
  if (shop.facilityTier === 3) return [];
  const sourceId = physicalTerminalId(shop.locationIds[0]);
  const plan = network.get(sourceId);
  if (!plan) return [];
  // A temporary self-help desk at a future elite location can name that on-site
  // workshop; this is not a remote transaction or a second active service desk.
  const primary = plan.next ?? (plan.tier === 3 ? sourceId : undefined);
  const primaryTier = primary && network.get(primary)?.tier;
  const ids = [primary, primaryTier === 3 ? undefined : plan.elite].filter((id): id is string => !!id);
  return [...new Set(ids)].flatMap((id, index) => {
    const destination = network.get(id);
    if (!destination || destination.tier <= shop.facilityTier) return [];
    const entranceId = localTerminalScopeIds(id).find(poi => canonicalEstellaLocationId(poi) === poi && emptyTravelAccess(poi) === 'public');
    if (!entranceId) return []; // Never reveal private or contract-only destinations.
    const location = ESTELLA_NODES_BY_ID.get(id)?.name;
    if (!location) return [];
    const live = MAINTENANCE_SHOPS.find(s => s.facilityTier >= destination.tier && s.locationIds.some(poi => physicalTerminalId(poi) === id));
    return [{ physicalId: id, entranceId, name: live?.name ?? landmarkNames[id] ?? `Workshop at ${location}`, location, path: estellaDisplayPath(id), eliteAlternative: index > 0 }];
  });
}
