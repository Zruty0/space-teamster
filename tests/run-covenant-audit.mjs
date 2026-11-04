import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const firstDay = Number(option('--first-day') ?? 0), days = Number(option('--days') ?? 16);
if (!Number.isSafeInteger(firstDay) || firstDay < 0 || !Number.isSafeInteger(days) || days < 1) throw Error('Invalid day range');
const dir = await mkdtemp(join(tmpdir(), 'space-teamster-covenant-review-'));
try {
  const outfile = join(dir, 'audit.mjs');
  await build({ entryPoints: ['tests/audit-covenant-reputation.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
    } }],
  });
  const api = await import(pathToFileURL(outfile).href);
  const input = option('--input'), referenceFile = option('--reference');
  const rows = input ? api.currentCovenantQuotes(JSON.parse(await readFile(input, 'utf8'))).filter(r => r.day >= firstDay && r.day < firstDay + days)
    : api.sampleCovenantBoards(firstDay, days);
  const reference = referenceFile ? api.currentCovenantQuotes(JSON.parse(await readFile(referenceFile, 'utf8'))).filter(r => r.day >= 0 && r.day < 16)
    : firstDay === 0 && days >= 16 ? rows.filter(r => r.day < 16) : api.sampleCovenantBoards(0, 16);
  if (!rows.length || !reference.length) throw Error('Empty Covenant census');
  if (option('--save-census')) await writeFile(option('--save-census'), JSON.stringify(rows), { flag: 'wx' });
  const curve = api.fitProposedCovenantCurve(reference);
  console.log(JSON.stringify({ status: 'PROPOSAL ONLY: no production Covenant progression, gates or price changes',
    source: input ? 'Cached census at reconstructed current prices' : 'Live public boards',
    method: 'Equal weight per posting; commercial essential-import curve fit on days 0–15; compact dues/service and notarized/sanctioned passage separately at 5k/trust 1.',
    firstDay, days, proposedCurve: curve, result: api.auditCovenantProposal(rows, curve) }, null, 2));
} finally { await rm(dir, { recursive: true, force: true }); }
