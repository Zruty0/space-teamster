// Guards for the review/audit, not a claim that House gameplay is implemented.
import { HOUSE_IDS, proposedHouseClass, proposedHouseRivalLoss, projectHouseReviewEvent, sampleHouseBoards, fitProposedHouseCurves, auditHouseProposal } from './audit-house-reputation';
import { HOUSE_ALVARES_PROVIDER } from '../src/content/estella/faction-contracts/alvares-contracts';
import { HOUSE_MENDES_PROVIDER } from '../src/content/estella/faction-contracts/mendes-contracts';
import { HOUSE_NUNES_PROVIDER } from '../src/content/estella/faction-contracts/nunes-contracts';
import { NUNES_INQUIRY_CATALOG } from '../src/content/estella/faction-contracts/nunes-inquiries';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../src/local-directory';
import { defaultCareerProfile } from '../src/career-state';
import { canTravelEmpty } from '../src/empty-runs';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { normalizeReputations } from '../src/reputation';

let checks = 0, candidates = 0;
function assert(value: unknown, text: string): asserts value { checks++; if (!value) throw Error(text); }
const sources = [...new Set(estellaSelectableNavTargets().flatMap(t => localTerminalScopeIds(canonicalEstellaLocationId(t.id))))];
const families = new Set<string>();
for (const day of [0, 1, 15, 30, 120, 135, 180, 195, 360]) {
  for (const sourceId of sources) for (const provider of [HOUSE_ALVARES_PROVIDER, HOUSE_MENDES_PROVIDER, HOUSE_NUNES_PROVIDER]) {
    for (const c of provider.generateContracts({ sourceId, worldTime: day * 86400 })) {
      candidates++;
      const before = JSON.stringify(c), p = proposedHouseClass(c);
      assert(p, `review covers ${c.templateId}`);
      assert(JSON.stringify(c) === before, 'classification leaves candidate identity/terms/copy unchanged');
      assert(p.house === c.factionId, 'no donor credit from location or issuer');
      assert(p.pool === 'commercial' ? p.trust === 0 && p.gain[0] === 0 : p.trust === 1 && p.gain[0] > 0, 'separate income and advancement pools');
      assert(!proposedHouseClass({ ...c, factionId: 'oathmark-accord' }), 'neutral Accord does not become House work');
      families.add(`${p.house}/${p.family}`);
    }
  }
}
for (const family of ['due', 'assigned', 'grant', 'escheat', 'occasion-delegation', 'occasion-delegation-return',
  'occasion-freight', 'occasion-retinue', 'occasion-retinue-return', 'occasion-equipment-return']) {
  assert(families.has(`house-alvares/${family}`), `real Alvares season covers ${family}`);
}
for (const family of ['outer-watch', 'outer-watch-return', 'outer-watch-passengers', 'recovery', 'recovery-return',
  'recovery-passengers', 'quiet-custody', 'quiet-custody-passengers', 'inquiry']) {
  assert(families.has(`house-nunes/${family}`), `real Nunes candidate covers ${family}`);
}
// Cover every Inquiry, not only the initial three; preserve its old fee and contribution.
for (const entry of NUNES_INQUIRY_CATALOG) {
  const active = { instanceId: `${entry.id}:4`, catalogId: entry.id, ordinal: 4, progress: 50 };
  const candidates = sources.flatMap(sourceId => HOUSE_NUNES_PROVIDER.generateContracts({ sourceId, worldTime: 0, nunesInquiries: { active: [active] } }))
    .filter(c => c.nunesInquiry?.instanceId === active.instanceId);
  assert(candidates.length > 0, `${entry.id}: still has retained work after Thule exclusions`);
  for (const c of candidates) {
    assert(proposedHouseClass(c)?.pool === 'inquiry', 'Inquiry distinct from newly low-paying important work');
    assert(c.flatReward === 20000 && c.generosity === .25 && c.compensationRatio === .75 && c.nunesInquiry!.contribution === 8, 'Inquiry terms/progress unchanged');
  }
}
// Find a real outer deployment; early reference days contain only local musters.
let firstOuterDay: number | undefined;
for (let day = 0; day < 6000 && firstOuterDay === undefined; day++) {
  const candidates = HOUSE_MENDES_PROVIDER.generateContracts({ sourceId: 'estella-xie-component-fabrication', worldTime: day * 86400 });
  for (const c of candidates) if (c.templateId.startsWith('hydra-estella-')) {
    const p = proposedHouseClass(c);
    assert(p?.gain[0] === 4 && p.gain[1] === 40, 'actual outer deployment has proposed 4/40 award');
    firstOuterDay = day;
  }
}
assert(firstOuterDay !== undefined, 'outer deployment actually exists in sampled calendar');
for (const [templateId, count, numerator] of [
  ['hydra-local:0:cadiz-highport:outbound-freight:a->b:sealed-weapons-lots', 14, 3],
  ['hydra-estella-x:0:calatrava-shield:outbound-passenger:a->b:senior-household-captains', 10, 4],
  ['hydra-local:0:cadiz-highport:return-freight:a->b:proof-failure-specimens', 20, 2],
  ['hydra-estella-xii:0:vigil-gate:return-passenger:a->b:exercise-adjudicators', 20, 2],
] as const) {
  const p = proposedHouseClass({ factionId: 'house-mendes', templateId })!;
  assert(p.gain[0] === numerator && p.gain[1] === 40 && Math.ceil(p.gain[1] / p.gain[0]) === count, '3:4:2 weights scaled to 10–20 completions');
  assert((count - 1) * numerator < 40 && count * numerator >= 40, 'earliest full-bar completion count');
}
for (const factionId of HOUSE_IDS) assert(!proposedHouseClass({ factionId, templateId: 'unreviewed-work' }), 'unknown future class fails audit instead of silently inventing policy');

const rows = sampleHouseBoards(0, 1), before = JSON.stringify(rows);
const curves = fitProposedHouseCurves(rows);
const audit = auditHouseProposal(rows, curves);
assert(JSON.stringify(rows) === before, 'proposal fitting/reporting never mutates actual quotes');
assert(audit.every(h => h.commercial > 0 && h.important.count > 0), 'each actual board sample has both pools');
const career = defaultCareerProfile();
career.reputations = { ...normalizeReputations(undefined), 'house-alvares': 1.5, 'house-mendes': 1.5, 'house-nunes': 1.5 };
career.reputationUnrelatedContracts = { 'house-alvares': 5, 'house-mendes': 5, 'house-nunes': 5 };
for (const row of rows) {
  assert(!!contractReputationLockReasons(career, row.contract).length === (row.contract.quote.expectedMargin > ({ 'house-alvares': 80000, 'house-mendes': 70000, 'house-nunes': 57500 }[row.contract.factionId as typeof HOUSE_IDS[number]])), 'House locks use actual quoted band above authored trust');
  const next = previewContractReputation(career, row.contract);
  const expected = projectHouseReviewEvent({ 'house-alvares': 1.5, 'house-mendes': 1.5, 'house-nunes': 1.5 },
    { 'house-alvares': 5, 'house-mendes': 5, 'house-nunes': 5 }, row.contract);
  for (const id of HOUSE_IDS) {
    assert(next.reputations[id] === expected.scores[id], 'live House simultaneous gains/rivalry match review');
    assert(next.reputationUnrelatedContracts[id] === expected.unrelated[id], 'live own-only refresh and unrelated counters match review');
  }
}
for (const id of ['estella-xa-deep-ice-mine', 'estella-xb-smelting-processing', 'estella-xd-geothermal-extraction',
  'estella-xie-outer-spec-drydock', 'estella-xie-component-fabrication', 'estella-xii-comm-relay-poi']) {
  assert(canTravelEmpty(career, id), `entry source/relocation remains public: ${id}`);
}
assert(!canTravelEmpty(career, 'estella-xiid-blackglass-observatory'), 'Blackglass is not silently made an empty-arrival destination');
// November 4 comments: explicit cross-House introduction, own-only refresh and favor losses.
const zero = () => ({ 'house-alvares': 0, 'house-mendes': 0, 'house-nunes': 0 });
const allAt = (value: number) => Object.fromEntries(HOUSE_IDS.map(id => [id, value])) as ReturnType<typeof zero>;
const routine = { factionId: 'house-alvares', templateId: 'due:source:ice:0' };
const escheat = { factionId: 'house-alvares', templateId: 'escheat:source->dest:tools:0' };
const muster = { factionId: 'house-mendes', templateId: 'hydra-local:0:cadiz:outbound-freight:a->b:tools' };
const inquiry = { factionId: 'house-nunes', templateId: 'inquiry:living-ice:1:collection:a->b:0', nunesInquiry: { instanceId: 'living-ice:1', contribution: 8 } };
let projected = { scores: zero(), unrelated: allAt(5) };
for (let i = 1; i <= 8; i++) {
  projected = projectHouseReviewEvent(projected.scores, projected.unrelated, routine);
  assert(projected.scores['house-alvares'] === Math.min(1, i / 4), 'four own introductions, no routine spill');
  for (const id of ['house-mendes', 'house-nunes'] as const) {
    assert(projected.scores[id] === Math.min(1, i / 8), 'eight cross-House introductions, capped at one');
    assert(projected.unrelated[id] === 5 + i, 'cross credit never resets another House grace');
  }
  assert(projected.unrelated['house-alvares'] === 0, 'only contracting House refreshes grace');
}
for (const value of [0, .75, .9, 1, 1.025, 1.5, 2, 2.5, 3]) {
  const next = projectHouseReviewEvent(allAt(value), allAt(7), escheat);
  const expected = value < 1 ? Math.min(1, value + 1 / 8) : Math.max(1, value - 1 / 20);
  assert(Math.abs(next.scores['house-mendes'] - expected) < 1e-14, 'recognition below one; rival loss above; no double passive loss');
  assert(next.unrelated['house-mendes'] === 8, 'rival event consumes one unrelated slot');
  assert(next.unrelated['house-alvares'] === 0, 'favor still refreshes its employer');
}
const mixed = projectHouseReviewEvent({ 'house-alvares': 1, 'house-mendes': .75, 'house-nunes': 2 }, allAt(7), escheat);
assert(mixed.scores['house-alvares'] === 128 / 120 && mixed.scores['house-mendes'] === .875 && mixed.scores['house-nunes'] === 1.95, 'gain/introduction/disapproval on different Houses coexist');
for (const value of [.75, 1, 1.5, 2, 2.5, 3]) {
  let p = { scores: allAt(value), unrelated: zero() };
  for (let i = 0; i < 7; i++) p = projectHouseReviewEvent(p.scores, p.unrelated, { factionId: 'other-employer' });
  assert(p.scores['house-nunes'] === value, 'seven unrelated completions free');
  p = projectHouseReviewEvent(p.scores, p.unrelated, { factionId: 'other-employer' });
  assert(p.scores['house-nunes'] === (value < 1 ? value : Math.max(Math.floor(value), value - 1 / 40)), 'eighth starts gentle decay, integer floor');
}
for (const c of [escheat, muster, inquiry]) assert(proposedHouseRivalLoss(c) === 1 / 20, 'selected favor families displease both other Houses');
for (const c of [routine, { factionId: 'house-alvares', templateId: 'grant:place:stores:0' },
  { factionId: 'house-mendes', templateId: 'forge-intake:port:stock' },
  { factionId: 'house-nunes', templateId: 'quiet-custody:port->clinic:0' },
  { factionId: 'house-nunes', templateId: 'recovery:clinic->field:0' },
  { ...inquiry, factionId: 'oathmark-accord' }]) assert(proposedHouseRivalLoss(c) === 0, 'no blanket or inherited-employer rivalry');
for (const c of [{ ...escheat, category: 'empty' }, { ...escheat, travelMode: 'old-nell' }]) {
  const p = projectHouseReviewEvent(allAt(1.5), allAt(7), c);
  assert(JSON.stringify(p) === JSON.stringify({ scores: allAt(1.5), unrelated: allAt(7) }), 'personal travel neither awards nor consumes grace');
}
for (const c of [escheat, muster, inquiry]) {
  const p = projectHouseReviewEvent(allAt(.99), zero(), c);
  assert(p.scores[c.factionId as keyof typeof p.scores] === 1, 'last introductory job cannot also grant advanced progress');
}
const immutableScores = Object.freeze(allAt(1.5)), immutableCounters = Object.freeze(allAt(7));
projectHouseReviewEvent(immutableScores, immutableCounters, escheat);
assert(immutableScores['house-nunes'] === 1.5 && immutableCounters['house-nunes'] === 7, 'projection never mutates input scores/counters');
console.log(`House review: ${checks} checks, ${candidates} real candidates, all 12 Inquiries, first sampled outer muster day ${firstOuterDay}; independent House review oracle retained for rollout comparisons.`);
