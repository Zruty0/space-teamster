export const MULTAQA = 'estella-ix-research-base';
export const BIR_SAFA = 'estella-ix-ice-mine';
export const WADI = 'estella-ix-geological-feature';
export const SUHAIL = 'estella-ix-opposite-sense-supply-depot';
export const RAQIB = 'estella-ix-moonlet-observation-outpost';
export const SAHRA_SURFACE_SITES = [MULTAQA, BIR_SAFA, WADI] as const;
export const SAHRA_SITES = [...SAHRA_SURFACE_SITES, SUHAIL, RAQIB] as const;
