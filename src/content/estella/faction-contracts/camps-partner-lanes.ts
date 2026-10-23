import { CONCORD, GALE, ASCENSION, SWITCHBACK, PIKE_DEPOT, ANVIL, HAMMER, STRIBOG, MORANA, VELES, MOSAIC, ROSTER } from '../camps-sites';
import type { CampsTradeLane } from './camps-trade-contracts';
const FUYUAN = 'estella-iv-primary-city', CAMPUS = 'estella-xif-deep-listening-array';

export const CAMPS_STEEL_LANES: readonly CampsTradeLane[] = [
  { id: 'morana-instruments', from: ANVIL, to: [MORANA], label: 'survey instrument crates', massClass: 'light', purpose: 'Planning Office supply of physical weather instruments through the established Anvil interface.' },
  { id: 'morana-station-stores', from: HAMMER, to: [MORANA], label: 'life-support filter pallets', massClass: 'standard', purpose: 'Planned station upkeep and life-support stores for the polar research workforce.' },
  { id: 'morana-crews', from: ANVIL, to: [MORANA], label: 'polar research crews', massClass: 'light', category: 'passenger', both: true, purpose: 'Combine-authorized polar staff rotations through Anvil; foreign Institute teams use the orbital interface.' },
  { id: 'stribog-return-personnel', from: STRIBOG, to: [ANVIL], label: 'personnel transfers', massClass: 'light', category: 'passenger', purpose: 'Returning port personnel complete their surface assignment and report to Anvil dispatch.' },
  { id: 'stribog-service-returns', from: STRIBOG, to: [ANVIL], label: 'spent-tooling returns', massClass: 'standard', purpose: 'Port tooling returns through the Planning Office\'s light-freight interface.' },
  { id: 'mokosh-farm-spares', from: HAMMER, to: ['estella-vi-agricultural-lowlands'], label: 'agricultural machinery spares', massClass: 'standard', purpose: 'Planned machinery upkeep for the commune\'s food-producing lowlands.' },
];
export const CAMPS_PLANETOLOGY_LANES: readonly CampsTradeLane[] = [
  ...[[GALE, 'dust-storm atmosphere comparisons'], [PIKE_DEPOT, 'airless-moon geology'], [ANVIL, 'Kuznia climate and interior comparisons through the Combine interface']].flatMap(([site, subject]): CampsTradeLane[] => [
    { id: 'camps-field-instruments', from: FUYUAN, to: [site], label: 'planetology field instrument chests', massClass: 'light', purpose: `Institute partnership: ${subject}. Hosts retain their facilities and arrange local distribution.` },
    { id: 'camps-field-specimens', from: site, to: [FUYUAN], label: 'planetology reference specimens', massClass: 'light', purpose: `Physical reference collections from ${subject}; routine data travels electronically.` },
    { id: 'camps-field-rotations', from: FUYUAN, to: [site], label: 'Institute field researchers', massClass: 'light', category: 'passenger', both: true, purpose: `Research assignments and returns for ${subject}.` },
  ]),
  { id: 'institute-metrology-return', from: FUYUAN, to: [MOSAIC], label: 'reference-standard recalibration cases', massClass: 'light', purpose: 'Customer-owned Institute reference artifacts sent to independent metrology specialists.' },
  { id: 'institute-certified-standards', from: MOSAIC, to: [FUYUAN], label: 'certified metrology standards', massClass: 'light', purpose: 'Recertified physical standards returned to Fuyuan comparative laboratories.' },
];
export const CAMPS_MACHINERY_LANES: readonly CampsTradeLane[] = [
  { id: 'scaffold-machine-tools', from: HAMMER, to: [ASCENSION], label: 'machine tools', massClass: 'heavy', purpose: 'Brokered replacement tools for independent Scaffold refit workshops.' },
  { id: 'scaffold-assay-benches', from: VELES, to: [ASCENSION], label: 'assay bench packages', massClass: 'standard', purpose: 'Physical inspection benches for certifying reclaimed workboat components.' },
  { id: 'scaffold-lifting-machinery', from: HAMMER, to: [ASCENSION], label: 'hoist drum assemblies', massClass: 'heavy', purpose: 'Leased handling equipment for the Old Scaffold\'s operating docks.' },
];
export const CAMPS_CARRIER_LANES: readonly CampsTradeLane[] = [
  { id: 'scaffold-consumables', from: CONCORD, to: [ASCENSION], label: 'industrial lubricant drums', massClass: 'standard', purpose: 'Brokered workshop consumables for the operating Scaffold.' },
  { id: 'scaffold-habitat-rework', from: ASCENSION, to: [SWITCHBACK, ROSTER], label: 'refurbished pressure-room modules', massClass: 'heavy', purpose: 'Reconditioned standard habitation modules for established worker settlements.' },
  { id: 'scaffold-reclamation-returns', from: PIKE_DEPOT, to: [ASCENSION], label: 'reclaimable workboat fittings', massClass: 'heavy', purpose: 'Workboat fittings purchased for remanufacture rather than indiscriminate raw scrap export.' },
];
export const CAMPS_DAEDALUS_LANES: readonly CampsTradeLane[] = [
  { id: 'scaffold-control-refit', from: CAMPUS, to: [ASCENSION], label: 'embedded industrial controller racks', massClass: 'standard', purpose: 'Public control electronics for independent dock and refit operators.' },
  { id: 'scaffold-controller-return', from: ASCENSION, to: [CAMPUS], label: 'returned automation interface units', massClass: 'standard', purpose: 'Customer electronics sent to their supplier for service.' },
  { id: 'scaffold-integration', from: CAMPUS, to: [ASCENSION], label: 'Daedalus integration engineers', massClass: 'light', category: 'passenger', both: true, purpose: 'Installation, commissioning and return travel for public customer equipment.' },
];
export const CAMPS_GOVERNMENT_LANES: readonly CampsTradeLane[] = [
  { id: 'camps-civic-services', from: CONCORD, to: [ROSTER], label: 'government civil servants', massClass: 'light', category: 'passenger', both: true, purpose: 'Civil-service and public-health coordination between independent Camps settlements.' },
  { id: 'pike-public-clinic', from: 'estella-iii-capital-city', to: [SWITCHBACK], label: 'public clinic modules', massClass: 'heavy', purpose: 'Clinic equipment for ordinary resident healthcare on Pike.' },
];
