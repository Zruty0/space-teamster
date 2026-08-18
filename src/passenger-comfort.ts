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
  'assay auditors': 'standard',
  'bonded contractor crew': 'minimal',
  'Bruckner field technician team': 'standard',
  'certified duel referees': 'elevated',
  'claims office passenger party': 'standard',
  'commissioning engineer team': 'standard',
  'completed long-term shift returnees': 'minimal',
  'custody processing passengers': 'minimal',
  'custody transfer passengers': 'minimal',
  'dealer compliance auditors': 'standard',
  'drive alignment crew': 'standard',
  'duelists, seconds, and armor squires': 'elevated',
  'emergency propulsion service crew': 'standard',
  'executive and supervisor staff': 'elevated',
  'executive delegation': 'prestige',
  'executive fitting delegation': 'prestige',
  'executive inspection party': 'prestige',
  'field geometry incident team': 'standard',
  'graduated household guard cadres': 'minimal',
  'Hartwell return rotation': 'minimal',
  'Hartwell worksite crew block': 'minimal',
  'heralds with sealed precedence rolls': 'prestige',
  'House delegation': 'prestige',
  'household guard candidates': 'standard',
  'household guards in dress kit': 'elevated',
  'hull acceptance board': 'elevated',
  'incident review board': 'elevated',
  'interior finish inspectors': 'standard',
  'Kisaragi master shipwright delegation': 'elevated',
  'Kisaragi recovery rotation crew': 'minimal',
  'long-term Hartwell shift cohort': 'minimal',
  'marriage-contract notaries': 'elevated',
  'medical return passengers': 'elevated',
  'metallurgical experts': 'elevated',
  'metric-drive audit team': 'elevated',
  'owner representative party': 'elevated',
  'personnel transfers': 'minimal',
  'petition counsel and clerks': 'elevated',
  'petition counsel and sealed clerks': 'elevated',
  'pilgrim scholars in sealed luxury berths': 'prestige',
  'precedence case witnesses': 'elevated',
  'private researchers with an unusually lavish retinue': 'prestige',
  'process engineers': 'standard',
  'refinery crew rotations': 'minimal',
  'refinery crews': 'minimal',
  'refinery executives': 'prestige',
  'senior commissioning crew': 'standard',
  'shift crews': 'minimal',
  'shift rotations': 'minimal',
  'shipwright witnesses and appraisers': 'elevated',
  'surface labor allocation': 'minimal',
  'technical specialist party': 'standard',
  'VHM factory engineer delegation': 'elevated',
  'warranty arbitration board': 'elevated',
  'warranty inspector party': 'standard',
  'work crews': 'minimal',
  'work rotations': 'minimal',
  'workforce transfer group': 'minimal',
  'yard arbitration counsel': 'elevated',
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
