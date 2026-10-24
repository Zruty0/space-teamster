import { MULTAQA, BIR_SAFA, WADI, SUHAIL } from '../sahra-sites';
import { sahraTradeContracts, type SahraTradeLane } from './sahra-trade-contracts';
import type { FactionContractProvider } from './index';

export const SAHRA_CIVILIAN_ID = 'sahra-civilian-bookings';
const SERAI = 'caravanserai-main-commercial-dock', WEYMARK = 'estella-viii-settlement';
const ORSELLE = 'estella-iii-capital-city', VALENNE = 'estella-iii-agricultural-region';
const DESCARTES = 'estella-iiia-science-settlement', FUYUAN = 'estella-iv-primary-city';
const CONCORD = 'estella-v-capital-settlement', VELES = 'estella-via-component-supply-station';
const KALYNA = 'estella-vib-cold-chain-station', CADIZ = 'estella-xid-main-port';
const RETREAT = 'estella-xb-luxury-retreat';
const freight = (id: string, from: string, to: readonly string[], label: string, massClass: SahraTradeLane['massClass'], issuerName: string, purpose: string): SahraTradeLane =>
  ({ id, from, to, label, massClass, issuerName, purpose, likelihood: 1.4 });
const people = (id: string, from: string, to: readonly string[], label: string, issuerName: string, purpose: string): SahraTradeLane =>
  ({ id, from, to, label, massClass: 'light', category: 'passenger', both: true, issuerName, purpose, likelihood: 1.4 });

export const SAHRA_CIVILIAN_LANES: readonly SahraTradeLane[] = [
  { id: 'cut-opals', from: MULTAQA, to: [ORSELLE, SERAI, RETREAT], label: 'cut veil-opal cases', massClass: 'light', massTons: 0.08,
    everyPairs: 3, likelihood: 0.35, generosity: 1.25, issuerName: 'Independent gemstone dealer',
    purpose: 'A small graded lot of natural veil opals in protected cases, including packaging mass. Cut and documented in Multaqa for offworld jewellery buyers; provenance and quality command the premium.' },
  { id: 'rough-opals', from: WADI, to: [ORSELLE, SERAI], label: 'veil-opal rough cases', massClass: 'light', massTons: 0.18,
    everyPairs: 4, likelihood: 0.35, generosity: 1.25, issuerName: 'Prospecting partnership',
    purpose: 'Selected opal-bearing pieces sold to an offworld cutter, packed with their claim provenance. Most ordinary Wadi-to-Multaqa trade travels with surface caravans rather than spacecraft.' },
  freight('garden-food', VALENNE, [MULTAQA, BIR_SAFA], 'fresh-produce crates', 'standard', 'Household food purchasing cooperative', 'Imported fresh produce complements preserved staples and pressure-garden supplies; shippers provide preservation.'),
  freight('marine-food', FUYUAN, [MULTAQA, SUHAIL], 'frozen seafood containers', 'standard', 'Independent food wholesaler', 'Packed seafood for settlement households and anchorage kitchens.'),
  freight('household-goods', SERAI, [MULTAQA, BIR_SAFA, SUHAIL], 'household supply crates', 'standard', 'Caravan household purchasing office', 'Clothing, furnishings and everyday necessities for travelling households and permanent residents.'),
  freight('clinic-stock', KALYNA, [MULTAQA], 'medical cold-chain lockers', 'light', 'Settlement clinic purchasing office', 'Medicines purchased through Kalyna Orbital for clinics serving settlements and visiting caravans.'),
  freight('teaching-kits', DESCARTES, [MULTAQA], 'teaching laboratory kits', 'light', 'Community school purchasing office', 'Practical science and technical teaching kits for resident and travelling students.'),
  people('household-visits', MULTAQA, [WEYMARK, CONCORD, CADIZ], 'caravan household passengers', 'Independent household travel office', 'Family visits, household business and return passage. Sealed caravan homes remain on Sahra.'),
  people('water-settlement-families', BIR_SAFA, [WEYMARK], 'civilian family visitors', 'Family travel office', 'Family visits and return journeys for Bir Safa residents.'),
  people('study-exchanges', MULTAQA, [DESCARTES, FUYUAN], 'technical students and instructors', 'Community education travel office', 'Study, teaching and return travel, separate from Institute field assignments.'),
  people('gem-trade-visits', MULTAQA, [SERAI, ORSELLE, RETREAT], 'opal buyers and cutters', 'Independent gem trade booking office', 'Auction visits, cutting commissions, customer appointments and return journeys.'),
  people('prospecting-visits', WADI, [WEYMARK], 'prospectors and survey specialists', 'Independent field travel office', 'Claim surveys, visiting prospectors and return travel to the fixed field landing.'),
  people('water-maintenance', BIR_SAFA, [VELES], 'civil engineering specialists', 'Waterworks service office', 'Purification and extraction equipment servicing, inspections and return assignments.'),
  people('clinical-visits', MULTAQA, [ORSELLE], 'civilian medical passengers', 'Clinic travel office', 'Specialist medical appointments and accompanied return journeys.'),
  people('anchorage-personnel', SUHAIL, [SERAI], 'civilian port personnel', 'Anchorage travel office', 'Cargo-handling training, port service assignments and return passage; native station business.'),
];

export const SAHRA_CIVILIAN_PROVIDER: FactionContractProvider = {
  id: SAHRA_CIVILIAN_ID, name: 'Independent Sahra bookings',
  generateContracts: ctx => SAHRA_CIVILIAN_LANES.flatMap(lane => sahraTradeContracts(ctx, {
    factionId: SAHRA_CIVILIAN_ID, factionName: 'Independent Sahra bookings',
    generosity: lane.generosity ?? (lane.category === 'passenger' ? 0.6 : 0.8),
    compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
  }, [lane])),
};
