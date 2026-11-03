// Read-only audit of actual public postings; no career/save or gameplay changes.
// node tests/run-equipment.mjs tests/audit-cerberus-earnings.ts
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { contractGrossPay } from '../src/mission-cost';

const elevated = new Set(['local-rare-metal-export-staging', 'local-carbonvale-export-staging', 'local-paradiso-hospitality',
  'rare-metals-to-gaia-tech', 'rare-metals-to-foundry', 'paradiso-hospitality-cargo']);
const custody = new Set(['custody-transfer-to-olympos', 'local-custody-processing', 'surface-labor-allocation', 'local-surface-labor-processing']);
const records = new Set(['local-shareholder-packets', 'local-legal-archives', 'local-audit-records', 'audit-records-to-acheron']);
const premium = new Set(['shareholder-packets-to-finance', 'legal-archives-to-capital']);
function group(c: CareerContract): string {
  const id = c.templateId!;
  if (elevated.has(id)) return 'L1 elevated routine freight';
  if (custody.has(id)) return 'L1 important custody/labor passengers';
  if (records.has(id)) return 'L1 important corporate records';
  if (premium.has(id)) return 'L2 premium corporate freight';
  if (id === 'local-workforce-manifests') return 'L1 workforce manifests';
  if (id === 'executive-delegation') return 'L2 executive passengers';
  if (id === 'workforce-transfer-to-hub') return 'L0 generic workforce intake';
  return 'L0 basic routine freight';
}
function previousProposal(c: CareerContract): number {
  const pay = { ...c.quote.pay };
  if (custody.has(c.templateId!)) { pay.generosity = 0.75; pay.compensationRatio = 0.60; }
  if (premium.has(c.templateId!)) { pay.generosity = 1.50; pay.compensationRatio = 0.25; }
  if (c.templateId === 'executive-delegation') { pay.generosity = 1; pay.compensationRatio = 0.60; }
  return contractGrossPay(pay, c.quote.parFuelCost, c.quote.parFuelCost) - c.quote.parFuelCost;
}
function stats(values: number[]) {
  const a = [...values].sort((x, y) => x - y);
  const quantile = (p: number) => {
    const i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return Math.round(a[lo] + (a[hi] - a[lo]) * (i - lo));
  };
  return { min: a[0], p25: quantile(.25), median: quantile(.5), p75: quantile(.75), max: a[a.length - 1] };
}
const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
const rows: { day: number; boardSource: string; group: string; contract: CareerContract; current: number; previous: number }[] = [];
for (let day = 0; day < 16; day++) for (const source of sources) {
  for (const contract of [...generateCareerContracts(source, day * 86400), ...generatePassengerContracts(source, day * 86400)]) {
    if (contract.factionId !== 'cerberus-human-resources') continue;
    rows.push({ day, boardSource: source, group: group(contract), contract, current: contract.quote.expectedMargin, previous: previousProposal(contract) });
  }
}
function example(row: typeof rows[number]) {
  return { template: row.contract.templateId, from: row.contract.sourceName, to: row.contract.destinationName,
    day: row.day, cargo: row.contract.cargo.label, tonnes: row.contract.cargo.massTons,
    netAtPar: row.current, previousProposalNetAtPar: row.previous, parFuel: row.contract.quote.parFuelCost,
    routeClass: row.contract.routeClass };
}
const groups = [...new Set(rows.map(r => r.group))].sort().map(name => {
  const selected = rows.filter(r => r.group === name).sort((a, b) => a.current - b.current);
  return { group: name, postings: selected.length, currentCredits: stats(selected.map(r => r.current)),
    previousUnapprovedProposalCredits: stats(selected.map(r => r.previous)),
    examples: [example(selected[0]), example(selected[Math.floor(selected.length / 2)]), example(selected[selected.length - 1])] };
});
const templates = [...new Set(rows.map(r => r.contract.templateId!))].sort().map(id => {
  const selected = rows.filter(r => r.contract.templateId === id).sort((a, b) => a.current - b.current);
  return { id, postings: selected.length, currentCredits: stats(selected.map(r => r.current)),
    examples: [example(selected[0]), example(selected[selected.length - 1])] };
});
console.log(JSON.stringify({ sourceCount: sources.length, days: '0–15', postings: rows.length,
  observedTemplates: templates.length, method: 'Actual generated freight/passenger boards, current preferred transfers and quotes. Equal weight per posting occurrence, not per unique route or per player hour. Proposed level/class labels are not live gates. Net after fuel at par, before penalties and maintenance. Previous coefficient proposal is comparison only, not approved balance.', groups, templates }, null, 2));
