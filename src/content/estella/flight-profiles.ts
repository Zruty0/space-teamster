import { type LandingLayoutDef, type TerrainFeature } from '../../world';

export interface EstellaSurfaceFlightProfile {
  subtitle: string;
  labelVisibility?: 'always' | 'target';
  padCenterX: number;
  padHalfWidth: number;
  padY: number;
  roughness: number;
  features: TerrainFeature[];
  landingLayout?: LandingLayoutDef;
  landingStart: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    landingMaxVSpeed: number;
    landingMaxHSpeed: number;
    landingMaxAngle: number;
  };
  descentProfile: {
    startX: number;
    startY: number;
    startVX: number;
    startVY: number;
    startAngle: number;
    gateY: number;
    gateRadius: number;
    gateMaxSpeed: number;
    gateMinSpeed: number;
  };
  departureProfile: {
    startY: number;
    startVY: number;
    exitAltitude: number;
    thresholdApoapsisAltitude: number;
    targetOrbitAltitude: number;
    orbitDir: 1 | -1;
    fuelSeconds: number;
  };
}

const ESTELLA_VIII_DEFAULT_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  subtitle: 'Generated Estella surface site',
  padCenterX: 1000,
  padHalfWidth: 28,
  padY: 30,
  roughness: 0.6,
  features: [
    { xStart: 900, xEnd: 920, height: 44 },
    { xStart: 1080, xEnd: 1100, height: 50 },
  ],
  landingStart: {
    x: 1000,
    y: 260,
    vx: 0,
    vy: -3,
    landingMaxVSpeed: 4.0,
    landingMaxHSpeed: 3.0,
    landingMaxAngle: 0.26,
  },
  descentProfile: {
    startX: -90_000,
    startY: 9_000,
    startVX: 480,
    startVY: -24,
    startAngle: 1.5,
    gateY: 1500,
    gateRadius: 1800,
    gateMaxSpeed: 150,
    gateMinSpeed: 15,
  },
  departureProfile: {
    startY: 260,
    startVY: 0,
    exitAltitude: 8_000,
    thresholdApoapsisAltitude: 85_000,
    targetOrbitAltitude: 100_000,
    orbitDir: -1,
    fuelSeconds: 180,
  },
};

const ESTELLA_IX_DEFAULT_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  subtitle: 'Generated Estella IX icy surface site',
  features: [
    { xStart: 880, xEnd: 905, height: 38 },
    { xStart: 1110, xEnd: 1135, height: 46 },
  ],
};

const ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  subtitle: 'Generated Hearth surface site',
  features: [
    { xStart: 860, xEnd: 890, height: 34 },
    { xStart: 1120, xEnd: 1150, height: 42 },
  ],
};

const ESTELLA_HEARTH_ATMO_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  subtitle: 'Generated Hearth atmospheric surface site',
  descentProfile: {
    startX: -90_000,
    startY: 30_000,
    startVX: 1_350,
    startVY: -70,
    startAngle: 1.5,
    gateY: 1800,
    gateRadius: 1700,
    gateMaxSpeed: 170,
    gateMinSpeed: 20,
  },
  departureProfile: {
    ...ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE.departureProfile,
    startY: 320,
    startVY: 5,
    exitAltitude: 30_000,
    thresholdApoapsisAltitude: 90_000,
    targetOrbitAltitude: 140_000,
    fuelSeconds: 180,
  },
};

const OLYMPOS_ALTITUDE = 55_000;
const NIMBUS_CRUCIBLE_ALTITUDE = 34_000;

const ESTELLA_II_OLYMPOS_PROFILE: EstellaSurfaceFlightProfile = {
  subtitle: 'Atmospheric platform landing deck at Olympos in Acheron\'s upper cloud layer',
  padCenterX: 1000,
  padHalfWidth: 70,
  padY: OLYMPOS_ALTITUDE,
  roughness: 0,
  features: [],
  landingLayout: {
    kind: 'cloud-city',
    deckLeft: 620,
    deckRight: 1380,
    deckY: OLYMPOS_ALTITUDE,
    deckThickness: 18,
    supportXs: [760, 1240],
    supportWidth: 12,
    supportHeight: 240,
    domes: [
      { x: 820, radius: 62, height: 42 },
      { x: 1160, radius: 78, height: 54 },
      { x: 1320, radius: 44, height: 34 },
    ],
  },
  landingStart: {
    x: 1000,
    y: OLYMPOS_ALTITUDE + 260,
    vx: 0,
    vy: -3,
    landingMaxVSpeed: 3.5,
    landingMaxHSpeed: 2.5,
    landingMaxAngle: 0.22,
  },
  descentProfile: {
    startX: -85_000,
    startY: OLYMPOS_ALTITUDE + 24_000,
    startVX: 1_050,
    startVY: -45,
    startAngle: 1.5,
    gateY: 1_800,
    gateRadius: 1_900,
    gateMaxSpeed: 150,
    gateMinSpeed: 20,
  },
  departureProfile: {
    startY: OLYMPOS_ALTITUDE + 260,
    startVY: 4,
    exitAltitude: 75_000,
    thresholdApoapsisAltitude: 130_000,
    targetOrbitAltitude: 160_000,
    orbitDir: -1,
    fuelSeconds: 150,
  },
};

const ESTELLA_II_NIMBUS_CRUCIBLE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_II_OLYMPOS_PROFILE,
  subtitle: 'Acid-cloud aerostat landing deck at Nimbus Crucible',
  padCenterX: 1000,
  padHalfWidth: 52,
  padY: NIMBUS_CRUCIBLE_ALTITUDE,
  landingLayout: {
    kind: 'cloud-city',
    deckLeft: 720,
    deckRight: 1280,
    deckY: NIMBUS_CRUCIBLE_ALTITUDE,
    deckThickness: 16,
    supportXs: [850, 1150],
    supportWidth: 10,
    supportHeight: 180,
    domes: [
      { x: 910, radius: 46, height: 34 },
      { x: 1105, radius: 58, height: 42 },
    ],
  },
  landingStart: {
    ...ESTELLA_II_OLYMPOS_PROFILE.landingStart,
    y: NIMBUS_CRUCIBLE_ALTITUDE + 250,
    landingMaxVSpeed: 3.2,
    landingMaxHSpeed: 2.2,
  },
  descentProfile: {
    ...ESTELLA_II_OLYMPOS_PROFILE.descentProfile,
    startY: NIMBUS_CRUCIBLE_ALTITUDE + 26_000,
    gateRadius: 1_700,
    gateMaxSpeed: 135,
  },
  departureProfile: {
    ...ESTELLA_II_OLYMPOS_PROFILE.departureProfile,
    startY: NIMBUS_CRUCIBLE_ALTITUDE + 250,
    exitAltitude: 75_000,
    thresholdApoapsisAltitude: 125_000,
    targetOrbitAltitude: 155_000,
    fuelSeconds: 165,
  },
  labelVisibility: 'target',
};

const ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  subtitle: 'Generated Camps thin-atmosphere industrial site',
  features: [
    { xStart: 820, xEnd: 860, height: 26 },
    { xStart: 1140, xEnd: 1190, height: 32 },
  ],
  descentProfile: {
    startX: -80_000,
    startY: 24_000,
    startVX: 850,
    startVY: -55,
    startAngle: 1.5,
    gateY: 1600,
    gateRadius: 1600,
    gateMaxSpeed: 160,
    gateMinSpeed: 20,
  },
  departureProfile: {
    ...ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE.departureProfile,
    startY: 300,
    startVY: 5,
    exitAltitude: 28_000,
    thresholdApoapsisAltitude: 75_000,
    targetOrbitAltitude: 85_000,
    fuelSeconds: 170,
  },
};

const ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  subtitle: 'Generated Camps thick-atmosphere industrial site',
  features: [
    { xStart: 780, xEnd: 835, height: 38 },
    { xStart: 1180, xEnd: 1240, height: 46 },
  ],
  descentProfile: {
    startX: -95_000,
    startY: 55_000,
    startVX: 1_150,
    startVY: -65,
    startAngle: 1.5,
    gateY: 2000,
    gateRadius: 1800,
    gateMaxSpeed: 155,
    gateMinSpeed: 20,
  },
  departureProfile: {
    ...ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE.departureProfile,
    startY: 330,
    startVY: 5,
    exitAltitude: 55_000,
    thresholdApoapsisAltitude: 115_000,
    targetOrbitAltitude: 130_000,
    fuelSeconds: 190,
  },
};

const ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  subtitle: 'Generated Camps airless industrial site',
  features: [
    { xStart: 840, xEnd: 875, height: 32 },
    { xStart: 1130, xEnd: 1175, height: 40 },
  ],
  descentProfile: {
    startX: -55_000,
    startY: 7_000,
    startVX: 360,
    startVY: -18,
    startAngle: 1.5,
    gateY: 1200,
    gateRadius: 1400,
    gateMaxSpeed: 120,
    gateMinSpeed: 10,
  },
  departureProfile: {
    ...ESTELLA_VIII_DEFAULT_SURFACE_PROFILE.departureProfile,
    exitAltitude: 5_500,
    thresholdApoapsisAltitude: 45_000,
    targetOrbitAltitude: 60_000,
    fuelSeconds: 160,
  },
};

const ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  subtitle: 'Generated Wells airless moon site',
  features: [
    { xStart: 820, xEnd: 870, height: 30 },
    { xStart: 1140, xEnd: 1195, height: 44 },
  ],
};

const ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE,
  subtitle: 'Generated Wells thin-atmosphere moon site',
  descentProfile: {
    ...ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE.descentProfile,
    startY: 22_000,
    startVX: 760,
    gateMaxSpeed: 145,
  },
  departureProfile: {
    ...ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE.departureProfile,
    exitAltitude: 22_000,
    thresholdApoapsisAltitude: 65_000,
    targetOrbitAltitude: 75_000,
  },
};

const ESTELLA_WELLS_METHANE_SURFACE_PROFILE: EstellaSurfaceFlightProfile = {
  ...ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE,
  subtitle: 'Generated Wells thick methane-atmosphere moon site',
  descentProfile: {
    ...ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE.descentProfile,
    startY: 62_000,
    startVX: 950,
    gateMaxSpeed: 135,
  },
  departureProfile: {
    ...ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE.departureProfile,
    exitAltitude: 45_000,
    thresholdApoapsisAltitude: 95_000,
    targetOrbitAltitude: 115_000,
  },
};

export const ESTELLA_SURFACE_FLIGHT_PROFILES: Partial<Record<string, EstellaSurfaceFlightProfile>> = {
  'estella-i-worker-hab': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-i-refractory-mine': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-i-hot-processing': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-i-deep-listening': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-ii-olympos': ESTELLA_II_OLYMPOS_PROFILE,
  'estella-ii-nimbus-crucible': ESTELLA_II_NIMBUS_CRUCIBLE_PROFILE,
  'estella-ii-pandemonium': { ...ESTELLA_HEARTH_ATMO_SURFACE_PROFILE, subtitle: 'Deep-pressure surface approach to Pandemonium', labelVisibility: 'target' },
  'estella-iii-capital-city': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iii-finance-city': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iii-high-tech-city': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iii-coastal-resort': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iii-agricultural-region': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iii-polar-science': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iii-military-spaceport': { ...ESTELLA_HEARTH_ATMO_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-iii-historic-site': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iiia-helium-mining': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-iiia-science-settlement': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-iiia-heritage-site': ESTELLA_HEARTH_DEFAULT_SURFACE_PROFILE,
  'estella-iv-primary-city': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iv-climate-poi-1': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iv-climate-poi-2': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-iv-climate-poi-3': ESTELLA_HEARTH_ATMO_SURFACE_PROFILE,
  'estella-v-capital-settlement': ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE,
  'estella-v-open-cast-mine': ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE,
  'estella-v-atmo-refinery': ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE,
  'estella-v-storm-research': { ...ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-v-abandoned-colony': { ...ESTELLA_CAMPS_THIN_ATMO_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-va-strip-mine': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-va-miner-hab': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vi-industrial-city': ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE,
  'estella-vi-foundry-complex': ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE,
  'estella-vi-spaceport': ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE,
  'estella-vi-agricultural-lowlands': ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE,
  'estella-vi-polar-weather-research': { ...ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-vi-mountain-mining': { ...ESTELLA_CAMPS_THICK_ATMO_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-via-surface-anchor': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-via-rare-alloy-extraction': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vib-vat-protein': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vib-pharma-horticulture': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vib-aquaculture': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vii-high-vacuum-factory': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vii-feedstock-mine': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vii-worker-hab': ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE,
  'estella-vii-black-project-outpost': { ...ESTELLA_CAMPS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-viii-settlement': ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  'estella-viii-mining-site': ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
  'estella-viii-abandoned-site': {
    ...ESTELLA_VIII_DEFAULT_SURFACE_PROFILE,
    labelVisibility: 'target',
  },
  'estella-ix-research-base': ESTELLA_IX_DEFAULT_SURFACE_PROFILE,
  'estella-ix-ice-mine': ESTELLA_IX_DEFAULT_SURFACE_PROFILE,
  'estella-ix-geological-feature': {
    ...ESTELLA_IX_DEFAULT_SURFACE_PROFILE,
    labelVisibility: 'target',
  },

  'estella-xa-volatiles-transit': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xa-deep-ice-mine': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xa-exobiology-research': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xb-rare-element-mine': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xb-smelting-processing': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xb-worker-hab': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xc-main-outpost': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xd-geothermal-extraction': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xia-sulfur-mine': ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE,
  'estella-xia-sealed-worker-hab': ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE,
  'estella-xia-rare-element-extraction': ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE,
  'estella-xib-cryo-transit': ESTELLA_WELLS_METHANE_SURFACE_PROFILE,
  'estella-xib-methane-refinery': ESTELLA_WELLS_METHANE_SURFACE_PROFILE,
  'estella-xib-organic-chemistry': ESTELLA_WELLS_METHANE_SURFACE_PROFILE,
  'estella-xib-hydrocarbon-extraction': ESTELLA_WELLS_METHANE_SURFACE_PROFILE,
  'estella-xib-science-settlement': { ...ESTELLA_WELLS_METHANE_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xic-deep-ice-exobiology': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xic-ice-mining': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xid-services-outfitter-hangar': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xid-customs-transit': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xid-specialty-cargo': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xie-outer-spec-drydock': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xie-component-fabrication': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xie-rare-alloy-extraction': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xif-observatory': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xif-deep-listening-array': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xif-sealed-research-outpost': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xiia-deep-ice-mine': ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE,
  'estella-xiia-volatiles-transit': ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE,
  'estella-xiia-isolated-settlement': { ...ESTELLA_WELLS_THIN_ATMO_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xiib-outpost': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiic-isotope-mining': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiic-comet-research': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiid-black-project-exile': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },

  'estella-xiii-governors-outpost': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiii-deep-ice-mining': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiii-long-range-observatory': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiii-prison-exile-colony': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xiii-classified-research': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xiv-religious-retreat': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'estella-xiv-smuggler-haven': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'estella-xiv-abandoned-active-site': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
  'reach-rogue-isotope-mine': ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE,
  'reach-rogue-lonely-beacon': { ...ESTELLA_WELLS_AIRLESS_SURFACE_PROFILE, labelVisibility: 'target' },
};
