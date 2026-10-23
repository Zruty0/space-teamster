/** Stable operational IDs. Names/roles change without rewriting saves or quotes. */
export const DAHAI_ORBITAL = 'estella-iv-main-orbital-station';
export const FUYUAN = 'estella-iv-primary-city';
export const ZHULONG = 'estella-iv-climate-poi-1';
export const JIUYUAN = 'estella-iv-climate-poi-2';
export const BINGJIE = 'estella-iv-climate-poi-3';
export const DAHAI_SURFACE_SITES = [FUYUAN, ZHULONG, JIUYUAN, BINGJIE] as const;
export type DahaiSurfaceSite = typeof DAHAI_SURFACE_SITES[number];
export const DAHAI_SITE_NAMES: Readonly<Record<DahaiSurfaceSite, string>> = {
  [FUYUAN]: 'Fuyuan', [ZHULONG]: 'Zhulong', [JIUYUAN]: 'Jiuyuan', [BINGJIE]: 'Bingjie',
};
