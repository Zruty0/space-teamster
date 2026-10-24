import type { CareerContract } from './career-contracts';
import { ESTELLA_NODES_BY_ID } from './content/estella';
import { canonicalEstellaLocationId } from './content/estella/location-aliases';
import { estellaDisplayPath } from './content/estella/navigation';
import { sharedTerminalParentId } from './local-directory';
import { publicContentText } from './content-terminology';

/** A contract travels to the physical station/asteroid, not a separate city for
 * each receiving berth. This is presentation ONLY: never use this ID for flight,
 * quoting, board scope, permissions, settlement, or saved contract endpoints.
 */
export function contractLocationId(locationId: string): string {
  const canonical = canonicalEstellaLocationId(locationId);
  return sharedTerminalParentId(canonical) ?? canonical;
}

export function contractLocationPresentation(locationId: string): { name: string; path: string } {
  const id = contractLocationId(locationId);
  return { name: ESTELLA_NODES_BY_ID.get(id)?.name ?? locationId, path: estellaDisplayPath(id) || locationId };
}

function escapeRegExp(text: string): string { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Normalize only references to this contract's own terminal endpoints. A
 * destination like "the Public Approach Dock at The Still" becomes "The Still",
 * not "the The Still at The Still". Surface sites and unrelated lore stay put.
 */
function terminalReferences(text: string, contract: CareerContract): string {
  for (const id of [contract.sourceId, contract.destinationId]) {
    const node = ESTELLA_NODES_BY_ID.get(id) ?? ESTELLA_NODES_BY_ID.get(canonicalEstellaLocationId(id));
    const physicalId = contractLocationId(id);
    const parent = ESTELLA_NODES_BY_ID.get(physicalId);
    if (!node || !parent) continue;
    // Sahra's approved renames/removal also apply to authored cached text. Use
    // this posting's own saved endpoint label, never a global "Research Base"
    // replacement that could rename unrelated worlds or cargo.
    const savedName = id === contract.sourceId ? contract.sourceName : contract.destinationName;
    if (id.startsWith('estella-ix') && savedName && savedName !== parent.name) {
      text = text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(savedName)}(?![\\p{L}\\p{N}])`, 'gu'), () => parent.name);
    }
    if (node.id === parent.id || node.name === parent.name) continue;
    const parentName = escapeRegExp(parent.name.replace(/^the /i, ''));
    const location = escapeRegExp(node.name.replace(/^the /i, ''));
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:the )?${location}(?: (?:at|aboard|on) (?:the )?${parentName})?(?![\\p{L}\\p{N}])`, 'giu');
    text = text.replace(pattern, () => parent.name);
  }
  return typeof text === 'string' ? publicContentText(text) : text;
}

/** Fresh public/contact contracts store physical display names. Render-time use
 * also handles an already accepted or cached old posting without mutating its
 * IDs, prices, cargo, progress, historical record or original text snapshot.
 */
export function presentCareerContract(contract: CareerContract): CareerContract {
  const source = ESTELLA_NODES_BY_ID.has(canonicalEstellaLocationId(contract.sourceId))
    ? contractLocationPresentation(contract.sourceId) : { name: contract.sourceName, path: contract.sourcePath };
  const destination = ESTELLA_NODES_BY_ID.has(canonicalEstellaLocationId(contract.destinationId))
    ? contractLocationPresentation(contract.destinationId) : { name: contract.destinationName, path: contract.destinationPath };
  // Rebuild ordinary titles from their actual cargo field, so a location-like
  // cargo label is never accidentally renamed along with its destination.
  const prefix = contract.category === 'empty' ? 'Empty run to '
    : `${contract.category === 'passenger' ? 'Transport' : 'Deliver'} ${contract.cargo.label} to `;
  const title = contract.title.startsWith(prefix)
    ? `${prefix}${destination.name}` : terminalReferences(contract.title, contract);
  return {
    ...contract,
    sourceName: source.name, sourcePath: source.path,
    destinationName: destination.name, destinationPath: destination.path,
    title: publicContentText(title),
    issuerName: contract.issuerName === undefined ? undefined : publicContentText(contract.issuerName),
    issuerTag: contract.factionId === 'svarog-yard-company' && contract.issuerTag === 'SYC' ? 'SSC' : contract.issuerTag,
    cargo: typeof contract.cargo.label !== 'string' || publicContentText(contract.cargo.label) === contract.cargo.label ? contract.cargo
      : { ...contract.cargo, label: publicContentText(contract.cargo.label) },
    details: contract.details === undefined ? undefined : terminalReferences(contract.details, contract),
    briefing: contract.briefing === undefined ? undefined : terminalReferences(contract.briefing, contract),
    completionMessage: terminalReferences(contract.completionMessage, contract),
  };
}
