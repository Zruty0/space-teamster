import { canonicalizeContractCandidates, type CareerContract } from '../../src/career-contracts';
import { generateFactionContractCandidates } from '../../src/content/estella/faction-contracts';
import { canonicalEstellaLocationId } from '../../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../../src/local-directory';
import { estimateEstellaMissionCost, makePayTerms } from '../../src/mission-cost';
import { calibrateNewContractQuote } from '../../src/contract-income';

/** Preserve old board snapshots WITHOUT exempting quotes or changing historical fixtures.
 * Recover exact authored pre-calibration terms from the same candidates, independently estimate
 * the old quote, and assert today's quote is precisely the authorized credit calibration.
 * The caller then checks the entire reconstructed board against its original frozen fingerprint.
 */
export function preIncomeBoardQuotes(rows: CareerContract[], sourceId: string, worldTime: number,
  check: (ok: unknown, message: string) => void): CareerContract[] {
  const candidates = canonicalizeContractCandidates(localTerminalScopeIds(canonicalEstellaLocationId(sourceId))
    .flatMap(sourceId => generateFactionContractCandidates({ sourceId, worldTime })));
  return rows.map(contract => {
    const candidate = candidates.find(c => contract.id.startsWith(`${c.factionId}:${c.templateId}:${c.sourceId}->${c.destinationId}:`)
      && c.cargo.label === contract.quote.cargoLabel && c.cargo.massTons === contract.quote.cargoMassTons);
    check(Boolean(candidate), `historical quote has exact original candidate: ${contract.id}`);
    if (!candidate) throw Error(`Missing original quote candidate: ${contract.id}`);
    const quote = estimateEstellaMissionCost(candidate.sourceId, candidate.destinationId, candidate.cargo, contract.selectedTransfer, makePayTerms(candidate));
    check(JSON.stringify(contract.quote) === JSON.stringify(calibrateNewContractQuote(candidate, quote)),
      `only approved new-quote income changes: ${contract.id}`);
    return { ...contract, quote };
  });
}
