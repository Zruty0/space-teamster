import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Review only. --reference FILE fits days 0–15; --input FILE reuses a census.
// Otherwise generate actual public boards at --first-day N for --days N (default 0/16).
// Output separates existing prices from proposed access/pay, never changes production curves.
const args = process.argv.slice(2);
const option = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const firstDay = Number(option('--first-day') ?? 0), days = Number(option('--days') ?? 16);
if (!Number.isSafeInteger(firstDay) || firstDay < 0 || !Number.isSafeInteger(days) || days < 1) throw Error('Invalid day range');
const dir = await mkdtemp(join(tmpdir(), 'space-teamster-house-review-'));
try {
  const outfile = join(dir, 'audit.mjs');
  await build({ entryPoints: ['tests/audit-house-reputation.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
    } }],
  });
  const api = await import(pathToFileURL(outfile).href);
  const input = option('--input'), referenceFile = option('--reference');
  const rows = input ? api.currentHouseQuotes(JSON.parse(await readFile(input, 'utf8')))
    .filter(r => r.day >= firstDay && r.day < firstDay + days) : api.sampleHouseBoards(firstDay, days);
  const reference = referenceFile ? api.currentHouseQuotes(JSON.parse(await readFile(referenceFile, 'utf8'))).filter(r => r.day >= 0 && r.day < 16)
    : firstDay === 0 && days >= 16 ? rows.filter(r => r.day < 16) : api.sampleHouseBoards(0, 16);
  if (!rows.length || !reference.length) throw Error('Empty House census');
  if (option('--save-census')) await writeFile(option('--save-census'), JSON.stringify(rows), { flag: 'wx' });
  const curves = api.fitProposedHouseCurves(reference);
  console.log(JSON.stringify({ status: 'REVIEW ONLY: no House progression, access or price changes implemented',
    method: 'Equal weight per public freight/passenger posting occurrence; fit remaining commercial pool on days 0–15, preserving workload ties. Important work separate at proposed 5k; Inquiry quoted terms untouched.',
    source: input ? 'Cached census reconstructed at current runtime prices' : 'Live public boards',
    firstDay, days, curves, houses: api.auditHouseProposal(rows, curves) }, null, 2));
} finally { await rm(dir, { recursive: true, force: true }); }
