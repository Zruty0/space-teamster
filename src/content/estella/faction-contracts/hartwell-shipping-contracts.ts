import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Hartwell shipping houses live on route arbitrage: Wells raw/resource lots into Camps demand,
// basic Hartwell/Kuznia life-support backhauls into Wells worksites, and Kalyna luxury supply to
// noble/elite Wells markets. They are carriers and speculators, not machinery financiers.
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

interface Lane {
  laneId: string;
  sourceIds: string[];
  destinationIds: string[];
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

const VOLATILES: CargoOption[] = [
  { label: 'Beira ice blocks', massClass: 'heavy' },
  { label: 'bonded water tanks', massClass: 'heavy' },
  { label: 'clean volatile lots', massClass: 'standard' },
  { label: 'Macao debt-court ice', massClass: 'heavy' },
];

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
  { laneId: 'wells-volatiles-to-camps', sourceIds: ['estella-xa-deep-ice-mine', 'estella-xic-ice-mining'], destinationIds: [HAMMER, ANVIL, KALYNA_ORBITAL], cargo: VOLATILES, likelihood: 0.55, pay: ROUTINE_PAY },
  { laneId: 'wells-gas-to-camps', sourceIds: ['estella-x-observation-skim-hub', 'estella-xi-skim-hub'], destinationIds: [HAMMER, YARDSTOCK, SVAROG_SHIPYARD, KALYNA_ORBITAL], cargo: GAS_PRODUCTS, likelihood: 0.52, pay: ROUTINE_PAY },
  { laneId: 'wells-sulfur-chemicals-to-camps', sourceIds: ['estella-xia-sulfur-mine', 'estella-xia-chem-station', 'estella-xd-chem-station'], destinationIds: [HAMMER, ZHITOMIR, MOSAIC], cargo: SULFUR_CHEMICALS, likelihood: 0.5, pay: ROUTINE_PAY },
  { laneId: 'wells-hydrocarbons-to-camps', sourceIds: ['estella-xib-cryo-transit', 'estella-xib-methane-refinery', 'estella-xib-organic-chemistry', 'estella-xib-hydrocarbon-extraction'], destinationIds: [HAMMER, KALYNA_ORBITAL, ZHITOMIR, TETERIV], cargo: HYDROCARBONS, likelihood: 0.5, pay: ROUTINE_PAY },
  { laneId: 'wells-metals-to-camps', sourceIds: ['estella-xb-rare-element-mine', 'estella-xb-smelting-processing', 'estella-xd-geothermal-extraction', 'estella-xia-rare-element-extraction'], destinationIds: [HAMMER, YARDSTOCK, SVAROG_SHIPYARD, MOSAIC], cargo: METALS, likelihood: 0.48, pay: CERTIFIED_PAY },
  { laneId: 'wells-isotopes-to-camps', sourceIds: ['estella-xiic-isotope-mining', 'estella-xiic-castle-teide'], destinationIds: [HAMMER, YARDSTOCK, MOSAIC], cargo: ISOTOPES, likelihood: 0.36, pay: ISOTOPE_PAY },
  { laneId: 'oathmark-surplus-to-camps', sourceIds: ['estella-xie-rare-alloy-extraction', 'estella-xie-outer-spec-drydock'], destinationIds: [SVAROG_SHIPYARD, YARDSTOCK, MOSAIC], cargo: YARD_SURPLUS, likelihood: 0.28, pay: CERTIFIED_PAY },
  { laneId: 'hartwell-life-support-to-wells', sourceIds: [ROADSTEAD, CONCORD], destinationIds: WELLS_WORKS, cargo: LIFE_SUPPORT, likelihood: 0.42, pay: BACKHAUL_PAY },
  { laneId: 'kuznia-consumables-to-wells', sourceIds: [HAMMER, ANVIL, YARDSTOCK], destinationIds: WELLS_WORKS, cargo: INDUSTRIAL_CONSUMABLES, likelihood: 0.38, pay: BACKHAUL_PAY },
  { laneId: 'kalyna-luxury-to-wells', sourceIds: [KALYNA_ORBITAL, TETERIV, ZHITOMIR, DNIPRO], destinationIds: WELLS_ELITE_MARKETS, cargo: KALYNA_LUXURY, likelihood: 0.32, pay: LUXURY_PAY },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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

const ROSTER: ShippingCompany[] = seededSample(NAME_POOL, 18, hashString('hartwell-shipping-roster-v1')).map(name => {
  const h = hashString(name);
  const laneCount = 2 + ((h >>> 6) % 2);
  return { name, slug: slug(name), lanes: seededSample(LANES, laneCount, h ^ 0x514c1a6e) };
});

function makeCargo(option: CargoOption, seedKey: string): MissionCargoSpec {
  return { label: option.label, massClass: option.massClass, massTons: cargoMassForClass(option.massClass, `${HARTWELL_SHIPPING_ID}:${seedKey}:${option.label}`) };
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
    likelihood: lane.likelihood,
    ...lane.pay,
  };
}

function generateHartwellShippingContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const day = Math.floor(ctx.worldTime / 86_400);
  for (const company of ROSTER) {
    for (const lane of company.lanes) {
      if (!lane.sourceIds.includes(ctx.sourceId)) continue;
      for (const destinationId of lane.destinationIds) {
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
