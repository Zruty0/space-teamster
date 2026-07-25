import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface PassengerTemplate {
  templateId: string;
  sourceIds: string[];
  destinationIds: string[];
  cargoLabel: string;
  massClass: CargoMassClass;
  likelihood: number;
  issuerName: string;
  generosity?: number;
  compensationRatio?: number;
}

const HARTWELL_LABOR_ID = 'hartwell-labor-exchange';
const HARTWELL_LABOR_NAME = 'Hartwell Labor Exchange';
const HARTWELL_LABOR_TAG = 'PASS';

// Low-paying seat blocks: special passenger work breaks even at par, while regular
// Hartwell crew transfers are slightly negative even when flown cleanly. This makes
// passenger legs ubiquitous connective tissue, not profit work.
const PASSENGER_GENEROSITY = 0.4;
const PASSENGER_COMPENSATION_RATIO = 0.6;
const REGULAR_CREW_GENEROSITY = 0.1;
const REGULAR_CREW_COMPENSATION_RATIO = 0.8;
const PASSENGER_MAX_COMP_ALLOWANCE = 2;

const ROADSTEAD = 'estella-v-transit-customs';
const CONCORD = 'estella-v-capital-settlement';
const HARTWELL_PASSENGER_NODES = [ROADSTEAD, CONCORD];

const GAIA_DAHAI_NODES = [
  'estella-iii-main-customs',
  'estella-iii-capital-city',
  'estella-iii-finance-city',
  'estella-iv-main-orbital-station',
  'estella-iv-primary-city',
];

// Passenger traffic to Kuznia proper stops at Anvil; the Steel Combine handles all
// surface distribution. Svarog, Kalyna, and Tessera remain independent destinations.
const CAMPS_WORK_NODES = [
  'estella-vi-main-transit-dispatch',
  'estella-via-drydock-station',
  'estella-via-component-supply-station',
  'estella-via-surface-anchor',
  'estella-via-rare-alloy-extraction',
  'estella-vib-cold-chain-station',
  'estella-vib-vat-protein',
  'estella-vib-pharma-horticulture',
  'estella-vib-aquaculture',
  'estella-vii-transit-export',
  'estella-vii-high-vacuum-factory',
  'estella-vii-feedstock-mine',
  'estella-vii-worker-hab',
];

const BELT_WORK_NODES = [
  'caravanserai-main-commercial-dock',
  'caravanserai-free-trader-anchorage',
  'harlan-dock',
  'mercer-dock',
  'industrial-refinery-staff-hab',
  'grubstake-depot-dock',
  'highgrade-depot-dock',
  'slagfoot-depot-dock',
  'deepcut-depot-dock',
  'estella-viii-first-rendezvous-station',
  'estella-viii-harder-approach-station',
  'estella-viii-settlement',
];

const WELLS_HUB_NODES = [
  'estella-xc-transit-refuel',
  'estella-xid-main-port',
  'estella-xid-customs-transit',
  'estella-xii-observation-post',
  'estella-xiib-transit-station-poi',
];

const OUTBOUND_WORK_NODES = [
  ...CAMPS_WORK_NODES,
  ...BELT_WORK_NODES,
  ...WELLS_HUB_NODES,
];

const PASSENGER_TEMPLATES: PassengerTemplate[] = [
  {
    templateId: 'hartwell-shift-block-out',
    sourceIds: HARTWELL_PASSENGER_NODES,
    destinationIds: OUTBOUND_WORK_NODES,
    cargoLabel: 'Hartwell worksite crew block',
    massClass: 'standard',
    likelihood: 1.7,
    issuerName: 'Hartwell Labor Exchange',
    generosity: REGULAR_CREW_GENEROSITY,
    compensationRatio: REGULAR_CREW_COMPENSATION_RATIO,
  },
  {
    templateId: 'hartwell-contractors-out',
    sourceIds: HARTWELL_PASSENGER_NODES,
    destinationIds: [...CAMPS_WORK_NODES, ...BELT_WORK_NODES, ...WELLS_HUB_NODES],
    cargoLabel: 'bonded contractor crew',
    massClass: 'standard',
    likelihood: 1.25,
    issuerName: 'Concord Contractor Registry',
    generosity: REGULAR_CREW_GENEROSITY,
    compensationRatio: REGULAR_CREW_COMPENSATION_RATIO,
  },
  {
    templateId: 'hartwell-specialists-out',
    sourceIds: HARTWELL_PASSENGER_NODES,
    destinationIds: [...CAMPS_WORK_NODES, ...WELLS_HUB_NODES],
    cargoLabel: 'technical specialist party',
    massClass: 'light',
    likelihood: 0.85,
    issuerName: 'Roadstead Placement Desk',
    generosity: REGULAR_CREW_GENEROSITY,
    compensationRatio: REGULAR_CREW_COMPENSATION_RATIO,
  },
  {
    templateId: 'hartwell-return-rotations',
    sourceIds: OUTBOUND_WORK_NODES,
    destinationIds: HARTWELL_PASSENGER_NODES,
    cargoLabel: 'Hartwell return rotation',
    massClass: 'standard',
    likelihood: 1.6,
    issuerName: 'Hartwell Labor Exchange',
    generosity: REGULAR_CREW_GENEROSITY,
    compensationRatio: REGULAR_CREW_COMPENSATION_RATIO,
  },
  {
    templateId: 'hearth-long-term-shifts-in',
    sourceIds: GAIA_DAHAI_NODES,
    destinationIds: HARTWELL_PASSENGER_NODES,
    cargoLabel: 'long-term Hartwell shift cohort',
    massClass: 'standard',
    likelihood: 1.2,
    issuerName: 'Concord Placement Office',
  },
  {
    templateId: 'hearth-supervisors-in',
    sourceIds: GAIA_DAHAI_NODES,
    destinationIds: HARTWELL_PASSENGER_NODES,
    cargoLabel: 'executive and supervisor staff',
    massClass: 'light',
    likelihood: 0.85,
    issuerName: 'Roadstead Supervisory Desk',
  },
  {
    templateId: 'hearth-shift-returns-out',
    sourceIds: HARTWELL_PASSENGER_NODES,
    destinationIds: GAIA_DAHAI_NODES,
    cargoLabel: 'completed long-term shift returnees',
    massClass: 'standard',
    likelihood: 0.75,
    issuerName: 'Concord Placement Office',
  },
  {
    templateId: 'hartwell-medical-return',
    sourceIds: [...CAMPS_WORK_NODES, ...BELT_WORK_NODES, ...WELLS_HUB_NODES],
    destinationIds: [CONCORD],
    cargoLabel: 'medical return passengers',
    massClass: 'light',
    likelihood: 0.65,
    issuerName: 'Concord Industrial Clinic',
  },
  {
    templateId: 'hartwell-admin-travel',
    sourceIds: [...GAIA_DAHAI_NODES, ROADSTEAD, CONCORD],
    destinationIds: [...GAIA_DAHAI_NODES, ROADSTEAD, CONCORD],
    cargoLabel: 'claims office passenger party',
    massClass: 'light',
    likelihood: 0.55,
    issuerName: 'Concord Charter Office',
  },
];

function cargoForTemplate(template: PassengerTemplate, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label: template.cargoLabel,
    massClass: template.massClass,
    massTons: cargoMassForClass(template.massClass, `${HARTWELL_LABOR_ID}:${template.templateId}:${sourceId}->${destinationId}:${template.cargoLabel}`),
  };
}

function candidatesFromTemplates(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const template of PASSENGER_TEMPLATES) {
    if (!template.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of template.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      const sourceIsHartwell = HARTWELL_PASSENGER_NODES.includes(ctx.sourceId);
      const destinationIsHartwell = HARTWELL_PASSENGER_NODES.includes(destinationId);
      if (sourceIsHartwell && destinationIsHartwell) continue;
      if (template.templateId === 'hartwell-admin-travel' && sourceIsHartwell === destinationIsHartwell) continue;
      out.push({
        factionId: HARTWELL_LABOR_ID,
        factionName: HARTWELL_LABOR_NAME,
        factionTag: HARTWELL_LABOR_TAG,
        templateId: template.templateId,
        sourceId: ctx.sourceId,
        destinationId,
        cargo: cargoForTemplate(template, ctx.sourceId, destinationId),
        likelihood: template.likelihood,
        issuerName: template.issuerName,
        category: 'passenger',
        generosity: template.generosity ?? PASSENGER_GENEROSITY,
        compensationRatio: template.compensationRatio ?? PASSENGER_COMPENSATION_RATIO,
        maxCompAllowance: PASSENGER_MAX_COMP_ALLOWANCE,
      });
    }
  }
  return out;
}

export const HARTWELL_LABOR_EXCHANGE_PROVIDER: FactionContractProvider = {
  id: HARTWELL_LABOR_ID,
  name: HARTWELL_LABOR_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(ctx);
  },
};
