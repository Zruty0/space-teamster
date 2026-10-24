import { CONCORD, DAWES, GALE, ASCENSION, FLINT, SWITCHBACK, PIKE_DEPOT, ROADSTEAD, ANVIL, HAMMER, SVAROG_YARD, VELES, ANCHORHOLD, BLACK_VEIN, KALYNA, TESSERA_ORBITAL, MOSAIC, WHITE_QUARRY, ROSTER } from '../camps-sites';
import { campsTradeContracts, type CampsTradeLane } from './camps-trade-contracts';
import type { FactionContractProvider } from './index';

export const CAMPS_CIVILIAN_ID = 'camps-civilian-bookings';
export const SVAROG_YARD_COMPANY_ID = 'svarog-yard-company';
const SERAI = 'caravanserai-main-commercial-dock', WEYMARK = 'estella-viii-settlement';
const BEAUMONT = 'estella-iiia-heritage-site', DESCARTES = 'estella-iiia-science-settlement';
const ROCHEFORT = 'estella-iii-high-tech-city', MIRABEL = 'estella-iii-coastal-resort';
const FUYUAN = 'estella-iv-primary-city', BINGJIE = 'estella-iv-climate-poi-3';
const CADIZ = 'estella-xid-main-port', COIMBRA = 'estella-xif-deep-listening-array';
const freight = (id: string, from: string, to: readonly string[], label: string, massClass: CampsTradeLane['massClass'], issuerName: string, purpose: string, both = false): CampsTradeLane =>
  ({ id, from, to, label, massClass, issuerName, purpose, both, likelihood: 1.6 });
const people = (id: string, from: string, to: readonly string[], label: string, issuerName: string, purpose: string): CampsTradeLane =>
  ({ id, from, to, label, massClass: 'light', category: 'passenger', both: true, issuerName, purpose, likelihood: 1.6 });

export const CAMPS_CIVILIAN_LANES: readonly CampsTradeLane[] = [
  freight('concord-greenhouses', CONCORD, [SWITCHBACK, ASCENSION, ROSTER, WEYMARK], 'greenhouse produce trays', 'standard', 'Dome growers cooperative', 'Packed greens and fresh produce from Concord-area pressure gardens; shipper-supplied preservation.'),
  freight('concord-utility-overhauls', CONCORD, [ASCENSION, PIKE_DEPOT, ANCHORHOLD, ROSTER], 'refurbished utility pump sets', 'heavy', 'Independent municipal workshop', 'Overhauled life-support and water-system pumps from Concord workshops.'),
  freight('concord-utility-returns', ASCENSION, [CONCORD], 'rebuildable utility pump cores', 'heavy', 'Station maintenance purchasing office', 'Used utility pumps returning to their contracted overhaul workshop.'),
  freight('concord-teaching', DESCARTES, [CONCORD], 'teaching laboratory kits', 'light', 'Technical college purchasing office', 'Physical teaching apparatus for frontier vocational and survey courses.'),
  freight('concord-clinic-supplies', KALYNA, [CONCORD], 'medical cold-chain lockers', 'light', 'Community clinic purchasing office', 'Specialist medicines for civilian clinics, purchased through Kalyna Orbital.'),
  freight('dawes-concentrate', DAWES, [HAMMER], 'Dawes alloy concentrates', 'dense', 'Independent mine operator', 'Assayed concentrate purchased by the Combine through Hammer. Most low-grade material goes to Cinderhook by local ground transport.'),
  freight('dawes-assays', DAWES, [DESCARTES], 'sealed assay cores', 'light', 'Independent assay office', 'Physical reference lots for external quality verification.'),
  freight('dawes-container-return', HAMMER, [DAWES], 'reusable concentrate containers', 'heavy', 'Mineral purchasing cooperative', 'Emptied concentrate containers returning for reuse.'),
  freight('gale-instrument-return', GALE, [MOSAIC], 'weather instrument service returns', 'light', 'Weather instrumentation workshop', 'Field instruments returning for physical calibration; live forecasts travel electronically.'),
  freight('gale-calibrated-instruments', MOSAIC, [GALE], 'survey instrument crates', 'light', 'Weather instrumentation workshop', 'Recalibrated instruments returning to the dust-storm field station.'),
  freight('scaffold-refit-products', ASCENSION, [BEAUMONT, PIKE_DEPOT, WEYMARK, CADIZ], 'remanufactured tug service modules', 'heavy', 'Independent Scaffold refit workshop', 'Rebuilt standard service modules for tugs and survey craft; drive work remains with authorized suppliers.'),
  freight('scaffold-refit-cores', PIKE_DEPOT, [ASCENSION], 'worn tug service modules', 'heavy', 'Workboat maintenance office', 'Service modules sent for remanufacture at the Old Scaffold.'),
  freight('scaffold-refit-cores-cadiz', CADIZ, [ASCENSION], 'worn tug service modules', 'heavy', 'Workboat maintenance office', 'Customer service modules returning from the Wells for refit.'),
  freight('scaffold-yard-stores', SERAI, [ASCENSION], 'yard tooling pallets', 'heavy', 'Scaffold workshops purchasing office', 'Shared tools for the station\'s small independent refit shops.'),
  freight('scaffold-heritage', ASCENSION, [BEAUMONT, FUYUAN], 'early-yard heritage cases', 'light', 'Industrial heritage exchange office', 'Original instruments and objects from the first Camps orbital yards, on exhibition loan.', true),
  freight('switchback-households', SERAI, [SWITCHBACK], 'household supply crates', 'standard', 'Habitat household wholesaler', 'Clothing, furnishings and ordinary household supplies for Pike residents.'),
  freight('switchback-clinic', KALYNA, [SWITCHBACK], 'medical cold-chain lockers', 'light', 'Habitat clinic purchasing office', 'Civilian clinical stock, distinct from company worksite provisioning.'),
  freight('pike-training-equipment', DESCARTES, [SWITCHBACK], 'teaching laboratory kits', 'light', 'Mining technical school', 'Physical apparatus for mining safety, assay and maintenance instruction.'),
  freight('mosaic-calibration-standards', MOSAIC, [ROCHEFORT, DESCARTES, COIMBRA, SVAROG_YARD, BINGJIE, 'estella-ix-research-base'], 'certified metrology standards', 'light', 'Independent metrology laboratory', 'Physical dimensional and optical reference standards, certified in protected temperature-controlled facilities.'),
  freight('mosaic-optical-fixtures', MOSAIC, [ROCHEFORT, COIMBRA, VELES, CADIZ], 'precision optical mounting assemblies', 'light', 'Precision assembly workshop', 'Finished mounting and alignment hardware; electronic processors remain other suppliers\' specialty.'),
  freight('mosaic-vacuum-work', MOSAIC, [ASCENSION, SVAROG_YARD, VELES, 'estella-xie-outer-spec-drydock'], 'vacuum-bonded component assemblies', 'standard', 'Vacuum fabrication workshop', 'Specialist bonded assemblies for shipyard and industrial customers.'),
  freight('mosaic-reference-returns', COIMBRA, [MOSAIC], 'reference-standard recalibration cases', 'light', 'Instrument calibration office', 'Customer-owned reference artifacts returning for recertification.'),
  freight('mosaic-reference-returns-yard', SVAROG_YARD, [MOSAIC], 'reference-standard recalibration cases', 'light', 'Instrument calibration office', 'Shipyard reference artifacts returning to the metrology laboratory.'),
  freight('mosaic-clean-fixtures', VELES, [MOSAIC], 'cleanroom fixture lots', 'standard', 'Precision workshop purchasing office', 'Certified fixtures for shielded clean workshops; exposed regolith stays outside the process areas.'),
  freight('quarry-certified-stock', WHITE_QUARRY, [ROCHEFORT, DESCARTES, COIMBRA], 'graded ceramic and optical feedstock', 'standard', 'Independent quarry sales office', 'Graded, processed ceramic and optical mineral stock for specialized customers.'),
  freight('quarry-tool-returns', WHITE_QUARRY, [VELES], 'worn precision cutting heads', 'standard', 'Quarry maintenance office', 'Customer tooling sent for offworld reconditioning.'),
  freight('roster-clinics', KALYNA, [ROSTER], 'medical cold-chain lockers', 'light', 'Civilian clinic purchasing office', 'Clinical supplies for residents and rotational workers, purchased through the established orbital interface.'),
  freight('roster-civic-supplies', BEAUMONT, [ROSTER], 'civic service equipment', 'standard', 'Habitat services cooperative', 'Public-kitchen, recreation and education equipment for Roster Hall.'),
  freight('roster-food-variety', CONCORD, [ROSTER], 'packaged offworld pantry goods', 'standard', 'Habitat food wholesaler', 'Ordinary pantry goods complement existing Gaia/Dahai food deliveries.'),
  ...[CONCORD, SWITCHBACK, ROSTER].flatMap(from => [
    people('resident-exchanges', from, [WEYMARK, CADIZ], 'civilian resident passengers', 'Resident travel office', 'Household, family and ordinary employment travel.'),
    people('study-exchanges', from, [BEAUMONT, DESCARTES], 'technical students and instructors', 'Technical college travel office', 'Vocational study, teaching visits and return travel.'),
  ]),
  people('concord-pike-families', CONCORD, [SWITCHBACK], 'civilian family visitors', 'Family travel office', 'Family visits and return journeys between Hartwell and Pike.'),
  people('concord-tessera-families', CONCORD, [ROSTER], 'civilian family visitors', 'Family travel office', 'Family visits independent of employer-booked crew rotations.'),
  people('concord-business', CONCORD, [ASCENSION, SVAROG_YARD, TESSERA_ORBITAL], 'civilian business passengers', 'Independent business travel office', 'Workshops, survey firms and small commercial customers visiting their counterparties.'),
  people('scaffold-workshops', ASCENSION, [SWITCHBACK, CONCORD, ROSTER], 'workboat refit specialists', 'Refit workshop travel office', 'Customer inspections, workshop assignments and return travel.'),
  people('scaffold-visitors', ASCENSION, [BEAUMONT, FUYUAN], 'industrial heritage visitors', 'Heritage travel office', 'Visitors to the preserved industrial core of an operating station.'),
  people('pike-study-placement', SWITCHBACK, [ROSTER], 'technical students and instructors', 'Technical college travel office', 'Metrology and industrial-maintenance placements for Pike students.'),
  people('mosaic-calibration-teams', MOSAIC, [ROCHEFORT, COIMBRA, SVAROG_YARD], 'metrology commissioning teams', 'Metrology travel office', 'Instrument installation, quality verification and return assignments.'),
  people('roster-culture', ROSTER, [CONCORD, BEAUMONT], 'cultural exchange passengers', 'Habitat cultural office', 'Performances, exhibitions and return journeys for residents and shift workers.'),
];

export const SVAROG_YARD_LANES: readonly CampsTradeLane[] = [
  { id: 'yard-utility-intake', from: HAMMER, to: [SVAROG_YARD], label: 'drydock utility assemblies', massClass: 'heavy', purpose: 'Infrastructure for the landlord\'s shared drydock utilities, separate from tenant shipbuilding contracts.' },
  { id: 'yard-alignment-intake', from: MOSAIC, to: [SVAROG_YARD], label: 'drydock alignment instruments', massClass: 'light', purpose: 'Physical alignment instruments for shared yard infrastructure.' },
  { id: 'yard-power-intake', from: VELES, to: [ANCHORHOLD], label: 'anchor-grid power modules', massClass: 'heavy', purpose: 'Certified modules for the buried power and alignment infrastructure supporting the yard.' },
  { id: 'yard-anchor-maintenance', from: SVAROG_YARD, to: [ANCHORHOLD], label: 'mooring-system service kits', massClass: 'standard', purpose: 'Maintenance kits dispatched by the yard landlord to its surface anchor complex.' },
  { id: 'yard-anchor-returns', from: ANCHORHOLD, to: [SVAROG_YARD], label: 'mooring-system overhaul cores', massClass: 'heavy', purpose: 'Worn anchor hardware returning for scheduled yard overhaul.' },
  { id: 'yard-shared-stock', from: ASCENSION, to: [VELES], label: 'remanufactured yard handling modules', massClass: 'heavy', purpose: 'Refurbished shared handling equipment purchased from the Old Scaffold\'s workshops.' },
  { id: 'yard-survey-equipment', from: SVAROG_YARD, to: [ASCENSION, CADIZ], label: 'dock survey instrument sets', massClass: 'light', purpose: 'Certified physical instrument sets for counterpart dock surveys.' },
  { id: 'yard-worn-handlers', from: VELES, to: [ASCENSION], label: 'worn yard handling modules', massClass: 'heavy', purpose: 'Shared cargo-handling hardware returning to the contracted refit shops.' },
  { id: 'yard-crews', from: SVAROG_YARD, to: [ASCENSION, CONCORD, CADIZ], label: 'yard infrastructure technicians', massClass: 'light', category: 'passenger', both: true, purpose: 'Shared-yard infrastructure staff, inspections and return assignments.' },
  { id: 'yard-anchor-rotations', from: SVAROG_YARD, to: [ANCHORHOLD], label: 'yard infrastructure technicians', massClass: 'light', category: 'passenger', both: true, purpose: 'Landlord-funded anchor maintenance rotations; tenant workforce arrangements remain independent.' },
];

export const CAMPS_CIVILIAN_PROVIDER: FactionContractProvider = {
  id: CAMPS_CIVILIAN_ID, name: 'Independent Camps bookings',
  generateContracts: ctx => CAMPS_CIVILIAN_LANES.flatMap(lane => campsTradeContracts(ctx, {
    factionId: CAMPS_CIVILIAN_ID, factionName: 'Independent Camps bookings',
    generosity: lane.category === 'passenger' ? 0.6 : 0.8,
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])),
};
export const SVAROG_YARD_COMPANY_PROVIDER: FactionContractProvider = {
  id: SVAROG_YARD_COMPANY_ID, name: 'Svarog Shipyard Company',
  generateContracts: ctx => SVAROG_YARD_LANES.flatMap(lane => campsTradeContracts(ctx, {
    factionId: SVAROG_YARD_COMPANY_ID, factionName: 'Svarog Shipyard Company', factionTag: 'SSC',
    issuerId: SVAROG_YARD_COMPANY_ID, issuerName: 'Svarog Shipyard Company',
    generosity: lane.category === 'passenger' ? 0.55 : 0.75,
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])),
};
