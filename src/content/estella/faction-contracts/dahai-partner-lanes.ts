import { FUYUAN, JIUYUAN, ZHULONG, BINGJIE } from '../dahai-sites';
import type { DahaiTradeLane } from './dahai-trade-contracts';

const CAMPUS = 'estella-xif-deep-listening-array', HAMMER = 'estella-vi-heavy-cargo-station';
const ROADSTEAD = 'estella-v-transit-customs', CONCORD = 'estella-v-capital-settlement';
const VELES = 'estella-via-component-supply-station', KALYNA = 'estella-vib-cold-chain-station';

// Actor-owned additions, separate from seeded general-purpose lane pools.
export const DAHAI_STEEL_LANES: readonly DahaiTradeLane[] = [
  { id: 'deep-alloy-stock', site: JIUYUAN, externalIds: [HAMMER], direction: 'in', label: 'certified pressure alloy', massClass: 'dense', purpose: 'Foreign Trade Committee material supply for local extraction maintenance.' },
  { id: 'deep-machine-tools', site: JIUYUAN, externalIds: [HAMMER], direction: 'in', label: 'machine tools', massClass: 'heavy', purpose: 'Foreign Trade Committee machinery for Dahai workshops.' },
  { id: 'fleet-steelwork', site: ZHULONG, externalIds: [HAMMER], direction: 'in', label: 'marine structural steel lots', massClass: 'heavy', purpose: 'Foreign Trade Committee material supply for working-fleet repairs.' },
  { id: 'polar-handling', site: BINGJIE, externalIds: [HAMMER], direction: 'in', label: 'cold-rated handling assemblies', massClass: 'heavy', purpose: 'Foreign Trade Committee cargo-handling equipment export.' },
];
export const DAHAI_DAEDALUS_LANES: readonly DahaiTradeLane[] = [
  { id: 'deep-sensors', site: JIUYUAN, externalIds: [CAMPUS], direction: 'in', label: 'sensor-fusion cabinets', massClass: 'standard', purpose: 'Finished sensing electronics for deep-operation control rooms.' },
  { id: 'farm-controls', site: FUYUAN, externalIds: [CAMPUS], direction: 'in', label: 'embedded industrial controller racks', massClass: 'standard', purpose: 'Finished food-processing and cultivation control electronics.' },
  { id: 'fleet-controls', site: ZHULONG, externalIds: [CAMPUS], direction: 'in', label: 'automation interface units', massClass: 'standard', purpose: 'Electronics for fleet weather and maintenance installations.' },
  { id: 'polar-archive-hardware', site: BINGJIE, externalIds: [CAMPUS], direction: 'in', label: 'storage substrate cabinets', massClass: 'standard', purpose: 'Public archive hardware procurement; routine records are transmitted electronically.' },
  ...([FUYUAN, JIUYUAN, ZHULONG, BINGJIE] as const).map<DahaiTradeLane>(site => ({ id: 'customer-hardware-return', site, externalIds: [CAMPUS], direction: 'out', label: 'returned automation interface units', massClass: 'standard', purpose: 'Customer hardware returning to the Systems Campus for service.' })),
  ...([JIUYUAN, BINGJIE] as const).map<DahaiTradeLane>(site => ({ id: 'integration-rotation', site, externalIds: [CAMPUS], direction: 'both', label: 'Daedalus integration engineers', massClass: 'light', category: 'passenger', purpose: 'Installation, commissioning and return travel for public customer equipment.' })),
];
export const DAHAI_MERREN_LANES: readonly DahaiTradeLane[] = [
  { id: 'hatchery-cultures', site: FUYUAN, externalIds: [KALYNA], direction: 'in', label: 'aquatic breeding cultures', massClass: 'light', purpose: 'Certified hatchery cultures supplied through Kalyna Orbital.' },
  { id: 'fleet-cultures', site: ZHULONG, externalIds: [KALYNA], direction: 'in', label: 'biological culture media', massClass: 'light', purpose: 'Cultivation inputs for fleet-supported marine farms.' },
  { id: 'marine-ingredient-purchase', site: FUYUAN, externalIds: [KALYNA], direction: 'out', label: 'processed marine ingredient drums', massClass: 'standard', purpose: 'Screened, processed marine ingredients purchased for Merren\'s food and cultivation facilities.' },
  { id: 'fleet-culture-rack-return', site: ZHULONG, externalIds: [KALYNA], direction: 'out', label: 'sterilizable culture racks', massClass: 'standard', purpose: 'Reusable cultivation transport hardware returning for sterilization.' },
];
export const DAHAI_CARRIER_LANES: readonly DahaiTradeLane[] = [
  { id: 'hartwell-seafood', site: FUYUAN, externalIds: [ROADSTEAD], direction: 'out', label: 'frozen seafood containers', massClass: 'standard', purpose: 'Brokered seafood shipment for Hartwell regional distribution; shipper-supplied preservation.' },
  { id: 'hartwell-fleet-catch', site: ZHULONG, externalIds: [ROADSTEAD], direction: 'out', label: 'preserved fleet-catch crates', massClass: 'standard', purpose: 'Independent fleet catch consolidated for Hartwell customers.' },
  { id: 'hartwell-workwear', site: JIUYUAN, externalIds: [CONCORD], direction: 'in', label: 'industrial workwear pallets', massClass: 'standard', purpose: 'Ordinary workwear and protective stores for extraction crews.' },
  { id: 'hartwell-polar-stores', site: BINGJIE, externalIds: [ROADSTEAD], direction: 'in', label: 'cold-rated habitat fittings', massClass: 'standard', purpose: 'Aggregated cold-service supply order for the polar port.' },
  { id: 'hartwell-farm-stores', site: FUYUAN, externalIds: [CONCORD], direction: 'in', label: 'food-processing consumable lots', massClass: 'standard', purpose: 'Food-safe workshop consumables and processing supplies.' },
  { id: 'hartwell-fleet-batteries', site: ZHULONG, externalIds: [VELES], direction: 'in', label: 'worksite battery stacks', massClass: 'heavy', purpose: 'Working-fleet shore-service battery replacements.' },
];
export const DAHAI_MACHINERY_LANES: readonly DahaiTradeLane[] = [
  { id: 'deep-process-machinery', site: JIUYUAN, externalIds: [ROADSTEAD], direction: 'in', label: 'marine process machinery sets', massClass: 'heavy', purpose: 'Brokered pumping and separation equipment for Dahai-local production.' },
  { id: 'deep-rebuild-core', site: JIUYUAN, externalIds: [ROADSTEAD], direction: 'out', label: 'rebuildable pressure-valve cores', massClass: 'heavy', purpose: 'Customer pressure-valve cores returned for specialist workshop overhaul.' },
  { id: 'food-line-machinery', site: FUYUAN, externalIds: [ROADSTEAD], direction: 'in', label: 'marine food-processing machinery', massClass: 'heavy', purpose: 'Independent broker supply of food-processing equipment.' },
  { id: 'fleet-workshop-machinery', site: ZHULONG, externalIds: [ROADSTEAD], direction: 'in', label: 'marine workshop equipment', massClass: 'heavy', purpose: 'Dockside repair and handling machinery.' },
  { id: 'polar-port-machinery', site: BINGJIE, externalIds: [ROADSTEAD], direction: 'in', label: 'polar cargo-handler assemblies', massClass: 'heavy', purpose: 'Cold-rated equipment for polar port cargo handling.' },
];
export const DAHAI_GOVERNMENT_LANES: readonly DahaiTradeLane[] = [
  { id: 'dahai-civic-exchange', site: FUYUAN, externalIds: [CONCORD, 'estella-xid-main-port'], direction: 'both', label: 'government civil servants', massClass: 'light', category: 'passenger', purpose: 'Civil-service exchanges and return assignments.' },
  { id: 'dahai-port-inspection', site: BINGJIE, externalIds: ['estella-iii-capital-city'], direction: 'both', label: 'government inspection teams', massClass: 'light', category: 'passenger', purpose: 'Civil port standards visits and return travel.' },
  { id: 'dahai-public-clinics', site: JIUYUAN, externalIds: ['estella-iii-capital-city'], direction: 'in', label: 'public clinic modules', massClass: 'heavy', purpose: 'Civilian public-health procurement for the extraction city.' },
  { id: 'dahai-physical-archives', site: BINGJIE, externalIds: ['estella-iii-capital-city'], direction: 'both', label: 'sealed administrative archives', massClass: 'light', purpose: 'Physical administrative custody copies; ordinary records travel electronically.' },
];
export const DAHAI_EDF_LANES: readonly DahaiTradeLane[] = [
  { id: 'dahai-port-liaison', site: BINGJIE, externalIds: ['estella-iii-capital-city'], direction: 'both', label: 'EDF liaison personnel', massClass: 'light', category: 'passenger', purpose: 'Port liaison assignments and return travel.' },
  { id: 'dahai-leave-exchange', site: FUYUAN, externalIds: ['estella-xie-oathmark-academy'], direction: 'both', label: 'EDF leave passengers', massClass: 'light', category: 'passenger', purpose: 'Personnel leave and return travel from the existing training partner.' },
  { id: 'dahai-liaison-stores', site: BINGJIE, externalIds: ['estella-iii-capital-city'], direction: 'in', label: 'EDF service stores', massClass: 'standard', purpose: 'Routine personal and support equipment for liaison personnel.' },
];
