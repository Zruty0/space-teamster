import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate } from './index';

type Blurb = (candidate: FactionContractCandidate, cargo: string, destination: string, issuer: string) => string;

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function destinationName(destinationId: string): string {
  return ESTELLA_NODES_BY_ID.get(destinationId)?.name ?? destinationId;
}

function pick(pool: Blurb[], candidate: FactionContractCandidate): Blurb {
  return pool[hashString(`${candidate.factionId}:${candidate.cargo.label}:${candidate.destinationId}`) % pool.length];
}

const GENERIC_BLURBS: Blurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s receiving clerk at ${destination} checks the ${cargo} against the manifest and keys the contract closed. A plain receipt thanks you for the completed delivery.`,
  (_candidate, cargo, destination, issuer) => `The ${cargo} is logged at ${destination} without ceremony. ${issuer} posts a short acknowledgement to your account before the dock seals cycle shut.`,
  (_candidate, cargo, destination, issuer) => `${issuer}'s dock crew at ${destination} waves the ${cargo} through inspection and starts unloading. The BBS marks the job complete a moment later.`,
  (_candidate, cargo, destination, issuer) => `At ${destination}, the cargo handler gives the ${cargo} one careful look and nods. ${issuer} thanks you for a clean handoff.`,
  (_candidate, cargo, destination, issuer) => `The ${cargo} disappears into ${destination}'s local logistics stream. ${issuer} sends a brief thank-you and releases payment.`,
];

const BLURBS_BY_FACTION: Record<string, Blurb[]> = {
  'new-canaan-miners-mutual': [
    (_candidate, cargo, destination, issuer) => `${issuer}'s loading crew at ${destination} starts pulling the ${cargo} loose before your engine bells have cooled. The crew chief shakes your hand hard and says it buys them another week of air.`,
    (_candidate, cargo, destination, issuer) => `The ${cargo} is met by patched suits and tired faces at ${destination}. ${issuer} sends thanks from the Co-op board: another leak, pump, or ration line can stay ahead of failure.`,
    (_candidate, cargo, destination) => `At ${destination}, the dock boss counts the ${cargo} twice, then grins like the numbers came out better than expected. Someone chalks your ship name onto a bulkhead under "paid up friends."`,
    (_candidate, cargo, destination, issuer) => `${issuer} locals swarm the ${cargo} with practiced urgency at ${destination}. A miner on the crew says nobody gets rich out here, but today nobody gets buried either.`,
    (_candidate, cargo, destination) => `The ${cargo} comes off at ${destination} into a noisy argument about whose claim needs it first. The argument sounds cheerful, which is probably the best report the Co-op can give.`,
  ],
  'cerberus-human-resources': [
    (_candidate, cargo, destination, issuer) => `${issuer} receives the ${cargo} at ${destination} behind tinted glass and immaculate hazard stripes. The thank-you is automated, polite, and signed by three compliance systems.`,
    (_candidate, cargo, destination) => `At ${destination}, Cerberus handlers move the ${cargo} without wasting a word. Your receipt arrives with a legal footer longer than the message.`,
    (_candidate, cargo, destination) => `The ${cargo} is absorbed into ${destination}'s Cerberus process chain with quiet efficiency. A supervisor smiles exactly once and certifies successful transfer.`,
    (_candidate, cargo, destination, issuer) => `${issuer} clocks the ${cargo} into ${destination} before you finish shutdown. The BBS thanks you for maintaining schedule discipline.`,
    (_candidate, cargo, destination) => `Cerberus staff at ${destination} separate the ${cargo} from your manifest like a balance-sheet entry becoming real. Payment clears immediately and without warmth.`,
  ],
  'bruckner-field-services': [
    (_candidate, cargo, destination, issuer) => `${issuer}'s service desk at ${destination} tags the ${cargo} with a warranty chain sticker before the pallet is fully down. A mechanic gives you a grease-smudged thumbs-up.`,
    (_candidate, cargo, destination) => `The ${cargo} rolls into ${destination}'s Bruckner cage among torque wrenches, orange cones, and half-open drive housings. Dispatch thanks you for keeping somebody else's warranty alive.`,
    (_candidate, cargo, destination) => `At ${destination}, a field tech signs for the ${cargo} while already arguing about the repair queue. Your manifest clears under "arrived in serviceable condition."`,
    (_candidate, cargo, destination, issuer) => `${issuer} receives the ${cargo} at ${destination} with practical relief rather than ceremony. Somewhere down the dock, a grounded hauler just moved up the schedule.`,
    (_candidate, cargo, destination) => `The ${cargo} disappears into labeled bins and anti-static sleeves at ${destination}. Bruckner's terminal thanks you and prints a warranty receipt nobody will read until something breaks.`,
  ],
  'voss-heinkel-metricwerke': [
    (_candidate, cargo, destination, issuer) => `${issuer} accepts the ${cargo} at ${destination} in a silent clean bay. The inspector's nod is barely visible, which from VHM counts as lavish praise.`,
    (_candidate, cargo, destination) => `The ${cargo} is transferred at ${destination} under seal, camera, and metric-field audit. Voss-Heinkel thanks you in precise language and no unnecessary adjectives.`,
    (_candidate, cargo, destination) => `At ${destination}, white-gloved technicians check the ${cargo} against tolerances you are not cleared to know. Payment clears the moment the final seal light goes green.`,
    (_candidate, cargo, destination, issuer) => `${issuer}'s receiving team takes the ${cargo} without small talk at ${destination}. The contract closes with a single line: performance acceptable.`,
    (_candidate, cargo, destination) => `The ${cargo} enters VHM custody at ${destination} through a door marked with more warnings than instructions. A clipped acknowledgement follows you back to the berth.`,
  ],
  'kisaragi-harmony-yards': [
    (_candidate, cargo, destination, issuer) => `${issuer}'s cargo dock at ${destination} is pristine and faintly scented with lavender. A smiling receptionist thanks you for completing the delivery harmoniously.`,
    (_candidate, cargo, destination) => `The ${cargo} is received at ${destination} by attendants in spotless yard coats. They bow to the manifest, then to you, and the payment arrives without a fingerprint on it.`,
    (_candidate, cargo, destination, issuer) => `${issuer} staff guide the ${cargo} into ${destination} as if it were entering a gallery. The thank-you note calls your arrival "properly balanced."`,
    (_candidate, cargo, destination) => `At ${destination}, Kisaragi inspectors approve the ${cargo} with soft voices and exact instruments. A porcelain-white terminal marks the contract complete.`,
    (_candidate, cargo, destination) => `The ${cargo} vanishes into ${destination}'s polished yard chain. Someone offers tea while the BBS releases payment with elegant finality.`,
  ],
  'kisaragi-yards-estella': [
    (_candidate, cargo, destination, issuer) => `${issuer}'s local yard office at ${destination} receives the ${cargo} with tidy efficiency. The clerk thanks you for keeping the Harmony schedule smooth.`,
    (_candidate, cargo, destination) => `The ${cargo} is moved into ${destination}'s Kisaragi-marked stores under soft lights and strict labels. Local staff are less theatrical than the parent house, but just as exacting.`,
    (_candidate, cargo, destination) => `At ${destination}, KIS-E handlers inspect the ${cargo}, reseal the manifest, and send a brief note of appreciation. Nothing is hurried; nothing is late.`,
    (_candidate, cargo, destination, issuer) => `${issuer} clears the ${cargo} into ${destination}'s yard inventory. The receipt is modest, polished, and formatted like a formal invitation.`,
    (_candidate, cargo, destination) => `The ${cargo} joins a neat line of Kisaragi work at ${destination}. A local expeditor thanks you for protecting the cadence.`,
  ],
  'teamsters-guild': [
    (_candidate, cargo, destination, issuer) => `${issuer} closes the ${cargo} manifest at ${destination} with an old stamp and a newer encryption key. The dispatcher says the road remembers reliable hands.`,
    (_candidate, cargo, destination) => `At ${destination}, Guild freight clerks take the ${cargo} into custody and argue over the ledger in three dialects. Your account balance settles before they finish.`,
    (_candidate, cargo, destination, issuer) => `${issuer} marks the ${cargo} delivered at ${destination}. A senior Teamster mutters that you made acceptable time, which is almost a compliment.`,
    (_candidate, cargo, destination) => `The ${cargo} clears Guild inspection at ${destination}. The BBS posts a plain thank-you and a reminder that the next job is already waiting.`,
    (_candidate, cargo, destination) => `At ${destination}, the Guild crew handles the ${cargo} like monopoly property: carefully, possessively, and with no apologies. The contract closes clean.`,
  ],
  'steel-combine': [
    (_candidate, cargo, destination) => `At ${destination}, the ${cargo} is received by a planning clerk with a red pencil and a tired smile. The Combine thanks you for fulfilling the schedule.`,
    (_candidate, cargo, destination) => `The ${cargo} enters ${destination}'s queue under stamped forms and loudspeakers. Someone marks another quota box green.`,
    (_candidate, cargo, destination) => `Steel Combine workers at ${destination} unload the ${cargo} with practiced, collective rhythm. The receipt says only: delivered for the plan.`,
    (_candidate, cargo, destination) => `At ${destination}, a foreman signs for the ${cargo} and waves you clear before the next shift horn. The thank-you is brief, sincere, and overworked.`,
    (_candidate, cargo, destination) => `The ${cargo} is folded into ${destination}'s production chain almost immediately. The Combine terminal credits you for useful work, not heroics.`,
  ],
  'glitterfield-miners': [
    (_candidate, cargo, destination, issuer) => `${issuer}'s crew at ${destination} crowds the hatch before the clamps finish settling. They joke about the ${cargo} like it is payday wearing a pressure suit.`,
    (_candidate, cargo, destination, issuer) => `The ${cargo} reaches ${destination} and ${issuer} hands start moving it with Belt-born impatience. A shift lead thanks you over open comms, half gratitude and half static.`,
    (_candidate, cargo, destination) => `At ${destination}, dusty miners pull the ${cargo} into the depot lane and immediately start arguing about shares. The mood says the job mattered.`,
    (_candidate, cargo, destination, issuer) => `${issuer} signs off the ${cargo} at ${destination} with a thumbprint, a laugh, and a warning not to trust Cupola's scales. Payment follows anyway.`,
    (_candidate, cargo, destination) => `The ${cargo} comes off at ${destination} into bright work lights and dirty gloves. Someone slaps the hull twice in thanks before the bay door closes.`,
  ],
  'halloran-smelting-house': [
    (_candidate, cargo, destination, issuer) => `${issuer} receives the ${cargo} at ${destination} under refinery glare and hot-metal stink. A House clerk thanks you and reminds everyone that the House takes its cut.`,
    (_candidate, cargo, destination) => `At ${destination}, Halloran crews move the ${cargo} toward the smelter side without breaking stride. The acknowledgement is brisk; furnaces do not wait.`,
    (_candidate, cargo, destination) => `The ${cargo} is logged at ${destination} beside heat-stained bulkheads and assay screens. Halloran thanks you for feeding the chokepoint.`,
    (_candidate, cargo, destination, issuer) => `${issuer}'s receiver signs for the ${cargo} at ${destination} with one eye on the cupola schedule. Payment clears before the next furnace cycle.`,
    (_candidate, cargo, destination) => `The ${cargo} disappears into ${destination}'s refinery traffic. A smelter boss gives you a short nod, the local equivalent of applause.`,
  ],
  'hartwell-labor-exchange': [
    (_candidate, cargo, destination, issuer) => `${issuer}'s ${cargo} files out at ${destination} talking excitedly about the shift. From the sound of it, this one pays unusually well.`,
    (_candidate, cargo, destination) => `The ${cargo} steps into ${destination} with bags, helmets, and practiced frontier optimism. A coordinator thanks you for keeping Hartwell's promises moving.`,
    (_candidate, cargo, destination) => `At ${destination}, passengers stretch their legs and start looking for the next desk, bus, or bunk assignment. The Labor Exchange closes your manifest with a weary thank-you.`,
    (_candidate, cargo, destination) => `The ${cargo} clears the passenger unit at ${destination} in a stream of tool bags and personal lockers. Somebody says the road from Hartwell never really ends.`,
    (_candidate, cargo, destination, issuer) => `${issuer} staff count the ${cargo} through the hatch at ${destination}. The thanks are practical: every seat filled is a job site that stays staffed.`,
  ],
};

export function completionBlurbForCandidate(candidate: FactionContractCandidate): string {
  const cargo = candidate.cargo.label;
  const destination = destinationName(candidate.destinationId);
  const issuer = candidate.issuerName ?? candidate.factionName;
  const pool = BLURBS_BY_FACTION[candidate.factionId] ?? GENERIC_BLURBS;
  return pick(pool, candidate)(candidate, cargo, destination, issuer);
}
