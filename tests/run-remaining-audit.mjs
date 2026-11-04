import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const args = process.argv.slice(2);
const option = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const firstDay = Number(option('--first-day') ?? 0), days = Number(option('--days') ?? 16);
if (!Number.isSafeInteger(firstDay) || firstDay < 0 || !Number.isSafeInteger(days) || days < 1) throw Error('Invalid day range');
const dir = await mkdtemp(join(tmpdir(), 'space-teamster-remaining-review-'));
try {
  const outfile = join(dir, 'audit.mjs');
  await build({ entryPoints: ['tests/audit-remaining-reputation.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
    } }],
  });
  const api = await import(pathToFileURL(outfile).href);
  const load = async path => api.currentBatchQuotes(JSON.parse(await readFile(path, 'utf8')));
  const input = option('--input'), ref = option('--reference'), cov = option('--covenant-reference');
  // Fit before sampling the holdout. No prices depend on the tested window.
  const reference = ref ? (await load(ref)).filter(r => r.day >= 0 && r.day < 16) : api.sampleBatchBoards(0, 16);
  const covenantReference = cov ? (await load(cov)).filter(r => r.day >= 0 && r.day < 128 && r.contract.factionId === 'covenant-remnants') : api.sampleCovenantBoards(0, 128);
  const fit = api.fitBatchProposal(reference, covenantReference);
  const rows = input ? (await load(input)).filter(r => r.day >= firstDay && r.day < firstDay + days) : api.sampleBatchBoards(firstDay, days);
  if (!rows.length) throw Error('Empty census');
  if (option('--save-census')) await writeFile(option('--save-census'), JSON.stringify(rows), { flag: 'wx' });
  console.log(JSON.stringify({ status: 'DESIGN/AUDIT ONLY: no production changes', source: input ? 'Cached census at current prices' : 'Fresh public boards',
    method: 'Six earning-provider refits, Daedalus entrusted premium budget; twelve inherited providers unchanged. Covenant development reference days 0–127 with fixed gentle entry shoulder; all other fits days 0–15. Important pools excluded from commercial ratios.',
    firstDay, days, referenceCount: reference.length, covenantReferenceCount: covenantReference.length,
    fit, result: api.auditBatchProposal(rows, fit) }, null, 2));
} finally { await rm(dir, { recursive: true, force: true }); }
