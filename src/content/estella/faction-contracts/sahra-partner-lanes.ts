import { MULTAQA, BIR_SAFA, WADI, SUHAIL, RAQIB } from '../sahra-sites';
import type { SahraTradeLane } from './sahra-trade-contracts';
const SERAI = 'caravanserai-main-commercial-dock', FUYUAN = 'estella-iv-primary-city';
const HAMMER = 'estella-vi-heavy-cargo-station', VELES = 'estella-via-component-supply-station';
const MOSAIC = 'estella-vii-high-vacuum-factory';

export const SAHRA_CARRIER_LANES: readonly SahraTradeLane[] = [
  { id: 'ice-exports', from: BIR_SAFA, to: [SERAI, 'harlan-dock', 'mercer-dock', 'estella-viii-first-rendezvous-station', 'estella-v-high-orbit-factory', 'estella-via-drydock-station', 'estella-vii-worker-hab'], label: 'Sahra ice blocks', massClass: 'heavy', likelihood: 1,
    purpose: 'Ordinary purchased ice for Belt habitats and Camps orbital/airless customers. Bir Safa competes on extraction and delivered cost alongside Beira and Macao; no exclusive water supply.' },
  { id: 'water-exports', from: BIR_SAFA, to: [HAMMER, 'estella-vib-cold-chain-station'], label: 'bonded water tanks', massClass: 'heavy', likelihood: 1,
    purpose: 'Purified industrial and habitat water sold through the established orbital interfaces, not a new surface-access privilege.' },
  { id: 'empty-tanks-serai', from: SERAI, to: [BIR_SAFA], label: 'empty water tank racks', massClass: 'heavy', purpose: 'Reusable emptied transport tanks returning to the water supplier.' },
  { id: 'empty-tanks-hammer', from: HAMMER, to: [BIR_SAFA], label: 'empty water tank racks', massClass: 'heavy', purpose: 'Customer tank racks returning for inspection and refill.' },
  { id: 'sealant-supplies', from: VELES, to: [BIR_SAFA, WADI, SUHAIL], label: 'habitat sealant drums', massClass: 'standard', purpose: 'Purchased seals and maintenance consumables for pressure habitats and working facilities.' },
  { id: 'field-rations', from: 'estella-v-capital-settlement', to: [WADI], label: 'frontier ration lockers', massClass: 'standard', purpose: 'Preserved field food for dispersed claim crews, received at the fixed field landing.' },
];
export const SAHRA_MACHINERY_LANES: readonly SahraTradeLane[] = [
  { id: 'water-pumps', from: HAMMER, to: [BIR_SAFA], label: 'pumps and compressors', massClass: 'heavy', purpose: 'Brokered extraction and purification machinery for independent water operators.' },
  { id: 'prospecting-chassis', from: HAMMER, to: [WADI], label: 'heavy vehicle chassis', massClass: 'heavy', purpose: 'Leased ground machinery for prospecting partnerships; caravans and claim equipment work on the surface.' },
  { id: 'survey-equipment', from: MOSAIC, to: [WADI], label: 'survey instrument crates', massClass: 'light', purpose: 'Independent survey equipment for geological claims, separate from Institute research bookings.' },
  { id: 'grading-benches', from: 'estella-iii-high-tech-city', to: [MULTAQA], label: 'assay bench packages', massClass: 'standard', purpose: 'Physical grading and inspection benches for independent cutters and gem dealers.' },
  { id: 'pump-overhaul-returns', from: BIR_SAFA, to: [HAMMER], label: 'rebuildable utility pump cores', massClass: 'heavy', purpose: 'Customer-owned water pumps returning through Hammer to contracted overhaul workshops.' },
  { id: 'cutting-head-returns', from: WADI, to: [VELES], label: 'worn precision cutting heads', massClass: 'standard', purpose: 'Used prospecting tooling sent to offworld reconditioning specialists.' },
  { id: 'reference-recalibration', from: MULTAQA, to: [MOSAIC], label: 'reference-standard recalibration cases', massClass: 'light', purpose: 'Customer-owned physical gem inspection standards returning to the independent laboratory that certifies them.' },
];
export const SAHRA_STEEL_LANES: readonly SahraTradeLane[] = [
  { id: 'waterworks-pipe', from: HAMMER, to: [BIR_SAFA], label: 'pressure-pipe stock', massClass: 'heavy', purpose: 'Foreign Trade Committee pipe exports for reservoir and purification works.' },
  { id: 'field-mining-stock', from: HAMMER, to: [WADI], label: 'mining supplies', massClass: 'standard', purpose: 'Foreign Trade Committee sales of ordinary excavation stock through Hammer; Kuznia surface access remains controlled.' },
];

// Raqib's entire demand is Institute-issued, including stores and staff. No
// civilian tourists, supplier-branded jobs, Guild consignments or broker traffic.
export const SAHRA_PLANETOLOGY_LANES: readonly SahraTradeLane[] = [
  { id: 'wadi-instruments', from: FUYUAN, to: [WADI], label: 'planetology field instrument chests', massClass: 'light', purpose: 'Institute field partnership studying buried ice and opal-bearing fractures, coordinated with Multaqa researchers and local claim holders.' },
  { id: 'wadi-specimens', from: WADI, to: [FUYUAN], label: 'planetology reference specimens', massClass: 'light', purpose: 'Physical comparative specimens from permitted sampling; protected discovery exposures remain undisturbed. Routine data travels electronically.' },
  { id: 'wadi-researchers', from: FUYUAN, to: [WADI], label: 'Institute field researchers', massClass: 'light', category: 'passenger', both: true, purpose: 'Institute field assignments and return journeys through Wadi al-Layl.' },
  ...([
    { id: 'raqib-instruments', from: FUYUAN, to: [RAQIB], label: 'planetology field instrument chests', massClass: 'light', purpose: 'Institute observation and reference instruments for Raqib, dispatched from its Fuyuan headquarters.' },
    { id: 'raqib-instrument-returns', from: RAQIB, to: [FUYUAN], label: 'reference-standard recalibration cases', massClass: 'light', purpose: 'Institute-owned instrument references returning to the comparative laboratories; observations themselves travel electronically.' },
    { id: 'raqib-researchers', from: FUYUAN, to: [RAQIB], label: 'Institute field researchers', massClass: 'light', category: 'passenger', both: true, purpose: 'Institute observer deployment and return passage; Raqib has no general visitor traffic.' },
    { id: 'raqib-life-support', from: SUHAIL, to: [RAQIB], label: 'life-support filter pallets', massClass: 'light', massTons: 1.2, purpose: 'Institute-procured replacement filters and compact outpost stores, staged at Suhail under an Institute manifest.' },
    { id: 'raqib-food', from: SUHAIL, to: [RAQIB], label: 'frontier ration lockers', massClass: 'light', massTons: 2.4, purpose: 'Institute provisions for the small observing staff, staged at the surviving anchorage.' },
    { id: 'raqib-local-standards', from: MULTAQA, to: [RAQIB], label: 'certified metrology standards', massClass: 'light', purpose: 'Institute local navigation-reference exchange with the Multaqa scientific quarter; direct local orbital service.' },
    { id: 'raqib-local-returns', from: RAQIB, to: [MULTAQA], label: 'reference-standard recalibration cases', massClass: 'light', purpose: 'Institute reference artifacts returning to its Multaqa partners; no forced onward leg.' },
    { id: 'raqib-local-observers', from: MULTAQA, to: [RAQIB], label: 'Institute field researchers', massClass: 'light', category: 'passenger', both: true, purpose: 'Institute local observer rotation between Raqib and Multaqa; permanent landing and docking sites retained.' },
  ] satisfies SahraTradeLane[]).map(lane => ({ ...lane, everyPairs: 4, likelihood: 0.35 })),
];
