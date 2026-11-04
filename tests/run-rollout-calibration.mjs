import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const args = process.argv.slice(2), option = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const dir = await mkdtemp(join(tmpdir(), 'teamster-rollout-fit-'));
try {
  const outfile = join(dir, 'fit.mjs');
  await build({ entryPoints: ['tests/reputation-rollout-calibration.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(b) {
      b.onResolve({ filter: /\.svg\?raw$/ }, a => ({ path: resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      b.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async a => ({ contents: await readFile(a.path, 'utf8'), loader: 'text' }));
    } }] });
  const api = await import(pathToFileURL(outfile).href), load = async p => JSON.parse(await readFile(p, 'utf8'));
  if (option('--sample')) {
    const first = Number(option('--first-day') ?? 0), days = Number(option('--days') ?? 192);
    if (!Number.isSafeInteger(first) || first < 0 || !Number.isSafeInteger(days) || days < 1) throw Error('Invalid sample range');
    const rows = api.focusedBoards(first, days);
    await writeFile(option('--sample'), JSON.stringify(rows), { flag: 'wx' });
    console.log(JSON.stringify({ first, days, appearances: rows.length }));
  } else console.log(JSON.stringify(api.rolloutFit(await load(option('--reference')), await load(option('--covenant-reference')), await load(option('--broad-reference'))), null, 2));
} finally { await rm(dir, { recursive: true, force: true }); }
