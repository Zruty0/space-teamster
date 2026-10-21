import { cargoMassForClass, type CargoMassClass } from '../../../mission-cost';
import { BALOR_ORBITAL, BAM_EXTRACTION, BAM_FOUNDRY, SHADE, balorDispatchEndpoint, type BalorSurfaceSite } from '../balor-logistics';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const BAM_ID = 'balor-advanced-materials';
const BAM_NAME = 'Balor Advanced Materials';
// Reliable, well-paying industrial client; proper passenger accommodation too.
// No hidden hazard roll, flat bounty, fraud, proprietary propulsion or fuel work.
const FREIGHT_PAY = { generosity: 1.0, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const PERSONNEL_PAY = { generosity: 1.0, compensationRatio: 0.5, maxCompAllowance: 2 } as const;
const HAMMER = 'estella-vi-heavy-cargo-station';
const ANVIL = 'estella-vi-main-transit-dispatch';
const VELES = 'estella-via-component-supply-station';
const SVAROG = 'estella-via-drydock-station';
const MOSAIC = 'estella-vii-high-vacuum-factory';
const GAIA_TECH = 'estella-iii-high-tech-city';
const GAIA_PORT = 'estella-iii-main-customs';
const CONCORD = 'estella-v-capital-settlement';
const OLYMPOS = 'estella-ii-olympos';
const KALYNA_ORBITAL = 'estella-vib-cold-chain-station';
const CAMPUS = 'estella-xif-deep-listening-array';
const CUPOLA_INTAKE = 'industrial-refinery-ore-intake';
const CINDERHOOK = 'estella-v-atmo-refinery';
const SURFACE_NAMES: Record<BalorSurfaceSite, string> = {
  [BAM_EXTRACTION]: 'BAM Extraction One', [BAM_FOUNDRY]: 'BAM Foundry One', [SHADE]: 'Shade',
};

interface Cargo { label: string; massClass: CargoMassClass }
interface Lane {
  id: string;
  surface: BalorSurfaceSite;
  direction: 'in' | 'out';
  externalIds: readonly string[];
  cargo: readonly Cargo[];
  likelihood: number;
  category?: 'passenger';
  purpose: 'Procurement' | 'Product dispatch' | 'Equipment overhaul return' | 'Specialist recruitment' | 'Specialist deployment' | 'Leave rotation';
}
const item = (label: string, massClass: CargoMassClass): Cargo => ({ label, massClass });

const LANES: readonly Lane[] = [
  // Kuznia trade uses its orbital membrane, never a Combine surface endpoint.
  { id: 'extraction-cutters', surface: BAM_EXTRACTION, direction: 'in', externalIds: [HAMMER], cargo: [item('mining cutting assemblies', 'heavy')], likelihood: 0.85, purpose: 'Procurement' },
  { id: 'extraction-actuators', surface: BAM_EXTRACTION, direction: 'in', externalIds: [VELES], cargo: [item('hot-zone mining actuator sets', 'heavy')], likelihood: 0.75, purpose: 'Procurement' },
  { id: 'extraction-sensors', surface: BAM_EXTRACTION, direction: 'in', externalIds: [MOSAIC, GAIA_TECH], cargo: [item('hot-zone sensor packages', 'light')], likelihood: 0.55, purpose: 'Procurement' },
  { id: 'extraction-seals', surface: BAM_EXTRACTION, direction: 'in', externalIds: [HAMMER, VELES], cargo: [item('industrial pressure seal crates', 'standard')], likelihood: 0.7, purpose: 'Procurement' },
  { id: 'foundry-pumps', surface: BAM_FOUNDRY, direction: 'in', externalIds: [HAMMER, VELES], cargo: [item('pump skid packages', 'heavy')], likelihood: 0.8, purpose: 'Procurement' },
  { id: 'foundry-automation', surface: BAM_FOUNDRY, direction: 'in', externalIds: [CAMPUS], cargo: [item('embedded industrial controller racks', 'standard'), item('predictive-maintenance processors', 'light')], likelihood: 0.55, purpose: 'Procurement' },
  { id: 'foundry-carbon', surface: BAM_FOUNDRY, direction: 'in', externalIds: [OLYMPOS], cargo: [item('graphite heat-sink blocks', 'heavy')], likelihood: 0.65, purpose: 'Procurement' },
  { id: 'foundry-oxygen', surface: BAM_FOUNDRY, direction: 'in', externalIds: [OLYMPOS], cargo: [item('industrial oxygen bottles', 'standard')], likelihood: 0.55, purpose: 'Procurement' },
  { id: 'shade-food', surface: SHADE, direction: 'in', externalIds: ['estella-iii-agricultural-region'], cargo: [item('preserved-food crates', 'standard')], likelihood: 0.75, purpose: 'Procurement' },
  { id: 'shade-medical', surface: SHADE, direction: 'in', externalIds: [KALYNA_ORBITAL], cargo: [item('medical clinic lockers', 'light')], likelihood: 0.65, purpose: 'Procurement' },
  { id: 'shade-water', surface: SHADE, direction: 'in', externalIds: ['estella-xid-main-port'], cargo: [item('bonded water tanks', 'heavy')], likelihood: 0.55, purpose: 'Procurement' },
  { id: 'shade-life-support', surface: SHADE, direction: 'in', externalIds: [ANVIL, VELES], cargo: [item('replacement scrubber beds', 'standard')], likelihood: 0.65, purpose: 'Procurement' },

  // Most mine-to-foundry movement is background local infrastructure. Offworld
  // concentrate sales and rebuildable equipment returns keep the mine distinct.
  { id: 'extraction-concentrates', surface: BAM_EXTRACTION, direction: 'out', externalIds: [HAMMER, CUPOLA_INTAKE], cargo: [item('refractory metal concentrates', 'dense')], likelihood: 0.65, purpose: 'Product dispatch' },
  { id: 'extraction-overhaul', surface: BAM_EXTRACTION, direction: 'out', externalIds: [HAMMER, VELES], cargo: [item('worn hot-zone actuator sets', 'heavy')], likelihood: 0.45, purpose: 'Equipment overhaul return' },
  { id: 'foundry-alloys', surface: BAM_FOUNDRY, direction: 'out', externalIds: [HAMMER, VELES, SVAROG], cargo: [item('refractory alloy billets', 'dense')], likelihood: 0.85, purpose: 'Product dispatch' },
  { id: 'foundry-linings', surface: BAM_FOUNDRY, direction: 'out', externalIds: [HAMMER, CUPOLA_INTAKE, CINDERHOOK, OLYMPOS], cargo: [item('refractory linings', 'heavy')], likelihood: 0.75, purpose: 'Product dispatch' },
  { id: 'foundry-thermal-tiles', surface: BAM_FOUNDRY, direction: 'out', externalIds: [SVAROG, 'caravanserai-outfitter-drydock', 'still-public-approach-dock'], cargo: [item('thermal tile lots', 'standard')], likelihood: 0.8, purpose: 'Product dispatch' },
  { id: 'foundry-ceramics', surface: BAM_FOUNDRY, direction: 'out', externalIds: [MOSAIC, GAIA_TECH, CAMPUS], cargo: [item('high-purity ceramic packages', 'light')], likelihood: 0.65, purpose: 'Product dispatch' },
  { id: 'foundry-overhaul', surface: BAM_FOUNDRY, direction: 'out', externalIds: [HAMMER, VELES], cargo: [item('rebuildable coolant pump sets', 'heavy')], likelihood: 0.45, purpose: 'Equipment overhaul return' },

  // New hires arrive at Shade; specialist deployment is distinct from ordinary
  // cheap labor blocks. BAM sponsors these seats, not a coercive labor broker.
  { id: 'rated-recruitment', surface: SHADE, direction: 'in', externalIds: [ANVIL, CONCORD, VELES], cargo: [item('BAM-rated furnace crews', 'standard'), item('BAM-rated extraction crews', 'standard')], likelihood: 0.75, category: 'passenger', purpose: 'Specialist recruitment' },
  { id: 'extraction-specialists', surface: BAM_EXTRACTION, direction: 'in', externalIds: [VELES, ANVIL], cargo: [item('BAM field maintenance specialists', 'light')], likelihood: 0.55, category: 'passenger', purpose: 'Specialist deployment' },
  { id: 'foundry-specialists', surface: BAM_FOUNDRY, direction: 'in', externalIds: [GAIA_TECH, MOSAIC], cargo: [item('BAM precision commissioning crews', 'light')], likelihood: 0.55, category: 'passenger', purpose: 'Specialist deployment' },
  { id: 'extraction-specialist-return', surface: BAM_EXTRACTION, direction: 'out', externalIds: [VELES, ANVIL], cargo: [item('returning BAM specialists', 'light')], likelihood: 0.5, category: 'passenger', purpose: 'Specialist deployment' },
  { id: 'foundry-specialist-return', surface: BAM_FOUNDRY, direction: 'out', externalIds: [GAIA_TECH, MOSAIC], cargo: [item('returning BAM specialists', 'light')], likelihood: 0.5, category: 'passenger', purpose: 'Specialist deployment' },
  { id: 'leave-out', surface: SHADE, direction: 'out', externalIds: [GAIA_PORT, 'estella-iv-primary-city', CONCORD], cargo: [item('BAM leave rotation', 'standard')], likelihood: 0.6, category: 'passenger', purpose: 'Leave rotation' },
  { id: 'leave-return', surface: SHADE, direction: 'in', externalIds: [GAIA_PORT, 'estella-iv-primary-city', CONCORD], cargo: [item('returning BAM leave rotation', 'standard')], likelihood: 0.6, category: 'passenger', purpose: 'Leave rotation' },
];

function generate(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const lane of LANES) for (const external of lane.externalIds) for (const cargo of lane.cargo) {
    const key = `${lane.id}:${external}:${cargo.label}`;
    const endpoint = balorDispatchEndpoint(lane.surface, key, ctx.worldTime);
    const sourceId = lane.direction === 'in' ? external : endpoint;
    if (sourceId !== ctx.sourceId) continue;
    const destinationId = lane.direction === 'in' ? endpoint : external;
    const handling = endpoint === BALOR_ORBITAL ? 'Balor Orbital consolidation; local transport arranged by BAM.' : 'Direct surface handling.';
    out.push({
      factionId: BAM_ID, factionName: BAM_NAME, factionTag: 'BAM',
      templateId: `${lane.id}:${external}:${cargo.label}`, sourceId, destinationId,
      cargo: { ...cargo, massTons: cargoMassForClass(cargo.massClass, `${BAM_ID}:${key}`) },
      likelihood: lane.likelihood, category: lane.category ?? 'freight',
      ...(lane.category === 'passenger' ? PERSONNEL_PAY : FREIGHT_PAY),
      // Operational fields only. Narrative completion scenes await copy review;
      // the shared provider wrapper supplies the existing neutral receipt.
      details: `${lane.purpose}. ${lane.direction === 'in' ? 'Receiving' : 'Originating'} site: ${SURFACE_NAMES[lane.surface]}. ${handling}`,
    });
  }
  return out;
}

export const BALOR_ADVANCED_MATERIALS_PROVIDER: FactionContractProvider = {
  id: BAM_ID, name: BAM_NAME, generosity: FREIGHT_PAY.generosity, generateContracts: generate,
};
