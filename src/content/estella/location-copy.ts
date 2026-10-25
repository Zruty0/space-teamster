import { ESTELLA_NODES_BY_ID } from './index';
import { CAMPS_LOCATION_IDS } from './camps-sites';
import { WEYMARK_SITES } from './weymark-sites';
import { THULE_SITES } from './thule-sites';

// Approved local prose. Keep worker-facing Pandemonium scenes separate from
// CHR's offworld corporate receipts; Renard's covert aid is reserved for a story.
export const PANDEMONIUM_COPY = {
  introduction: 'The workers run Pandemonium’s dock themselves. Pressure doors wear layers of mismatched repairs; exhausted crews strip an abandoned loader for parts. Beside the water point, someone has crossed out the day’s ration and written a smaller figure. [contact]Thomas Thorne[/contact]’s allocation orders divide the available supplies between the workings, the kitchens and the infirmary. Several requests beneath them are marked WAITING. Some have been waiting for months.',
  personnelArrival: 'A reception crew meets the arrivals with a tray of numbered cups. “Drink slowly,” a woman tells them. “[contact]Thorne[/contact] says nobody goes straight from a transport into the workings. You get water, a bunk and a night’s sleep first.” Behind her, another worker counts the newcomers twice, then starts revising tomorrow’s ration sheet. Your payment notification arrives from Cerberus while they are still dividing the water.',
  miningEquipmentArrival: 'The unloading crew gathers around the new cutting assembly. Their own machine stands nearby, its housing stitched with welds and one bearing held in place by a hand-machined collar. “[contact]Thorne[/contact] kept that section closed until this arrived,” the shift delegate says. “Cost us output. Cost us water. He said we’d already buried enough people under the old one.” She rests a hand on the crate. “We can open it again now.”',
  industrialPartsArrival: 'A pressure seal slips from its packing and rolls beneath the loader. Everyone stops until a worker crawls under and retrieves it. “[contact]Thorne[/contact] has a destination for every one of these,” the fitter explains. He lays the recovered seal beside the others, wiping grit from it with his sleeve. “We used to fight over whatever came down. He got us keeping a common store. That’s why there are still people here to unload you.”',
  metalsPickup: 'The dock delegate checks the assay seals against the figures in your manifest. “[contact]Thorne[/contact] wants a copy of the receiving weight. Every deduction comes out of our hydrogen allowance, and they’ve been finding deductions.” Behind him, the next shift is already assembling for the workings. Several lean against the wall with their eyes closed. “Get the receipt back to us, Teamster. We need something he can argue with.”',
} as const;

// Factual site-role descriptions, not new NPC dialogue or mission contacts.
const LOCATION_SUMMARY_IDS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(CAMPS_LOCATION_IDS.map(id => [id, id])),
  ...Object.fromEntries(WEYMARK_SITES.map(id => [id, id])),
  ...Object.fromEntries(THULE_SITES.map(id => [id, id])),
  ...Object.fromEntries([
    'estella-iii-capital-city', 'estella-iii-high-tech-city', 'estella-iii-coastal-resort',
    'estella-iii-agricultural-region', 'estella-iii-polar-science',
    'estella-iiia-helium-mining', 'estella-iiia-science-settlement', 'estella-iiia-heritage-site',
    'estella-iv-primary-city', 'estella-iv-climate-poi-1', 'estella-iv-climate-poi-2', 'estella-iv-climate-poi-3',
    'estella-ix-opposite-sense-supply-depot', 'estella-ix-research-base', 'estella-ix-ice-mine',
    'estella-ix-geological-feature', 'estella-ix-moonlet-observation-outpost', 'deepest-dock-poi',
    'estella-xiv-transit-dock', 'estella-xiv-religious-retreat', 'estella-xiv-smuggler-haven', 'estella-xiv-abandoned-active-site',
  ].map(id => [id, id])),
  'estella-iii-main-customs': 'estella-iii-main-customs',
  'estella-iiia-main-port-transit': 'estella-iiia',
  'estella-iv-main-orbital-station': 'estella-iv-main-orbital-station',
};

export const ESTELLA_LOCATION_INTRODUCTIONS: Readonly<Record<string, string>> = {
  'estella-ii-pandemonium': PANDEMONIUM_COPY.introduction,
};

export function estellaLocationIntroduction(locationId: string): string | undefined {
  // Resolve at scene time: providers also import the authored dialogue, before
  // the world catalog has necessarily finished initialization.
  return ESTELLA_LOCATION_INTRODUCTIONS[locationId]
    ?? ESTELLA_NODES_BY_ID.get(LOCATION_SUMMARY_IDS[locationId])?.summary;
}
