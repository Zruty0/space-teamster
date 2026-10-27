import { ESTELLA_NODES_BY_ID } from '../content/estella';
import { COVERAGE_COPY } from './coverage-copy';
import { COVERAGE_SITES, type CoverageTerms } from './coverage-sites';
import type { MaintenanceShopDef } from './shops';

type Terms = Omit<MaintenanceShopDef, 'id' | 'name' | 'locationIds' | 'copy'>;
const basic: Terms = {
  facilityTier: 0, diagnosticGrade: 'E', workQualityGrade: 'F', componentGradeBest: 'F', componentGradeWorst: 'F',
  laborRate: 250, diagnosisHours: 2, partsMarkup: 1.15, laborHoursMultiplier: 1, honesty: 0.95,
};
const terms: Record<CoverageTerms, Terms> = {
  S0: basic,
  W0: { ...basic, partsMarkup: 1.5, honesty: 0.8 },
  S1: {
    facilityTier: 1, diagnosticGrade: 'C', workQualityGrade: 'D', componentGradeBest: 'D', componentGradeWorst: 'D',
    laborRate: 500, diagnosisHours: 2, partsMarkup: 1, laborHoursMultiplier: 1, honesty: 1,
    equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  },
  E0: { ...basic, facilityTier: -1, diagnosticGrade: 'F', laborRate: 0, diagnosisHours: 0, partsMarkup: 1, honesty: 1 },
};

/** Reviewed local coverage only; private stops remain private. No career migration. */
export const COVERAGE_SHOPS: readonly MaintenanceShopDef[] = COVERAGE_SITES.map(site => {
  const place = ESTELLA_NODES_BY_ID.get(site.physicalId)!.name;
  const copy = COVERAGE_COPY[site.family];
  const resolve = (text: string) => text.split('{place}').join(place);
  return {
    ...terms[site.terms], id: site.id, name: site.name, organizationName: site.organizationName,
    locationIds: [...site.locationIds], directorySummary: resolve(copy.directorySummary),
    copy: {
      profileBlurb: resolve(copy.profileBlurb), levelBlurb: resolve(copy.levelBlurb),
      diagnosisBlurb: resolve(copy.diagnosisBlurb), serviceBlurb: resolve(copy.serviceBlurb), repairsBlurb: resolve(copy.repairsBlurb),
    },
  };
});
