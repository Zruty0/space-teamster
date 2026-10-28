// Runtime acceptance audit against the approved Markdown, not generated fixtures.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const markdown = (await readFile(join(root, 'design-docs/maintenance-stage-3-copy-review.md'), 'utf8')).replace(/\r\n/g, '\n');
const fullMarkdown = (await readFile(join(root, 'design-docs/maintenance-stage-4.md'), 'utf8')).replace(/\r\n/g, '\n');
const fullReview = new Map([...fullMarkdown.matchAll(/^### ([a-z0-9-]+) — ([^\n]+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(m => [m[1], {
  name: m[2], fields: Object.fromEntries([...m[3].matchAll(/^\*\*([^*]+):\*\* (.+)$/gm)].map(f => [f[1], f[2]])),
}]));
const eliteMarkdown = (await readFile(join(root, 'design-docs/maintenance-stage-5.md'), 'utf8')).replace(/\r\n/g, '\n');
const eliteReview = new Map([...eliteMarkdown.matchAll(/^### ([a-z0-9-]+) — ([^\n]+)\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)].map(m => [m[1], {
  name: m[2], fields: Object.fromEntries([...m[3].matchAll(/^\*\*([^*]+):\*\* (.+)$/gm)].map(f => [f[1], f[2]])),
}]));
const namingMarkdown = (await readFile(join(root, 'design-docs/maintenance-naming-review.md'), 'utf8')).replace(/\r\n/g, '\n');
const namingRows = namingMarkdown.split('## 6. Full 159-scope name disposition')[1].split('\n## ')[0].split('\n').filter(l => l.startsWith('|') && l.includes('`')).map(l => l.split('|').slice(1, -1).map(s => s.trim()));
const preNaming = JSON.parse(await readFile(join(root, 'tests/fixtures/maintenance-pre-naming.json'), 'utf8'));
const preElite = JSON.parse(await readFile(join(root, 'tests/fixtures/maintenance-stage-4-fingerprints.json'), 'utf8'));
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
equal([...fullReview.keys()].sort(), roster.filter(r => r.tier === 2 && r.physicalId !== 'estella-viii-friendly-station').map(r => r.physicalId).sort(), 'exact 25 authorized Stage 4 overrides');
for (const [id, entry] of fullReview) {
  for (const field of ['Account', 'Staff', 'Directory summary', 'Profile', 'Facilities', 'Diagnosis', 'Service', 'Repairs', 'Referral']) assert(entry.fields[field], `${id}: complete bespoke ${field}`);
  assert(entry.fields.Referral.includes('{name}') && !/\[person\]/.test(entry.fields.Referral), `${id}: public destination substitution and plain referral rendering`);
}
equal([...eliteReview.keys()].sort(), ['estella-iii-high-tech-city', 'estella-via-drydock'], 'only two authorized elite overrides');
for (const [id, entry] of eliteReview) {
  for (const field of ['Account', 'Receiving IDs', 'Staff', 'Directory summary', 'Profile', 'Facilities', 'Diagnosis', 'Service', 'Repairs', 'Referral']) assert(entry.fields[field], `${id}: complete elite ${field}`);
  equal(entry.fields.Referral, '—', `${id}: no higher referral`);
  for (const field of ['Directory summary', 'Profile', 'Facilities', 'Diagnosis', 'Service', 'Repairs']) assert(!/\b(?:TODO|TBD)\b|\btier\s*-?\d|\{[^}]+\}|routine (?:maintenance|servicing) (?:is|remains) separate/i.test(entry.fields[field]), `${id}: finished player-facing ${field}`);
}
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
      export { approvedMaintenanceText, APPROVED_MAINTENANCE_NAMES } from './tests/fixtures/approved-maintenance-naming';
      export { maintenanceShopSnapshots } from './tests/fixtures/maintenance-shop-snapshots';
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
  const amend = source.approvedMaintenanceText;
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
  const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
  equal([preNaming.baseline, preNaming.shops.length, namingRows.length], ['38ef088', 159, 159], 'independent pre-rename capture and full approval roster');
  equal([...new Set(namingRows.map(r => code(r[0])))].sort(), roster.map(r => r.physicalId).sort(), 'approved naming scope exactly matches physical network');
  const approvedNames = Object.fromEntries(namingRows.filter(r => r[3] !== 'Keep').map(r => [r[2], r[3].replaceAll('**', '')]));
  equal(canonical(source.APPROVED_MAINTENANCE_NAMES), canonical(approvedNames), 'test name map exactly matches preferred Markdown, not alternatives');
  equal(Object.keys(approvedNames).length, 38, '38 approved name changes');
  const restored = new Map();
  let amendedFields = 0, renamed = 0;
  const allowed = /^(?:shop\.(?:name|organizationName|directorySummary)|shop\.copy\.(?:profileBlurb|levelBlurb|diagnosisBlurb|serviceBlurb|repairsBlurb|referralBlurb)|directory\.(?:name|summary|description)|identity\.(?:1|2|5)|referrals\.\d+\.(?:name|customText|text))$/;
  for (const old of preNaming.shops) {
    const live = source.maintenanceShopSnapshots.find(s => s.shop.id === old.id);
    assert(live, `${old.id}: pre-rename account retained`);
    const restoredSnapshot = structuredClone(live);
    for (const change of old.amendments) {
      assert(allowed.test(change.path.join('.')), `${old.id}: only display text can change`);
      equal(amend(change.before), change.after, `${old.id}: exact approved amendment, no arbitrary text exemption`);
      const key = change.path.at(-1), parent = change.path.slice(0, -1).reduce((o, k) => o[k], restoredSnapshot);
      equal(parent[key], change.after, `${old.id}: live ${change.path.join('.')} equals approved wording`);
      parent[key] = change.before;
      amendedFields++;
    }
    equal(digest(restoredSnapshot), old.sha256, `${old.id}: every other field, term, quote, account and referral relationship unchanged`);
    const row = namingRows.find(r => code(r[0]) === old.physicalId);
    equal(live.shop.name, row[3] === 'Keep' ? row[2] : row[3].replaceAll('**', ''), `${old.id}: preferred name or exact retained name`);
    if (row[3] !== 'Keep') renamed++;
    assert(!/visiting[\s\u2010-\u2015-]+rigs?\b/i.test(JSON.stringify([live.shop, live.directory, live.referrals])), `${old.id}: rejected term absent from live text`);
    restored.set(old.id, restoredSnapshot);
  }
  equal([renamed, amendedFields], [38, 604], 'exact name and mirrored display-field change boundary');
  const plans = new Map(roster.map(row => [row.physicalId, row]));
  const counts = {}, usedFamilies = new Set(), receiving = new Set(), shopIds = new Set(), directoryIds = new Set();
  let retained = 0, retainedAccounts = 0, publicReferrals = 0, promotedWells = 0, newStaffed = 0;
  for (const row of roster) {
    const id = row.physicalId, assignment = assignments.get(id), account = accounts.get(id);
    const [physical, name, directoryName, organization, familyId, terms] = assignment;
    const family = families.get(familyId);
    const full = fullReview.get(id);
    const elite = eliteReview.get(id);
    const fields = elite?.fields ?? full?.fields ?? family?.fields;
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
    equal(live.facilityTier, elite ? 3 : full ? 2 : tier, `${id}: actual stage capability`);
    if (elite) {
      equal([amend(elite.name), code(fields.Account)], [live.name, live.id], `${id}: elite account/name retained`);
      equal([...fields['Receiving IDs'].matchAll(/`([^`]+)`/g)].map(m => m[1]), live.locationIds, `${id}: elite receiving IDs retained`);
    }
    if (full) {
      equal([amend(full.name), code(fields.Account)], [live.name, live.id], `${id}: bespoke names/accounts retained`);
      equal(live.copy.referralBlurb, amend(fields.Referral), `${id}: bespoke referral template`);
    } else assert(!live.copy.referralBlurb, `${id}: no extra unapproved bespoke referral`);
    const liveDirectory = directories.find(d => d.maintenanceShopId === live.id);
    assert(liveDirectory, `${id}: live directory present`);
    equal([live.name, live.organizationName ?? '—', liveDirectory.name, liveDirectory.id], [amend(name), amend(organization), amend(directoryName), row.directoryId], `${id}: exact approved names and directory`);
    const resolveCopy = text => text === '—' ? '' : amend(text.split('{place}').join(nodes.get(id).name));
    for (const [label, key] of Object.entries({ Profile: 'profileBlurb', Facilities: 'levelBlurb', Diagnosis: 'diagnosisBlurb', Service: 'serviceBlurb', Repairs: 'repairsBlurb' })) equal(live.copy[key], resolveCopy(fields[label]), `${id}: actual ${label} matches reviewed copy`);
    equal(liveDirectory.summary, resolveCopy(fields['Directory summary']), `${id}: actual directory summary`);
    equal(liveDirectory.description, resolveCopy((full || elite) && !familyId.startsWith('L') ? fields.Profile : family.fields['Directory description'] ?? family.fields.Profile), `${id}: actual directory description`);
    if (originalIds.has(live.id)) retainedAccounts++;
    else if (tier >= 0) newStaffed++;
    const authored = familyId.startsWith('L');
    if (authored) {
      const directory = directories.find(d => d.maintenanceShopId === live.id);
      retained++;
      assert(familyId.startsWith('L'), `${id}: authored set retained`);
      equal([amend(name), amend(organization), amend(directoryName)], [live.name, live.organizationName ?? '—', directory.name], `${id}: exact retained names`);
      equal(terms, `${full ? 1 : live.facilityTier} / unchanged`, `${id}: only the approved Cadiz authored upgrade`);
      for (const [label, key] of Object.entries({ Profile: 'profileBlurb', Facilities: 'levelBlurb', Diagnosis: 'diagnosisBlurb', Service: 'serviceBlurb', Repairs: 'repairsBlurb' })) {
        equal(amend(family.fields[label]), live.copy[key], `${id}: retained ${label} plus approved phrase cleanup`);
      }
      equal(amend(family.fields['Directory summary']), directory.summary, `${id}: retained summary`);
      equal(amend(family.fields['Directory description']), directory.description, `${id}: retained directory description plus approved phrase cleanup`);
    } else {
      equal(tier, Math.min(row.tier, 1), `${id}: everyday rollout only`);
      equal(terms.split(' / ')[1], row.tier < 0 ? 'E0' : row.tier > 0 ? 'S1' : row.terms, `${id}: approved everyday terms`);
      if (live.id.startsWith('wells-frontier-outfitter-') && tier === 1) promotedWells++;
      assert(!familyId.startsWith('L'), `${id}: mapped shared set`);
      const expectedTerms = elite ? ['A', 'A', 'A', 'D', 1400, 2, 1.1, 0.8, 1] : full ? ['B', 'B', 'B', 'D', 800, 2, 1, 0.9, 1] : tier < 0 ? ['F', 'F', 'F', 'F', 0, 0, 1, 1, 1] : tier > 0 ? ['C', 'D', 'D', 'D', 500, 2, 1, 1, 1] : ['E', 'F', 'F', 'F', 250, 2, row.terms === 'W0' ? 1.5 : 1.15, 1, row.terms === 'W0' ? 0.8 : 0.95];
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
    const liveExpected = elite ? [] : expected.map(({ entrance, output }, index) => ({ entrance, output: amend(full && index === 0 ? fields.Referral.split('{name}').join(assignments.get(targetIds[0])[1]) : output.split('<br>')[0]) + '<br>' + estellaDisplayPath(targetIds[index]) }));
    if (full) assert(expected.length === 1 && plans.get(targetIds[0]).tier === 3, `${id}: bespoke advice names one elite`);
    equal(source.maintenanceReferrals(live).map(r => ({ entrance: r.entranceId, output: `${source.maintenanceReferralText(r)}<br>${r.path}` })), liveExpected, `${id}: actual referral output matches reviewed line`);
  }
  equal(counts, { '-1': 9, '0': 57, '1': 90, '2': 1, '3': 2 }, 'stage snapshot');
  equal([retained, retainedAccounts, newStaffed, promotedWells], [15, 66, 84, 25], 'retained businesses/accounts and approved rollout changes');
  assert(usedFamilies.size === families.size && receiving.size === 177, 'no orphaned copy sets or missing receiving locations');
  // Explicit institutional/local variants prevent wrong population or economy claims.
  for (const [place, expectedFamily] of Object.entries({ 'Raqib': 'Field technical help', 'Gale Survey': 'Field technical help', 'Morana Station': 'Field technical help', 'Comet Fragment 4': 'Field technical help', 'Comet Fragment 6': 'Field technical help', 'Lonely Beacon / Lone-Operator Station': 'Beacon operator', 'Kopanka Mine': 'Commune mechanic', 'Mokosh Lowlands': 'Commune mechanic', 'Dnipro Pools': 'Merren mechanic', 'Teteriv Broiler Farm': 'Merren mechanic', 'Zhitomir Hydroponics': 'Merren mechanic', 'Pandemonium': 'Pandemonium mechanic', 'The Warren': 'Warren professional', 'Icarus Lab': 'Coimbra mechanic', 'Cathedral of Testimony': 'Covenant mechanic', 'Vigil Keep': 'Covenant mechanic' })) {
    const id = roster.find(r => nodes.get(r.physicalId).name === place).physicalId;
    equal(families.get(assignments.get(id)[4]).name, expectedFamily, `${place}: reviewed local variant`);
  }
  equal([-1, 0, 1, 2, 3].map(t => shops.filter(s => s.facilityTier === t).length), [9, 57, 63, 26, 4], 'final approved facility distribution');
  equal(shops.reduce((n, s) => n + source.maintenanceReferrals(s).length, 0), 279, '279 live public referral lines; two interim on-site lines retired');
  equal([preElite.baseline, preElite.shops.length], ['e50332f', 159], 'independent pre-Stage-5 snapshot');
  let protectedShops = 0;
  for (const old of preElite.shops) {
    const snapshot = restored.get(old.id);
    assert(snapshot, `${old.id}: original account still present`);
    equal(snapshot.identity, old.identity, `${old.id}: account, name and receiving membership unchanged`);
    if (eliteReview.has(old.physicalId)) continue;
    equal(createHash('sha256').update(JSON.stringify(canonical(snapshot))).digest('hex'), old.sha256, `${old.id}: complete shop/directory/referral/quotes unchanged since Stage 4`);
    protectedShops++;
  }
  equal(protectedShops, 157, 'only two approved promotions affect existing facilities');
  console.log(`Final maintenance copy: ${checks} checks; 64 original sets, 25 full-service and two elite overrides; 159 scopes / 177 receiving IDs; ${publicReferrals} historical and 279 live referral lines; 157 pre-Stage-5 fingerprints after exact approved text normalization; all 159 pre-rename fingerprints protected; ${renamed} renames / ${amendedFields} display-field amendments.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
