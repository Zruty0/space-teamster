import { ESTELLA_NODES_BY_ID } from '../content/estella';
import { canonicalEstellaLocationId } from '../content/estella/location-aliases';
import { emptyTravelAccess } from '../content/estella/empty-travel-access';
import { estellaDisplayPath } from '../content/estella/navigation';
import { localTerminalScopeIds, physicalTerminalId } from '../physical-terminals';
import { MAINTENANCE_SHOPS, type MaintenanceShopDef } from './shops';
import { MAINTENANCE_NETWORK } from './referral-network';

const network = new Map(MAINTENANCE_NETWORK.map(site => [site.physicalId, site]));
export interface MaintenanceReferral { physicalId: string; entranceId: string; name: string; location: string; path: string; eliteAlternative: boolean; onsiteSpecialist: boolean; customText?: string }
export function maintenanceReferralText(referral: MaintenanceReferral): string {
  if (referral.customText) return referral.customText;
  if (referral.onsiteSpecialist) return `For more advanced work, ask for the specialist service at ${referral.name}.`;
  return referral.eliteAlternative ? `Or, of course, you can go to ${referral.name}. They handle the most demanding work.` : `For more advanced work, go to ${referral.name}.`;
}
/** Informational only. References to approved future shops do not activate them. */
export function maintenanceReferrals(shop: MaintenanceShopDef): MaintenanceReferral[] {
  if (shop.facilityTier === 3) return [];
  const sourceId = physicalTerminalId(shop.locationIds[0]);
  const plan = network.get(sourceId);
  if (!plan) return [];
  // Interim professional branches can refer to their future specialist service.
  // Naming that service does not activate its later-stage capabilities.
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
    const live = MAINTENANCE_SHOPS.find(s => s.facilityTier >= 0 && s.locationIds.some(poi => physicalTerminalId(poi) === id));
    if (!live) return [];
    return [{ physicalId: id, entranceId, name: live.name, location, path: estellaDisplayPath(id), eliteAlternative: index > 0, onsiteSpecialist: id === sourceId,
      customText: index === 0 ? shop.copy.referralBlurb?.split('{name}').join(live.name) : undefined,
    }];
  });
}
