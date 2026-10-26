import { localTerminalScopeIds } from './physical-terminals';
export { localTerminalScopeIds, sharedTerminalParentId } from './physical-terminals';
import { MAINTENANCE_SHOPS } from './maintenance/shops';
import { WELLS_FRONTIER_OUTFITTER_SUMMARY } from './frontier-outfitter-content';
import { PURCHASABLE_TEAMSTER_LICENSES, type TeamsterCertificationId } from './career-state';
import { ESTELLA_NODES_BY_ID } from './content/estella';

export interface LocalDirectoryActionDef {
  id: string;
  label: string;
  detail: string;
  tag?: string;
  contactId?: string;
  requiresCertification?: TeamsterCertificationId;
  purchaseCertification?: { certificationId: TeamsterCertificationId; price: number; requiresCertification: TeamsterCertificationId };
  response?: { title: string; dialogue: string[] };
}

interface LocalDirectoryEntryBase {
  id: string;
  name: string;
  organizationName?: string;
  factionId?: string;
  missionTags?: string[];
  locationIds: string[];
  summary: string;
  /** False when remote access must be initiated through an office rather than the general directory. */
  listedRemotely?: boolean;
  /** Show this entry as tutorial guidance until the named certification is earned. */
  tutorialUntilCertification?: TeamsterCertificationId;
  /** Hide this listing until the named credential is earned. */
  requiresCertification?: TeamsterCertificationId;
  maintenanceShopId?: string;
  actions: LocalDirectoryActionDef[];
}

export interface LocalOfficeDef extends LocalDirectoryEntryBase {
  kind: 'office';
  description: string;
}

export type ContactCommsRange = 'local' | 'cluster' | 'body' | 'region';

export interface LocalContactDef extends LocalDirectoryEntryBase {
  kind: 'contact';
  title: string;
  description: string;
  dialogue: string[];
  commsRange: ContactCommsRange;
}

export type LocalDirectoryEntryDef = LocalOfficeDef | LocalContactDef;

export interface LocalContactPresentation {
  description: string;
  dialogue: string[];
}

function ancestorIdOfKind(locationId: string, kinds: Set<string>): string | undefined {
  let node = ESTELLA_NODES_BY_ID.get(locationId);
  const seen = new Set<string>();
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    if (kinds.has(node.kind)) return node.id;
    node = node.placement?.parentId ? ESTELLA_NODES_BY_ID.get(node.placement.parentId) : undefined;
  }
  return undefined;
}

const BODY_KINDS = new Set(['planet', 'moon', 'dwarf-planet', 'gas-giant']);
const CLUSTER_KINDS = new Set(['cluster']);

function withinContactRange(currentLocationId: string, contactLocationId: string, range: ContactCommsRange): boolean {
  if (range === 'local') return false;
  if (range === 'cluster') {
    const currentCluster = ancestorIdOfKind(currentLocationId, CLUSTER_KINDS);
    return currentCluster !== undefined && currentCluster === ancestorIdOfKind(contactLocationId, CLUSTER_KINDS);
  }
  if (range === 'body') {
    const currentBody = ancestorIdOfKind(currentLocationId, BODY_KINDS);
    return currentBody !== undefined && currentBody === ancestorIdOfKind(contactLocationId, BODY_KINDS);
  }
  const currentRegion = ESTELLA_NODES_BY_ID.get(currentLocationId)?.regionId;
  return currentRegion !== undefined && currentRegion === ESTELLA_NODES_BY_ID.get(contactLocationId)?.regionId;
}

export const GIDEON_BELL: LocalContactDef = {
  kind: 'contact',
  id: 'gideon-gid-bell',
  name: 'Gideon “Gid” Bell',
  title: 'Senior Certification Officer',
  organizationName: 'Teamsters’ Guild',
  factionId: 'teamsters-guild',
  missionTags: ['certification-basic'],
  locationIds: ['still-guild-hq'],
  summary: 'The Guild examiner responsible for Teamster flight certifications and endorsements.',
  listedRemotely: false,
  tutorialUntilCertification: 'line',
  commsRange: 'cluster',
  description: 'A broad, silver-bearded older Teamster leans toward the camera in a faded Guild work shirt. Laugh lines crowd his eyes; one scarred hand cradles a steaming mug while the other rests on a battered checkride clipboard.',
  dialogue: [
    '“Hello there! Gideon Bell—Gid to everybody who isn’t filing paperwork. Good to meet you.”',
    '“I’m sure you already know how to handle the Teamster rig, but, you know, regulations. Every new Guild number needs a witnessed checkride in the ledger before Dispatch can turn you loose on contract work.”',
    '“Keeps the insurers calm, keeps Council inspectors out of our hair, and every so often catches somebody who thought stopping was optional.”',
    '“When you’re ready, visit me at Guild HQ and we’ll get your checkride out of the way.”',
  ],
  actions: [
    {
      id: 'ask-about-additional-endorsements',
      label: 'Ask Gid about additional endorsements',
      detail: 'Ask where the atmospheric practicals are administered and what each one covers.',
      requiresCertification: 'basic-3',
      response: {
        title: 'Additional Endorsements',
        dialogue: [
          '“They’re optional endorsements, not part of the tutorial or your line certificate. Take them when the work you want calls for atmosphere authority.”',
          '“For thin atmosphere, contact the Guild certification office at Roadstead Station. They’ll send you down through Hartwell’s thin carbon-dioxide air and dust to Concord. The practical checks descent planning and control where there isn’t much air to work with.”',
          '“For thick atmosphere, contact the office at Anvil Station. That run goes through Kuznia’s cold, heavy weather to Port Stribog. Expect stronger drag, stronger winds, and less forgiveness if you carry too much speed.”',
        ],
      },
    },
  ],
};

export function localContactPresentation(
  contact: LocalContactDef,
  currentLocationId: string,
  certifications: readonly TeamsterCertificationId[],
): LocalContactPresentation {
  if (contact.id !== GIDEON_BELL.id) return { description: contact.description, dialogue: contact.dialogue };

  const hasBasic1 = certifications.includes('basic-1');
  const hasBasic2 = certifications.includes('basic-2');
  const hasBasic3 = certifications.includes('basic-3');
  const hasLine = certifications.includes('line');
  const atStill = localTerminalScopeIds(currentLocationId).includes('still-guild-hq');
  const atNellsRest = localTerminalScopeIds(currentLocationId).includes('estella-viii-first-rendezvous-station');
  const atWeymarkTown = currentLocationId === 'estella-viii-settlement';

  if (hasBasic3) {
    if (hasLine) {
      return {
        description: contact.description,
        dialogue: [
          '“There’s a Teamster with a proper line certificate. Roadstead sent the clean arrival record.”',
          '“Fragile cargo, volatile cargo, and passenger licenses are desk tests. Any Guild certification office can sell you a sitting when you’re ready.”',
        ],
      };
    }
    return {
      description: contact.description,
      dialogue: [
        '“Three practicals complete. That makes you a Junior Teamster: cleared for local work, but not independent line work yet.”',
        atNellsRest
          ? '“You can stay around Weymark and work the local boards, take Old Nell back to the Still, or fly the line checkride from here when you’re ready.”'
          : atStill
            ? '“Work the local boards as long as you like. When you’re ready, this office at the Still or the one at Nell’s Rest can issue your line checkride to Roadstead Station.”'
            : '“Work the local boards as long as you like. When you’re ready, the certification office at the Still or the one at Nell’s Rest can issue your line checkride to Roadstead Station.”',
        '“Pass that run and I can strike ‘Junior’ from the ledger.”',
      ],
    };
  }

  if (hasBasic2) {
    return {
      description: contact.description,
      dialogue: [
        atWeymarkTown
          ? '“Weymark Town sent me the touchdown record. Nicely done.”'
          : '“I have your landing record here. Two marks down, one to go.”',
        '“Here’s the final certification run: take your rig back to orbit, rendezvous with Nell’s Rest, and dock.”',
        '“Rendezvous can be tricky when the station isn’t where your eyes think it ought to be. If your orbital mechanics feel rusty, check the Orbital Rendezvous entry in the TOH before you launch.”',
      ],
    };
  }

  if (hasBasic1 && atNellsRest) {
    return {
      description: 'The certification-office terminal carries a slightly delayed feed from Gid’s office inside Guild HQ at the Still. Gid fills most of the frame: broad, silver-bearded, and still in the same faded work shirt, with a steaming mug beside his battered checkride clipboard.',
      dialogue: [
        '“Made it aboard Old Nell, did you? Good. She rattles, but she has never misplaced an apprentice.”',
        '“Here’s the next certification run: undock from Nell’s Rest, deorbit, and put your rig down at Weymark Town.”',
        '“Call me again after landing.”',
      ],
    };
  }

  if (hasBasic1 && atStill) {
    return {
      description: 'Gid’s office is wedged deep inside Guild HQ, a narrow room lined with dented maneuvering plaques, paper ledgers, and photographs of obsolete tugs. Gid himself is broad and silver-bearded, in a faded Guild work shirt; laugh lines crowd his eyes as one scarred hand offers a chair and the other guards a steaming mug.',
      dialogue: [
        '“There you are. The Public Approach Dock sent me a clean berth report, so your first practical is in the ledger.”',
        '“Your next checkride phase is a moon landing, so you’ll take Old Nell out to Weymark. Don’t mind the smell or the noises—we respect the old girl for her long service, and she still gets where she’s going.”',
        '“She’ll carry you and your rig to Nell’s Rest. Call me from the Certification Office when you arrive, and I’ll issue the deorbit run over the Guild link.”',
        '“By the way, the TOH isn’t only good as emergency ballast. It’s got plenty of information in it, if you’re the reading kind.”',
      ],
    };
  }

  return { description: contact.description, dialogue: contact.dialogue };
}

const CERTIFICATION_LICENSE_ACTIONS: LocalDirectoryActionDef[] = PURCHASABLE_TEAMSTER_LICENSES.map(license => ({
  id: `purchase-${license.certificationId}-license`,
  label: license.name,
  detail: `Pay the ${license.price.toLocaleString('en-US')} cr license fee and add this credential to your Guild record.`,
  tag: 'LICENSE',
  purchaseCertification: { certificationId: license.certificationId, price: license.price, requiresCertification: license.requiresCertification },
}));

export const TEAMSTERS_GUILD_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'teamsters-guild-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['caravanserai-certification-authority'],
  summary: 'Guild licensing and practical-flight administration for working Teamsters.',
  tutorialUntilCertification: 'basic-3',
  description: 'The certification office occupies a low-ceilinged suite behind the Caravanserai traffic hall. Scuffed maneuver plots and framed rig licenses cover the walls; old acceleration couches serve as waiting-room seats.',
  actions: [
    {
      id: 'start-basic-certification',
      label: 'Contact Gid about Guild certification',
      detail: 'Open a call with the Guild officer responsible for flight certifications.',
      tag: 'TUTORIAL',
      contactId: GIDEON_BELL.id,
    },
    ...CERTIFICATION_LICENSE_ACTIONS,
  ],
};

export const NELLS_REST_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'nells-rest-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-viii-first-rendezvous-station'],
  summary: 'Guild checkride administration and Junior Teamster flight dispatch.',
  tutorialUntilCertification: 'line',
  description: 'The Certification Office is a glass-fronted room off Nell’s Rest’s maintenance concourse. Training orbits cover one wall; a heavy Guild communications terminal occupies the examiner’s desk, patched directly to Guild HQ at the Still.',
  actions: [
    {
      id: 'contact-gid-for-weymark-checkride',
      label: 'Contact Gid for certification instructions',
      detail: 'Open the reserved certification link to Guild HQ at the Still.',
      tag: 'TUTORIAL',
      contactId: GIDEON_BELL.id,
    },
    ...CERTIFICATION_LICENSE_ACTIONS,
  ],
};

export const WEYMARK_TOWN_CERTIFICATION_DESK: LocalOfficeDef = {
  kind: 'office',
  id: 'weymark-town-certification-desk',
  name: 'Teamsters’ Guild Checkride Desk',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-viii-settlement'],
  summary: 'The Guild terminal used to close surface practicals and issue return flights.',
  tutorialUntilCertification: 'basic-3',
  description: 'A reinforced terminal booth beside Weymark Town’s pad office carries a Guild seal, a telemetry reader, and a direct certification circuit back to Gid at the Still.',
  actions: [
    {
      id: 'contact-gid-for-return-checkride',
      label: 'Contact Gid after landing',
      detail: 'Submit the landing record and request the final practical.',
      tag: 'TUTORIAL',
      contactId: GIDEON_BELL.id,
    },
  ],
};

export const STILL_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'still-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['still-guild-hq'],
  summary: 'Guild HQ certification office for line checkrides, endorsements, and license records.',
  tutorialUntilCertification: 'line',
  description: 'A row of examiner desks occupies the public side of Guild HQ. Checkride plots share wall space with cargo-license fee schedules and framed photographs of retired Teamsters.',
  actions: [
    {
      id: 'contact-gid-for-line-checkride',
      label: 'Contact Gid for line certification',
      detail: 'Request the tutorial line checkride to Roadstead Station.',
      tag: 'TUTORIAL',
      contactId: GIDEON_BELL.id,
    },
    ...CERTIFICATION_LICENSE_ACTIONS,
  ],
};

export const ROADSTEAD_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'roadstead-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  factionId: 'teamsters-guild',
  missionTags: ['certification-thin-atmosphere'],
  locationIds: ['estella-v-transit-customs'],
  summary: 'Hartwell thin-atmosphere endorsement and Guild license office.',
  description: 'The Roadstead office overlooks Hartwell through dust-streaked armor glass. Descent profiles to Concord fill the practical examiner’s displays; a separate counter handles written cargo and passenger licenses.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const ANVIL_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'anvil-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  factionId: 'teamsters-guild',
  missionTags: ['certification-thick-atmosphere'],
  locationIds: ['estella-vi-main-transit-dispatch'],
  summary: 'Kuznia thick-atmosphere endorsement and Guild license office.',
  description: 'Anvil’s certification room sits beside surface-weather dispatch. Live pressure maps and wind columns dominate the displays; the practical route terminates at Port Stribog below.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const GAIA_LICENSING_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'gaia-guild-licensing-office',
  name: 'Teamsters’ Guild Licensing Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-iii-main-customs'],
  summary: 'Guild license counter serving Gaia and the Hearth.',
  description: 'A compact Guild counter operates beside Gaia’s main customs hall. It records cargo and passenger licenses but does not administer flight checkrides.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const HERALD_GATE_LICENSING_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'herald-gate-guild-licensing-office',
  name: 'Teamsters’ Guild Licensing Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-xc-transit-refuel'],
  summary: 'Guild license counter serving Gryphon and the inner Wells.',
  description: 'The Guild’s Herald Gate counter sits among the herald and transit clerks. It records cargo and passenger licenses but does not administer flight checkrides.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const CADIZ_LICENSING_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'cadiz-guild-licensing-office',
  name: 'Teamsters’ Guild Licensing Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-xid-main-port'],
  summary: 'Guild license counter at the Wells’ main commercial hub.',
  description: 'Cadiz Highport gives the Guild licensing counter a permanent room off the commercial arrivals concourse. It records cargo and passenger licenses but does not administer flight checkrides.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const MANTICORE_LICENSING_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'manticore-guild-licensing-office',
  name: 'Teamsters’ Guild Licensing Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-xii-observation-post'],
  summary: 'Small Guild liaison and license counter for the outer Wells.',
  description: 'A one-room Guild liaison office shares Manticore Observatory’s civilian services deck. It records cargo and passenger licenses but does not administer flight checkrides.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const REACH_LICENSING_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'reach-guild-licensing-office',
  name: 'Teamsters’ Guild Licensing Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-xiii-main-port'],
  summary: 'Guild license counter serving the Reach and outer-system traffic.',
  description: 'The Reach’s Guild counter occupies a spare dispatch booth at Estella XIII Main Port. It records cargo and passenger licenses but does not administer flight checkrides.',
  actions: [...CERTIFICATION_LICENSE_ACTIONS],
};

export const OLD_NELL_PASSAGE_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'old-nell-passage-office',
  name: 'Old Nell Passage Office',
  organizationName: 'Teamsters’ Guild',
  factionId: 'teamsters-guild',
  missionTags: ['old-nell-passage'],
  locationIds: ['still-public-approach-dock', 'estella-viii-first-rendezvous-station'],
  summary: 'No-charge Guild passage for Junior Teamsters and their rigs between the Still and Weymark.',
  requiresCertification: 'basic-3',
  description: 'Old Nell’s passage desk keeps a handwritten sailing board, a stack of berth warrants, and a permanent warning that machinery noises are not grounds for alarm. Junior Teamsters and their rigs travel between the Still and Nell’s Rest at no charge.',
  actions: [],
};

export const VILAR_GRYPHON_AERIE_OUTFITTER: LocalOfficeDef = {
  kind: 'office',
  id: 'vilar-gryphon-aerie-outfitter-office',
  name: 'Vilar’s Outfitter at Gryphon Aerie',
  organizationName: 'House Vilar',
  locationIds: ['estella-x-observation-skim-hub'],
  summary: 'House Vilar network outfitter.',
  description: 'A gilt House Vilar badge spans the entrance to a glass-fronted service gallery high in Gryphon Aerie. Sir Tomás Barreto governs the concession from a balcony above the bays, welcoming Teamsters with courtly warmth while licensed journeymen drive rows of serf mechanics through the work below.',
  maintenanceShopId: 'vilar-gryphon-aerie-outfitter',
  actions: [],
};

export const VILAR_HERALD_GATE_OUTFITTER: LocalOfficeDef = {
  kind: 'office',
  id: 'vilar-herald-gate-outfitter-office',
  name: 'Vilar’s Outfitter at Herald Gate',
  organizationName: 'House Vilar',
  locationIds: ['estella-xc-transit-refuel'],
  summary: 'House Vilar network outfitter.',
  description: 'The crimson-and-gold badge of House Vilar hangs above a vaulted service gallery built into Herald Gate’s commercial ring. Baron Estêvão Vilar’s local concession is governed by Dame Leonor Falcão, a knight-overseer whose immaculate licensed journeymen direct rows of grey-clad serf mechanics below.',
  maintenanceShopId: 'vilar-herald-gate-outfitter',
  actions: [],
};

export const VILAR_CADIZ_HIGHPORT_OUTFITTER: LocalOfficeDef = {
  kind: 'office',
  id: 'vilar-cadiz-highport-outfitter-office',
  name: 'Vilar’s Outfitter at Cadiz Highport',
  organizationName: 'House Vilar',
  locationIds: ['estella-xid-main-port'],
  summary: 'House Vilar flagship outfitter.',
  description: 'Vilar’s Outfitter at Cadiz Highport occupies a full commercial pier: six numbered service bays, a two-level parts warehouse, and an executive gallery hung with expansion plans beside a purchased baronial crest. Baron Estêvão Vilar built the chain before buying the title with its proceeds, and still walks the floor with a founder’s eye for idle hands, slow inventory, and missed opportunity.',
  maintenanceShopId: 'vilar-cadiz-highport-outfitter',
  actions: [],
};

export const VILAR_HYDRA_MAW_OUTFITTER: LocalOfficeDef = {
  kind: 'office',
  id: 'vilar-hydra-maw-outfitter-office',
  name: 'Vilar’s Outfitter at Hydra Maw Orbital',
  organizationName: 'House Vilar',
  locationIds: ['estella-xi-skim-hub'],
  summary: 'House Vilar industrial outfitter.',
  description: 'House Vilar’s Hydra Maw concession occupies an armored service gallery between the skim tenders and the station’s pressure refuge. Dame Inês Moura, a former gas-skimmer chief, runs the bays like a flight deck: sealed carts, clipped commands, exact turnaround boards, and journeymen trained to hear a pressure leak through the machinery.',
  maintenanceShopId: 'vilar-hydra-maw-outfitter',
  actions: [],
};

export const VILAR_MACAO_PALACE_OUTFITTER: LocalOfficeDef = {
  kind: 'office',
  id: 'vilar-macao-palace-outfitter-office',
  name: 'Vilar’s Outfitter at Macao Palace',
  organizationName: 'House Vilar',
  locationIds: ['estella-xic-research-station-poi'],
  summary: 'House Vilar palace outfitter.',
  description: 'The Macao Palace concession resembles a private gaming salon built around a spotless service floor. Sir Gaspar Seixas receives Teamsters beneath lacquered House Vilar screens while mechanics, parts clerks, debt advocates, and contract brokers move through the galleries at signals from his jeweled hand. He remembers every patron’s wagers, obligations, and preferred manner of being addressed.',
  maintenanceShopId: 'vilar-macao-palace-outfitter',
  actions: [],
};

export const VILAR_MANTICORE_OBSERVATORY_OUTFITTER: LocalOfficeDef = {
  kind: 'office',
  id: 'vilar-manticore-observatory-outfitter-office',
  name: 'Vilar’s Outfitter at Manticore Observatory',
  organizationName: 'House Vilar',
  locationIds: ['estella-xii-observation-post'],
  summary: 'House Vilar outer-Wells outfitter.',
  description: 'The gilt Vilar badge hangs at the entrance where the commercial charter requires it. Inside, the older silver-and-black arms of House Noronha dominate two warm, meticulously ordered service bays beneath Manticore Observatory’s long-watch decks. Sir Lourenço Noronha accepted command of the concession without conceding social equality to its proprietor. His lineage is older and more renowned than Baron Vilar’s purchased title, a distinction he introduces before business has properly begun.',
  maintenanceShopId: 'vilar-manticore-observatory-outfitter',
  actions: [],
};

export const CADIZ_ARMORIAL_SHIPWRIGHTS: LocalOfficeDef = {
  kind: 'office',
  id: 'cadiz-armorial-shipwrights-office',
  name: 'The Armorial Shipwrights at Shipwright Keep',
  organizationName: 'The Armorial Shipwrights',
  locationIds: ['estella-xid-services-outfitter-hangar'],
  summary: 'Heraldic repair court and noble outfitter.',
  description: 'The Armorial Shipwrights occupy the inner ward of Shipwright Keep, where vaulted service bays open beneath painted shields and long rolls of honored craftsmen. Journeymen wear immaculate house livery over their work clothes, apprentices carry silver-edged tool cases, and young squires occasionally complete a shipyard rotation under the masters. The carpets stop precisely at the painted bay line. The shop’s Teamsters’ Guild certification is an actual parchment displayed behind crystal, its heavy red wax seal resting in a velvet-lined mount. Sir Afonso de Lacerda, Keeper of the Shipyard Seal, presides over the work.',
  maintenanceShopId: 'cadiz-armorial-shipwrights',
  actions: [],
};

export const SERRAT_DOMAIN_CIVIL_REFIT_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'serrat-domain-civil-refit-office-directory',
  name: 'Serrat Domain Civil Refit Office',
  organizationName: 'Serrat Domain Shipyard Office',
  locationIds: ['estella-xie-outer-spec-drydock'],
  summary: 'High-capability civilian diagnostics, repair, and refit.',
  description: 'The Civil Refit Office occupies a line of enclosed rig bays along Serrat Domain Shipyard’s inner service spine. Overhead carriers move drive cores, pressure sections, and frame members between calibrated lift frames, machine shops, and sealed test rooms. Master Shipwright Beatriz Correia commands the civilian watch from the main dock board, assigning visiting craft among the shipyard’s structures, machinery, and electrical teams.',
  maintenanceShopId: 'serrat-domain-civil-refit-office',
  actions: [],
};

export const KEELWRIGHT_WORKS_SECONDS_GATE: LocalOfficeDef = {
  kind: 'office',
  id: 'keelwright-works-seconds-gate-directory',
  name: 'The Seconds Gate at Keelwright Works',
  locationIds: ['estella-xie-rare-alloy-extraction'],
  summary: 'Rapid factory service and proofed production-overrun components.',
  description: 'The Seconds Gate occupies a receiving hall beside Keelwright Works’ final proofing floor. Its tall racks hold pristine drive housings in rival House colors, frame members with obsolete crests milled away, and actuator sets marked thirteen of twelve. Every component carries a production pedigree and a visible proof stamp. At each shift bell, carts, crews, and visiting rigs advance together through the exchange line under Proofmaster Tomé Avelar’s ear.',
  maintenanceShopId: 'keelwright-works-seconds-gate',
  actions: [],
};

export const OATHMARK_ACADEMY_HIGH_PENNANT_YARD: LocalOfficeDef = {
  kind: 'office',
  id: 'oathmark-academy-high-pennant-yard-directory',
  name: 'The High Pennant Shipyard at Oathmark Academy',
  locationIds: ['estella-xie-oathmark-academy'],
  summary: 'Discreet private-vessel maintenance under Oathmark Academy protocol.',
  description: 'The High Pennant Shipyard receives clients in a silent salon of dark wood, pale stone, and smoked privacy glass. Its production floor lies beyond layered pressure bulkheads and acoustic isolation; tools, crews, machinery, and unfinished vessels remain entirely outside the reception experience. Dames Margarida and Madalena de Sá operate the shipyard from matching desks in matching ivory uniforms. Their badges both read M. DE SÁ, and neither sister volunteers which name belongs to which woman.',
  maintenanceShopId: 'oathmark-academy-high-pennant-yard',
  actions: [],
};

export const GOVERNORS_RESERVE_AND_DUCAL_WEIGHTS_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'governors-reserve-ducal-weights-office',
  name: 'Governor’s Reserve and Ducal Weights Office',
  organizationName: 'House Alvares',
  locationIds: ['estella-xc-transit-refuel'],
  summary: 'Ducal assessments, public allotments, and bonded custody',
  description: 'The Governor’s Reserve occupies a fortified run of bonded holds beside Herald Gate’s principal freight axis. The Ducal Weights Office shares its public counter, where assessed cargo is weighed into House obligations and released again as grants, common burdens, and court-ordered assignments.',
  actions: [],
};

export const OFFICE_OF_INVESTITURES_AND_PUBLIC_OCCASIONS: LocalOfficeDef = {
  kind: 'office',
  id: 'office-of-investitures-public-occasions',
  name: 'Office of Investitures and Public Occasions',
  organizationName: 'House Alvares',
  locationIds: ['estella-xc-castle-alvares', 'estella-xc-main-outpost'],
  summary: 'Official recognition, ceremonial delegations, and public feasts',
  description: 'The Office prepares House Alvares representation for weddings, births, comings of age, investitures, and other occasions requiring formal recognition. Its stewards arrange official delegations, subsidized household attendance, feast apparatus, and the return of every person and reusable fitting afterward.',
  actions: [],
};

export const MERREN_CONSERVATORY_EXPORT_HOUSE: LocalOfficeDef = {
  kind: 'office',
  id: 'merren-conservatory-export-house',
  name: 'Merren Conservatory Export House',
  organizationName: 'Merren Conservatory',
  locationIds: ['estella-vib-cold-chain-station'],
  summary: 'Cold-chain inspection, commissioned exports, and sponsored settlement',
  description: 'Merren’s Export House surrounds Kalyna Orbital’s cold-chain floor with glass offices, sealed sample rooms, and red-painted dispatch counters. Surface producer halls deliver every outbound lot under their own seals. The adjoining settlement desk receives Merren-sponsored households and directs them toward prepared homes and work placements across Kalyna.',
  actions: [],
};

export const MERREN_WORK_UNION_PASSAGE_HALL: LocalOfficeDef = {
  kind: 'office',
  id: 'merren-work-union-passage-hall',
  name: 'Merren Work Union Passage Hall',
  organizationName: 'Merren Work Union',
  locationIds: ['estella-vib-cold-chain-station', 'estella-vib-vat-protein', 'estella-vib-pharma-horticulture', 'estella-vib-aquaculture'],
  summary: 'Udarniki work pilgrimages and collective passage',
  description: 'The Passage Hall is maintained by the growers, pool stewards, culture technicians, and household delegates of the Merren Work Union. Its boards organize reciprocal Udarniki work pilgrimages with Kuznia and receive returning parties under the same collective account.',
  actions: [],
};

export const HOUSE_NUNES_CHAMBER_OF_INQUIRY: LocalOfficeDef = {
  kind: 'office',
  id: 'house-nunes-chamber-of-inquiry',
  name: 'House Nunes Chamber of Inquiry',
  organizationName: 'House Nunes',
  locationIds: ['estella-xiid-black-project-exile'],
  summary: 'Learned patronage, outer wardenship, and sealed custody',
  description: 'The Chamber records every open Inquiry under the private seal of House Nunes. Its clerks grant instruments, passage, and field expenses to the learned houses of the Wells, while adjoining offices administer the outer watch, quarantine warrants, recoveries, and matters committed to sealed custody.',
  actions: [{ id: 'review-open-inquiries', label: 'Review the Open Inquiries', detail: 'Read the current slate, principal institutions, and progress entered by the Chamber.' }],
};

export const HOUSE_NUNES_PATRONAGE_HALL: LocalOfficeDef = {
  kind: 'office',
  id: 'house-nunes-patronage-hall',
  name: 'House Nunes Patronage Hall',
  organizationName: 'House Nunes',
  locationIds: ['estella-xi-science-waypoint-poi'],
  summary: 'Open Inquiries and passage for the learned estate',
  description: 'House Nunes maintains this vaulted hall among the Academy’s workshops and disputation chambers. Magisters, apprentices, physicians, alchemists, and celestial philosophers receive their assignments here before carrying instruments and arguments across the Wells.',
  actions: [{ id: 'review-open-inquiries', label: 'Review the Open Inquiries', detail: 'Read the current slate, principal institutions, and progress entered by the Chamber.' }],
};

export const BLACKGLASS_OFFICE_OF_OBSERVANCES: LocalOfficeDef = {
  kind: 'office',
  id: 'blackglass-office-of-observances',
  name: 'Blackglass Office of Observances',
  organizationName: 'House Nunes',
  locationIds: ['estella-xiid-blackglass-observatory'],
  summary: 'Deep observations, field trials, and private archives',
  description: 'The Office receives celestial instruments, sealed recorder vaults, and the findings of distant observances. Blackglass Magisters compare each result against the private Nunes archive before releasing selected measures to the Academy.',
  actions: [],
};

export const MIRROR_CLINIC_QUIET_REGISTRY: LocalOfficeDef = {
  kind: 'office',
  id: 'mirror-clinic-quiet-registry',
  name: 'Mirror Clinic Quiet Registry',
  organizationName: 'House Nunes',
  locationIds: ['estella-xiid-mirror-clinic'],
  summary: 'Physic, quarantine, and protected passage',
  description: 'The Quiet Registry arranges controlled passage for physicians, altered patients, protected witnesses, and recovery parties. Its custody clerks receive sealed medical apparatus and preserve the chosen identity of every person entered under the Clinic’s seal.',
  actions: [],
};

export const HOUSE_MENDES_MARSHALCY: LocalOfficeDef = {
  kind: 'office',
  id: 'house-mendes-marshalcy',
  name: 'House Mendes Marshalcy',
  organizationName: 'House Mendes',
  locationIds: ['estella-xc-castle-mendes'],
  summary: 'Muster command office',
  description: '[contact]Lord Marshal Vasco Mendes[/contact] directs the House’s muster warrants from Castle Mendes. His office coordinates Banner Forge deployments, guard inspections, and the return of personnel from the Wells.',
  actions: [],
};

export const BRUCKNER_CENTRAL_SERVICE_HALL: LocalOfficeDef = {
  kind: 'office',
  id: 'bruckner-central-service-hall-office',
  name: 'Bruckner Central Service Hall',
  locationIds: ['estella-viii-harder-approach-station'],
  summary: 'Advanced VHM-authorized precision service and civilian parts depot.',
  description: 'Bruckner’s central Estella service floor is bright, quiet, and divided into numbered clean bays. VHM-certified diagnostic frames stand beside locked civilian parts cages and a glass-fronted warranty office. Depot Service Director Anja Riedel runs the floor by headset; every removed component is tagged before it touches a cart.',
  maintenanceShopId: 'bruckner-central-service-hall',
  actions: [],
};

export const RED_DUST_MECHANICAL: LocalOfficeDef = {
  kind: 'office',
  id: 'red-dust-mechanical-reclamation-office',
  name: 'Red Dust Mechanical & Reclamation',
  locationIds: ['estella-v-capital-settlement'],
  summary: 'Family maintenance shop',
  description: 'Red Dust Mechanical & Reclamation occupies Concord’s former contractor motor pool, with four enclosed service bays and a crowded reclaimed-parts warehouse. Abraham “Honest Abe” Calder staffs the enterprise entirely with his sons, in-laws, cousins, and whichever other relatives need work that season. Estimates are discussed around the family table in the office, while Gasket, the Calder family dog, sleeps underneath and wakes for every arriving rig.',
  maintenanceShopId: 'red-dust-mechanical-reclamation',
  actions: [],
};

const AUTHORED_LOCAL_DIRECTORY_ENTRIES: LocalDirectoryEntryDef[] = [
  VILAR_GRYPHON_AERIE_OUTFITTER,
  VILAR_HERALD_GATE_OUTFITTER,
  VILAR_CADIZ_HIGHPORT_OUTFITTER,
  VILAR_HYDRA_MAW_OUTFITTER,
  VILAR_MACAO_PALACE_OUTFITTER,
  VILAR_MANTICORE_OBSERVATORY_OUTFITTER,
  CADIZ_ARMORIAL_SHIPWRIGHTS,
  SERRAT_DOMAIN_CIVIL_REFIT_OFFICE,
  KEELWRIGHT_WORKS_SECONDS_GATE,
  OATHMARK_ACADEMY_HIGH_PENNANT_YARD,
  GOVERNORS_RESERVE_AND_DUCAL_WEIGHTS_OFFICE,
  OFFICE_OF_INVESTITURES_AND_PUBLIC_OCCASIONS,
  MERREN_CONSERVATORY_EXPORT_HOUSE,
  MERREN_WORK_UNION_PASSAGE_HALL,
  HOUSE_NUNES_CHAMBER_OF_INQUIRY,
  HOUSE_NUNES_PATRONAGE_HALL,
  BLACKGLASS_OFFICE_OF_OBSERVANCES,
  MIRROR_CLINIC_QUIET_REGISTRY,
  HOUSE_MENDES_MARSHALCY,
  BRUCKNER_CENTRAL_SERVICE_HALL,
  RED_DUST_MECHANICAL,
  OLD_NELL_PASSAGE_OFFICE,
  TEAMSTERS_GUILD_CERTIFICATION_OFFICE,
  NELLS_REST_CERTIFICATION_OFFICE,
  WEYMARK_TOWN_CERTIFICATION_DESK,
  STILL_CERTIFICATION_OFFICE,
  ROADSTEAD_CERTIFICATION_OFFICE,
  ANVIL_CERTIFICATION_OFFICE,
  GAIA_LICENSING_OFFICE,
  HERALD_GATE_LICENSING_OFFICE,
  CADIZ_LICENSING_OFFICE,
  MANTICORE_LICENSING_OFFICE,
  REACH_LICENSING_OFFICE,
  GIDEON_BELL,
];

const AUTHORED_SHOP_IDS = new Set(AUTHORED_LOCAL_DIRECTORY_ENTRIES.map(entry => entry.maintenanceShopId));
/** One registry decides coverage; directory listings cannot diverge from shops. */
const GENERATED_SHOP_ENTRIES: LocalOfficeDef[] = MAINTENANCE_SHOPS
  .filter(shop => !AUTHORED_SHOP_IDS.has(shop.id))
  .map(shop => ({
    kind: 'office', id: `${shop.id}-office`, name: shop.name,
    locationIds: shop.locationIds, summary: shop.id.startsWith('wells-frontier-outfitter-') ? WELLS_FRONTIER_OUTFITTER_SUMMARY : shop.copy.levelBlurb,
    description: shop.copy.profileBlurb, maintenanceShopId: shop.id, actions: [],
  }));
export const WELLS_FRONTIER_OUTFITTER_DIRECTORY_ENTRIES = GENERATED_SHOP_ENTRIES.filter(entry => entry.maintenanceShopId?.startsWith('wells-frontier-outfitter-'));

export const LOCAL_DIRECTORY_ENTRIES: LocalDirectoryEntryDef[] = [
  ...AUTHORED_LOCAL_DIRECTORY_ENTRIES,
  ...GENERATED_SHOP_ENTRIES,
];

export type LocalDirectoryAccess = 'local' | 'remote';

export function localDirectoryEntryAccess(entry: LocalDirectoryEntryDef, locationId: string, scope: ReadonlySet<string> = new Set(localTerminalScopeIds(locationId))): LocalDirectoryAccess | undefined {
  if (entry.locationIds.some(id => scope.has(id))) return 'local';
  if (entry.kind === 'contact' && entry.locationIds.some(id => withinContactRange(locationId, id, entry.commsRange))) return 'remote';
  return undefined;
}

export function localDirectoryEntriesAt(locationId: string, certifications: readonly TeamsterCertificationId[]): LocalDirectoryEntryDef[] {
  const scope = new Set(localTerminalScopeIds(locationId));
  return LOCAL_DIRECTORY_ENTRIES.filter(entry => {
    if (entry.requiresCertification && !certifications.includes(entry.requiresCertification)) return false;
    const access = localDirectoryEntryAccess(entry, locationId, scope);
    return access !== undefined && (access === 'local' || entry.listedRemotely !== false);
  });
}

export function tutorialCertificationAvailableAt(locationId: string, certifications: readonly TeamsterCertificationId[]): boolean {
  const scope = new Set(localTerminalScopeIds(locationId));
  const hasBasic1 = certifications.includes('basic-1');
  const hasBasic2 = certifications.includes('basic-2');
  const hasBasic3 = certifications.includes('basic-3');
  if (!hasBasic1) return scope.has('caravanserai-main-commercial-dock');
  if (!hasBasic2) return scope.has('still-guild-hq') || scope.has('estella-viii-first-rendezvous-station');
  if (!hasBasic3) return scope.has('estella-viii-settlement');
  if (!certifications.includes('line')) return scope.has('still-guild-hq') || scope.has('estella-viii-first-rendezvous-station');
  return false;
}

export function localDirectoryEntryById(id: string): LocalDirectoryEntryDef | undefined {
  return LOCAL_DIRECTORY_ENTRIES.find(entry => entry.id === id);
}
