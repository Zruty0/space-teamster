import baseline from './thule-baseline.json';
import {ESTELLA_NODES} from '../../src/content/estella';
import {ESTELLA_FACTION_CONTRACT_PROVIDERS,generateFactionContractCandidates} from '../../src/content/estella/faction-contracts';
import {contractLocationId} from '../../src/contract-presentation';
import {reviewFingerprint} from './camps-review-fingerprint';
import {generateCareerContracts,generatePassengerContracts} from '../../src/career-contracts';
import {estellaSelectableNavTargets} from '../../src/content/estella/navigation';

export const isReachSettlementAddition=(c:{templateId?:string})=>!!c.templateId?.startsWith('thule:')||!!c.templateId?.startsWith('barataria:');
export const THULE_RETIRED_PROVIDER_IDS=new Set(['house-nunes','daedalus-systems']);
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi');
let cachedRows:ReturnType<typeof generateFactionContractCandidates>|undefined;
function rows(){return cachedRows??=baseline.days.flatMap(day=>pois.flatMap(n=>generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})));}
/** Older whole-system hashes include the explicitly retired custody/research
 * jobs. This independent BEFORE-change fixture protects every surviving old
 * provider order, including those two providers, without regenerating history. */
export function assertPreThuleEconomy(check:(ok:unknown,msg:string)=>void):void{
  for(const p of ESTELLA_FACTION_CONTRACT_PROVIDERS){
    const actual=baseline.days.flatMap(day=>pois.flatMap(n=>p.generateContracts({sourceId:n.id,worldTime:day*86400}).filter(c=>!isReachSettlementAddition(c))));
    check(JSON.stringify(reviewFingerprint(actual))===JSON.stringify((baseline.providers as Record<string,number[]>)[p.id]),`${p.id}: exact surviving pre-Thule raw programme`);
  }
  check(JSON.stringify(reviewFingerprint(rows().filter(c=>!isReachSettlementAddition(c))))===JSON.stringify(baseline.raw),'all15913 surviving pre-Thule routed candidates exact');
}
export function assertPreThuleBoards(check:(ok:unknown,msg:string)=>void):void{
  const affected=thuleAffectedBoardSources();
  for(const day of baseline.days)for(const n of estellaSelectableNavTargets())if(!affected.has(contractLocationId(n.id))){
    const current=[...generateCareerContracts(n.id,day*86400),...generatePassengerContracts(n.id,day*86400)];
    check(JSON.stringify(reviewFingerprint(current))===JSON.stringify((baseline.boardSources as Record<string,number[]>)[`${day}:${n.id}`]),`unchanged pre-Thule quoted board: ${day}:${n.id}`);
  }
}
export function thuleAffectedBoardSources():Set<string>{
  return new Set([...baseline.retiredBoardSources,...rows().filter(isReachSettlementAddition).map(c=>contractLocationId(c.sourceId))]);
}
