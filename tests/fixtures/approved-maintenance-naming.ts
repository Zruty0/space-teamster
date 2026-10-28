// Independent test expectations from the approved maintenance-naming-review.md.
// Never imported by production. Only display strings are eligible for amendment.
export const APPROVED_MAINTENANCE_NAMES: Readonly<Record<string, string>> = {
  'Rochefort Precision Service': 'Atelier du Méridien',
  'Svarog Visiting-Rig Service': 'SSC Reconstruction Works',
  'Balor Orbital Service Works': 'Redline Engineering',
  'Acheron Transfer Engineering': 'Clearlock Refit',
  'Richelieu Fleet Service': 'Les Ateliers Réunis',
  'Celeste Port Engineering': 'The Plumb Line',
  'Fuyuan Ship Service Cooperative': 'Fuyuan Mechanics’ Cooperative',
  'Roadstead Rig Works': 'Chalkwall Mechanical',
  'Switchback Service Hall': 'Switchback Mechanics’ Hall',
  'Anvil Visiting-Rig Works': 'Combine Overhaul Depot',
  'Perun Rig Workshop': 'Perun Repair Brigade',
  'Kalyna Port Engineering': 'Kalyna Fitting Works',
  'Mosaic Rig and Instrument Service': 'Mosaic Metrology & Repair',
  'Caravanserai Drydock Service': 'Keel & Key',
  'Halloran Rig Service': 'Halloran Machine Rooms',
  'Anchorage Community Workshop': 'The Common Bench',
  'Beira Port Workshop': 'The Charter Court',
  'Ember Court Rig Works': 'Ferraz Mechanical',
  'Serratine Civil Workshop': 'The Glass Court',
  'Alembic Ring Service Works': 'Alembic Pressure & Seal',
  'Almaden Orbital Engineering': 'Proofmark Engineering',
  'Daedalus Visiting-Rig Workshop': 'Daedalus Refit Laboratory',
  'Pilgrim Gate Repair Hall': 'Works of Mercy',
  'Teide Charter Workshop': 'Mendonça’s',
  'Farwatch Visiting-Rig Workshop': 'Farwatch Technical Section',
  'Ark Quarantine Station Workshop': 'Ark Quarantine Technical Section',
  'Cinderhook Refinery Workshop': 'Cinderhook Mechanical Department',
  'BAM Foundry One Workshop': 'BAM Plant Maintenance',
  'Dahai Main Orbital Station Workshop': 'Dahai Orbital Maintenance',
  'Gaia Luxury Orbital Habitat Workshop': 'Habitat Engineering',
  'Barataria Observatory Workshop': 'Observatory Technical Section',
  'Daedalus Server Farm Workshop': 'Daedalus Site Maintenance',
  'Blackglass Observatory Workshop': 'Blackglass Technical Services',
  'Academy of Sublime Measures Workshop': 'Sublime Measures Technical Office',
  'Teide Survey Collegium Workshop': 'Collegium Technical Services',
  'The Still Workshop': 'The Still Machine Shop',
  'Roster Hall Workshop': 'Roster Hall Toolroom',
  'Veles Terminal Workshop': 'Veles Fitting Shop',
};
export const APPROVED_MAINTENANCE_PHRASES: readonly (readonly [string, string])[] = [
  ['The visiting-rig workbench at ', 'The repair bench at '],
  ['The visiting-rig maintenance desk at ', 'The rig maintenance desk at '],
  ['household machinery and visiting rigs', 'household repairs and rig work'],
  ['The visiting-rig bench at ', 'The rig maintenance bench at '],
  ['keeps visiting rigs on the same orderly work board', 'lists rig repairs on the same orderly work board'],
  ['Ask for the visiting-rig specialists.', 'Ask for the reconstruction team.'],
  ['Their visiting-rig service has the specialist equipment.', 'Their heavy repair shop can take that work further.'],
  ['for visiting rigs at Switchback', 'at Switchback'],
  ['Full-service inspection, advanced repairs and equipment fitting for visiting rigs', 'Full-service inspection, advanced repairs and equipment fitting'],
  ['That is the public visiting-rig service to ask for.', 'Their heavy repair facilities cover those cases.'],
  ['Full-service engineering for visiting rigs at the Combine’s orbital interface.', 'Full-service rig engineering at the Combine’s orbital interface.'],
  ['Their visiting-rig floor is the appropriate next stop.', 'Their reconstruction floor has the specialist tooling.'],
  ['Ask for the visiting-rig service there.', 'They handle demanding structural and core work.'],
  ['visiting-rig ledger', 'rig repair ledger'],
  ['Full-service community workshop for visiting rigs at Thule Anchorage.', 'Full-service community repair workshop at Thule Anchorage.'],
  ['Full-service visiting-rig engineering at the Daedalus commercial campus.', 'Full-service mechanical and control-system repairs at the Daedalus commercial campus.'],
  ['SSC visiting-rig specialists:', 'SSC reconstruction specialists:'],
  ['Visiting-rig superintendent', 'Repair superintendent'],
  ['visiting rigs occupy bright bays', 'rigs occupy bright bays'],
  ['carts, crews, and visiting rigs advance together', 'carts, crews, and rigs advance together'],
  // Explicit preferred-name row pairs Mendonça’s with this short summary.
  ['Full-service rig engineering under the Teide port charter.', 'Chartered repairs and refits.'],
];
export function approvedMaintenanceText(text: string): string {
  for (const [before, after] of [...Object.entries(APPROVED_MAINTENANCE_NAMES), ...APPROVED_MAINTENANCE_PHRASES]) text = text.split(before).join(after);
  return text;
}
/** Amend only approved text fields. Never transform IDs, locations, paths or terms. */
export function amendedMaintenanceSnapshot<T>(original: T): T {
  const s: any = structuredClone(original);
  const field = (o: any, key: string | number) => { if (typeof o?.[key] === 'string') o[key] = approvedMaintenanceText(o[key]); };
  if (s.shop) {
    for (const key of ['name', 'organizationName', 'directorySummary']) field(s.shop, key);
    for (const key of ['profileBlurb', 'levelBlurb', 'diagnosisBlurb', 'serviceBlurb', 'repairsBlurb', 'referralBlurb']) field(s.shop.copy, key);
  }
  for (const key of ['name', 'summary', 'description']) field(s.directory, key);
  for (const key of [1, 2, 5]) field(s.identity, key);
  for (const r of s.referrals ?? []) for (const key of ['name', 'customText', 'text']) field(r, key);
  return s;
}
