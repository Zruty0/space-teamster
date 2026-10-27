import { WEYMARK_PILOT_SHOPS } from './weymark-shops';
import { COVERAGE_SHOPS } from './coverage';
import { componentFaultById, maintenanceComponentById, maintenanceSystemById } from './catalog';
import { componentHasFabricatedFault, fabricatedFaultById, fabricatedFaultsForComponent } from './fabricated-faults';
import { COMPONENT_GRADES, componentMaxHp, componentPartsCost, componentReplacementCost, componentServicedAp, shopCanPerform } from './grades';
import { applyMechanicOperation } from './maintenance-service';
import { MAINTENANCE_SYSTEM_IDS, type CareerRigState, type ComponentGrade, type ComponentId, type FabricatedFaultClaim, type MaintenanceSystemId, type RigEquipmentId, type ShopGrade, type WorkGrade } from './types';

export interface MaintenanceShopCopy {
  profileBlurb: string;
  levelBlurb: string;
  diagnosisBlurb: string;
  serviceBlurb: string;
  repairsBlurb: string;
}

export type MaintenanceFacilityTier = -1 | 0 | 1 | 2 | 3;
export interface MaintenanceShopDef {
  id: string;
  /** Content classification only; never render this number. */
  facilityTier: MaintenanceFacilityTier;
  name: string;
  organizationName?: string;
  directorySummary?: string;
  locationIds: string[];
  equipmentIds?: readonly RigEquipmentId[];
  diagnosticGrade: WorkGrade;
  workQualityGrade: ShopGrade;
  componentGradeBest: ComponentGrade;
  componentGradeWorst: ComponentGrade;
  laborRate: number;
  diagnosisHours: number;
  partsMarkup: number;
  laborHoursMultiplier: number;
  honesty: number;
  copy: MaintenanceShopCopy;
}

export interface MaintenanceQuote {
  credits: number;
  laborHours: number;
}

export const VILAR_GRYPHON_AERIE_OUTFITTER: MaintenanceShopDef = {
  id: 'vilar-gryphon-aerie-outfitter', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Vilar’s Outfitter at Gryphon Aerie',
  organizationName: 'House Vilar',
  locationIds: ['estella-x-observation-skim-hub'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'A gilt House Vilar badge spans the entrance to a glass-fronted service gallery high in Gryphon Aerie. [person]Sir Tomás Barreto[/person] governs the concession from a balcony above the bays, welcoming Teamsters with courtly warmth while licensed journeymen drive rows of serf mechanics through the work below.',
    levelBlurb: 'Standard Wells outfitter in [person]Baron Vilar[/person]’s chartered network',
    diagnosisBlurb: '“Welcome, Teamster! Entrust your rig to House Vilar and I shall see it examined from frame to antenna.” [person]Sir Tomás Barreto[/person] turns and shouts down the gallery. “Inspection cradle three! Move, you witless sluggards—the rig will not inspect itself!” He turns back with a broad smile. “Your rig shall receive my personal attention.”',
    serviceBlurb: '“A prudent choice, Teamster! My people shall restore every serviceable fitting to mint condition.” [person]Sir Tomás Barreto[/person] snaps his fingers toward the bays. “What are you gawping at? Get to work!” He faces you again. “House Vilar takes uncommon pride in the care of a working rig.”',
    repairsBlurb: '“Ah, the serious work—the kind that proves the value of a proper shop. House Vilar shall return your rig sound, aligned, and fit for the road ahead.” [person]Sir Tomás Barreto[/person] calls down to the bays. “Fetch the proper tools, not whatever rubbish you abandoned under a bench!” He offers you an expansive bow. “We shall put matters right.”',
  },
};

export const VILAR_HERALD_GATE_SHOP: MaintenanceShopDef = {
  id: 'vilar-herald-gate-outfitter', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Vilar’s Outfitter at Herald Gate',
  organizationName: 'House Vilar',
  locationIds: ['estella-xc-transit-refuel'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'The crimson-and-gold badge of House Vilar hangs above a vaulted service gallery built into Herald Gate’s commercial ring. [person]Baron Estêvão Vilar[/person]’s local concession is governed by [person]Dame Leonor Falcão[/person], a knight-overseer whose immaculate licensed journeymen direct rows of grey-clad serf mechanics below.',
    levelBlurb: 'Standard Wells outfitter in [person]Baron Vilar[/person]’s chartered network',
    diagnosisBlurb: '“House Vilar welcomes you to Herald Gate, Teamster. I am [person]Dame Leonor Falcão[/person], and nothing beneath this roof escapes a proper accounting.” (She glances down into the service gallery.) “That scanner is three degrees out. Correct it before I decide your eyes are ornamental.” (Her attention returns to you.) “Your rig shall be examined with considerably greater care.”',
    serviceBlurb: '“A working rig deserves to leave my gallery looking newly issued. House Vilar shall see every serviceable fitting restored accordingly.” ([person]Dame Leonor[/person] taps the gallery rail with one gloved finger.) “Must I explain the purpose of a tool cart, or will someone bring it before the Teamster dies of age?” (She offers you a composed smile.) “They become remarkably efficient under proper supervision.”',
    repairsBlurb: '“Damage is distasteful, but never embarrassing when placed in competent hands. We shall return your rig to honorable service.” ([person]Dame Leonor[/person] looks down toward the bays.) “If I see that component struck with a hammer, the next object fitted to the test stand will be the mechanic.” (She inclines her head to you.) “Do not be concerned, Teamster. My people understand the cost of disappointing me.”',
  },
};

export const VILAR_CADIZ_HIGHPORT_OUTFITTER: MaintenanceShopDef = {
  id: 'vilar-cadiz-highport-outfitter', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Vilar’s Outfitter at Cadiz Highport',
  organizationName: 'House Vilar',
  locationIds: ['estella-xid-main-port'],
  diagnosticGrade: 'B',
  workQualityGrade: 'C',
  componentGradeBest: 'C',
  componentGradeWorst: 'D',
  laborRate: 600,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'Vilar’s Outfitter at Cadiz Highport occupies a full commercial pier: six numbered service bays, a two-level parts warehouse, and an executive gallery hung with expansion plans beside a purchased baronial crest. [person]Baron Estêvão Vilar[/person] built the chain before buying the title with its proceeds, and still walks the floor with a founder’s eye for idle hands, slow inventory, and missed opportunity.',
    levelBlurb: 'House Vilar flagship outfitter and regional service works',
    diagnosisBlurb: '“Every idle hour belongs on somebody’s ledger.” [person]Baron Estêvão Vilar[/person] studies the arriving rig from the gallery rail. “My senior diagnosticians will give you the finding, the available parts, and the work order. While they work, tell me what you’ve heard from the Hearth. Which firms are expanding? Who has found new capital? What are the serious people buying?”',
    serviceBlurb: '“Service protects earning time. That is the whole proposition.” [person]Baron Estêvão Vilar[/person] taps the work schedule on his tablet. “I recruited journeymen with the highest credentials and certifications I could find in the Camps and the Belt. Select the systems, and my floor will document every adjustment and turn your rig back toward revenue.”',
    repairsBlurb: '“Teamster, you have my sincere sympathy. A damaged rig is lost earning time, and that is painful to see.” [person]Baron Estêvão Vilar[/person] straightens his coat and attempts the brisk, polished cadence he associates with Hearth boardrooms. “Still, this is a business opportunity for both of us. You need the rig restored; I have the most modern tools anywhere beyond the Belt and the people certified to use them. Authorize the order, and we both improve our position.”',
  },
};

export const VILAR_HYDRA_MAW_OUTFITTER: MaintenanceShopDef = {
  id: 'vilar-hydra-maw-outfitter', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Vilar’s Outfitter at Hydra Maw Orbital',
  organizationName: 'House Vilar',
  locationIds: ['estella-xi-skim-hub'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'House Vilar’s Hydra Maw concession occupies an armored service gallery between the skim tenders and the station’s pressure refuge. [person]Dame Inês Moura[/person], a former gas-skimmer chief, runs the bays like a flight deck: sealed carts, clipped commands, exact turnaround boards, and journeymen trained to hear a pressure leak through the machinery.',
    levelBlurb: 'Standard Wells outfitter for industrial and skim traffic',
    diagnosisBlurb: '“Pressure board is steady. Put the rig in bay two and leave the access panels closed until my people mark them.” [person]Dame Inês Moura[/person] watches the station gauges settle. “Hydra punishes guesses. My senior journeymen will trace each load path, pressure-test the sealed systems, and give you a finding you can act on.”',
    serviceBlurb: '“Preventive work buys margin when the well and weather both turn against you.” [person]Dame Inês Moura[/person] checks the maintenance board. “We’ll service the selected systems to Vilar standard and return the adjustment record with the rig.”',
    repairsBlurb: '“Parts team forward. Clear the main lift.” [person]Dame Inês Moura[/person] studies the next quiet band in Hydra’s weather. “I have a disciplined floor and a clean work plan. Authorize it, and we’ll put the rig back together properly.”',
  },
};

export const VILAR_MACAO_PALACE_OUTFITTER: MaintenanceShopDef = {
  id: 'vilar-macao-palace-outfitter', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Vilar’s Outfitter at Macao Palace',
  organizationName: 'House Vilar',
  locationIds: ['estella-xic-research-station-poi'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'The Macao Palace concession resembles a private gaming salon built around a spotless service floor. [person]Sir Gaspar Seixas[/person] receives Teamsters beneath lacquered House Vilar screens while mechanics, parts clerks, debt advocates, and contract brokers move through the galleries at signals from his jeweled hand. He remembers every patron’s wagers, obligations, and preferred manner of being addressed.',
    levelBlurb: 'Standard Wells outfitter for palace and contract traffic',
    diagnosisBlurb: '“Every machine tells the truth once the right questions are asked.” [person]Sir Gaspar Seixas[/person] beckons his chief diagnostician forward as though opening a private table. “My people will turn the cards faceup one system at a time. You shall have the finding, the available options, and the exact stakes.”',
    serviceBlurb: '“The favorable wager is the one settled before the odds move.” [person]Sir Gaspar Seixas[/person] presents the service options with a practiced sweep of his hand. “Preserve the rig’s margin now, and leave Macao with the advantage.”',
    repairsBlurb: '“The table is set: trained hands, proper tooling, and the required parts behind the cage.” [person]Sir Gaspar Seixas[/person] inclines his head toward the authorization terminal. “Place the order, Teamster, and House Vilar will play it through to completion.”',
  },
};

export const VILAR_MANTICORE_OBSERVATORY_OUTFITTER: MaintenanceShopDef = {
  id: 'vilar-manticore-observatory-outfitter', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Vilar’s Outfitter at Manticore Observatory',
  organizationName: 'House Vilar',
  locationIds: ['estella-xii-observation-post'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'The gilt Vilar badge hangs at the entrance where the commercial charter requires it. Inside, the older silver-and-black arms of House Noronha dominate two warm, meticulously ordered service bays beneath Manticore Observatory’s long-watch decks. [person]Sir Lourenço Noronha[/person] accepted command of the concession without conceding social equality to its proprietor. His lineage is older and more renowned than [person]Baron Vilar[/person]’s purchased title, a distinction he introduces before business has properly begun.',
    levelBlurb: 'Standard outer-Wells outfitter under knightly supervision',
    diagnosisBlurb: '“House Noronha bore arms before [person]Baron Vilar[/person] learned what one cost.” [person]Sir Lourenço Noronha[/person] regards you with austere patience. “The distinction will mean little to a Teamster of common birth. What should matter to you is that my honor stands behind this inspection. Every finding will be complete, exact, and properly witnessed.”',
    serviceBlurb: '“Maintenance is stewardship: the preservation of what has been entrusted to one’s care.” [person]Sir Lourenço Noronha[/person] surveys the waiting journeymen. “It is a principle old houses learn early. My people will service the selected systems under my eye, and every adjustment will satisfy the obligations of my name.”',
    repairsBlurb: '“Damage is a regrettable disorder, Teamster, but its correction is honorable work.” [person]Sir Lourenço Noronha[/person] rests one hand upon the silver tower worked into his coat. “Though this concession bears [person]Baron Vilar[/person]’s freshly gilded name, my own honor governs the floor. Authorize the work. It will be completed to an excellent standard, as befits the supervision of a noble knight.”',
  },
};

export const CADIZ_ARMORIAL_SHIPWRIGHTS: MaintenanceShopDef = {
  id: 'cadiz-armorial-shipwrights', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'The Armorial Shipwrights at Shipwright Keep',
  organizationName: 'The Armorial Shipwrights',
  locationIds: ['estella-xid-services-outfitter-hangar'],
  diagnosticGrade: 'B',
  workQualityGrade: 'C',
  componentGradeBest: 'C',
  componentGradeWorst: 'D',
  laborRate: 600,
  diagnosisHours: 2,
  partsMarkup: 2,
  laborHoursMultiplier: 2,
  honesty: 1,
  copy: {
    profileBlurb: 'The Armorial Shipwrights occupy the inner ward of Shipwright Keep, where vaulted service bays open beneath painted shields and long rolls of honored craftsmen. Journeymen wear immaculate house livery over their work clothes, apprentices carry silver-edged tool cases, and young squires occasionally complete a shipyard rotation under the masters. The carpets stop precisely at the painted bay line. The shop’s Teamsters’ Guild certification is an actual parchment displayed behind crystal, its heavy red wax seal resting in a velvet-lined mount. [person]Sir Afonso de Lacerda[/person], Keeper of the Shipyard Seal, presides over the work.',
    levelBlurb: 'Ancient armorial repair court, rumored to offer ordinary workmanship with twice the ceremony',
    diagnosisBlurb: '“Before a tool touches your rig, its condition will be entered in the shipyard book and properly witnessed.” [person]Sir Afonso de Lacerda[/person] gestures toward the framed parchment. “Our Guild certification bears wax because an oath deserves a physical seal. You will receive the finding beneath the arms of Shipwright Keep.”',
    serviceBlurb: '“Maintenance is stewardship, and stewardship is among the oldest duties of rank.” [person]Sir Afonso de Lacerda[/person] surveys the assembled craftsmen. “Two journeymen will oversee each selected system. [person]Young Dom Rui[/person] is completing his shipyard rotation this month; if a squire’s hand assists the work, a master’s eye will follow it. Our cadenced keel will mark every completed adjustment.”',
    repairsBlurb: '“Damage shall be corrected with the ceremony due to a working rig.” [person]Sir Afonso de Lacerda[/person] selects a small heraldic punch from its fitted case. “When the repair passes inspection, the responsible journeyman will strike his device beside the crowned keel of this court. Those marks are our lineage, our warranty, and our answer to anyone who questions the work.”',
  },
};

export const SERRAT_DOMAIN_CIVIL_REFIT_OFFICE: MaintenanceShopDef = {
  id: 'serrat-domain-civil-refit-office', facilityTier: 3,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Serrat Domain Civil Refit Office',
  organizationName: 'Serrat Domain Shipyard Office',
  locationIds: ['estella-xie-outer-spec-drydock'],
  diagnosticGrade: 'A',
  workQualityGrade: 'A',
  componentGradeBest: 'C',
  componentGradeWorst: 'D',
  laborRate: 1_000,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 1,
  honesty: 1,
  copy: {
    profileBlurb: 'The Civil Refit Office occupies a line of enclosed rig bays along Serrat Domain Shipyard’s inner service spine. Overhead carriers move drive cores, pressure sections, and frame members between calibrated lift frames, machine shops, and sealed test rooms. [person]Master Shipwright Beatriz Correia[/person] commands the civilian watch from the main dock board, assigning visiting craft among the shipyard’s structures, machinery, and electrical teams.',
    levelBlurb: 'Domain shipyard diagnostics and full-complexity civilian repair',
    diagnosisBlurb: '“Bring the rig onto line seven and give my surveyors clear access from the cargo spine forward.” [person]Master Shipwright Beatriz Correia[/person] marks three teams onto the dock board. “Structures, machinery, and controls will inspect in parallel. You’ll receive one consolidated finding, the work we can certify here, and the available replacement grades.”',
    serviceBlurb: '“Service work takes the same discipline as a major refit. The machine only cares whether the measurement is right.” [person]Beatriz Correia[/person] studies the selected systems. “My watch will renew the protective treatments, align the moving gear, test every adjusted circuit under load, and release the rig when each value holds.”',
    repairsBlurb: '“Your rig is compact enough to finish in one bay and important enough to finish correctly.” [person]Beatriz Correia[/person] opens the work packages across the dock board. “Shipyard welders, machinists, electronics hands, and alignment crews are on this watch. Authorize the order, and the same people who build these systems will return yours to specification.”',
  },
};

export const KEELWRIGHT_WORKS_SECONDS_GATE: MaintenanceShopDef = {
  id: 'keelwright-works-seconds-gate', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'The Seconds Gate at Keelwright Works',
  organizationName: 'Keelwright Works',
  locationIds: ['estella-xie-rare-alloy-extraction'],
  diagnosticGrade: 'B',
  workQualityGrade: 'C',
  componentGradeBest: 'B',
  componentGradeWorst: 'C',
  laborRate: 1_600,
  diagnosisHours: 2,
  partsMarkup: 0.85,
  laborHoursMultiplier: 0.5,
  honesty: 1,
  copy: {
    profileBlurb: 'The Seconds Gate occupies a receiving hall beside Keelwright Works’ final proofing floor. Its tall racks hold pristine drive housings in rival House colors, frame members with obsolete crests milled away, and actuator sets marked thirteen of twelve. Every component carries a production pedigree and a visible proof stamp. At each shift bell, carts, crews, and visiting rigs advance together through the exchange line under [person]Proofmaster Tomé Avelar[/person]’s ear.',
    levelBlurb: 'Rapid factory exchange using proofed production overruns and cosmetic seconds',
    diagnosisBlurb: '“Bring the rig beneath proof frame six.” [person]Proofmaster Tomé Avelar[/person] raises one hand, and a single bell stroke moves three inspection crews into position. “We will load the structure, run the machinery at works tolerance, and test the controls against production references. One hour. Then you’ll know what holds, what can be machined here, and which proofed exchange assemblies fit.”',
    serviceBlurb: '“Keelwright builds by rhythm, and maintenance belongs in the same rhythm.” [person]Tomé Avelar[/person] sounds a short sequence on the shift bell. Tool carts turn, acceptance benches open, and the service hands take their stations. “Select the systems. The line will renew protection, set clearances, and run each assembly across its acceptance bench before the next bell.”',
    repairsBlurb: '“Every part in this hall passed proof. It is here because a lord changed his crest, a contract ordered twelve and the line made thirteen, or a polishing gauge offended somebody with a title.” [person]Tomé Avelar[/person] taps the visible acceptance stamp. “Metal does not become weaker because a herald changed his mind. Authorize the work. Certified repairs go to the machinists, exchanges come straight from the proof racks, and your rig leaves on this shift.”',
  },
};

export const OATHMARK_ACADEMY_HIGH_PENNANT_YARD: MaintenanceShopDef = {
  id: 'oathmark-academy-high-pennant-yard', facilityTier: 1,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'The High Pennant Shipyard at Oathmark Academy',
  organizationName: 'Oathmark Academy',
  locationIds: ['estella-xie-oathmark-academy'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1.5,
  laborHoursMultiplier: 1.5,
  honesty: 1,
  copy: {
    profileBlurb: 'The High Pennant Shipyard receives clients in a silent salon of dark wood, pale stone, and smoked privacy glass. Its production floor lies beyond layered pressure bulkheads and acoustic isolation; tools, crews, machinery, and unfinished vessels remain entirely outside the reception experience. [person]Dames Margarida and Madalena de Sá[/person] operate the shipyard from matching desks in matching ivory uniforms. Their badges both read M. DE SÁ, and neither sister volunteers which name belongs to which woman.',
    levelBlurb: 'Standard maintenance with private-yacht discretion, ceremonial scheduling, and noble-client pricing',
    diagnosisBlurb: '“A working rig among the pleasure craft. How refreshing.” One of [person]the de Sá twins[/person] accepts the authorization while her sister seals the salon display. “The production floor will inspect every installed system under Academy protocol.” They exchange desks while the appointment clerk looks down. “Three hours. Your findings will return in a sealed folio.” Neither woman offers a name.',
    serviceBlurb: '“Service may proceed.” The twin seated on the left reviews the selected systems while her sister closes the privacy screen. By the time the screen seals, they have exchanged chairs. “The rig will pass behind the bulkhead. Each selected system will be maintained, tested, and presented at reception after the floor has been cleared.”',
    repairsBlurb: '“The work order is settled.” One twin closes the folio while the other signs it in an identical hand: M. de Sá. “Our floor will complete every authorized repair to Academy standard and fit production-grade parts wherever replacement is required. Your rig will return through the presentation lock cleaned, sealed, and ready to depart.” Neither signature clarifies which sister authorized the work.',
  },
};

export const BRUCKNER_WEYMARK_SERVICE_HALL: MaintenanceShopDef = {
  id: 'bruckner-central-service-hall', facilityTier: 3,
  equipmentIds: ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'],
  name: 'Bruckner Central Service Hall',
  organizationName: 'Bruckner Field Services',
  locationIds: ['estella-viii-harder-approach-station'],
  diagnosticGrade: 'A',
  workQualityGrade: 'A',
  componentGradeBest: 'A',
  componentGradeWorst: 'D',
  laborRate: 1_600,
  diagnosisHours: 2,
  partsMarkup: 1,
  laborHoursMultiplier: 0.75,
  honesty: 1,
  copy: {
    profileBlurb: 'Bruckner’s central Estella service floor is bright, quiet, and divided into numbered clean bays. VHM-certified diagnostic frames stand beside locked civilian parts cages and a glass-fronted warranty office. Depot Service Director [person]Anja Riedel[/person] runs the floor by headset; every removed component is tagged before it touches a cart.',
    levelBlurb: 'Advanced VHM-authorized precision service and civilian parts depot',
    diagnosisBlurb: '“Put the rig on cradle four and leave the flight recorder live, Teamster. Weymark’s latest-generation diagnostic frames are operated by Bruckner’s senior VHM-certified engineers.” [person]Anja Riedel[/person] checks the custody seal on the diagnostic terminal. “You’ll receive a complete finding, the applicable warranty status, and the available work options. In that order.”',
    serviceBlurb: '“Preventive service is cheaper than an incident board, and considerably shorter. We’ll bring the selected systems to Bruckner service standard and return every recorded adjustment with the rig.”',
    repairsBlurb: '“You have already brought it to the best-equipped civilian service depot in Estella, Teamster. The certified alignment frames, sealed test benches, and VHM tooling are here at Weymark. If the component can be returned to specification, we have the equipment to do it. If it cannot, we will fit the proper replacement.”',
  },
};

export const RED_DUST_MECHANICAL: MaintenanceShopDef = {
  id: 'red-dust-mechanical-reclamation', facilityTier: 0,
  name: 'Red Dust Mechanical & Reclamation',
  organizationName: 'Red Dust Mechanical & Reclamation',
  locationIds: ['estella-v-capital-settlement'],
  diagnosticGrade: 'D',
  workQualityGrade: 'E',
  componentGradeBest: 'E',
  componentGradeWorst: 'E',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1.35,
  laborHoursMultiplier: 1,
  honesty: 0,
  copy: {
    profileBlurb: 'Red Dust Mechanical & Reclamation occupies Concord’s former contractor motor pool, with four enclosed service bays and a crowded reclaimed-parts warehouse. [person]Abraham “Honest Abe” Calder[/person] staffs the enterprise entirely with his sons, in-laws, cousins, and whichever other relatives need work that season. Estimates are discussed around the family table in the office, while Gasket, the Calder family dog, sleeps underneath and wakes for every arriving rig.',
    levelBlurb: 'Notorious mechanical and reclaimed-parts shop that keeps regaining and again losing the Guild certification',
    diagnosisBlurb: '“Set her over the pit and come inside, Teamster. My daughter-in-law Marta has stew on, and nobody studies a repair estimate properly on an empty stomach.” [person]Abraham “Honest Abe” Calder[/person] ushers you toward the family table while his sons-in-law set the scanner beneath the rig. He beckons one of them over with a curl of one finger. “By the time we’ve eaten, young Eli here will have found everything worth discussing.”',
    serviceBlurb: '“Service only?” [person]Abe[/person]’s smile dims by exactly one degree. “Certainly. The boys will clear the dust, refresh the compounds, tighten the mounts, and give the finish a proper polish.” He glances toward the closed panels. “The deeper concerns will keep until you’re ready to give them the attention they deserve.”',
    repairsBlurb: '“Excellent. The Calders believe serious work deserves a full turnout.” Beyond the office glass, [person]Abe[/person]’s sons, in-laws, and cousins line up beside loaded tool carts, waiting for the authorization light. Gasket sits at the front with a rag in his mouth. “Sign the order, Teamster, and the whole family goes to work.”',
  },
};

const AUTHORED_MAINTENANCE_SHOPS: readonly MaintenanceShopDef[] = [
  VILAR_GRYPHON_AERIE_OUTFITTER,
  VILAR_HERALD_GATE_SHOP,
  VILAR_CADIZ_HIGHPORT_OUTFITTER,
  VILAR_HYDRA_MAW_OUTFITTER,
  VILAR_MACAO_PALACE_OUTFITTER,
  VILAR_MANTICORE_OBSERVATORY_OUTFITTER,
  CADIZ_ARMORIAL_SHIPWRIGHTS,
  SERRAT_DOMAIN_CIVIL_REFIT_OFFICE,
  KEELWRIGHT_WORKS_SECONDS_GATE,
  OATHMARK_ACADEMY_HIGH_PENNANT_YARD,
  BRUCKNER_WEYMARK_SERVICE_HALL,
  RED_DUST_MECHANICAL,
  ...WEYMARK_PILOT_SHOPS,
];

// The 26 remaining basic Wells mechanics; promoted accounts retain their IDs
// in COVERAGE_SHOPS but now use the approved professional terms and prose.
export const WELLS_FRONTIER_OUTFITTERS = COVERAGE_SHOPS.filter(shop => shop.id.startsWith('wells-frontier-outfitter-') && shop.facilityTier === 0);
export const EMERGENCY_MAINTENANCE_SHOPS = COVERAGE_SHOPS.filter(shop => shop.facilityTier === -1);
export const MAINTENANCE_SHOPS: readonly MaintenanceShopDef[] = [...AUTHORED_MAINTENANCE_SHOPS, ...COVERAGE_SHOPS];

export function maintenanceShopById(id: string): MaintenanceShopDef | undefined {
  return MAINTENANCE_SHOPS.find(shop => shop.id === id);
}

function laborHoursAtShop(shop: MaintenanceShopDef, authoredHours: number): number {
  return authoredHours * shop.laborHoursMultiplier;
}

export function diagnosisQuote(shop: MaintenanceShopDef): MaintenanceQuote {
  const laborHours = laborHoursAtShop(shop, shop.diagnosisHours);
  return {
    credits: Math.round(laborHours * shop.laborRate),
    laborHours,
  };
}

function unitRoll(value: number): number {
  return Math.max(0, Math.min(0.9999999999999999, value));
}

export function fabricateFaultClaimsAtShop(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  random: () => number = Math.random,
): FabricatedFaultClaim[] {
  const fabricationChance = 1 - Math.max(0, Math.min(1, shop.honesty));
  if (fabricationChance <= 0) return [];
  const claims: FabricatedFaultClaim[] = [];
  for (const systemId of MAINTENANCE_SYSTEM_IDS) {
    const system = maintenanceSystemById(systemId);
    const installedComponents = system.componentIds.flatMap(componentId => {
      const component = maintenanceComponentById(componentId);
      const state = rig.components[componentId];
      return component && state?.installed && fabricatedFaultsForComponent(component).length
        ? [{ component, state }]
        : [];
    });
    const healthyComponents = installedComponents.filter(({ state }) => !state.fault);
    if (!installedComponents.some(({ state }) => !!state.fault) || !healthyComponents.length
      || unitRoll(random()) >= fabricationChance) continue;
    const selected = healthyComponents[Math.floor(unitRoll(random()) * healthyComponents.length)];
    const faults = fabricatedFaultsForComponent(selected.component);
    const fault = faults[Math.floor(unitRoll(random()) * faults.length)];
    claims.push({
      id: `fabricated-claim-${systemId}-${selected.component.id}-${fault.id}`,
      systemId,
      componentId: selected.component.id,
      faultId: fault.id,
      statusActive: true,
    });
  }
  return claims;
}

export function fabricateServiceComponentIdsAtShop(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  excludedComponentIds: ReadonlySet<ComponentId> = new Set(),
  random: () => number = Math.random,
): ComponentId[] {
  const fabricationChance = 1 - Math.max(0, Math.min(1, shop.honesty));
  if (fabricationChance <= 0) return [];
  const fabricated: ComponentId[] = [];
  for (const systemId of MAINTENANCE_SYSTEM_IDS) {
    const system = maintenanceSystemById(systemId);
    const candidates = system.componentIds.flatMap(componentId => {
      const component = maintenanceComponentById(componentId);
      const state = rig.components[componentId];
      return component && state?.installed && !state.fault && !excludedComponentIds.has(componentId)
        && !componentNeedsService(rig, shop, componentId)
        ? [{ componentId, cost: componentReplacementCost(component, state.grade) }]
        : [];
    });
    if (!candidates.length || unitRoll(random()) >= fabricationChance) continue;
    candidates.sort((a, b) => b.cost - a.cost);
    fabricated.push(candidates[0].componentId);
  }
  return fabricated;
}

export function fabricatedRepairQuote(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  claim: FabricatedFaultClaim,
): (MaintenanceQuote & { repair: string; workGrade: WorkGrade }) | undefined {
  if (shop.facilityTier === -1) return undefined;
  const component = maintenanceComponentById(claim.componentId);
  const state = rig.components[claim.componentId];
  const fault = fabricatedFaultById(claim.faultId);
  if (!component || component.systemId !== claim.systemId || !state?.installed || !fault
    || !componentHasFabricatedFault(component, fault.id) || !shopCanPerform(shop.workQualityGrade, fault.workGrade)) return undefined;
  const laborHours = laborHoursAtShop(shop, fault.laborHours);
  const labor = laborHours * shop.laborRate;
  const parts = componentPartsCost(component, state.grade, 'minor') * shop.partsMarkup;
  return {
    repair: fault.repair,
    workGrade: fault.workGrade,
    credits: Math.round(labor + parts),
    laborHours,
  };
}

export function diagnoseRigAtShop(rig: CareerRigState, shop: MaintenanceShopDef): number {
  if (shop.facilityTier === -1) return 0;
  let changed = 0;
  for (const [componentId, state] of Object.entries(rig.components)) {
    if (!state.installed || !state.fault || state.fault.diagnosis === 'confirmed') continue;
    if (state.fault.severity === 'total') {
      state.fault.diagnosis = 'confirmed';
      changed++;
      continue;
    }
    const component = maintenanceComponentById(componentId);
    const fault = component && componentFaultById(component, state.fault.faultId);
    const diagnosis = fault && shopCanPerform(shop.diagnosticGrade, fault.workGrade) ? 'confirmed' : 'suspected';
    if (state.fault.diagnosis !== diagnosis) {
      state.fault.diagnosis = diagnosis;
      changed++;
    }
  }
  return changed;
}

export function componentNeedsService(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): boolean {
  if (shop.facilityTier === -1) return false;
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  return !!component && !!state?.installed && state.ap < componentServicedAp(component, state.grade, shop.workQualityGrade);
}

export function systemServiceQuote(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  systemId: MaintenanceSystemId,
  fabricatedServiceComponentIds: readonly ComponentId[] = [],
): MaintenanceQuote {
  if (shop.facilityTier === -1) return { credits: 0, laborHours: 0 };
  const system = maintenanceSystemById(systemId);
  const fabricated = new Set(fabricatedServiceComponentIds);
  const authoredHours = system.componentIds.reduce((sum, componentId) => {
    const component = maintenanceComponentById(componentId);
    return sum + (component && (componentNeedsService(rig, shop, componentId) || fabricated.has(componentId)) ? component.serviceHours : 0);
  }, 0);
  const laborHours = laborHoursAtShop(shop, authoredHours);
  return {
    credits: Math.round(laborHours * shop.laborRate),
    laborHours,
  };
}

export function rigServiceQuote(rig: CareerRigState, shop: MaintenanceShopDef, fabricatedServiceComponentIds: readonly ComponentId[] = []): MaintenanceQuote {
  return MAINTENANCE_SYSTEM_IDS.reduce((total, systemId) => {
    const quote = systemServiceQuote(rig, shop, systemId, fabricatedServiceComponentIds);
    total.credits += quote.credits;
    total.laborHours += quote.laborHours;
    return total;
  }, { credits: 0, laborHours: 0 });
}

export function systemNeedsService(rig: CareerRigState, shop: MaintenanceShopDef, systemId: MaintenanceSystemId, fabricatedServiceComponentIds: readonly ComponentId[] = []): boolean {
  const system = maintenanceSystemById(systemId);
  const fabricated = new Set(fabricatedServiceComponentIds);
  return system.componentIds.some(componentId => componentNeedsService(rig, shop, componentId) || fabricated.has(componentId));
}

export function repairQuote(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): (MaintenanceQuote & { repair: string; workGrade: WorkGrade }) | undefined {
  if (shop.facilityTier === -1) return undefined;
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state?.installed || !state.fault || state.fault.severity === 'total' || state.fault.diagnosis !== 'confirmed') return undefined;
  const fault = componentFaultById(component, state.fault.faultId);
  if (!fault || !shopCanPerform(shop.workQualityGrade, fault.workGrade)) return undefined;
  const laborHours = laborHoursAtShop(shop, fault.laborHours);
  const labor = laborHours * shop.laborRate;
  const parts = componentPartsCost(component, state.grade, state.fault.severity) * shop.partsMarkup;
  return {
    repair: fault.repair,
    workGrade: fault.workGrade,
    credits: Math.round(labor + parts),
    laborHours,
  };
}

export function stockedComponentGrades(shop: MaintenanceShopDef): ComponentGrade[] {
  if (shop.facilityTier === -1) return [];
  const best = COMPONENT_GRADES.indexOf(shop.componentGradeBest);
  const worst = COMPONENT_GRADES.indexOf(shop.componentGradeWorst);
  return COMPONENT_GRADES.slice(Math.min(best, worst), Math.max(best, worst) + 1);
}

export function replacementGradeAtShop(shop: MaintenanceShopDef, currentGrade: ComponentGrade): { grade: ComponentGrade; exact: boolean } {
  const stocked = stockedComponentGrades(shop);
  if (stocked.includes(currentGrade)) return { grade: currentGrade, exact: true };
  const currentRank = COMPONENT_GRADES.indexOf(currentGrade);
  const grade = stocked.reduce((closest, candidate) => Math.abs(COMPONENT_GRADES.indexOf(candidate) - currentRank) < Math.abs(COMPONENT_GRADES.indexOf(closest) - currentRank) ? candidate : closest);
  return { grade, exact: false };
}

export function replacementQuote(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): (MaintenanceQuote & { grade: ComponentGrade; exact: boolean }) | undefined {
  if (shop.facilityTier === -1) return undefined;
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state?.installed || !state.fault) return undefined;
  const replacement = replacementGradeAtShop(shop, state.grade);
  const laborHours = laborHoursAtShop(shop, component.replacementLaborHours);
  const labor = laborHours * shop.laborRate;
  const parts = componentReplacementCost(component, replacement.grade) * shop.partsMarkup;
  return {
    ...replacement,
    credits: Math.round(labor + parts),
    laborHours,
  };
}

export function serviceSystemAtShop(rig: CareerRigState, shop: MaintenanceShopDef, systemId: MaintenanceSystemId, worldTime: number): boolean {
  const system = maintenanceSystemById(systemId);
  let changed = false;
  for (const componentId of system.componentIds) {
    if (componentNeedsService(rig, shop, componentId)) changed = applyMechanicOperation(rig, componentId, 'service', shop.workQualityGrade, worldTime) || changed;
  }
  return changed;
}

export function serviceRigAtShop(rig: CareerRigState, shop: MaintenanceShopDef, worldTime: number): boolean {
  let changed = false;
  for (const systemId of MAINTENANCE_SYSTEM_IDS) changed = serviceSystemAtShop(rig, shop, systemId, worldTime) || changed;
  return changed;
}

export function repairComponentAtShop(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId, worldTime: number): boolean {
  if (!repairQuote(rig, shop, componentId)) return false;
  return applyMechanicOperation(rig, componentId, 'repair', shop.workQualityGrade, worldTime);
}

export function replaceComponentAtShop(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): boolean {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  const quote = replacementQuote(rig, shop, componentId);
  if (!component || !state || !quote) return false;
  state.installed = true;
  state.grade = quote.grade;
  state.hp = componentMaxHp(component, quote.grade);
  state.ap = componentServicedAp(component, quote.grade, shop.workQualityGrade);
  delete state.fault;
  delete state.lastServiceWorldTime;
  delete state.lastServiceMission;
  return true;
}
