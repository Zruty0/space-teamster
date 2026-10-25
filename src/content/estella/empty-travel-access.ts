// Empty-run discovery/arrival policy ONLY. Contract postings carry their own
// authorization and must never be filtered through this registry.
export type EmptyTravelAccess = 'public' | 'restricted' | 'unlisted' | 'contract-only';
// Explicitly no empty arrivals, even with a known local mission contact.
const CONTRACT_ONLY = ['deepest-dock-poi'] as const;
const RESTRICTED = [
  'estella-vi-industrial-city', 'estella-vi-foundry-complex', 'estella-vi-spaceport',
  'estella-vi-agricultural-lowlands', 'estella-vi-polar-weather-research', 'estella-vi-mountain-mining',
  'estella-vib-vat-protein', 'estella-vib-pharma-horticulture', 'estella-vib-aquaculture',
  'estella-vii-black-project-outpost',
  'still-guild-hq', 'still-refinery-core', 'still-distribution-bay', 'still-worker-hab', 'still-skim-runner-berth-poi',
  'ark-quarantine-station-poi',
  'estella-xa-exobiology-research', 'estella-xb-luxury-retreat', 'estella-xd-redoubt-field',
  'estella-xic-deep-ice-exobiology', 'estella-xif-observatory', 'estella-xif-sealed-research-outpost',
  'estella-xiia-deep-ice-mine', 'estella-xiia-isolated-settlement', 'estella-xiib-outpost',
  'estella-xiid-black-project-exile', 'estella-xiid-blackglass-observatory',
  'estella-xiii-prison-exile-colony', 'estella-xiii-classified-research',
] as const;
const UNLISTED = [
  'arkfall-apocrypha-cache-poi', 'estella-xid-specialty-cargo',
  'estella-xi-smuggler-deaddrop-poi', 'estella-xi-fence-poi', 'estella-xii-smuggler-waypoint-poi',
  'estella-xiid-mirror-clinic', 'estella-xiv-smuggler-haven', 'estella-xiv-religious-retreat', 'estella-xiv-abandoned-active-site', 'reach-comet-fragment-3-poi',
  // Abandoned, isolated and lore sites: no empty arrival until a contact is known.
  'estella-v-abandoned-colony', 'estella-viii-abandoned-site', 'reach-comet-fragment-2-poi',
  'reach-rogue-lonely-beacon',
  'reach-comet-fragment-4-poi', 'reach-comet-fragment-6-poi',
  'coronal-observation-post-ops',
] as const;
const PUBLIC: readonly string[] = [
  'estella-i-transit-customs', 'estella-i-worker-hab', 'estella-i-refractory-mine', 'estella-i-hot-processing',
  'estella-ii-commercial-hub-dock', 'estella-ii-olympos', 'estella-ii-nimbus-crucible', 'estella-ii-pandemonium',
  'estella-iii-main-customs', 'estella-iii-luxury-orbital-habitat', 'estella-iii-capital-city', 'estella-iii-finance-city',
  'estella-iii-high-tech-city', 'estella-iii-coastal-resort', 'estella-iii-agricultural-region', 'estella-iii-polar-science', 'estella-iii-historic-site',
  'estella-iiia-main-port-transit', 'estella-iiia-helium-mining', 'estella-iiia-science-settlement', 'estella-iiia-heritage-site',
  'estella-iv-main-orbital-station', 'estella-iv-primary-city', 'estella-iv-climate-poi-1', 'estella-iv-climate-poi-2', 'estella-iv-climate-poi-3',
  'skim-hub-alpha-precursor-dock', 'skim-hub-beta-precursor-dock',
  'estella-v-transit-customs', 'estella-v-capital-settlement', 'estella-v-open-cast-mine', 'estella-v-atmo-refinery', 'estella-v-storm-research', 'estella-v-high-orbit-factory',
  'estella-va-strip-mine', 'estella-va-miner-hab', 'estella-va-ore-handling-depot',
  'estella-vi-main-transit-dispatch', 'estella-vi-heavy-cargo-station',
  'estella-via-drydock-station', 'estella-via-component-supply-station', 'estella-via-surface-anchor', 'estella-via-rare-alloy-extraction',
  'estella-vib-cold-chain-station', 'estella-vii-transit-export', 'estella-vii-high-vacuum-factory', 'estella-vii-feedstock-mine', 'estella-vii-worker-hab',
  'caravanserai-main-commercial-dock', 'caravanserai-player-hangar', 'caravanserai-highliner-bay-poi', 'caravanserai-outfitter-drydock',
  'caravanserai-certification-authority', 'caravanserai-refuel-depot', 'caravanserai-foreign-quarter', 'caravanserai-customs-inspection',
  'caravanserai-free-trader-anchorage', 'caravanserai-lookout-spire', 'still-public-approach-dock', 'mercer-dock', 'harlan-dock',
  'industrial-refinery-ore-intake', 'industrial-refinery-finished-goods', 'industrial-refinery-staff-hab',
  'grubstake-depot-dock', 'highgrade-depot-dock', 'slagfoot-depot-dock', 'deepcut-depot-dock',
  'estella-viii-first-rendezvous-station', 'estella-viii-harder-approach-station', 'estella-viii-settlement',
  'estella-viii-mining-site', 'estella-viii-moonlet-docking-site',
  'estella-ix-geological-feature', 'estella-ix-opposite-sense-supply-depot', 'estella-ix-research-base', 'estella-ix-ice-mine', 'estella-ix-moonlet-observation-outpost',
  'estella-x-observation-skim-hub', 'estella-xa-volatiles-transit', 'estella-xa-deep-ice-mine',
  'estella-xb-rare-element-mine', 'estella-xb-smelting-processing', 'estella-xb-worker-hab',
  'estella-xc-main-outpost', 'estella-xc-transit-refuel', 'estella-xc-castle-alvares', 'estella-xc-castle-mendes',
  'estella-xd-geothermal-extraction', 'estella-xd-chem-station', 'estella-xd-proving-grounds', 'estella-xd-iron-lists', 'estella-x-captive-refuel-relay',
  'estella-xi-skim-hub', 'estella-xia-sulfur-mine', 'estella-xia-chem-station', 'estella-xia-sealed-worker-hab', 'estella-xia-rare-element-extraction',
  'estella-xib-cryo-transit', 'estella-xib-methane-refinery', 'estella-xib-organic-chemistry', 'estella-xib-hydrocarbon-extraction', 'estella-xib-science-settlement',
  'estella-xic-research-station-poi', 'estella-xic-ice-mining', 'estella-xic-last-breath-lists',
  'estella-xid-main-port', 'estella-xid-services-outfitter-hangar', 'estella-xid-customs-transit',
  'estella-xie-outer-spec-drydock', 'estella-xie-component-fabrication', 'estella-xie-rare-alloy-extraction', 'estella-xie-oathmark-academy',
  'estella-xif-deep-listening-array', 'estella-xi-science-waypoint-poi', 'estella-xi-religious-retreat-poi',
  'estella-xii-observation-post', 'estella-xiia-volatiles-transit', 'estella-xiib-transit-station-poi',
  'estella-xiic-isotope-mining', 'estella-xiic-comet-research', 'estella-xiic-castle-teide', 'estella-xii-comm-relay-poi',
  'estella-xiii-main-port', 'estella-xiii-governors-outpost', 'estella-xiii-deep-ice-mining', 'estella-xiii-long-range-observatory',
  'estella-xiv-transit-dock', 'reach-comet-fragment-1-poi', 'reach-comet-fragment-5-poi', 'reach-rogue-isotope-mine',
];
export const EMPTY_TRAVEL_ACCESS: Readonly<Record<string, EmptyTravelAccess>> = Object.fromEntries([
  ...PUBLIC.map(id => [id, 'public'] as const),
  ...RESTRICTED.map(id => [id, 'restricted'] as const),
  ...UNLISTED.map(id => [id, 'unlisted'] as const),
  ...CONTRACT_ONLY.map(id => [id, 'contract-only'] as const),
]);
// Unknown/new IDs fail closed until their access is explicitly authored.
export function emptyTravelAccess(id: string): EmptyTravelAccess {
  return Object.prototype.hasOwnProperty.call(EMPTY_TRAVEL_ACCESS, id) ? EMPTY_TRAVEL_ACCESS[id] : 'unlisted';
}
