import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

// --fit: print fixed reference curves; --input FILE: reuse an explicit read-only census.
// Default generates reference days 0–15 and independent validation days 16–31 (several minutes).
// --baseline FILE additionally verifies all identities/quotes outside calibration against old boards.
const args = process.argv.slice(2);
const option = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
const dir = await mkdtemp(join(tmpdir(), 'space-teamster-income-'));
try {
  const outfile = join(dir, 'audit.mjs');
  await build({ entryPoints: ['tests/audit-contract-income.ts'], bundle: true, platform: 'node', format: 'esm', outfile,
    plugins: [{ name: 'svg-raw', setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
    } }],
  });
  const api = await import(pathToFileURL(outfile).href);
  const input = option('--input');
  const chrOnly = args.includes('--cerberus-only');
  const sample = chrOnly ? api.sampleCerberusIncomeBoards : api.sampleIncomeBoards;
  let rows = input ? JSON.parse(await readFile(input, 'utf8')) : sample(Number(option('--first-day') ?? 0), Number(option('--days') ?? 32));
  if (chrOnly) rows = rows.filter(r => r.contract.factionId === 'cerberus-human-resources');
  if (args.includes('--project-new-quotes')) rows = rows.map(r => ({ ...r, contract: { ...r.contract,
    quote: api.calibrateNewContractQuote(r.contract, r.contract.quote) } }));
  if (option('--save-census')) await writeFile(option('--save-census'), JSON.stringify(rows), { flag: 'wx' });
  const reference = rows.filter(r => r.day < 16), validation = rows.filter(r => r.day >= 16);
  if (args.includes('--fit-cerberus')) {
    const ordinary = api.fitIncomeCurves(reference)['cerberus-human-resources'];
    console.log(JSON.stringify({ ordinary, premium: api.fitCerberusPremiumCurve(reference, ordinary) }, null, 2));
  } else if (args.includes('--fit')) console.log(JSON.stringify(api.fitIncomeCurves(reference), null, 2));
  else {
    const referenceAudit = api.incomeAudit(reference), validationAudit = api.incomeAudit(validation);
    if (reference.length) {
      const expectedCurves = chrOnly ? { 'cerberus-human-resources': api.CONTRACT_INCOME_CURVES['cerberus-human-resources'] } : api.CONTRACT_INCOME_CURVES;
      assert.deepEqual(api.fitIncomeCurves(reference), expectedCurves, 'fixed curves reproduce reference census');
      assert.deepEqual(api.fitCerberusPremiumCurve(reference, api.CONTRACT_INCOME_CURVES['cerberus-human-resources']),
        api.CERBERUS_PREMIUM_CURVE, 'CHR premium curve includes entrusted commercial pool');
      for (const provider of referenceAudit.providers) for (const band of provider.bands) if (band.count) {
        assert.equal(band.median, provider.targets[band.level], `${provider.provider}: exact reference median at tier ${band.level}`);
      }
    }
    let preserved;
    if (option('--baseline')) {
      let before = JSON.parse(await readFile(option('--baseline'), 'utf8'));
      if (chrOnly) before = before.filter(r => r.contract.factionId === 'cerberus-human-resources');
      assert.equal(rows.length, before.length, 'same board membership/count');
      let unchangedQuotes = 0, changedQuotes = 0;
      for (let i = 0; i < rows.length; i++) {
        const stripPay = r => {
          const { pay, generosity, grossPay, expectedMargin, ...physicalQuote } = r.contract.quote;
          return { ...r, contract: { ...r.contract, quote: physicalQuote } };
        };
        assert.equal(JSON.stringify(stripPay(rows[i])), JSON.stringify(stripPay(before[i])), `posting ${i}: serialized identities, route, cargo, seed order, transfer, inquiry, copy`);
        const old = before[i].contract.quote, next = rows[i].contract.quote;
        assert.equal(JSON.stringify(next), JSON.stringify(api.calibrateNewContractQuote(before[i].contract, old)), `posting ${i}: only exact authorized calibration, excluded quotes unchanged`);
        assert.equal(old.pay.compensationRatio, next.pay.compensationRatio, 'fuel reimbursement retained');
        assert.equal(old.pay.maxCompAllowance, next.pay.maxCompAllowance, 'fuel cap retained');
        if (JSON.stringify(old) === JSON.stringify(next)) unchangedQuotes++; else changedQuotes++;
      }
      preserved = { postingIdentities: rows.length, fuelTerms: rows.length, unchangedQuotes, changedQuotes };
    }
    console.log(JSON.stringify({ method: 'Public freight/passenger boards; equal weight per occurrence; fixed day-0–15 workload knots.',
      source: input ? 'Explicit cached census' : 'Live generated boards', scope: chrOnly ? 'Cerberus only' : 'All providers', projectedNewQuotes: args.includes('--project-new-quotes'),
      days: [...new Set(rows.map(r => r.day))].sort((a, b) => a - b),
      preserved, reference: referenceAudit, validation: validationAudit }, null, 2));
  }
} finally { await rm(dir, { recursive: true, force: true }); }
