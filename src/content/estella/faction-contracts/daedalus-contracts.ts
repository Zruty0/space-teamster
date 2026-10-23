import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

import { BAM_EXTRACTION, BAM_FOUNDRY } from '../balor-logistics';
import { dahaiTradeContracts } from './dahai-trade-contracts';
import { DAHAI_DAEDALUS_LANES } from './dahai-partner-lanes';
import { campsTradeContracts } from './camps-trade-contracts';
import { CAMPS_DAEDALUS_LANES } from './camps-partner-lanes';
import { balorTradeContracts, type BalorTradeLane } from './balor-trade-contracts';

const DAEDALUS_ID = 'daedalus-systems';
const DAEDALUS_NAME = 'Daedalus Systems';
const DAEDALUS_TAG = 'DAEDALUS';
const DAY = 86_400;

const SERVER_FARM = 'estella-xif-observatory';
const SYSTEMS_CAMPUS = 'estella-xif-deep-listening-array';
const ICARUS_LAB = 'estella-xif-sealed-research-outpost';

const PROCUREMENT_PAY = { generosity: 0.7, compensationRatio: 0.45, maxCompAllowance: 2 } as const;
const PRODUCT_PAY = { generosity: 0.7, compensationRatio: 0.45, maxCompAllowance: 2 } as const;
const VALIDATION_PAY = { generosity: 0.8, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const PERSONNEL_PAY = { generosity: 0.55, compensationRatio: 0.6, maxCompAllowance: 2 } as const;
const ICARUS_PAY = { generosity: 0.75, compensationRatio: 0.5, maxCompAllowance: 2, flatReward: 20_000 } as const;

type Pay = typeof PROCUREMENT_PAY | typeof PRODUCT_PAY | typeof VALIDATION_PAY | typeof PERSONNEL_PAY | typeof ICARUS_PAY;

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
}

interface ProcurementLane {
  id: string;
  destinationId: string;
  sourceIds: readonly string[];
  cargo: readonly CargoOption[];
  likelihood: number;
  issuerId: string;
  issuerName: string;
  pay: Pay;
}

interface CandidateArgs {
  templateId: string;
  sourceId: string;
  destinationId: string;
  cargo: CargoOption;
  pay: Pay;
  issuerId: string;
  issuerName: string;
  details: string;
  completionMessage: string;
  title?: string;
  category?: 'passenger';
  likelihood?: number;
}

const HIGH_END_SUPPLIERS = [
  'caravanserai-highliner-bay-poi',
  'estella-iii-high-tech-city',
  'estella-vii-high-vacuum-factory',
  'estella-vii-feedstock-mine',
  'estella-via-component-supply-station',
  'estella-xie-rare-alloy-extraction',
  'estella-xid-main-port',
] as const;

const SERVER_INPUTS: readonly CargoOption[] = [
  { label: 'accelerator-grade processor wafers', massClass: 'light' },
  { label: 'radiation-hardened memory stacks', massClass: 'light' },
  { label: 'high-density optical interconnect assemblies', massClass: 'light' },
  { label: 'storage substrate cabinets', massClass: 'standard' },
  { label: 'server power-conditioning assemblies', massClass: 'standard' },
  { label: 'radiator heat-pipe sections', massClass: 'heavy' },
  { label: 'cleanroom filter cassettes', massClass: 'standard' },
];

const CAMPUS_INPUTS: readonly CargoOption[] = [
  { label: 'semiconductor substrate lots', massClass: 'light' },
  { label: 'controller enclosure stock', massClass: 'standard' },
  { label: 'high-purity ceramic packages', massClass: 'light' },
  { label: 'optical feedstock cabinets', massClass: 'standard' },
  { label: 'instrument-grade alloy blanks', massClass: 'standard' },
  { label: 'sensor interface assemblies', massClass: 'light' },
  { label: 'electronics fabrication consumables', massClass: 'standard' },
];

const ICARUS_INPUTS: readonly CargoOption[] = [
  { label: 'isolated compute cabinets', massClass: 'standard' },
  { label: 'restricted processor substrate', massClass: 'light' },
  { label: 'sealed experimental memory racks', massClass: 'standard' },
  { label: 'independent test-environment modules', massClass: 'heavy' },
  { label: 'high-density research interconnects', massClass: 'light' },
];

const PROCUREMENT_LANES: readonly ProcurementLane[] = [
  {
    id: 'server-farm-inputs',
    destinationId: SERVER_FARM,
    sourceIds: HIGH_END_SUPPLIERS,
    cargo: SERVER_INPUTS,
    likelihood: 0.52,
    issuerId: 'daedalus-systems-procurement',
    issuerName: 'Daedalus Systems Procurement',
    pay: PROCUREMENT_PAY,
  },
  {
    id: 'campus-fabrication-inputs',
    destinationId: SYSTEMS_CAMPUS,
    sourceIds: HIGH_END_SUPPLIERS,
    cargo: CAMPUS_INPUTS,
    likelihood: 0.56,
    issuerId: 'daedalus-systems-procurement',
    issuerName: 'Daedalus Systems Procurement',
    pay: PROCUREMENT_PAY,
  },
  {
    id: 'icarus-restricted-inputs',
    destinationId: ICARUS_LAB,
    sourceIds: [
      'caravanserai-highliner-bay-poi',
      'estella-iii-high-tech-city',
      'estella-vii-high-vacuum-factory',
      'estella-vii-feedstock-mine',
      'estella-via-component-supply-station',
    ],
    cargo: ICARUS_INPUTS,
    likelihood: 0.09,
    issuerId: 'daedalus-research-administration',
    issuerName: 'Daedalus Research Administration',
    pay: ICARUS_PAY,
  },
];

const PRODUCTS: readonly CargoOption[] = [
  { label: 'Daedalus navigation accelerators', massClass: 'light' },
  { label: 'embedded industrial controller racks', massClass: 'standard' },
  { label: 'certified driver-stack appliances', massClass: 'light' },
  { label: 'predictive-maintenance processors', massClass: 'light' },
  { label: 'sensor-fusion cabinets', massClass: 'standard' },
  { label: 'simulation accelerator modules', massClass: 'light' },
  { label: 'radiation-hardened flight computers', massClass: 'light' },
  { label: 'automation interface units', massClass: 'standard' },
];

const PRODUCT_DESTINATIONS = [
  'caravanserai-outfitter-drydock',
  'estella-iii-high-tech-city',
  'estella-vi-main-transit-dispatch',
  'estella-via-drydock-station',
  'estella-via-component-supply-station',
  'estella-vii-high-vacuum-factory',
  'estella-xid-main-port',
  'estella-xid-services-outfitter-hangar',
  'estella-xie-outer-spec-drydock',
  'estella-xie-rare-alloy-extraction',
  'estella-xii-observation-post',
  'estella-xii-comm-relay-poi',
  'estella-xiii-main-port',
  'estella-xiii-long-range-observatory',
  'caravanserai-highliner-bay-poi',
] as const;

const VALIDATION_UNITS: readonly CargoOption[] = [
  { label: 'prototype controller cabinets', massClass: 'standard' },
  { label: 'sensor-fusion test units', massClass: 'light' },
  { label: 'experimental driver-stack appliances', massClass: 'light' },
  { label: 'diagnostic inference modules', massClass: 'light' },
  { label: 'hardened automation processors', massClass: 'light' },
];

const VALIDATION_DESTINATIONS = [
  'estella-via-drydock-station',
  'estella-vii-high-vacuum-factory',
  'estella-xib-cryo-transit',
  'estella-xia-chem-station',
  'estella-xid-main-port',
  'estella-xie-outer-spec-drydock',
  'estella-xie-rare-alloy-extraction',
  'estella-xii-observation-post',
  'estella-xiii-long-range-observatory',
  'estella-v-storm-research',
  'caravanserai-outfitter-drydock',
] as const;

const VALIDATION_RETURNS: readonly CargoOption[] = [
  { label: 'field-tested controller units', massClass: 'standard' },
  { label: 'failed prototype cabinets', massClass: 'standard' },
  { label: 'sealed validation telemetry', massClass: 'light' },
];

const DATA_INPUTS: readonly CargoOption[] = [
  { label: 'industrial fault archives', massClass: 'light' },
  { label: 'flight-behavior recorder vaults', massClass: 'light' },
  { label: 'environmental sensor histories', massClass: 'light' },
  { label: 'operator-response study cabinets', massClass: 'light' },
];

const FIELD_SOURCES = [...new Set([...VALIDATION_DESTINATIONS, ...PRODUCT_DESTINATIONS])] as readonly string[];

const RESEARCH_SOURCES = [
  'caravanserai-highliner-bay-poi',
  'estella-iii-high-tech-city',
  'estella-vii-high-vacuum-factory',
  'estella-xi-science-waypoint-poi',
] as const;

const ICARUS_RESEARCH_SOURCES = [
  'caravanserai-highliner-bay-poi',
  'estella-iii-high-tech-city',
  'estella-vii-high-vacuum-factory',
  'estella-via-drydock-station',
  'estella-xie-outer-spec-drydock',
  'estella-xid-main-port',
] as const;

const FIELD_PERSONNEL: readonly CargoOption[] = [
  { label: 'Daedalus integration engineers', massClass: 'standard' },
  { label: 'driver-validation teams', massClass: 'standard' },
  { label: 'compute commissioning specialists', massClass: 'standard' },
  { label: 'electronics reliability auditors', massClass: 'standard' },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sample<T>(values: readonly T[], key: string): T {
  return values[hashString(key) % values.length];
}

function sampleMany<T>(values: readonly T[], count: number, key: string): T[] {
  const remaining = values.slice();
  const out: T[] = [];
  let state = hashString(key) || 1;
  while (remaining.length && out.length < count) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const index = (state >>> 0) % remaining.length;
    out.push(remaining.splice(index, 1)[0]);
  }
  return out;
}

function locationName(id: string): string {
  return ESTELLA_NODES_BY_ID.get(id)?.name ?? id;
}

function missionCargo(option: CargoOption, key: string): MissionCargoSpec {
  return {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${DAEDALUS_ID}:${key}:${option.label}`),
  };
}

function candidate(args: CandidateArgs): FactionContractCandidate {
  if (args.sourceId === args.destinationId) throw new Error(`Daedalus contract has identical endpoints: ${args.sourceId}`);
  return {
    factionId: DAEDALUS_ID,
    factionName: DAEDALUS_NAME,
    factionTag: DAEDALUS_TAG,
    templateId: args.templateId,
    sourceId: args.sourceId,
    destinationId: args.destinationId,
    title: args.title,
    cargo: missionCargo(args.cargo, args.templateId),
    category: args.category,
    likelihood: args.likelihood ?? 1,
    issuerId: args.issuerId,
    issuerName: args.issuerName,
    details: args.details,
    completionMessage: args.completionMessage,
    ...args.pay,
  };
}

function procurementCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  return PROCUREMENT_LANES.flatMap(lane => {
    if (!lane.sourceIds.includes(ctx.sourceId)) return [];
    const cargo = sample(lane.cargo, `${lane.id}:${ctx.sourceId}:${day}`);
    if (lane.destinationId === ICARUS_LAB) {
      return [candidate({
        templateId: `${lane.id}-${ctx.sourceId}-${cargo.label}`,
        sourceId: ctx.sourceId,
        destinationId: ICARUS_LAB,
        cargo,
        pay: lane.pay,
        issuerId: lane.issuerId,
        issuerName: lane.issuerName,
        likelihood: lane.likelihood,
        details: `Daedalus Research Administration assigned the ${cargo.label} to restricted capital inventory at Icarus Lab. Receiving has issued an isolated power allocation and equipment count.`,
        completionMessage: `Icarus Lab accepts the ${cargo.label} into isolated inventory. Equipment count, shielding seals, and power-state records match the restricted transfer order.`,
      })];
    }
    const destination = locationName(lane.destinationId);
    return [candidate({
      templateId: `${lane.id}-${ctx.sourceId}-${cargo.label}`,
      sourceId: ctx.sourceId,
      destinationId: lane.destinationId,
      cargo,
      pay: lane.pay,
      issuerId: lane.issuerId,
      issuerName: lane.issuerName,
      likelihood: lane.likelihood,
      details: `Daedalus Systems Procurement assigned the ${cargo.label} to ${destination} inventory. Receiving has reserved a controlled transfer bay and verified the package count against the supplier record.`,
      completionMessage: `${destination} receiving transfers the ${cargo.label} into controlled storage. Package count, seal condition, and thermal history match the dispatch record.`,
    })];
  });
}

function campusOutboundCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  if (ctx.sourceId !== SYSTEMS_CAMPUS) return [];
  const products = sampleMany(PRODUCT_DESTINATIONS, 3, `product-destinations:${day}`).map((destinationId, index) => {
    const cargo = sample(PRODUCTS, `product:${destinationId}:${day}`);
    return candidate({
      templateId: `product-${index}-${destinationId}-${cargo.label}`,
      sourceId: SYSTEMS_CAMPUS,
      destinationId,
      cargo,
      pay: PRODUCT_PAY,
      issuerId: 'daedalus-product-fulfillment',
      issuerName: 'Daedalus Product Fulfillment',
      likelihood: 0.58,
      details: `Daedalus Product Fulfillment released the ${cargo.label} against an approved ${locationName(destinationId)} integration order. The buyer has matched each serial group to its installation inventory.`,
      completionMessage: `${locationName(destinationId)} accepts every serial group and moves the ${cargo.label} directly to installation inventory. Daedalus closes the customer order complete.`,
    });
  });

  const validation = sampleMany(VALIDATION_DESTINATIONS, 2, `validation-destinations:${day}`).map((destinationId, index) => {
    const cargo = sample(VALIDATION_UNITS, `validation:${destinationId}:${day}`);
    return candidate({
      templateId: `validation-outbound-${index}-${destinationId}-${cargo.label}`,
      sourceId: SYSTEMS_CAMPUS,
      destinationId,
      cargo,
      pay: VALIDATION_PAY,
      issuerId: 'daedalus-field-validation',
      issuerName: 'Daedalus Field Validation',
      likelihood: 0.44,
      details: `Daedalus Field Validation assigned the ${cargo.label} to a controlled deployment at ${locationName(destinationId)}. The receiving engineers have prepared isolated interfaces and an independent cutoff.`,
      completionMessage: `${locationName(destinationId)} receives the ${cargo.label} into the prepared test circuit. Every unit powers within the declared envelope, and the deployment record is opened.`,
    });
  });

  const personnelDestination = sample(PRODUCT_DESTINATIONS, `personnel-destination:${day}`);
  const personnel = sample(FIELD_PERSONNEL, `personnel:${personnelDestination}:${day}`);
  return [...products, ...validation, candidate({
    templateId: `personnel-outbound-${personnelDestination}-${personnel.label}`,
    sourceId: SYSTEMS_CAMPUS,
    destinationId: personnelDestination,
    cargo: personnel,
    pay: PERSONNEL_PAY,
    issuerId: 'daedalus-research-personnel',
    issuerName: 'Daedalus Research Personnel',
    category: 'passenger',
    likelihood: 0.34,
    details: `The ${personnel.label} have been assigned to commission Daedalus systems at ${locationName(personnelDestination)}. Their site clearances and installation inventory are already registered.`,
    completionMessage: `${locationName(personnelDestination)} admits the ${personnel.label} directly to the assigned integration work. Their personnel record and installation inventory arrive complete.`,
  })];
}

function fieldReturnCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  if (!FIELD_SOURCES.includes(ctx.sourceId)) return [];
  const hardware = sample(VALIDATION_RETURNS, `return-hardware:${ctx.sourceId}:${day}`);
  const data = sample(DATA_INPUTS, `return-data:${ctx.sourceId}:${day}`);
  const hardwareCandidate = candidate({
    templateId: `validation-return-${ctx.sourceId}-${hardware.label}`,
    sourceId: ctx.sourceId,
    destinationId: SYSTEMS_CAMPUS,
    cargo: hardware,
    pay: VALIDATION_PAY,
    issuerId: 'daedalus-field-validation',
    issuerName: 'Daedalus Field Validation',
    likelihood: 0.36,
    details: `The ${hardware.label} completed its assigned field deployment at ${locationName(ctx.sourceId)}. Daedalus requires the hardware and sealed local records returned together for Campus examination.`,
    completionMessage: `Campus validation receives the ${hardware.label} with its local records intact. The hardware passes into teardown before the carrier manifest is closed.`,
  });
  const dataCandidate = candidate({
    templateId: `dataset-intake-${ctx.sourceId}-${data.label}`,
    sourceId: ctx.sourceId,
    destinationId: SERVER_FARM,
    cargo: data,
    pay: VALIDATION_PAY,
    issuerId: 'daedalus-field-validation',
    issuerName: 'Daedalus Field Validation',
    likelihood: 0.4,
    details: `Daedalus purchased the ${data.label} from ${locationName(ctx.sourceId)} for its certified validation corpus. Server Farm holds the custody hashes and has assigned isolated ingestion capacity.`,
    completionMessage: `Server Farm verifies the custody hashes before opening the ${data.label} into isolated ingestion. The source records and physical media are accepted together.`,
  });
  return [hardwareCandidate, dataCandidate];
}

function researchPersonnelCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  if (RESEARCH_SOURCES.includes(ctx.sourceId as typeof RESEARCH_SOURCES[number])) {
    out.push(candidate({
      templateId: `research-fellows-${ctx.sourceId}`,
      sourceId: ctx.sourceId,
      destinationId: SYSTEMS_CAMPUS,
      cargo: { label: 'recruited Daedalus research fellows', massClass: 'standard' },
      pay: PERSONNEL_PAY,
      issuerId: 'daedalus-research-personnel',
      issuerName: 'Daedalus Research Personnel',
      category: 'passenger',
      likelihood: 0.2,
      details: `Daedalus appointed the research fellows to the Systems Campus after external technical review. Their laboratory placements and residential assignments are registered for arrival.`,
      completionMessage: `The Systems Campus receives the research fellows into their assigned laboratories and residences. Every appointment record arrives with its named researcher.`,
    }));
  }
  if (ICARUS_RESEARCH_SOURCES.includes(ctx.sourceId as typeof ICARUS_RESEARCH_SOURCES[number])) {
    out.push(candidate({
      templateId: `icarus-research-principals-${ctx.sourceId}-${day % 7}`,
      sourceId: ctx.sourceId,
      destinationId: ICARUS_LAB,
      cargo: { label: 'selected Daedalus research principals', massClass: 'standard' },
      pay: ICARUS_PAY,
      issuerId: 'daedalus-research-administration',
      issuerName: 'Daedalus Research Administration',
      title: 'Transfer Selected Researchers',
      category: 'passenger',
      likelihood: 0.07,
      details: 'Daedalus Research Administration recalled the research principals from external assignments and reassigned them directly to Icarus Lab. Their destination clearances activate at receiving, and their research archives travel under separate inventory.',
      completionMessage: 'Icarus Lab verifies the principals and their sealed archives before admitting the party beyond receiving. The reassignment closes under its internal designation.',
    }));
  }
  if (FIELD_SOURCES.includes(ctx.sourceId)) {
    out.push(candidate({
      templateId: `validation-team-return-${ctx.sourceId}`,
      sourceId: ctx.sourceId,
      destinationId: SYSTEMS_CAMPUS,
      cargo: { label: 'returning Daedalus validation teams', massClass: 'standard' },
      pay: PERSONNEL_PAY,
      issuerId: 'daedalus-research-personnel',
      issuerName: 'Daedalus Research Personnel',
      category: 'passenger',
      likelihood: 0.22,
      details: `The validation teams completed their assigned deployment at ${locationName(ctx.sourceId)}. Daedalus has recalled them to the Systems Campus with their personal test records.`,
      completionMessage: `The Systems Campus receives the validation teams and their personal records together. Their field assignments close ready for technical review.`,
    }));
  }
  return out;
}

const BALOR_LANES: (BalorTradeLane & { pay: Pay; office: string })[] = [
  { id: 'sensor-sale', surface: BAM_EXTRACTION, externalId: SYSTEMS_CAMPUS, direction: 'in', label: 'sensor-fusion cabinets', massClass: 'standard', likelihood: 0.55, purpose: 'Finished industrial sensing equipment.', pay: PRODUCT_PAY, office: 'Daedalus Product Fulfillment' },
  { id: 'interface-sale', surface: BAM_FOUNDRY, externalId: SYSTEMS_CAMPUS, direction: 'in', label: 'automation interface units', massClass: 'standard', likelihood: 0.55, purpose: 'Finished industrial automation equipment.', pay: PRODUCT_PAY, office: 'Daedalus Product Fulfillment' },
  { id: 'isolated-hot-zone-trial', surface: BAM_FOUNDRY, externalId: SYSTEMS_CAMPUS, direction: 'in', label: 'hardened automation processors', massClass: 'light', likelihood: 0.4, purpose: 'Isolated hot-environment test circuit with independent cutoff; production controls remain separate.', pay: VALIDATION_PAY, office: 'Daedalus Field Validation' },
  { id: 'trial-hardware-return', surface: BAM_FOUNDRY, externalId: SYSTEMS_CAMPUS, direction: 'out', label: 'field-tested controller units', massClass: 'standard', likelihood: 0.35, purpose: 'Return isolated-trial hardware for Campus examination.', pay: VALIDATION_PAY, office: 'Daedalus Field Validation' },
  { id: 'trial-record-return', surface: BAM_FOUNDRY, externalId: SYSTEMS_CAMPUS, direction: 'out', label: 'sealed validation telemetry', massClass: 'light', likelihood: 0.35, purpose: 'Return isolated hot-environment trial records.', pay: VALIDATION_PAY, office: 'Daedalus Field Validation' },
  { id: 'interface-rma', surface: BAM_FOUNDRY, externalId: SYSTEMS_CAMPUS, direction: 'out', label: 'returned automation interface units', massClass: 'standard', likelihood: 0.3, purpose: 'Customer hardware return for inspection and repair.', pay: PRODUCT_PAY, office: 'Daedalus Product Fulfillment' },
  { id: 'ceramic-stock-purchase', surface: BAM_FOUNDRY, externalId: SYSTEMS_CAMPUS, direction: 'out', label: 'high-purity ceramic stock', massClass: 'standard', likelihood: 0.5, purpose: 'Campus electronics fabrication material order.', pay: PROCUREMENT_PAY, office: 'Daedalus Systems Procurement' },
];
function balorSystemsContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  return BALOR_LANES.flatMap(lane => balorTradeContracts(ctx, {
    factionId: DAEDALUS_ID, factionName: DAEDALUS_NAME, factionTag: DAEDALUS_TAG,
    issuerName: lane.office, ...lane.pay,
  }, [lane]));
}

function generateDaedalusContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const day = Math.floor(ctx.worldTime / DAY);
  return [
    ...procurementCandidates(ctx, day),
    ...campusOutboundCandidates(ctx, day),
    ...fieldReturnCandidates(ctx, day),
    ...researchPersonnelCandidates(ctx, day),
    ...balorSystemsContracts(ctx),
    ...CAMPS_DAEDALUS_LANES.flatMap(lane => campsTradeContracts(ctx, {
      factionId: DAEDALUS_ID, factionName: DAEDALUS_NAME, factionTag: DAEDALUS_TAG,
      issuerName: lane.category === 'passenger' ? 'Daedalus Research Personnel' : 'Daedalus Product Fulfillment',
      ...(lane.category === 'passenger' ? PERSONNEL_PAY : PRODUCT_PAY),
    }, [lane])),
    ...DAHAI_DAEDALUS_LANES.flatMap(lane => dahaiTradeContracts(ctx, {
      factionId: DAEDALUS_ID, factionName: DAEDALUS_NAME, factionTag: DAEDALUS_TAG,
      issuerName: lane.category === 'passenger' ? 'Daedalus Research Personnel' : 'Daedalus Product Fulfillment',
      ...(lane.category === 'passenger' ? PERSONNEL_PAY : PRODUCT_PAY),
    }, [lane])),
  ];
}

export const DAEDALUS_SYSTEMS_PROVIDER: FactionContractProvider = {
  id: DAEDALUS_ID,
  name: DAEDALUS_NAME,
  generateContracts: generateDaedalusContracts,
};
