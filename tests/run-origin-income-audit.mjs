import { build } from 'esbuild';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const args=process.argv.slice(2), option=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
const dir=await mkdtemp(join(tmpdir(),'teamster-origin-income-'));
try {
 const outfile=join(dir,'audit.mjs');
 await build({entryPoints:['tests/audit-origin-income.ts'],bundle:true,platform:'node',format:'esm',outfile,
  plugins:[{name:'svg-raw',setup(b){
   b.onResolve({filter:/\.svg\?raw$/},a=>({path:resolve(a.resolveDir,a.path.replace(/\?raw$/,'')),namespace:'svg-raw'}));
   b.onLoad({filter:/.*/,namespace:'svg-raw'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}));
  }}]});
 const api=await import(pathToFileURL(outfile).href), load=async p=>JSON.parse(await readFile(p,'utf8'));
 const reference=option('--reference')?(await Promise.all(option('--reference').split(',').map(load))).flat():undefined;
 const curves=reference?api.fitOriginCurves(reference):api.liveOriginFit;
 if(args.includes('--input-reference')&&!reference)throw Error('--input-reference requires --reference FILE[,FILE]');
 if(option('--save-curves'))await writeFile(option('--save-curves'),JSON.stringify(curves,null,2),{flag:'wx'});
 const first=Number(option('--first-day')??256),days=Number(option('--days')??16);
 if(!Number.isSafeInteger(first)||first<0||!Number.isSafeInteger(days)||days<1)throw Error('Invalid range');
 const rows=args.includes('--input-reference')?reference:option('--input')?await load(option('--input')):api.sampleIncomeBoards(first,days);
 if(option('--save-census'))await writeFile(option('--save-census'),JSON.stringify(rows),{flag:'wx'});
 console.log(JSON.stringify(api.auditOriginIncome(rows,curves),null,2));
} finally {await rm(dir,{recursive:true,force:true});}
