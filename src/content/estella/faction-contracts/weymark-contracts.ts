import { NELLS_REST, BRUCKNER_DEPOT, WEYMARK_TOWN, LOW_GAUGE } from '../weymark-sites';
import type { CargoMassClass } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractProvider } from './index';

export const WEYMARK_OPERATORS_ID = 'weymark-independent-operators';
const VELES = 'estella-via-component-supply-station';
interface WeymarkLane {
  id: string;
  from: string;
  to: readonly string[];
  label: string;
  massClass: CargoMassClass;
  massTons: number;
  issuer: string;
  purpose: string;
  people?: boolean;
  both?: boolean;
}
const crew = (id: string, from: string, to: string, label: string, issuer: string, purpose: string): WeymarkLane =>
  ({id, from, to: [to], label, issuer, purpose, massClass: 'light', massTons: 4, people: true, both: true});

// A small local industry, not a second Pike/Glitterfield. Town/mine road travel
// and local stone deliveries stay on the ground. No automatic gateway reroute,
// compulsory paired flights, new corporate ownership or Lantern traffic.
export const WEYMARK_LANES: readonly WeymarkLane[] = [
  {id: 'selected-metal-lots', from: LOW_GAUGE, to: ['industrial-refinery-ore-intake', 'estella-vi-heavy-cargo-station'], label: 'Weymark metal concentrates', massClass: 'standard', massTons: 12, issuer: 'Low Gauge claim partnership',
    purpose: 'A small assayed nickel-iron concentrate lot from independent workings served by Low Gauge Mine. Only selected material earns offworld processing; ordinary stone and low-grade spoil remain on Weymark.'},
  {id: 'station-shielding', from: LOW_GAUGE, to: [NELLS_REST], label: 'regolith shielding blocks', massClass: 'standard', massTons: 16, issuer: 'Independent Weymark quarry',
    purpose: 'Locally cut shielding stock for scheduled station and maintenance-shipyard work at Nell\'s Rest. Most quarry output supplies surface construction by ground transport.'},
  {id: 'assay-checks', from: LOW_GAUGE, to: ['estella-vii-high-vacuum-factory'], label: 'sealed assay cores', massClass: 'light', massTons: 0.6, issuer: 'Low Gauge assay cooperative',
    purpose: 'Physical claim samples for independent grade verification. Survey results and routine paperwork travel electronically.'},
  {id: 'replacement-cutters', from: VELES, to: [LOW_GAUGE], label: 'drill head assemblies', massClass: 'light', massTons: 4, issuer: 'Mine maintenance purchasing office',
    purpose: 'Replacement cutting equipment purchased jointly by small Weymark claim operators.'},
  {id: 'pressure-stores', from: NELLS_REST, to: [LOW_GAUGE], label: 'pressure seals and valve blocks', massClass: 'light', massTons: 3, issuer: 'Mine maintenance purchasing office',
    purpose: 'Shared worksite pressure-system stores staged at Nell\'s Rest. Food, household supplies and ordinary town-to-mine traffic continue locally on the ground.'},
  {id: 'pump-overhaul', from: LOW_GAUGE, to: [NELLS_REST], label: 'rebuildable utility pump cores', massClass: 'light', massTons: 4, issuer: 'Nell\'s Rest repair workshop',
    purpose: 'Customer-owned utility pumps sent to an independent station workshop for overhaul.'},
  {id: 'serviced-pumps', from: NELLS_REST, to: [LOW_GAUGE], label: 'refurbished utility pump sets', massClass: 'light', massTons: 4, issuer: 'Nell\'s Rest repair workshop',
    purpose: 'Serviced customer pumps returning to the small mine workings. This is a separate optional booking, not a compulsory return leg.'},
  crew('mine-shifts', NELLS_REST, LOW_GAUGE, 'Weymark mining crews', 'Low Gauge crew office', 'Small working parties travelling between the orbital interchange and their mine assignments, with separately booked return passage.'),
  crew('town-rotations', NELLS_REST, WEYMARK_TOWN, 'Weymark mining crews', 'Low Gauge crew office', 'Crew arrival, leave and return travel through the settlement where households and rented rooms are based.'),
  crew('depot-shifts', BRUCKNER_DEPOT, WEYMARK_TOWN, 'Weymark depot personnel', 'Depot services contractor', 'Locally contracted handling and facility staff travelling between Bruckner Weymark Depot and their homes in town. Bruckner\'s precision-cargo network remains separate.'),
  crew('contract-crew-travel', 'caravanserai-main-commercial-dock', WEYMARK_TOWN, 'Weymark mining crews', 'Independent mine crew booking office', 'Voluntary short mining assignments and return journeys, with accommodation arranged in Weymark Town.'),
  crew('claim-visits', 'harlan-dock', NELLS_REST, 'visiting claim crews', 'Independent claim travel office', 'Visiting small-claim teams, survey consultations and return travel through Nell\'s Rest; no transfer of claims or compulsory Co-op membership.'),
  crew('equipment-technicians', VELES, LOW_GAUGE, 'mine equipment technicians', 'Mine maintenance contractor', 'Equipment installation, repair assignments and return journeys for small mine operators.'),
];

export const WEYMARK_OPERATORS_PROVIDER: FactionContractProvider = {
  id: WEYMARK_OPERATORS_ID, name: 'Independent Weymark bookings',
  generateContracts: ctx => WEYMARK_LANES.flatMap(lane => lane.to.flatMap(other => (lane.both ? [false, true] : [false]).flatMap(reverse => {
    const sourceId = reverse ? other : lane.from, destinationId = reverse ? lane.from : other;
    if (ctx.sourceId !== sourceId) return [];
    const templateId = `weymark:${lane.id}:${lane.from}:${other}:${reverse ? 'return' : 'out'}`;
    const key = `${WEYMARK_OPERATORS_ID}:${templateId}`;
    return [{
      factionId: WEYMARK_OPERATORS_ID, factionName: 'Independent Weymark bookings',
      issuerId: `${WEYMARK_OPERATORS_ID}:${lane.issuer.toLowerCase().replace(/[^a-z]+/g, '-')}`, issuerName: lane.issuer,
      templateId, sourceId, destinationId, gaiaDispatchKey: key, dahaiDispatchKey: key, campsDispatchKey: key, sahraDispatchKey: key,
      cargo: {label: lane.label, massClass: lane.massClass, massTons: lane.massTons},
      category: lane.people ? 'passenger' : 'freight', likelihood: lane.people ? 0.8 : 0.6,
      generosity: lane.people ? 0.6 : 0.75, compensationRatio: lane.people ? 0.6 : 0.4, maxCompAllowance: 2,
      details: lane.purpose,
    } satisfies FactionContractCandidate];
  }))),
};
