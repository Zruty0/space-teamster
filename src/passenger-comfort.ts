export type ComfortExpectation = 'minimal' | 'standard' | 'elevated' | 'prestige';

export interface PassengerComfortTerms {
  expectation: ComfortExpectation;
  serviceRiskFraction: number;
}

export const COMFORT_EXPECTATIONS: Readonly<Record<ComfortExpectation, { name: string; comfort: number; buffer: number; serviceRiskFraction: number }>> = {
  minimal: { name: 'Minimal comfort', comfort: 5, buffer: 2, serviceRiskFraction: 0.30 },
  standard: { name: 'Standard', comfort: 4, buffer: 1, serviceRiskFraction: 0.40 },
  elevated: { name: 'Elevated comfort', comfort: 3, buffer: 1, serviceRiskFraction: 0.50 },
  prestige: { name: 'Prestige', comfort: 2, buffer: 1, serviceRiskFraction: 0.60 },
};

/** Explicit passenger-manifest catalog. Expectations are never inferred from label text. */
const PASSENGER_EXPECTATIONS: Readonly<Record<string, ComfortExpectation>> = {
  'Accord arbitrator and seal clerks': 'elevated',
  'Alvares ceremonial delegation': 'prestige',
  'assay auditors': 'standard',
  'bonded contractor crew': 'standard',
  'Bruckner field technician team': 'standard',
  'certified duel referees': 'elevated',
  'charter-combat referees': 'elevated',
  'claims office passenger party': 'standard',
  'commissioning engineer team': 'standard',
  'coming-of-age sponsors and ceremonial guard': 'elevated',
  'completed long-term shift returnees': 'standard',
  'custody processing passengers': 'minimal',
  'custody transfer passengers': 'minimal',
  'damage assessor and evidence registrar': 'elevated',
  'dealer compliance auditors': 'standard',
  'drive alignment crew': 'standard',
  'duelists, seconds, and armor squires': 'elevated',
  'emergency mediation panelists': 'elevated',
  'emergency propulsion service crew': 'standard',
  'exercise adjudicators': 'elevated',
  'executive and supervisor staff': 'elevated',
  'executive delegation': 'prestige',
  'executive fitting delegation': 'prestige',
  'executive inspection party': 'prestige',
  'field geometry incident team': 'standard',
  'field surgeons and casualty assessors': 'standard',
  'graduated household guard cadres': 'standard',
  'Hartwell return rotation': 'standard',
  'Hartwell worksite crew block': 'standard',
  'heralds with sealed precedence rolls': 'prestige',
  'House delegation': 'prestige',
  'household elders and ceremonial attendants': 'elevated',
  'household elders and wedding attendants': 'elevated',
  'household guard candidates': 'standard',
  'household guard standards inspectors': 'elevated',
  'household guards in dress kit': 'elevated',
  'household logistics officers': 'standard',
  'hull acceptance board': 'elevated',
  'incident review board': 'elevated',
  'interior finish inspectors': 'standard',
  'investiture officers and ceremonial guards': 'elevated',
  'Kisaragi master shipwright delegation': 'elevated',
  'Kisaragi recovery rotation crew': 'standard',
  'long-term Hartwell shift cohort': 'standard',
  'marriage-contract notaries': 'elevated',
  'medical return passengers': 'elevated',
  'metallurgical experts': 'elevated',
  'metric-drive audit team': 'elevated',
  'musicians, chapel staff, and feast servants': 'standard',
  'muster clerks and seal officers': 'standard',
  'neutral truce witnesses': 'elevated',
  'owner representative party': 'elevated',
  'personnel transfers': 'standard',
  'petition counsel and clerks': 'elevated',
  'petition counsel and sealed clerks': 'elevated',
  'pilgrim scholars in sealed luxury berths': 'prestige',
  'precedence case witnesses': 'elevated',
  'private researchers with an unusually lavish retinue': 'prestige',
  'process engineers': 'standard',
  'public occasion stewards and witnesses': 'elevated',
  'refinery crew rotations': 'standard',
  'refinery crews': 'standard',
  'refinery executives': 'prestige',
  'senior commissioning crew': 'standard',
  'senior household captains': 'elevated',
  'shift crews': 'standard',
  'shift rotations': 'standard',
  'shipwright witnesses and appraisers': 'elevated',
  'succession hearing mediators': 'elevated',
  'subsidized lesser-household retinue': 'elevated',
  'surface labor allocation': 'minimal',
  'technical specialist party': 'standard',
  'VHM factory engineer delegation': 'elevated',
  'warranty arbitration board': 'elevated',
  'warranty inspector party': 'standard',
  'work crews': 'standard',
  'work rotations': 'standard',
  'workforce transfer group': 'minimal',
  'yard arbitration counsel': 'elevated',
  'yard-lien examiner and valuation counsel': 'elevated',
};

export function passengerComfortTerms(label: string): PassengerComfortTerms {
  const expectation = PASSENGER_EXPECTATIONS[label];
  if (!expectation) throw new Error(`Unclassified Estella passenger manifest: ${label}`);
  return { expectation, serviceRiskFraction: COMFORT_EXPECTATIONS[expectation].serviceRiskFraction };
}

export function comfortExpectationDisplay(terms: PassengerComfortTerms): string {
  return COMFORT_EXPECTATIONS[terms.expectation].name;
}

export function isCatalogedPassengerLabel(label: string): boolean {
  return PASSENGER_EXPECTATIONS[label] !== undefined;
}

export const ESTELLA_PASSENGER_CATALOG_SIZE = Object.keys(PASSENGER_EXPECTATIONS).length;
