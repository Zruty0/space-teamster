import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const args = process.argv.slice(2);
const option = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const firstDay = Number(option('--first-day') ?? 0), days = Number(option('--days') ?? 16);
if (!Number.isSafeInteger(firstDay) || firstDay < 0 || !Number.isSafeInteger(days) || days < 1) throw Error('Invalid day range');
if (!option('--reference') || !option('--covenant-reference')) throw Error('Supply --reference day-0–15 census and --covenant-reference day-0–127 census');
const dir = await mkdtemp(join(tmpdir(), 'space-teamster-gate-coverage-'));
try {
  const outfile = join(dir, 'audit.mjs');
  await build({ entryPoints: ['tests/audit-contract-gate-coverage.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
    } }],
  });
  const api = await import(pathToFileURL(outfile).href);
  const load = async file => api.currentAllQuotes(JSON.parse(await readFile(file, 'utf8')));
  const reference = (await load(option('--reference'))).filter(r => r.day >= 0 && r.day < 16);
  const covenant = (await load(option('--covenant-reference'))).filter(r => r.day >= 0 && r.day < 128);
  const fit = api.fitCoverage(reference, covenant);
  const rows = option('--input') ? (await load(option('--input'))).filter(r => r.day >= firstDay && r.day < firstDay + days) : api.sampleAllBoards(firstDay, days);
  if (!rows.length) throw Error('Empty census');
  if (option('--save-census')) await writeFile(option('--save-census'), JSON.stringify(rows), { flag: 'wx' });
  const contacts = api.sampleContactOffers();
  console.log(JSON.stringify({ status: 'READ-ONLY COVERAGE AUDIT; no live locks/prices changed', firstDay, days,
    source: option('--input') ? 'Cached actual boards at reconstructed current prices' : 'Fresh actual boards',
    additionalCurves: fit.additional, contactEntries: contacts.missionEntries,
    contactOffers: contacts.offers.map(c => ({ id: c.id, template: c.templateId, net: c.quote.expectedMargin, policy: api.contractGateCoverage(c) })),
    result: api.auditGateCoverage(rows, fit) }, null, 2));
} finally { await rm(dir, { recursive: true, force: true }); }
