// Runtime acceptance audit against the approved Markdown, not generated fixtures.
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const markdown = (await readFile(join(root, 'design-docs/maintenance-stage-3-copy-review.md'), 'utf8')).replace(/\r\n/g, '\n');
const roster = JSON.parse(await readFile(join(root, 'design-docs/maintenance-stage-1-roster.json'), 'utf8'));
const baseline = JSON.parse(await readFile(join(root, 'tests/fixtures/maintenance-stage-1-shops.json'), 'utf8'));
const originalIds = new Set([...baseline.shops.map(s => s.id), 'maintenance-estella-viii-mining-site', 'maintenance-estella-viii-settlement', 'maintenance-estella-viii-friendly-station']);
let checks = 0;
function assert(value, message) { checks++; if (!value) throw Error(message); }
function equal(actual, expected, message) { assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`); }
function table(section) {
  const start = markdown.indexOf(`## ${section}. `);
  assert(start >= 0, `section ${section} exists`);
  const end = markdown.indexOf('\n## ', start + 1);
  return markdown.slice(start, end < 0 ? undefined : end).split('\n')
    .filter(line => line.startsWith('| ') && line.includes('`'))
    .map(line => line.trim().slice(1, -1).split('|').map(cell => cell.trim()));
}
function code(cell) { return cell.match(/`([^`]+)`/)?.[1]; }
for (const section of [5, 6, 7]) assert(table(section).length === 159, `section ${section}: exactly one row per site`);
const assignments = new Map(table(5).map(row => [code(row[0]), row]));
const referrals = new Map(table(6).map(row => [code(row[0]), row]));
const accounts = new Map(table(7).map(row => [code(row[0]), row]));
const families = new Map([...markdown.matchAll(/^### ([FL]\d+) — ([^\n]+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(match => [match[1], {
  name: match[2], fields: Object.fromEntries([...match[3].matchAll(/^\*\*([^*]+):\*\* (.+)$/gm)].map(m => [m[1], m[2]])),
}]));
assert(families.size === 64, 'all 49 shared and 15 retained sets present');
assert([...markdown.matchAll(/^### [FL]\d+ — /gm)].length === 64, 'no duplicate copy-set definitions');
for (const [id, family] of families) {
  for (const field of ['Directory summary', 'Profile', 'Facilities', 'Diagnosis', 'Service', 'Repairs']) {
    assert(family.fields[field], `${id}: complete ${field}`);
    assert(!/\b(?:TODO|TBD)\b|\bplaceholder text\b|\bTier\s*-?\d/i.test(family.fields[field]), `${id}: no unfinished text or internal classes`);
    const vars = [...family.fields[field].matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
    assert(vars.every(v => v === 'place'), `${id}: every substitution has a full location map`);
  }
  assert(!/routine (?:maintenance|servicing) (?:is|remains) separate|Ordinary repairs, servicing and equipment purchases remain separate/i.test(JSON.stringify(family.fields)), `${id}: removed disclaimer not restored`);
}
for (const [label, rows] of [['assignments', assignments], ['referrals', referrals], ['accounts', accounts]]) {
  assert(rows.size === 159, `all physical sites in ${label}`);
  equal([...rows.keys()].sort(), roster.map(row => row.physicalId).sort(), `${label}: exact scope membership`);
}
const temp = await mkdtemp(join(tmpdir(), 'maintenance-copy-audit-'));
try {
  const outfile = join(temp, 'source.mjs');
  await build({
    stdin: { contents: `
      export { MAINTENANCE_SHOPS } from './src/maintenance/shops';
      export { maintenanceReferrals, maintenanceReferralText } from './src/maintenance/referrals';
      export { LOCAL_DIRECTORY_ENTRIES } from './src/local-directory';
      export { ESTELLA_NODES_BY_ID } from './src/content/estella';
      export { emptyTravelAccess } from './src/content/estella/empty-travel-access';
      export { canonicalEstellaLocationId } from './src/content/estella/location-aliases';
      export { estellaDisplayPath } from './src/content/estella/navigation';
      export { physicalTerminalId, localTerminalScopeIds } from './src/physical-terminals';
    `, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(b) {
      b.onResolve({ filter: /\.svg\?raw$/ }, a => ({ path: resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      b.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async a => ({ contents: await readFile(a.path, 'utf8'), loader: 'text' }));
    } }],
  });
  const source = await import(pathToFileURL(outfile).href);
  const { MAINTENANCE_SHOPS: shops, LOCAL_DIRECTORY_ENTRIES: directories, ESTELLA_NODES_BY_ID: nodes, physicalTerminalId, localTerminalScopeIds, emptyTravelAccess, canonicalEstellaLocationId, estellaDisplayPath } = source;
  const plans = new Map(roster.map(row => [row.physicalId, row]));
  const counts = {}, usedFamilies = new Set(), receiving = new Set(), shopIds = new Set(), directoryIds = new Set();
  let retained = 0, retainedAccounts = 0, publicReferrals = 0, promotedWells = 0, newStaffed = 0;
  for (const row of roster) {
    const id = row.physicalId, assignment = assignments.get(id), account = accounts.get(id);
    const [physical, name, directoryName, organization, familyId, terms] = assignment;
    const family = families.get(familyId);
    assert(family, `${id}: defined copy set`);
    for (const text of [name, directoryName, organization]) assert(text && !/\{|\}|\b(?:TODO|TBD)\b|\btier\s*-?\d/i.test(text), `${id}: complete literal displayed name`);
    usedFamilies.add(familyId);
    equal(physical.split('<br>')[0], nodes.get(id).name, `${id}: exact place substitution`);
    const tier = Number(terms.split(' / ')[0]);
    counts[tier] = (counts[tier] ?? 0) + 1;
    equal([...account[1].matchAll(/`([^`]+)`/g)].map(m => m[1]), row.receivingIds, `${id}: exact receiving IDs`);
    equal(code(account[2]), row.shopId, `${id}: approved shop account`);
    equal(code(account[3]), row.directoryId, `${id}: approved directory ID`);
    assert(!shopIds.has(row.shopId) && !directoryIds.has(row.directoryId), `${id}: unique account/directory`);
    shopIds.add(row.shopId); directoryIds.add(row.directoryId);
    for (const poi of row.receivingIds) { assert(!receiving.has(poi), `${poi}: unique membership`); receiving.add(poi); }
    const live = shops.find(s => physicalTerminalId(s.locationIds[0]) === id);
    assert(live, `${id}: runtime covered`);
    equal(live.id, row.shopId, `${id}: correct live account`);
    equal(live.facilityTier, tier, `${id}: actual stage capability`);
    const liveDirectory = directories.find(d => d.maintenanceShopId === live.id);
    assert(liveDirectory, `${id}: live directory present`);
    equal([live.name, live.organizationName ?? '—', liveDirectory.name, liveDirectory.id], [name, organization, directoryName, row.directoryId], `${id}: exact approved names and directory`);
    const resolveCopy = text => text === '—' ? '' : text.split('{place}').join(nodes.get(id).name);
    for (const [label, key] of Object.entries({ Profile: 'profileBlurb', Facilities: 'levelBlurb', Diagnosis: 'diagnosisBlurb', Service: 'serviceBlurb', Repairs: 'repairsBlurb' })) equal(live.copy[key], resolveCopy(family.fields[label]), `${id}: actual ${label} matches approved copy`);
    equal(liveDirectory.summary, resolveCopy(family.fields['Directory summary']), `${id}: actual directory summary`);
    equal(liveDirectory.description, resolveCopy(family.fields['Directory description'] ?? family.fields.Profile), `${id}: actual directory description`);
    if (originalIds.has(live.id)) retainedAccounts++;
    else if (tier >= 0) newStaffed++;
    const authored = familyId.startsWith('L');
    if (authored) {
      const directory = directories.find(d => d.maintenanceShopId === live.id);
      retained++;
      assert(familyId.startsWith('L'), `${id}: authored set retained`);
      equal([name, organization, directoryName], [live.name, live.organizationName ?? '—', directory.name], `${id}: exact retained names`);
      equal(terms, `${live.facilityTier} / unchanged`, `${id}: no premature authored upgrade`);
      for (const [label, key] of Object.entries({ Profile: 'profileBlurb', Facilities: 'levelBlurb', Diagnosis: 'diagnosisBlurb', Service: 'serviceBlurb', Repairs: 'repairsBlurb' })) {
        equal(family.fields[label], live.copy[key], `${id}: exact retained ${label}`);
      }
      equal(family.fields['Directory summary'], directory.summary, `${id}: retained summary`);
      equal(family.fields['Directory description'], directory.description, `${id}: retained directory description`);
    } else {
      equal(tier, Math.min(row.tier, 1), `${id}: everyday rollout only`);
      equal(terms.split(' / ')[1], row.tier < 0 ? 'E0' : row.tier > 0 ? 'S1' : row.terms, `${id}: approved everyday terms`);
      if (live.id.startsWith('wells-frontier-outfitter-') && tier === 1) promotedWells++;
      assert(!familyId.startsWith('L'), `${id}: mapped shared set`);
      const expectedTerms = tier < 0 ? ['F', 'F', 'F', 'F', 0, 0, 1, 1, 1] : tier > 0 ? ['C', 'D', 'D', 'D', 500, 2, 1, 1, 1] : ['E', 'F', 'F', 'F', 250, 2, row.terms === 'W0' ? 1.5 : 1.15, 1, row.terms === 'W0' ? 0.8 : 0.95];
      equal([live.diagnosticGrade, live.workQualityGrade, live.componentGradeBest, live.componentGradeWorst, live.laborRate, live.diagnosisHours, live.partsMarkup, live.laborHoursMultiplier, live.honesty], expectedTerms, `${id}: actual approved commercial terms`);
      equal(live.equipmentIds ?? [], tier > 0 ? ['atmospheric-package', 'heavy-heat-shielding', 'cargo-shock-absorbers', 'passenger-comfort-package'] : [], `${id}: actual equipment offering`);
      if (family.name === 'Wells mechanic') {
        for (const [label, key] of Object.entries({ Profile: 'profileBlurb', Facilities: 'levelBlurb', Diagnosis: 'diagnosisBlurb', Service: 'serviceBlurb', Repairs: 'repairsBlurb' })) equal(family.fields[label], live.copy[key], `${id}: Wells text reused exactly`);
      }
      if (tier < 0) {
        equal(name, live.name, `${id}: emergency-only name`);
        equal(family.fields.Profile, live.copy.profileBlurb, `${id}: accepted emergency copy`);
        for (const field of ['Diagnosis', 'Service', 'Repairs']) equal(family.fields[field], '—', `${id}: no invented paid service`);
      } else for (const field of ['Diagnosis', 'Service', 'Repairs']) assert(family.fields[field] !== '—', `${id}: staffed copy complete`);
    }
    const targetIds = [];
    if (tier < 3) {
      const primary = row.referralPhysicalId ?? (row.tier === 3 ? id : undefined);
      if (primary) targetIds.push(primary);
      if (primary && plans.get(primary).tier !== 3 && row.elitePhysicalId !== primary) targetIds.push(row.elitePhysicalId);
    }
    const expected = targetIds.map((target, index) => {
      const dst = plans.get(target), targetName = assignments.get(target)[1];
      const entrance = localTerminalScopeIds(target).find(poi => canonicalEstellaLocationId(poi) === poi && emptyTravelAccess(poi) === 'public');
      assert(entrance && dst.tier > tier, `${id}: public, higher planned service at ${target}`);
      const variant = target === id ? 'R3' : index ? 'R2' : 'R1';
      const sentence = variant === 'R3' ? `For more advanced work, ask for the specialist service at ${targetName}.` : variant === 'R2' ? `Or, of course, you can go to ${targetName}. They handle the most demanding work.` : `For more advanced work, go to ${targetName}.`;
      publicReferrals++;
      return { entrance, variant, output: `${sentence}<br>${estellaDisplayPath(target)}` };
    });
    equal(referrals.get(id).slice(1), [expected[0]?.output ?? '—', expected[1]?.output ?? '—', expected.map(r => r.variant).join(', ') || '—', expected.map(r => '`' + r.entrance + '`').join('; ') || '—'], `${id}: complete expanded referrals and exact public entrances`);
    equal(source.maintenanceReferrals(live).map(r => ({ entrance: r.entranceId, output: `${source.maintenanceReferralText(r)}<br>${r.path}` })), expected.map(({ entrance, output }) => ({ entrance, output })), `${id}: actual referral output matches every approved line`);
  }
  equal(counts, { '-1': 9, '0': 57, '1': 90, '2': 1, '3': 2 }, 'stage snapshot');
  equal([retained, retainedAccounts, newStaffed, promotedWells], [15, 66, 84, 25], 'retained businesses/accounts and approved rollout changes');
  assert(usedFamilies.size === families.size && receiving.size === 177, 'no orphaned copy sets or missing receiving locations');
  // Explicit institutional/local variants prevent wrong population or economy claims.
  for (const [place, expectedFamily] of Object.entries({ 'Raqib': 'Field technical help', 'Gale Survey': 'Field technical help', 'Morana Station': 'Field technical help', 'Comet Fragment 4': 'Field technical help', 'Comet Fragment 6': 'Field technical help', 'Lonely Beacon / Lone-Operator Station': 'Beacon operator', 'Kopanka Mine': 'Commune mechanic', 'Mokosh Lowlands': 'Commune mechanic', 'Dnipro Pools': 'Merren mechanic', 'Teteriv Broiler Farm': 'Merren mechanic', 'Zhitomir Hydroponics': 'Merren mechanic', 'Pandemonium': 'Pandemonium mechanic', 'The Warren': 'Warren professional', 'Icarus Lab': 'Coimbra mechanic', 'Cathedral of Testimony': 'Covenant mechanic', 'Vigil Keep': 'Covenant mechanic' })) {
    const id = roster.find(r => nodes.get(r.physicalId).name === place).physicalId;
    equal(families.get(assignments.get(id)[4]).name, expectedFamily, `${place}: reviewed local variant`);
  }
  console.log(`Stage 3 runtime copy: ${checks} checks; 64 complete sets, 159 physical sites, 177 receiving IDs, ${publicReferrals} exact public referral lines; all approved copy and terms match.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
