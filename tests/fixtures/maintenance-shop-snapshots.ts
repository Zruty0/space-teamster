// Test-only serialization for the independently captured pre-Stage-5 fingerprints.
import { MAINTENANCE_SHOPS, diagnosisQuote, rigServiceQuote, replacementQuote } from '../../src/maintenance/shops';
import { createDefaultRigState } from '../../src/maintenance/rig-state';
import { equipmentQuote } from '../../src/maintenance/equipment';
import { maintenanceReferrals, maintenanceReferralText } from '../../src/maintenance/referrals';
import { LOCAL_DIRECTORY_ENTRIES } from '../../src/local-directory';
import { physicalTerminalId } from '../../src/physical-terminals';
export const maintenanceShopSnapshots = MAINTENANCE_SHOPS.map(shop => {
  const service = createDefaultRigState(true);
  for (const state of Object.values(service.components)) state.ap = 0;
  const drive = createDefaultRigState(true);
  drive.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  const directory = LOCAL_DIRECTORY_ENTRIES.find(d => d.maintenanceShopId === shop.id)!;
  return {
    physicalId: physicalTerminalId(shop.locationIds[0]), shop, directory,
    identity: [shop.id, shop.name, shop.organizationName, shop.locationIds, directory.id, directory.name, directory.locationIds],
    referrals: maintenanceReferrals(shop).map(r => ({ ...r, text: maintenanceReferralText(r) })),
    diagnosis: diagnosisQuote(shop), service: rigServiceQuote(service, shop), replacement: replacementQuote(drive, shop, 'powertrain-main-drive-core') ?? null,
    equipment: Object.fromEntries((shop.equipmentIds ?? []).map(id => [id, equipmentQuote(id === 'heavy-heat-shielding' ? createDefaultRigState(true) : createDefaultRigState(false), shop, id, 'D')])),
  };
});
