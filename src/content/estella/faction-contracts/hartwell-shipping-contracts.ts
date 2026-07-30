import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Hartwell shipping houses live on route arbitrage: Wells raw/resource lots into Camps demand,
// basic Hartwell/Kuznia life-support backhauls into all Wells destinations, industrial
// consumables into Wells worksites, and Kalyna luxury supply to noble/elite Wells markets.
// They are carriers and speculators, not machinery financiers.
const HARTWELL_SHIPPING_ID = 'hartwell-shipping-companies';

const ROADSTEAD = 'estella-v-transit-customs';
const CONCORD = 'estella-v-capital-settlement';
const HAMMER = 'estella-vi-heavy-cargo-station';
const ANVIL = 'estella-vi-main-transit-dispatch';
const SVAROG_SHIPYARD = 'estella-via-drydock-station';
const YARDSTOCK = 'estella-via-component-supply-station';
const KALYNA_ORBITAL = 'estella-vib-cold-chain-station';
const TETERIV = 'estella-vib-vat-protein';
const ZHITOMIR = 'estella-vib-pharma-horticulture';
const DNIPRO = 'estella-vib-aquaculture';
const MOSAIC = 'estella-vii-high-vacuum-factory';
const CADIZ_HIGHPORT = 'estella-xid-main-port';

const ROUTINE_PAY = { generosity: 0.75, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const CERTIFIED_PAY = { generosity: 0.85, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const ISOTOPE_PAY = { generosity: 0.95, compensationRatio: 0.3, maxCompAllowance: 2 } as const;
const BACKHAUL_PAY = { generosity: 0.7, compensationRatio: 0.45, maxCompAllowance: 2 } as const;
const LUXURY_PAY = { generosity: 0.9, compensationRatio: 0.35, maxCompAllowance: 2 } as const;

type Pay = typeof ROUTINE_PAY | typeof CERTIFIED_PAY | typeof ISOTOPE_PAY | typeof BACKHAUL_PAY | typeof LUXURY_PAY;

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
}

interface WeightedDestination {
  id: string;
  weight: number;
}

interface Lane {
  laneId: string;
  sourceIds: string[];
  destinationIds?: string[];
  destinationPool?: WeightedDestination[];
  destinationCount?: number;
  /** If set, this lane models consolidation: hub gets 80% of posting weight, direct buyers share 20%. */
  consolidationHubId?: string;
  cargo: CargoOption[];
  likelihood: number;
  pay: Pay;
  sampleCount?: number;
}

interface ShippingCompany {
  name: string;
  slug: string;
  lanes: Lane[];
}

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s factor at ${destination} checks the ${cargo} against three purchase orders. "Camps price held," she says, and signs before anyone can change it.`,
  (_candidate, cargo, destination) => `The ${cargo} clears into ${destination}'s buyer queue with Hartwell brokerage marks still on the straps. The margin was won somewhere between two calendars and a nervous warehouse clerk.`,
  (_candidate, cargo, destination, issuer) => `${issuer} hands the ${cargo} over at ${destination} under a plain carrier seal. "Backhaul paid for itself," the receiver says, which is the closest thing to poetry in this trade.`,
  (_candidate, cargo, destination) => `At ${destination}, dockhands move the ${cargo} straight from your bay to a waiting work order. Nobody calls it arbitrage while the forklifts are listening.`,
  (_candidate, cargo, destination, issuer) => `${destination} receives the ${cargo} with the brisk manners of a place that needed it yesterday. ${issuer}'s clerk closes the manifest and starts pricing the return leg.`,
];

const NAME_POOL = [
  'Roadstead Interchange',
  'Concord Carrying House',
  'Camps-Wells Packet Company',
  'Frontier Turnaround Lines',
  'Hartwell Backhaul Office',
  'Three Wells Trading Run',
  'Red Dust Route Company',
  'Claimant Shipping Factors',
  'Roadstead Margin House',
  'Concord Speculative Freight',
  'Cinder-Pike Carrying Trust',
  'Outer Prices Shipping',
  'Westward Interchange',
  'Saddle Route Factors',
  'Hartwell Spot Freight',
  'Long Quote Carriers',
  'Roadstead Arbitrage Desk',
  'Concord Useful Cargo',
  'Dustline Through-Freight',
  'Frontier Price Company',
];

const WELLS_WORKS = [
  'estella-xa-deep-ice-mine',
  'estella-xb-rare-element-mine',
  'estella-xb-smelting-processing',
  'estella-xd-geothermal-extraction',
  'estella-xd-chem-station',
  'estella-xia-sulfur-mine',
  'estella-xia-chem-station',
  'estella-xia-rare-element-extraction',
  'estella-xib-cryo-transit',
  'estella-xib-methane-refinery',
  'estella-xib-organic-chemistry',
  'estella-xib-hydrocarbon-extraction',
  'estella-xic-ice-mining',
  'estella-xid-customs-transit',
  'estella-xie-rare-alloy-extraction',
  'estella-xiic-isotope-mining',
  'estella-xiic-castle-teide',
];

function destination(id: string, weight: number): WeightedDestination {
  return { id, weight };
}

const WELLS_LIFE_SUPPORT_DESTINATIONS: WeightedDestination[] = [
  destination('estella-xid-main-port', 3.2),
  destination('estella-xid-customs-transit', 3.0),
  destination('estella-xc-main-outpost', 2.8),
  destination('estella-xc-transit-refuel', 2.5),
  destination('estella-xic-research-station-poi', 2.4),
  destination('estella-xia-sealed-worker-hab', 2.0),
  destination('estella-xib-science-settlement', 2.0),
  destination('estella-xa-volatiles-transit', 1.8),
  destination('estella-xb-worker-hab', 1.8),
  destination('estella-xid-services-outfitter-hangar', 1.8),
  destination('estella-xiia-isolated-settlement', 1.7),
  destination('estella-xic-ice-mining', 1.6),
  destination('estella-xd-proving-grounds', 1.6),
  destination('estella-xie-outer-spec-drydock', 1.6),
  destination('estella-xie-oathmark-academy', 1.6),
  destination('estella-xib-cryo-transit', 1.5),
  destination('estella-xib-methane-refinery', 1.5),
  destination('estella-xii-observation-post', 1.5),
  destination('estella-x-observation-skim-hub', 1.4),
  destination('estella-xi-skim-hub', 1.4),
  destination('estella-xie-rare-alloy-extraction', 1.4),
  destination('estella-xa-deep-ice-mine', 1.3),
  destination('estella-xd-geothermal-extraction', 1.3),
  destination('estella-xia-sulfur-mine', 1.3),
  destination('estella-xib-hydrocarbon-extraction', 1.3),
  destination('estella-xiic-castle-teide', 1.3),
  destination('estella-xiic-isotope-mining', 1.2),
  destination('estella-xc-castle-alvares', 1.2),
  destination('estella-xc-castle-mendes', 1.2),
  destination('estella-xb-smelting-processing', 1.1),
  destination('estella-xd-chem-station', 1.1),
  destination('estella-xia-chem-station', 1.1),
  destination('estella-xib-organic-chemistry', 1.1),
  destination('estella-xie-component-fabrication', 1.1),
  destination('estella-xb-luxury-retreat', 1.0),
  destination('estella-xic-deep-ice-exobiology', 1.0),
  destination('estella-xic-last-breath-lists', 1.0),
  destination('estella-xiid-mirror-clinic', 1.0),
  destination('estella-xii-comm-relay-poi', 1.0),
  destination('estella-x-captive-refuel-relay', 0.9),
  destination('estella-xb-rare-element-mine', 0.9),
  destination('estella-xia-rare-element-extraction', 0.9),
  destination('estella-xiia-volatiles-transit', 0.9),
  destination('estella-xiib-transit-station-poi', 0.9),
  destination('estella-xi-religious-retreat-poi', 0.8),
  destination('estella-xiic-comet-research', 0.8),
  destination('estella-xiid-blackglass-observatory', 0.8),
  destination('estella-xa-exobiology-research', 0.7),
  destination('estella-xd-iron-lists', 0.7),
  destination('estella-xd-redoubt-field', 0.7),
  destination('estella-xi-science-waypoint-poi', 0.7),
  destination('estella-xiia-deep-ice-mine', 0.7),
  destination('estella-xiib-outpost', 0.7),
  destination('estella-xiid-black-project-exile', 0.7),
  destination('estella-xid-specialty-cargo', 0.6),
  destination('estella-xi-fence-poi', 0.6),
  destination('estella-xi-smuggler-deaddrop-poi', 0.5),
  destination('estella-xii-smuggler-waypoint-poi', 0.5),
  destination('estella-xif-deep-listening-array', 0.5),
  destination('estella-xif-observatory', 0.4),
  destination('estella-xif-sealed-research-outpost', 0.25),
];

const WELLS_ELITE_MARKETS = [
  'estella-xc-main-outpost',
  'estella-xc-transit-refuel',
  'estella-xid-customs-transit',
  'estella-xic-research-station-poi',
  'estella-xb-luxury-retreat',
  'estella-xa-volatiles-transit',
  'estella-xb-worker-hab',
  'estella-xd-proving-grounds',
  'estella-xia-sealed-worker-hab',
  'estella-xib-science-settlement',
  'estella-xid-services-outfitter-hangar',
  'estella-xiic-castle-teide',
];

const BEIRA_VOLATILES: CargoOption[] = [
  { label: 'Beira ice blocks', massClass: 'heavy' },
  { label: 'bonded water tanks', massClass: 'heavy' },
  { label: 'clean volatile lots', massClass: 'standard' },
];

const MACAO_VOLATILES: CargoOption[] = [
  { label: 'Macao debt-court ice', massClass: 'heavy' },
  { label: 'bonded water tanks', massClass: 'heavy' },
  { label: 'clean volatile lots', massClass: 'standard' },
];

const VOLATILES: CargoOption[] = [...BEIRA_VOLATILES, ...MACAO_VOLATILES];

const GAS_PRODUCTS: CargoOption[] = [
  { label: 'helium-rich industrial gas racks', massClass: 'standard' },
  { label: 'pressure gas bottle pallets', massClass: 'standard' },
  { label: 'skim condensate canisters', massClass: 'dense' },
  { label: 'gas-giant coolant stock', massClass: 'standard' },
];

const SULFUR_CHEMICALS: CargoOption[] = [
  { label: 'industrial sulfur lots', massClass: 'heavy' },
  { label: 'sulfur clinker', massClass: 'dense' },
  { label: 'acid precursor drums', massClass: 'standard' },
  { label: 'alchemical reagent pallets', massClass: 'standard' },
];

const HYDROCARBONS: CargoOption[] = [
  { label: 'methane tankage', massClass: 'standard' },
  { label: 'polymer precursor drums', massClass: 'standard' },
  { label: 'organic solvent lots', massClass: 'standard' },
  { label: 'Marisma hydrocarbon fractions', massClass: 'heavy' },
];

const METALS: CargoOption[] = [
  { label: 'rare-element assay drums', massClass: 'dense' },
  { label: 'Tinto smelter cakes', massClass: 'dense' },
  { label: 'Cinnabar trace-metal lots', massClass: 'dense' },
  { label: 'processed ore preforms', massClass: 'heavy' },
  { label: 'Marcher mineral salts', massClass: 'heavy' },
];

const ISOTOPES: CargoOption[] = [
  { label: 'Bluefire isotope cylinders', massClass: 'dense' },
  { label: 'shielded isotope concentrates', massClass: 'dense' },
  { label: 'reactor diagnostic isotopes', massClass: 'light' },
];

const YARD_SURPLUS: CargoOption[] = [
  { label: 'Keelwright component overruns', massClass: 'standard' },
  { label: 'certified refit modules', massClass: 'heavy' },
  { label: 'rejected-but-saleable fittings', massClass: 'standard' },
];

const LIFE_SUPPORT: CargoOption[] = [
  { label: 'life-support filter pallets', massClass: 'standard' },
  { label: 'pressure-suit consumables', massClass: 'standard' },
  { label: 'frontier ration lockers', massClass: 'standard' },
  { label: 'medical clinic lockers', massClass: 'light' },
  { label: 'replacement scrubber beds', massClass: 'standard' },
  { label: 'habitat sealant drums', massClass: 'standard' },
];

const INDUSTRIAL_CONSUMABLES: CargoOption[] = [
  { label: 'compressor cartridge crates', massClass: 'standard' },
  { label: 'cryo-safe valve kits', massClass: 'standard' },
  { label: 'industrial lubricant drums', massClass: 'standard' },
  { label: 'worksite battery stacks', massClass: 'heavy' },
  { label: 'bulk worker supply pallets', massClass: 'standard' },
];

const KALYNA_LUXURY: CargoOption[] = [
  { label: 'boutique aquaculture trays', massClass: 'light' },
  { label: 'cultured game-bird cuts', massClass: 'light' },
  { label: 'noble-table protein lots', massClass: 'standard' },
  { label: 'pharmaceutical horticulture crates', massClass: 'light' },
  { label: 'sealed floral conservatory stock', massClass: 'light' },
  { label: 'status banquet cold-chain', massClass: 'standard' },
  { label: 'bespoke medical nutriments', massClass: 'light' },
];

const LANES: Lane[] = [
  { laneId: 'beira-volatiles-to-camps', sourceIds: ['estella-xa-deep-ice-mine'], destinationIds: [CADIZ_HIGHPORT, HAMMER, ANVIL, KALYNA_ORBITAL], consolidationHubId: CADIZ_HIGHPORT, cargo: BEIRA_VOLATILES, likelihood: 0.55, pay: ROUTINE_PAY },
  { laneId: 'macao-volatiles-to-camps', sourceIds: ['estella-xic-ice-mining'], destinationIds: [CADIZ_HIGHPORT, HAMMER, ANVIL, KALYNA_ORBITAL], consolidationHubId: CADIZ_HIGHPORT, cargo: MACAO_VOLATILES, likelihood: 0.55, pay: ROUTINE_PAY },
  { laneId: 'wells-gas-to-camps', sourceIds: ['estella-x-observation-skim-hub', 'estella-xi-skim-hub'], destinationIds: [CADIZ_HIGHPORT, HAMMER, YARDSTOCK, SVAROG_SHIPYARD, KALYNA_ORBITAL], consolidationHubId: CADIZ_HIGHPORT, cargo: GAS_PRODUCTS, likelihood: 0.52, pay: ROUTINE_PAY },
  { laneId: 'wells-sulfur-chemicals-to-camps', sourceIds: ['estella-xia-sulfur-mine', 'estella-xia-chem-station', 'estella-xd-chem-station'], destinationIds: [CADIZ_HIGHPORT, HAMMER, ZHITOMIR, MOSAIC], consolidationHubId: CADIZ_HIGHPORT, cargo: SULFUR_CHEMICALS, likelihood: 0.5, pay: ROUTINE_PAY },
  { laneId: 'wells-hydrocarbons-to-camps', sourceIds: ['estella-xib-cryo-transit', 'estella-xib-methane-refinery', 'estella-xib-organic-chemistry', 'estella-xib-hydrocarbon-extraction'], destinationIds: [CADIZ_HIGHPORT, HAMMER, KALYNA_ORBITAL, ZHITOMIR, TETERIV], consolidationHubId: CADIZ_HIGHPORT, cargo: HYDROCARBONS, likelihood: 0.5, pay: ROUTINE_PAY },
  { laneId: 'wells-metals-to-camps', sourceIds: ['estella-xb-rare-element-mine', 'estella-xb-smelting-processing', 'estella-xd-geothermal-extraction', 'estella-xia-rare-element-extraction'], destinationIds: [CADIZ_HIGHPORT, HAMMER, YARDSTOCK, SVAROG_SHIPYARD, MOSAIC], consolidationHubId: CADIZ_HIGHPORT, cargo: METALS, likelihood: 0.48, pay: CERTIFIED_PAY },
  { laneId: 'wells-isotopes-to-camps', sourceIds: ['estella-xiic-isotope-mining', 'estella-xiic-castle-teide'], destinationIds: [CADIZ_HIGHPORT, HAMMER, YARDSTOCK, MOSAIC], consolidationHubId: CADIZ_HIGHPORT, cargo: ISOTOPES, likelihood: 0.36, pay: ISOTOPE_PAY },
  { laneId: 'oathmark-surplus-to-camps', sourceIds: ['estella-xie-rare-alloy-extraction', 'estella-xie-outer-spec-drydock'], destinationIds: [CADIZ_HIGHPORT, SVAROG_SHIPYARD, YARDSTOCK, MOSAIC], consolidationHubId: CADIZ_HIGHPORT, cargo: YARD_SURPLUS, likelihood: 0.28, pay: CERTIFIED_PAY },
  { laneId: 'hartwell-life-support-to-wells', sourceIds: [ROADSTEAD, CONCORD, ANVIL], destinationPool: WELLS_LIFE_SUPPORT_DESTINATIONS, destinationCount: 12, cargo: LIFE_SUPPORT, likelihood: 0.42, pay: BACKHAUL_PAY },
  { laneId: 'kuznia-consumables-to-wells', sourceIds: [HAMMER, ANVIL, YARDSTOCK], destinationIds: WELLS_WORKS, cargo: INDUSTRIAL_CONSUMABLES, likelihood: 0.38, pay: BACKHAUL_PAY },
  { laneId: 'kalyna-luxury-to-wells', sourceIds: [KALYNA_ORBITAL, TETERIV, ZHITOMIR, DNIPRO], destinationIds: WELLS_ELITE_MARKETS, cargo: KALYNA_LUXURY, likelihood: 0.32, pay: LUXURY_PAY },
  { laneId: 'cadiz-consolidated-wells-exports', sourceIds: [CADIZ_HIGHPORT], destinationIds: [HAMMER, ANVIL, SVAROG_SHIPYARD, YARDSTOCK, KALYNA_ORBITAL, ZHITOMIR, TETERIV, MOSAIC], cargo: [...VOLATILES, ...GAS_PRODUCTS, ...SULFUR_CHEMICALS, ...HYDROCARBONS, ...METALS, ...ISOTOPES, ...YARD_SURPLUS], likelihood: 0.6, pay: ROUTINE_PAY },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rand(seed: number): number {
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 0xffffffff;
}

function slug(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '');
}

function seededSample<T>(pool: T[], count: number, seed: number): T[] {
  const out = pool.slice();
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, count);
}

function weightedSampleDestinations(pool: WeightedDestination[], count: number, seed: number): WeightedDestination[] {
  const remaining = pool.slice();
  const picked: WeightedDestination[] = [];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const total = remaining.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
    let roll = rand(seed + i * 0x7f4a7c15) * total;
    let index = 0;
    for (; index < remaining.length; index++) {
      roll -= Math.max(0, remaining[index].weight);
      if (roll <= 0) break;
    }
    const [item] = remaining.splice(Math.min(index, remaining.length - 1), 1);
    picked.push(item);
  }
  return picked;
}

const ROSTER: ShippingCompany[] = seededSample(NAME_POOL, 18, hashString('hartwell-shipping-roster-v1')).map(name => {
  const h = hashString(name);
  const laneCount = 2 + ((h >>> 6) % 2);
  return { name, slug: slug(name), lanes: seededSample(LANES, laneCount, h ^ 0x514c1a6e) };
});

function makeCargo(option: CargoOption, seedKey: string): MissionCargoSpec {
  return { label: option.label, massClass: option.massClass, massTons: cargoMassForClass(option.massClass, `${HARTWELL_SHIPPING_ID}:${seedKey}:${option.label}`) };
}

function destinationLikelihoodMultiplier(lane: Lane, destinationId: string): number {
  if (!lane.consolidationHubId || !lane.destinationIds) return 1;
  if (destinationId === lane.consolidationHubId) return 0.8;
  const directDestinationCount = Math.max(1, lane.destinationIds.filter(id => id !== lane.consolidationHubId).length);
  return 0.2 / directDestinationCount;
}

function candidate(company: ShippingCompany, lane: Lane, sourceId: string, destinationId: string, option: CargoOption): FactionContractCandidate {
  const seedKey = `${company.slug}:${lane.laneId}:${sourceId}->${destinationId}:${slug(option.label)}`;
  return {
    factionId: HARTWELL_SHIPPING_ID,
    factionName: company.name,
    templateId: seedKey,
    sourceId,
    destinationId,
    cargo: makeCargo(option, seedKey),
    likelihood: lane.likelihood * destinationLikelihoodMultiplier(lane, destinationId),
    ...lane.pay,
  };
}

function destinationIdsForLane(company: ShippingCompany, lane: Lane, sourceId: string, day: number): string[] {
  if (lane.destinationPool) {
    return weightedSampleDestinations(lane.destinationPool, lane.destinationCount ?? lane.destinationPool.length, hashString(`${company.slug}:${lane.laneId}:${sourceId}:destinations:${day}`)).map(destination => destination.id);
  }
  return lane.destinationIds ?? [];
}

function generateHartwellShippingContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const day = Math.floor(ctx.worldTime / 86_400);
  for (const company of ROSTER) {
    for (const lane of company.lanes) {
      if (!lane.sourceIds.includes(ctx.sourceId)) continue;
      for (const destinationId of destinationIdsForLane(company, lane, ctx.sourceId, day)) {
        if (destinationId === ctx.sourceId) continue;
        const options = seededSample(lane.cargo, lane.sampleCount ?? 1, hashString(`${company.slug}:${lane.laneId}:${ctx.sourceId}->${destinationId}:${day}`));
        for (const option of options) out.push(candidate(company, lane, ctx.sourceId, destinationId, option));
      }
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const HARTWELL_SHIPPING_COMPANIES_PROVIDER: FactionContractProvider = {
  id: HARTWELL_SHIPPING_ID,
  name: 'Hartwell Shipping Companies',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateHartwellShippingContracts(ctx);
  },
};
