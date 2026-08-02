import { PURCHASABLE_TEAMSTER_LICENSES, type TeamsterCertificationId } from './career-state';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { estellaSelectableNavTargets } from './content/estella/navigation';

export interface LocalDirectoryActionDef {
  id: string;
  label: string;
  detail: string;
  tag?: string;
  contactId?: string;
  requiresCertification?: TeamsterCertificationId;
  purchaseCertification?: { certificationId: TeamsterCertificationId; price: number };
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

const SHARED_TERMINAL_PARENT_KINDS = new Set(['station', 'atmospheric-station', 'asteroid']);

function sharedTerminalParentId(locationId: string): string | undefined {
  const node = ESTELLA_NODES_BY_ID.get(locationId);
  if (!node) return undefined;
  if (SHARED_TERMINAL_PARENT_KINDS.has(node.kind)) return node.id;
  if (node.placement?.kind !== 'aboard') return undefined;
  const parent = ESTELLA_NODES_BY_ID.get(node.placement.parentId);
  return parent && SHARED_TERMINAL_PARENT_KINDS.has(parent.kind) ? parent.id : undefined;
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

/** POIs sharing the current physical station or asteroid terminal. Surface sites remain separate. */
export function localTerminalScopeIds(locationId: string): string[] {
  const parentId = sharedTerminalParentId(locationId);
  if (!parentId) return [locationId];
  const selectableIds = new Set(estellaSelectableNavTargets().map(target => target.id));
  const siblingPoiIds = [...ESTELLA_NODES_BY_ID.values()]
    .filter(node => node.kind === 'poi' && node.placement?.kind === 'aboard' && node.placement.parentId === parentId && selectableIds.has(node.id))
    .map(node => node.id);
  const ordered = [
    ...(selectableIds.has(locationId) ? [locationId] : []),
    ...siblingPoiIds.filter(id => id !== locationId),
  ];
  return ordered.length ? ordered : [locationId];
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
  detail: `Pay the ${license.price.toLocaleString('en-US')} cr test fee and add this license to your Guild record.`,
  tag: 'LICENSE',
  purchaseCertification: { certificationId: license.certificationId, price: license.price },
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
  locationIds: ['estella-v-transit-customs'],
  summary: 'Hartwell thin-atmosphere endorsement and Guild license office.',
  description: 'The Roadstead office overlooks Hartwell through dust-streaked armor glass. Descent profiles to Concord fill the practical examiner’s displays; a separate counter handles written cargo and passenger licenses.',
  actions: [
    {
      id: 'contact-gid-for-thin-atmosphere-endorsement',
      label: 'Contact Gid about the thin-atmosphere endorsement',
      detail: 'Request the Roadstead-to-Concord atmospheric practical.',
      tag: 'ENDORSEMENT',
      contactId: GIDEON_BELL.id,
      requiresCertification: 'basic-3',
    },
    ...CERTIFICATION_LICENSE_ACTIONS,
  ],
};

export const ANVIL_CERTIFICATION_OFFICE: LocalOfficeDef = {
  kind: 'office',
  id: 'anvil-certification-office',
  name: 'Teamsters’ Guild Certification Office',
  organizationName: 'Teamsters’ Guild',
  locationIds: ['estella-vi-main-transit-dispatch'],
  summary: 'Kuznia thick-atmosphere endorsement and Guild license office.',
  description: 'Anvil’s certification room sits beside surface-weather dispatch. Live pressure maps and wind columns dominate the displays; the practical route terminates at Port Stribog below.',
  actions: [
    {
      id: 'contact-gid-for-thick-atmosphere-endorsement',
      label: 'Contact Gid about the thick-atmosphere endorsement',
      detail: 'Request the Anvil-to-Port Stribog atmospheric practical.',
      tag: 'ENDORSEMENT',
      contactId: GIDEON_BELL.id,
      requiresCertification: 'basic-3',
    },
    ...CERTIFICATION_LICENSE_ACTIONS,
  ],
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

export const LOCAL_DIRECTORY_ENTRIES: LocalDirectoryEntryDef[] = [
  OLD_NELL_PASSAGE_OFFICE,
  TEAMSTERS_GUILD_CERTIFICATION_OFFICE,
  NELLS_REST_CERTIFICATION_OFFICE,
  WEYMARK_TOWN_CERTIFICATION_DESK,
  STILL_CERTIFICATION_OFFICE,
  ROADSTEAD_CERTIFICATION_OFFICE,
  ANVIL_CERTIFICATION_OFFICE,
  GIDEON_BELL,
];

export type LocalDirectoryAccess = 'local' | 'remote';

export function localDirectoryEntryAccess(entry: LocalDirectoryEntryDef, locationId: string): LocalDirectoryAccess | undefined {
  const scope = new Set(localTerminalScopeIds(locationId));
  if (entry.locationIds.some(id => scope.has(id))) return 'local';
  if (entry.kind === 'contact' && entry.locationIds.some(id => withinContactRange(locationId, id, entry.commsRange))) return 'remote';
  return undefined;
}

export function localDirectoryEntriesAt(locationId: string, certifications: readonly TeamsterCertificationId[]): LocalDirectoryEntryDef[] {
  return LOCAL_DIRECTORY_ENTRIES.filter(entry => {
    if (entry.requiresCertification && !certifications.includes(entry.requiresCertification)) return false;
    const access = localDirectoryEntryAccess(entry, locationId);
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
