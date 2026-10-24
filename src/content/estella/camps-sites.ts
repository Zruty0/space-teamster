/** Camps operational IDs stay stable through the content pass. */
export const ROADSTEAD = 'estella-v-transit-customs';
export const CONCORD = 'estella-v-capital-settlement';
export const DAWES = 'estella-v-open-cast-mine';
export const CINDERHOOK = 'estella-v-atmo-refinery';
export const GALE = 'estella-v-storm-research';
export const FIRST_LANDING = 'estella-v-abandoned-colony';
export const ASCENSION = 'estella-v-high-orbit-factory';
export const FLINT = 'estella-va-strip-mine';
export const SWITCHBACK = 'estella-va-miner-hab';
export const PIKE_DEPOT = 'estella-va-ore-handling-depot';
export const ANVIL = 'estella-vi-main-transit-dispatch';
export const HAMMER = 'estella-vi-heavy-cargo-station';
export const STRIBOG = 'estella-vi-spaceport';
export const MORANA = 'estella-vi-polar-weather-research';
export const SVAROG_YARD = 'estella-via-drydock-station';
export const VELES = 'estella-via-component-supply-station';
export const ANCHORHOLD = 'estella-via-surface-anchor';
export const BLACK_VEIN = 'estella-via-rare-alloy-extraction';
export const KALYNA = 'estella-vib-cold-chain-station';
export const TESSERA_ORBITAL = 'estella-vii-transit-export';
export const MOSAIC = 'estella-vii-high-vacuum-factory';
export const WHITE_QUARRY = 'estella-vii-feedstock-mine';
export const ROSTER = 'estella-vii-worker-hab';
export const BLACK_TILE = 'estella-vii-black-project-outpost';
export const HARTWELL_TRADE_SURFACES = [CONCORD, DAWES, CINDERHOOK, GALE] as const;
export const TESSERA_TRADE_SURFACES = [MOSAIC, WHITE_QUARRY, ROSTER] as const;
export const CAMPS_LOCATION_IDS = [
  ROADSTEAD, CONCORD, DAWES, CINDERHOOK, GALE, FIRST_LANDING, ASCENSION,
  FLINT, SWITCHBACK, PIKE_DEPOT,
  ANVIL, HAMMER, 'estella-vi-industrial-city', 'estella-vi-foundry-complex', STRIBOG,
  'estella-vi-agricultural-lowlands', MORANA, 'estella-vi-mountain-mining',
  SVAROG_YARD, VELES, ANCHORHOLD, BLACK_VEIN, KALYNA,
  'estella-vib-vat-protein', 'estella-vib-pharma-horticulture', 'estella-vib-aquaculture',
  TESSERA_ORBITAL, MOSAIC, WHITE_QUARRY, ROSTER, BLACK_TILE,
] as const;
export const CAMPS_TRADE_WORLDS = [
  { bodyId: 'estella-v', name: 'Hartwell', hub: ROADSTEAD, hubName: 'Roadstead Station', sites: HARTWELL_TRADE_SURFACES },
  { bodyId: 'estella-vii', name: 'Tessera', hub: TESSERA_ORBITAL, hubName: 'Tessera Orbital', sites: TESSERA_TRADE_SURFACES },
] as const;
