import type { MaintenanceShopDef } from './shops';

const equipmentIds = ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'] as const;
export const WEYMARK_PILOT_SHOPS: readonly MaintenanceShopDef[] = [
  {
    id: 'maintenance-estella-viii-mining-site', facilityTier: 0,
    name: 'Look for a local mechanic', organizationName: 'Low Gauge independent mechanics',
    locationIds: ['estella-viii-mining-site'], diagnosticGrade: 'E', workQualityGrade: 'F',
    componentGradeBest: 'F', componentGradeWorst: 'F', laborRate: 250, diagnosisHours: 2,
    partsMarkup: 1.15, laborHoursMultiplier: 1, honesty: 0.95,
    copy: {
      profileBlurb: 'A notice beside Low Gauge’s shift board lists workers who take repair jobs between mine assignments. Today, a mechanic meets you at the rig with a tool chest strapped to a hand trolley. Spare couplings and reclaimed modules occupy the shelves of a borrowed pressure shed.',
      levelBlurb: 'Basic servicing, straightforward repairs and reclaimed replacement parts',
      diagnosisBlurb: '“Let’s run the checks while the rig is warm. I’ll mark what needs attention and price the work I can do with the tools here.”',
      serviceBlurb: 'The mechanic unfolds a stained service sheet against the wheel of the trolley. “We’ll work through the lubrication points, clean the contacts and set the easy adjustments. Choose the systems you want covered.”',
      repairsBlurb: '“Bring the estimate over to the shed. We’ll check the available parts against your rig before you authorize anything.” The mechanic clears a space on the bench for the removed assembly.',
    },
  },
  {
    id: 'maintenance-estella-viii-settlement', facilityTier: 1,
    name: 'Weymark Town Workshop', organizationName: 'Weymark Town Workshop',
    locationIds: ['estella-viii-settlement'], equipmentIds,
    diagnosticGrade: 'C', workQualityGrade: 'D', componentGradeBest: 'D', componentGradeWorst: 'D',
    laborRate: 500, diagnosisHours: 2, partsMarkup: 1, laborHoursMultiplier: 1, honesty: 1,
    copy: {
      profileBlurb: 'Weymark Town’s workshop occupies two pressure bays beside the vocational classrooms. Numbered parts bins line the walls, and the afternoon instructor is checking a trainee’s work against a signed job sheet. A service clerk opens a fresh sheet for your rig.',
      levelBlurb: 'Professional routine servicing, standard repairs and equipment installation',
      diagnosisBlurb: '“We’ll run the standard inspection and separate the findings from the work order. You can review every item before choosing what to authorize.”',
      serviceBlurb: 'The service clerk clips your selections to the bay schedule. “Each system gets its checks, adjustments and final sign-off. The estimate includes the time the rig will be here.”',
      repairsBlurb: '“The workshop handles ordinary repairs and standard module exchanges.” The instructor sets the approved parts list beside the job sheet. “We’ll identify anything that needs a specialist before starting.”',
    },
  },
  {
    id: 'maintenance-estella-viii-friendly-station', facilityTier: 2,
    name: 'Nell’s Rest Shipworks', organizationName: 'Nell’s Rest Shipworks',
    locationIds: ['estella-viii-first-rendezvous-station'], equipmentIds,
    diagnosticGrade: 'B', workQualityGrade: 'B', componentGradeBest: 'B', componentGradeWorst: 'D',
    laborRate: 800, diagnosisHours: 2, partsMarkup: 1, laborHoursMultiplier: 0.9, honesty: 1,
    copy: {
      profileBlurb: 'A workboat hangs in an open assembly frame above Nell’s Rest’s service floor. Beneath it, rigs occupy bright bays connected to a common machine shop. Forewoman [person]Mara Venn[/person] meets you at a wall covered with silhouettes of assemblies waiting for machining, testing or collection.',
      levelBlurb: 'Full-service engineering, advanced repairs and quality equipment installations',
      diagnosisBlurb: '“Give us the symptoms and we’ll test the affected assemblies under load.” [person]Mara[/person] moves a magnetic rig marker onto the inspection board. “The report will distinguish the repairs we can finish here from work needing the depot’s specialist tooling.”',
      serviceBlurb: '“Our machinists and fitters share one schedule, so your rig moves through the work in sequence.” [person]Mara[/person] traces the open bays with a fingertip. “Choose the systems and we’ll return them adjusted, tested and signed off.”',
      repairsBlurb: '“We can rebuild and align most assemblies on that rig, or fit the replacement you select.” [person]Mara[/person] calls a fitter over to review the estimate with you. “The toughest structural and core work goes to Bruckner’s specialist floor.”',
    },
  },
];
