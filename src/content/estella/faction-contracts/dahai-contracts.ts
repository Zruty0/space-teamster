import { FUYUAN, JIUYUAN, ZHULONG, BINGJIE, DAHAI_SURFACE_SITES, type DahaiSurfaceSite } from '../dahai-sites';
import { dahaiTradeContracts, type DahaiTradeLane } from './dahai-trade-contracts';
import type { FactionContractProvider } from './index';
import { campsTradeContracts } from './camps-trade-contracts';
import { CAMPS_PLANETOLOGY_LANES } from './camps-partner-lanes';
import { sahraTradeContracts } from './sahra-trade-contracts';
import { SAHRA_PLANETOLOGY_LANES } from './sahra-partner-lanes';
import { farwatchContracts } from './farwatch-contracts';
import { reachSettlementContracts } from './reach-settlement-contracts';

export const DAHAI_CIVILIAN_ID = 'dahai-civilian-bookings';
export const PLANETOLOGY_ID = 'estella-institute-of-planetology';
const VALENNE = 'estella-iii-agricultural-region', MIRABEL = 'estella-iii-coastal-resort';
const ORSELLE = 'estella-iii-capital-city', ROCHEFORT = 'estella-iii-high-tech-city';
const BEAUMONT = 'estella-iiia-heritage-site', DESCARTES = 'estella-iiia-science-settlement';
const CONCORD = 'estella-v-capital-settlement', ROADSTEAD = 'estella-v-transit-customs';
const VELES = 'estella-via-component-supply-station', SVAROG = 'estella-via-drydock-station';
const HAMMER = 'estella-vi-heavy-cargo-station', KALYNA = 'estella-vib-cold-chain-station';
const MOSAIC = 'estella-vii-high-vacuum-factory', ROSTER = 'estella-vii-worker-hab';
const COMMERCIAL = 'caravanserai-main-commercial-dock', HIGHLINER = 'caravanserai-highliner-bay-poi';
const WEYMARK = 'estella-viii-settlement', CADIZ = 'estella-xid-main-port';
const RESEARCH = 'estella-ix-research-base', TEIDE = 'estella-xiic-comet-research';
const freight = (id: string, site: DahaiSurfaceSite, direction: 'in' | 'out', externalIds: readonly string[], label: string, massClass: DahaiTradeLane['massClass'], issuerName: string, purpose: string): DahaiTradeLane =>
  ({ id, site, direction, externalIds, label, massClass, issuerName, purpose, likelihood: 2 });
const passengers = (id: string, site: DahaiSurfaceSite, externalIds: readonly string[], label: string, issuerName: string, purpose: string): DahaiTradeLane =>
  ({ id, site, direction: 'both', externalIds, label, massClass: 'light', category: 'passenger', issuerName, purpose, likelihood: 2 });

export const DAHAI_CIVILIAN_LANES: readonly DahaiTradeLane[] = [
  freight('frozen-seafood', FUYUAN, 'out', [VALENNE, MIRABEL, BEAUMONT, CONCORD, ROSTER, COMMERCIAL, WEYMARK, CADIZ, SVAROG, 'harlan-dock', 'mercer-dock'], 'frozen seafood containers', 'standard', 'Aquaculture cooperative', 'Ordinary fish and shellfish for households and kitchens; preservation supplied with the consignment.'),
  freight('sea-crops', FUYUAN, 'out', [VALENNE, BEAUMONT, CONCORD, ROSTER, COMMERCIAL, WEYMARK, CADIZ, 'harlan-dock'], 'dried sea-vegetable bales', 'standard', 'Marine food processor', 'Shelf-stable staple foods, packed for offworld kitchens.'),
  freight('marine-ingredients', FUYUAN, 'out', [ORSELLE, VALENNE, COMMERCIAL], 'processed marine ingredient drums', 'standard', 'Marine ingredient processor', 'Screened marine oils and alginates for food processing and formulated products.'),
  freight('dietary-variety', FUYUAN, 'in', [VALENNE, CONCORD, COMMERCIAL], 'grain products and spice crates', 'standard', 'Food purchasing cooperative', 'Dietary variety alongside Dahai-grown fish and sea crops; separate from existing fresh-produce bookings.'),
  freight('hatchery-packaging', FUYUAN, 'in', [VELES, COMMERCIAL, HIGHLINER], 'hatchery packaging supplies', 'standard', 'Aquaculture purchasing office', 'Replacement food-safe packaging and processing supplies.'),
  freight('seafood-container-returns', FUYUAN, 'in', [BEAUMONT, CONCORD, ROSTER, COMMERCIAL, CADIZ, SVAROG], 'reusable seafood transport containers', 'standard', 'Food export cooperative', 'Empty reusable containers returning to the packing houses.'),
  freight('heritage-loans', FUYUAN, 'out', [BEAUMONT, ORSELLE, WEYMARK], 'maritime heritage exhibition cases', 'light', 'City museum exchange office', 'Original maritime objects lent for temporary exhibitions.'),
  freight('heritage-returns', FUYUAN, 'in', [BEAUMONT, ORSELLE, WEYMARK], 'maritime heritage exhibition cases', 'light', 'City museum exchange office', 'Loaned original objects returning to their home collections.'),
  freight('deep-operation-supplies', JIUYUAN, 'in', [VELES, MOSAIC, HIGHLINER], 'deep-operation seal and membrane kits', 'standard', 'Ocean extraction purchasing office', 'Specialized consumables for local extraction and processing installations.'),
  freight('robotic-spares', JIUYUAN, 'in', [VELES, MOSAIC, COMMERCIAL], 'subsea manipulator service kits', 'standard', 'Independent marine maintenance workshop', 'Replacement robotic joints, cable and control interfaces.'),
  freight('failed-equipment', JIUYUAN, 'out', [ROCHEFORT, VELES, COMMERCIAL], 'failed subsea pump assemblies', 'heavy', 'Marine maintenance purchasing office', 'Customer equipment sent to specialist workshops for overhaul.'),
  freight('overhauled-equipment', JIUYUAN, 'in', [ROCHEFORT, VELES, COMMERCIAL], 'overhauled subsea pump assemblies', 'heavy', 'Marine maintenance purchasing office', 'Repaired customer machinery returning to service.'),
  freight('fleet-catch', ZHULONG, 'out', [CONCORD, ROSTER, COMMERCIAL, WEYMARK, CADIZ, SVAROG], 'preserved fleet-catch crates', 'standard', 'Independent fishing cooperative', 'Packaged catch from fleets based in Zhulong; preservation supplied by the shipper.'),
  freight('fleet-sea-crops', ZHULONG, 'out', [VALENNE, BEAUMONT, COMMERCIAL, CADIZ], 'preserved sea-crop packs', 'standard', 'Marine cultivation cooperative', 'Processed sea crops for ordinary offworld food markets.'),
  freight('fleet-repairs', ZHULONG, 'in', [VELES, CONCORD, COMMERCIAL], 'marine netting and lifting-gear lots', 'heavy', 'Fleet repair cooperative', 'Nets, handling gear and repair materials for working vessels.'),
  freight('weather-buoys-out', ZHULONG, 'out', [ROCHEFORT, MOSAIC], 'weather buoy service returns', 'standard', 'Marine instrument workshop', 'Damaged buoy assemblies sent to their specialist service workshops.'),
  freight('weather-buoys-in', ZHULONG, 'in', [ROCHEFORT, MOSAIC], 'calibrated weather buoy assemblies', 'standard', 'Marine instrument workshop', 'Serviced instruments for fleet deployment beyond the calm settlement belts.'),
  freight('archive-loans', BINGJIE, 'out', [ORSELLE, BEAUMONT, TEIDE], 'original archive preservation cases', 'light', 'Polar archive office', 'Physical archival originals and custody copies; routine digital data travels electronically.'),
  freight('archive-returns', BINGJIE, 'in', [ORSELLE, BEAUMONT, TEIDE], 'original archive preservation cases', 'light', 'Polar archive office', 'Original loaned records returning to controlled archive storage.'),
  freight('archive-consumables', BINGJIE, 'in', [VELES, COMMERCIAL, HIGHLINER], 'archive preservation supplies', 'standard', 'Archive purchasing office', 'Storage housings and conservation materials; electronic hardware has separate supplier orders.'),
  freight('cold-field-equipment', BINGJIE, 'out', ['estella-iii-polar-science', RESEARCH, TEIDE], 'cold-field sampling packages', 'standard', 'Polar field outfitter', 'Prepared and calibrated field kits for comparative cold-environment work.'),
  freight('polar-port-supplies', BINGJIE, 'in', [BEAUMONT, VELES, COMMERCIAL], 'cold-rated port fittings', 'heavy', 'Polar port purchasing office', 'Replacement fittings for handling equipment and working shelters.'),
  ...DAHAI_SURFACE_SITES.flatMap(site => [
    freight('household-goods', site, 'in', [BEAUMONT, CONCORD, COMMERCIAL], 'household supply crates', 'standard', 'Independent household wholesaler', 'Clothing, furnishings and everyday goods for residents.'),
    freight('packaged-food', site, 'in', [CONCORD, COMMERCIAL], 'packaged offworld pantry goods', 'standard', 'Neighbourhood food wholesaler', 'Imported pantry variety for ordinary households and worksite kitchens.'),
    passengers('family-visits', site, [BEAUMONT, CONCORD, WEYMARK, CADIZ], 'civilian family visitors', 'Passenger booking agency', 'Family visits and return travel.'),
    passengers('resident-travel', site, [COMMERCIAL, VELES, ROSTER], 'civilian resident passengers', 'Resident travel office', 'Ordinary resident, household and employment travel.'),
  ]),
  passengers('fuyuan-study', FUYUAN, [BEAUMONT, DESCARTES, CONCORD, WEYMARK, CADIZ], 'university students and staff', 'University travel office', 'Study and teaching exchanges; Institute fieldwork is booked separately.'),
  passengers('fuyuan-culture', FUYUAN, [BEAUMONT, WEYMARK, CADIZ], 'cultural exchange passengers', 'Cultural travel office', 'Performances, exhibitions and cultural exchanges.'),
  passengers('fuyuan-holidays', FUYUAN, [CONCORD, COMMERCIAL, CADIZ, SVAROG, 'estella-i-worker-hab'], 'civilian holiday passengers', 'Passenger booking agency', 'Holiday travel and return journeys for civilian residents.'),
  passengers('jiuyuan-maintenance', JIUYUAN, [ROCHEFORT, VELES, MOSAIC], 'marine maintenance specialists', 'Marine engineering travel office', 'Installation, maintenance and return assignments for local extraction operations.'),
  passengers('jiuyuan-training', JIUYUAN, [ROCHEFORT, CONCORD], 'technical students and instructors', 'Technical college travel office', 'Industrial training and apprenticeship exchanges.'),
  passengers('zhulong-fleet-crews', ZHULONG, [CONCORD, SVAROG, CADIZ], 'marine fleet technicians', 'Fleet travel cooperative', 'Marine technical assignments, safety training and return travel.'),
  passengers('bingjie-conservators', BINGJIE, [ORSELLE, BEAUMONT, TEIDE], 'archive conservators and historians', 'Archive travel office', 'Conservation assignments and scholarly visits.'),
  passengers('bingjie-port-staff', BINGJIE, [ROADSTEAD, COMMERCIAL, CADIZ], 'civilian port personnel', 'Port travel office', 'Port operations exchanges, training and returns.'),
];

const FIELD_PROGRAMS = [
  ['estella-i-refractory-mine', 'volcanic and refractory geology'],
  ['estella-ii-olympos', 'hostile-atmosphere observation'],
  ['estella-iii-polar-science', 'comparative climate and polar ice'],
  [DESCARTES, 'lunar geology'],
  ['estella-v-atmo-refinery', 'atmospheric chemistry'],
  [HAMMER, 'mineral and interior specimens through the orbital interface'],
  [KALYNA, 'biosphere and habitability comparisons through the orbital interface'],
  [RESEARCH, 'icy-dwarf geology'],
  ['estella-x-observation-skim-hub', 'gas-giant atmosphere and magnetosphere'],
  ['estella-xa-exobiology-research', 'subsurface ocean comparisons'],
  ['estella-xd-geothermal-extraction', 'geothermal processes'],
  ['estella-xib-organic-chemistry', 'cold atmospheric organic chemistry'],
  ['estella-xii-observation-post', 'outer gas-giant climate and magnetosphere'],
  [TEIDE, 'cometary and small-body geology'],
  ['estella-xiii-main-port', 'outer-system field logistics'],
] as const;
export const PLANETOLOGY_LANES: readonly DahaiTradeLane[] = [
  ...FIELD_PROGRAMS.flatMap(([external, subject]): DahaiTradeLane[] => [
    { id: 'field-instruments', site: FUYUAN, externalIds: [external], direction: 'out', label: 'planetology field instrument chests', massClass: 'light', purpose: `Estella Institute of Planetology field partnership: ${subject}. Existing host facilities retain their operators.` },
    { id: 'field-specimens', site: FUYUAN, externalIds: [external], direction: 'in', label: 'planetology reference specimens', massClass: 'light', purpose: `Physical reference specimens for Fuyuan comparative laboratories: ${subject}. Sampling is arranged locally; ordinary data travels electronically.` },
    { id: 'field-rotations', site: FUYUAN, externalIds: [external], direction: 'both', label: 'Institute field researchers', massClass: 'light', category: 'passenger', purpose: `Scientific deployment and return travel for ${subject}.` },
  ]),
  { id: 'instrument-procurement', site: FUYUAN, externalIds: [DESCARTES, MOSAIC, HIGHLINER], direction: 'in', label: 'comparative laboratory instrument sets', massClass: 'light', purpose: 'Instrument procurement for the Institute\'s comparative laboratories in Fuyuan.' },
  { id: 'visiting-fellows', site: FUYUAN, externalIds: [ORSELLE, DESCARTES, TEIDE, 'estella-xif-deep-listening-array'], direction: 'both', label: 'Institute visiting fellows', massClass: 'light', category: 'passenger', purpose: 'Teaching, fellowship and comparative-research exchanges at the Fuyuan headquarters.' },
  { id: 'polar-comparisons', site: BINGJIE, externalIds: ['estella-iii-polar-science', RESEARCH, TEIDE], direction: 'out', label: 'polar sample cabinets', massClass: 'light', purpose: 'Packaged polar field specimens from Bingjie for collaborative laboratory comparisons.' },
  { id: 'deep-assays', site: JIUYUAN, externalIds: [ORSELLE, DESCARTES], direction: 'out', label: 'screened deep-ocean assay specimens', massClass: 'light', purpose: 'Screened samples from Jiuyuan\'s deep installations for comparative laboratory analysis.' },
  { id: 'storm-comparisons', site: ZHULONG, externalIds: ['estella-x-observation-skim-hub', 'estella-xii-observation-post'], direction: 'out', label: 'preserved storm-wake specimens', massClass: 'light', purpose: 'Screened physical specimens for comparative atmosphere/ocean work, harvested from accessible waters.' },
];

export const DAHAI_CIVILIAN_PROVIDER: FactionContractProvider = {
  id: DAHAI_CIVILIAN_ID, name: 'Independent Dahai bookings',
  generateContracts: ctx => DAHAI_CIVILIAN_LANES.flatMap(lane => dahaiTradeContracts(ctx, {
    factionId: DAHAI_CIVILIAN_ID, factionName: 'Independent Dahai bookings',
    generosity: lane.category === 'passenger' ? 0.6 : 0.8,
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])),
};
export const PLANETOLOGY_PROVIDER: FactionContractProvider = {
  id: PLANETOLOGY_ID, name: 'Estella Institute of Planetology',
  generateContracts: ctx => [...PLANETOLOGY_LANES.flatMap(lane => dahaiTradeContracts(ctx, {
    factionId: PLANETOLOGY_ID, factionName: 'Estella Institute of Planetology', factionTag: 'EIP',
    issuerId: PLANETOLOGY_ID, issuerName: 'Estella Institute of Planetology',
    generosity: lane.category === 'passenger' ? 0.6 : 0.8,
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])), ...CAMPS_PLANETOLOGY_LANES.flatMap(lane => campsTradeContracts(ctx, {
    factionId: PLANETOLOGY_ID, factionName: 'Estella Institute of Planetology', factionTag: 'EIP',
    issuerId: PLANETOLOGY_ID, issuerName: 'Estella Institute of Planetology',
    generosity: lane.category === 'passenger' ? 0.6 : 0.8,
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])), ...SAHRA_PLANETOLOGY_LANES.flatMap(lane => sahraTradeContracts(ctx, {
    factionId: PLANETOLOGY_ID, factionName: 'Estella Institute of Planetology', factionTag: 'EIP',
    issuerId: PLANETOLOGY_ID, issuerName: 'Estella Institute of Planetology',
    generosity: lane.category === 'passenger' ? 0.6 : 0.8,
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])), ...farwatchContracts(ctx, 'EIP'), ...reachSettlementContracts(ctx, 'EIP')],
};
