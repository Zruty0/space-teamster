import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface BrucknerCargoOption {
  label: string;
  massClass: CargoMassClass;
  likelihood: number;
}

interface BrucknerNodeGroup {
  subHubId: string;
  leafIds: string[];
}

const BRUCKNER_ID = 'bruckner-field-services';
const BRUCKNER_NAME = 'Bruckner Field Services';
const BRUCKNER_TAG = 'BFS';

const IMPORT_TOUCHDOWN_ID = 'caravanserai-highliner-bay-poi';
const CENTRAL_HUB_ID = 'estella-viii-harder-approach-station';

const HEARTH_SUB_HUB_ID = 'estella-iii-main-customs';
const CAMPS_SUB_HUB_ID = 'estella-via-component-supply-station';
const ESTELLA_X_SUB_HUB_ID = 'estella-xc-transit-refuel';
const ESTELLA_XI_SUB_HUB_ID = 'estella-xid-main-port';
const ESTELLA_XII_SUB_HUB_ID = 'estella-xiib-transit-station-poi';
const REACH_SUB_HUB_ID = 'estella-xiii-main-port';

const LOCAL_SERVICE_LEAVES = [
  'caravanserai-outfitter-drydock',
  'estella-viii-first-rendezvous-station',
  'still-public-approach-dock',
];

const NODE_GROUPS: BrucknerNodeGroup[] = [
  {
    subHubId: HEARTH_SUB_HUB_ID,
    leafIds: [
      'estella-i-transit-customs',
      'estella-i-hot-processing',
      'estella-ii-commercial-hub-dock',
      'estella-iii-high-tech-city',
      'estella-iiia-main-port-transit',
      'skim-hub-alpha-precursor-dock',
      'skim-hub-beta-precursor-dock',
    ],
  },
  {
    subHubId: CAMPS_SUB_HUB_ID,
    leafIds: [
      'estella-via-drydock-station',
      'estella-vi-heavy-cargo-station',
      'estella-vi-industrial-city',
      'estella-vi-foundry-complex',
      'estella-vii-transit-export',
      'estella-vii-high-vacuum-factory',
    ],
  },
  {
    subHubId: ESTELLA_X_SUB_HUB_ID,
    leafIds: [
      'estella-x-observation-skim-hub',
      'estella-xc-main-outpost',
      'estella-xd-chem-station',
      'estella-x-captive-refuel-relay',
      'estella-xb-smelting-processing',
    ],
  },
  {
    subHubId: ESTELLA_XI_SUB_HUB_ID,
    leafIds: [
      'estella-xid-services-outfitter-hangar',
      'estella-xid-specialty-cargo',
      'estella-xie-outer-spec-drydock',
      'estella-xie-component-fabrication',
      'estella-xi-skim-hub',
      'estella-xia-chem-station',
      'estella-xib-cryo-transit',
      'estella-xib-organic-chemistry',
    ],
  },
  {
    subHubId: ESTELLA_XII_SUB_HUB_ID,
    leafIds: [
      'estella-xiia-volatiles-transit',
      'estella-xiic-isotope-mining',
      'estella-xii-comm-relay-poi',
    ],
  },
  {
    subHubId: REACH_SUB_HUB_ID,
    leafIds: [
      'estella-xiv-transit-dock',
      'reach-rogue-isotope-mine',
      'reach-rogue-lonely-beacon',
      'reach-comet-fragment-2-poi',
      'reach-comet-fragment-5-poi',
      'deepest-dock-poi',
    ],
  },
];

const SUB_HUB_IDS = NODE_GROUPS.map(group => group.subHubId);
const SERVICE_LEAF_IDS = [...LOCAL_SERVICE_LEAVES, ...NODE_GROUPS.flatMap(group => group.leafIds)];

const IMPORT_STOCK: BrucknerCargoOption[] = [
  { label: 'VHM civilian drive inventory', massClass: 'standard', likelihood: 1.1 },
  { label: 'certified propulsion service stock', massClass: 'standard', likelihood: 1.0 },
  { label: 'metric-drive dealer inventory', massClass: 'standard', likelihood: 0.9 },
  { label: 'sealed warranty replacement lots', massClass: 'standard', likelihood: 0.8 },
  { label: 'Bruckner branch resupply pallets', massClass: 'standard', likelihood: 0.7 },
];

const HUB_DISTRIBUTION_STOCK: BrucknerCargoOption[] = [
  { label: 'main drive maintenance supplies', massClass: 'standard', likelihood: 1.1 },
  { label: 'RCS installation kits', massClass: 'heavy', likelihood: 0.9 },
  { label: 'field calibration service kits', massClass: 'standard', likelihood: 1.0 },
  { label: 'propulsion diagnostics kits', massClass: 'standard', likelihood: 0.85 },
  { label: 'thermal-control maintenance kits', massClass: 'standard', likelihood: 0.75 },
  { label: 'drive alignment certification kits', massClass: 'light', likelihood: 0.7 },
];

const LEAF_SERVICE_STOCK: BrucknerCargoOption[] = [
  { label: 'main drive maintenance supplies', massClass: 'standard', likelihood: 1.0 },
  { label: 'field calibration service kits', massClass: 'standard', likelihood: 0.95 },
  { label: 'RCS maintenance supplies', massClass: 'standard', likelihood: 0.85 },
  { label: 'warranty recertification packages', massClass: 'light', likelihood: 0.75 },
  { label: 'certified drive overhaul kits', massClass: 'heavy', likelihood: 0.55 },
  { label: 'vibration isolation service kits', massClass: 'standard', likelihood: 0.65 },
];

const RETURNS: BrucknerCargoOption[] = [
  { label: 'failed drive service returns', massClass: 'standard', likelihood: 1.0 },
  { label: 'warranty black-box packages', massClass: 'light', likelihood: 0.95 },
  { label: 'sealed telemetry return lots', massClass: 'light', likelihood: 0.9 },
  { label: 'incident review evidence crates', massClass: 'light', likelihood: 0.65 },
  { label: 'quarantined controller returns', massClass: 'standard', likelihood: 0.7 },
];

const CREW_MOVES: BrucknerCargoOption[] = [
  { label: 'Bruckner field technician team', massClass: 'light', likelihood: 1.1 },
  { label: 'drive alignment crew', massClass: 'light', likelihood: 1.0 },
  { label: 'commissioning engineer team', massClass: 'light', likelihood: 0.85 },
  { label: 'warranty inspector party', massClass: 'light', likelihood: 0.8 },
  { label: 'incident review board', massClass: 'light', likelihood: 0.55 },
  { label: 'emergency propulsion service crew', massClass: 'standard', likelihood: 0.75 },
];

function cargoFor(label: string, massClass: CargoMassClass, templateId: string, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label,
    massClass,
    massTons: cargoMassForClass(massClass, `${BRUCKNER_ID}:${templateId}:${sourceId}->${destinationId}:${label}`),
  };
}

function pushCargoOptions(out: FactionContractCandidate[], templatePrefix: string, sourceId: string, destinationId: string, options: BrucknerCargoOption[], laneLikelihood: number): void {
  for (const option of options) {
    const templateId = `${templatePrefix}:${option.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}`;
    out.push({
      factionId: BRUCKNER_ID,
      factionName: BRUCKNER_NAME,
      factionTag: BRUCKNER_TAG,
      templateId,
      sourceId,
      destinationId,
      cargo: cargoFor(option.label, option.massClass, templateId, sourceId, destinationId),
      likelihood: laneLikelihood * option.likelihood,
    });
  }
}

function groupForSource(sourceId: string): BrucknerNodeGroup | undefined {
  return NODE_GROUPS.find(group => group.subHubId === sourceId || group.leafIds.includes(sourceId));
}

function addCrewRelocations(out: FactionContractCandidate[], sourceId: string): void {
  const crewNodes = [...SUB_HUB_IDS, ...SERVICE_LEAF_IDS];
  if (!crewNodes.includes(sourceId)) return;
  const directTargets = crewNodes.filter(id => id !== sourceId);
  for (const destinationId of directTargets) pushCargoOptions(out, 'crew-direct', sourceId, destinationId, CREW_MOVES, 0.1);
}

function generateBrucknerContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const sourceId = ctx.sourceId;

  if (sourceId === IMPORT_TOUCHDOWN_ID) {
    pushCargoOptions(out, 'import-feeder', sourceId, CENTRAL_HUB_ID, IMPORT_STOCK, 2.4);
  }

  if (sourceId === CENTRAL_HUB_ID) {
    pushCargoOptions(out, 'export-return-to-highliner', sourceId, IMPORT_TOUCHDOWN_ID, RETURNS, 1.25);
    for (const subHubId of SUB_HUB_IDS) pushCargoOptions(out, 'hub-to-subhub', sourceId, subHubId, HUB_DISTRIBUTION_STOCK, 0.95);
    for (const leafId of LOCAL_SERVICE_LEAVES) pushCargoOptions(out, 'hub-to-local-leaf', sourceId, leafId, LEAF_SERVICE_STOCK, 0.85);
  }

  const group = groupForSource(sourceId);
  if (group?.subHubId === sourceId) {
    pushCargoOptions(out, 'subhub-return-to-hub', sourceId, CENTRAL_HUB_ID, RETURNS, 1.05);
    for (const leafId of group.leafIds) pushCargoOptions(out, 'subhub-to-leaf', sourceId, leafId, LEAF_SERVICE_STOCK, 0.95);
  } else if (group?.leafIds.includes(sourceId)) {
    pushCargoOptions(out, 'leaf-return-to-subhub', sourceId, group.subHubId, RETURNS, 1.05);
    pushCargoOptions(out, 'leaf-return-to-hub', sourceId, CENTRAL_HUB_ID, RETURNS, 0.55);
  }

  if (LOCAL_SERVICE_LEAVES.includes(sourceId)) {
    pushCargoOptions(out, 'local-leaf-return-to-hub', sourceId, CENTRAL_HUB_ID, RETURNS, 1.05);
  }

  addCrewRelocations(out, sourceId);
  return out;
}

export const BRUCKNER_FIELD_SERVICES_PROVIDER: FactionContractProvider = {
  id: BRUCKNER_ID,
  name: BRUCKNER_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateBrucknerContracts(ctx);
  },
};
