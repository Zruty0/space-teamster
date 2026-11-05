// Offline origin-market fitting/audit. Production never fits against current boards.
import type { CareerContract } from '../src/career-contracts';
import { physicalTerminalId } from '../src/physical-terminals';
import { contractWorkPolicy } from '../src/contract-work-policy';
import { incomeCalibrationKind, incomeTargetId, incomeBoundaries, incomeEconomicMinimum, ordinaryContractNetCredits,
  calibrateNewContractQuote, CONTRACT_INCOME_TARGETS, type IncomeIdentity } from '../src/contract-income';
import { originIncomePosition, originIncomeCredits, type OriginIncomeCurve, type OriginFeeCurve } from '../src/origin-income-math';
import { contractReputationLockReasons } from '../src/contract-reputation';
import { defaultCareerProfile } from '../src/career-state';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { fitIncomeCurve, incomeStats, sampleIncomeBoards, type IncomeSample } from './audit-contract-income';
import { ORIGIN_INCOME_CURVES, ORIGIN_ROUTE_WORKLOADS, ORIGIN_EMPLOYER_FEES, ORIGIN_INCOME_REFERENCE } from '../src/contract-income-origin-curves';
export { sampleIncomeBoards };
export const liveOriginFit = { curves: ORIGIN_INCOME_CURVES, routeWorkloads: ORIGIN_ROUTE_WORKLOADS, fees: ORIGIN_EMPLOYER_FEES,
  reference: { appearances: ORIGIN_INCOME_REFERENCE.appearances, days: [...ORIGIN_INCOME_REFERENCE.days] } };
export interface OriginFit {
  reference?: { appearances: number; days: number[] };
  curves: Record<string, OriginIncomeCurve>;
  routeWorkloads: Record<string, number>;
  fees: Record<string, OriginFeeCurve>;
}
export function originKey(c: IncomeIdentity & { sourceId: string }) {
  return `${physicalTerminalId(c.sourceId)}|${c.category === 'passenger' ? 'passenger' : 'freight'}`;
}
export function originEligible(c: IncomeIdentity) {
  return incomeCalibrationKind(c) === 'ordinary' && contractWorkPolicy(c)?.trust === 0;
}
export function routeKey(c: CareerContract) { return `${physicalTerminalId(c.sourceId)}|${physicalTerminalId(c.destinationId)}`; }
export function originWorkload(c: CareerContract, routes: Record<string, number>) {
  return Math.round((routes[routeKey(c)] ?? c.quote.parFuelCost / c.quote.loadedMassTons) * c.quote.loadedMassTons);
}
function middlePair(values: number[]): [number, number] {
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted.length ? [sorted[(sorted.length-1)>>1],sorted[sorted.length>>1]] : [1,1];
}
export function fitOriginCurves(rows: IncomeSample[]): OriginFit {
  const eligible = rows.filter(r=>originEligible(r.contract)), routes = new Map<string, number[]>();
  for (const { contract: c } of eligible) {
    const key = routeKey(c), values = routes.get(key) ?? []; values.push(c.quote.parFuelCost / c.quote.loadedMassTons); routes.set(key, values);
  }
  const routeWorkloads = Object.fromEntries([...routes.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,values])=>[key,incomeStats(values).median!]));
  const groups = new Map<string, number[]>();
  for (const { contract: c } of eligible) {
    const key = originKey(c), values = groups.get(key) ?? []; values.push(originWorkload(c,routeWorkloads)); groups.set(key,values);
  }
  const curves: Record<string, OriginIncomeCurve> = Object.fromEntries([...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,values])=>{
    // Sparse one/two-group routine markets cannot support three honest price bands.
    if(new Set(values).size<3) return [key,[incomeStats(values).median!]];
    const sorted=[...values].sort((a,b)=>a-b),cuts=sorted.flatMap((v,i)=>i>0&&v!==sorted[i-1]?[i]:[]);
    // Small freight entry buffer, no daily board quota or randomized tie splitting.
    const share=key.endsWith('|freight')?.3:.2;
    const lower=cuts.slice(0,-1).find(i=>i>=values.length*share)??cuts[cuts.length-2];
    return [key,fitIncomeCurve(values,false,lower/values.length,.8)];
  }));
  const fees: Record<string, OriginFeeCurve> = {};
  for(const provider of [...new Set(eligible.map(r=>r.contract.factionId!))].sort()) {
    const positions=eligible.filter(r=>r.contract.factionId===provider).map(r=>originIncomePosition(originWorkload(r.contract,routeWorkloads),curves[originKey(r.contract)]));
    fees[provider]=[...middlePair(positions.filter(p=>p.band===0).map(p=>p.workload)),
      ...middlePair(positions.filter(p=>p.band===1).map(p=>p.workload)),
      ...middlePair(positions.filter(p=>p.band===2).map(p=>p.workload))] as unknown as OriginFeeCurve;
  }
  return {curves,routeWorkloads,fees,reference:{appearances:rows.length,days:[...new Set(rows.map(r=>r.day))].sort((a,b)=>a-b)}};
}
export function networkNet(c: CareerContract) {
  const kind=incomeCalibrationKind(c);
  return kind==='important'?contractWorkPolicy(c)!.importantNet!:kind?ordinaryContractNetCredits(c,c.quote.parFuelCost):c.quote.expectedMargin;
}
export function projectedOriginNet(c: CareerContract,fit:OriginFit) {
  const curve=originEligible(c)?fit.curves[originKey(c)]:undefined,fees=fit.fees[c.factionId!];
  if(!curve||!fees||c.factionId==='covenant-remnants')return networkNet(c);
  const target=incomeTargetId(c.factionId)!;
  const local=originIncomeCredits(originIncomePosition(originWorkload(c,fit.routeWorkloads),curve),
    CONTRACT_INCOME_TARGETS[target] as readonly number[],incomeBoundaries(target)!,fees);
  return local;
}
export function auditOriginIncome(rows:IncomeSample[],fit:OriginFit) {
  const zero=defaultCareerProfile();
  const data=rows.map(r=>{const c=r.contract,net=projectedOriginNet(c,fit),minimum=Math.max(contractWorkPolicy(c)?.trust??0,incomeEconomicMinimum(c.factionId,net)??0);
    return {...r,physical:physicalTerminalId(r.boardSource),net,minimum,ordinary:originEligible(c)};});
  const origins=[...new Set(data.map(r=>r.physical))].sort().map(origin=>{
    const pool=data.filter(r=>r.physical===origin),days=[...new Set(pool.map(r=>r.day))];
    const sample=days.map(day=>{
      // Count one representative board per physical port/day; aliases aren't extra consignments.
      const dayRows=pool.filter(r=>r.day===day),board=dayRows.find(r=>r.boardSource===origin)?.boardSource??dayRows[0].boardSource;
      const at=dayRows.filter(r=>r.boardSource===board);
      return {day,postings:at.length,tiers:[0,1,2].map(level=>at.filter(r=>r.minimum===level).length),
        eligibleFreight:at.filter(r=>r.ordinary&&r.contract.category==='freight').length,
        starterFreight:at.filter(r=>r.minimum===0&&r.contract.category==='freight').length,
        unlicensedStarterFreight:at.filter(r=>r.minimum===0&&r.contract.category==='freight'&&!r.contract.requiredCertification).length,
        beforeStarters:at.filter(r=>!contractReputationLockReasons(zero,{...r.contract,quote:{...r.contract.quote,expectedMargin:networkNet(r.contract)}}).length).length};
    });
    return {origin,access:pool.some(r=>emptyTravelAccess(r.boardSource)==='public')?'public':emptyTravelAccess(pool[0].boardSource),sample,
      beforeStarvedDays:sample.filter(d=>d.beforeStarters===0&&d.eligibleFreight>0).length,
      starvedDays:sample.filter(d=>d.tiers[0]===0&&d.eligibleFreight>0).length,
      noStarterFreightDays:sample.filter(d=>d.starterFreight===0&&d.eligibleFreight>0).length};
  });
  const providers=[...new Set(data.map(r=>r.contract.factionId!))].sort().map(provider=>{
    const pool=data.filter(r=>r.contract.factionId===provider&&incomeCalibrationKind(r.contract)==='ordinary');
    return {provider,targets:CONTRACT_INCOME_TARGETS[incomeTargetId(provider)!],
      publicNetworkStarterFreight:pool.filter(r=>r.contract.category==='freight'&&emptyTravelAccess(r.boardSource)==='public'&&contractWorkPolicy(r.contract)?.trust===0&&incomeEconomicMinimum(provider,networkNet(r.contract))===0).length,
      publicStarterFreight:pool.filter(r=>r.minimum===0&&r.contract.category==='freight'&&emptyTravelAccess(r.boardSource)==='public').length,
      publicStarterSources:[...new Set(pool.filter(r=>r.minimum===0&&emptyTravelAccess(r.boardSource)==='public').map(r=>r.physical))],
      bands:[0,1,2].map(level=>{const at=pool.filter(r=>r.minimum===level);
      return {level,percent:pool.length?Math.round(at.length/pool.length*1000)/10:0,...incomeStats(at.map(r=>r.net))};})};
  });
  return {appearances:rows.length,originMarkets:Object.keys(fit.curves).length,routeWorkloads:Object.keys(fit.routeWorkloads).length,
    missingMarkets:[...new Set(data.filter(r=>r.ordinary&&!fit.curves[originKey(r.contract)]).map(r=>originKey(r.contract)))],
    missingRoutes:[...new Set(data.filter(r=>r.ordinary&&!fit.routeWorkloads[routeKey(r.contract)]).map(r=>routeKey(r.contract)))],
    liveMismatches:data.filter(r=>calibrateNewContractQuote(r.contract,r.contract.quote).expectedMargin!==r.net).length,providers,origins};
}
