import type { FactionContractCandidate, FactionContractContext } from './index';

export const FARWATCH = 'deepest-dock-poi';
const PORT = 'estella-xiii-main-port';
const ORSELLE = 'estella-iii-capital-city';
const FUYUAN = 'estella-iv-primary-city';
const MOSAIC = 'estella-vii-high-vacuum-factory';
interface FarwatchLane {
  id: string; from: string; to: string; label: string; mass: number;
  purpose: string; everyPairs: number; people?: boolean; both?: boolean;
}
export const FARWATCH_EDF_LANES: readonly FarwatchLane[] = [
  {id:'provisions',from:PORT,to:FARWATCH,label:'Farwatch station provisions',mass:8,everyPairs:2,
    purpose:'Shelf-stable food and everyday stores consolidated at the Reach main port for the EDF station complement and its scientific attachment.'},
  {id:'life-support',from:PORT,to:FARWATCH,label:'Farwatch life-support service kits',mass:4,everyPairs:2,
    purpose:'Filters, pressure seals and water-recovery service parts for sustained occupation of the outer observation base.'},
  {id:'station-equipment',from:PORT,to:FARWATCH,label:'Farwatch station maintenance assemblies',mass:6,everyPairs:2,
    purpose:'Replacement power-distribution, communications and docking equipment procured by the EDF. Existing BFS/VHM propulsion service contracts remain separate.'},
  {id:'overhaul-returns',from:FARWATCH,to:PORT,label:'rebuildable utility pump cores',mass:4,everyPairs:2,
    purpose:'Customer-owned station pumps returning to the regional service depot for overhaul, rather than being discarded at the outer limit.'},
  {id:'equipment-returns',from:FARWATCH,to:PORT,label:'Farwatch reusable expedition fittings',mass:3,everyPairs:2,
    purpose:'Reusable mounting frames, handling fixtures and protective cases returning for inspection and reissue to later expeditions.'},
  {id:'duty-rotations',from:ORSELLE,to:FARWATCH,label:'EDF Farwatch duty personnel',mass:4,everyPairs:4,people:true,both:true,
    purpose:'Relief assignments and separately booked return passage for the EDF station complement. A posting authorizes this visit, not independent access to the station.'},
  {id:'technical-rotations',from:PORT,to:FARWATCH,label:'Farwatch station technicians',mass:3,everyPairs:3,people:true,both:true,
    purpose:'EDF-contracted facility technicians travelling for scheduled maintenance assignments and returning to the Reach main port.'},
];
export const FARWATCH_INSTITUTE_LANES: readonly FarwatchLane[] = [
  {id:'observation-equipment',from:FUYUAN,to:FARWATCH,label:'Farwatch observation instrument chests',mass:2,everyPairs:3,
    purpose:'Institute instruments for repeatable observations of the phenomena first reported in Reach outer space, informally called space ghosts. Their nature remains unresolved.'},
  {id:'instrument-returns',from:FARWATCH,to:FUYUAN,label:'Farwatch observation instrument chests',mass:2,everyPairs:3,
    purpose:'Physical instruments returning to the Institute for bench calibration and inspection. Ordinary observation data is transmitted; this is not a data-courier or specimen shipment.'},
  {id:'research-rotations',from:FUYUAN,to:FARWATCH,label:'Institute field researchers',mass:4,everyPairs:4,people:true,both:true,
    purpose:'Scientific attachment rotations and return travel between the Institute and EDF Farwatch Station. Station operations remain under EDF authority.'},
  {id:'optical-service',from:MOSAIC,to:FARWATCH,label:'precision optical mounting assemblies',mass:1,everyPairs:4,both:true,
    purpose:'Institute-owned optical assemblies moving between Farwatch and Tessera specialists for installation or recalibration; each direction is an independent booking.'},
];
function hash(text: string): number {
  let h=2166136261;
  for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}
// Additive programme under existing institutions. Adjacent-day availability
// preserves established independent 50/50 Gaia/Dahai/Tessera gateway routing.
export function farwatchContracts(ctx: FactionContractContext, institution: 'EDF'|'EIP'): FactionContractCandidate[] {
  const factionId=institution==='EDF'?'estella-defence-force':'estella-institute-of-planetology';
  const factionName=institution==='EDF'?'Estella Defence Force':'Estella Institute of Planetology';
  const lanes=institution==='EDF'?FARWATCH_EDF_LANES:FARWATCH_INSTITUTE_LANES;
  return lanes.flatMap(lane=>(lane.both?[false,true]:[false]).flatMap(reverse=>{
    const sourceId=reverse?lane.to:lane.from,destinationId=reverse?lane.from:lane.to;
    if(ctx.sourceId!==sourceId)return [];
    const templateId=`farwatch:${lane.id}:${reverse?'return':'out'}`;
    const key=`${factionId}:${templateId}`;
    if((Math.floor(ctx.worldTime/172800)+hash(`${key}:schedule`))%lane.everyPairs!==0)return [];
    return [{factionId,factionName,factionTag:institution,issuerId:factionId,issuerName:factionName,
      templateId,sourceId,destinationId,gaiaDispatchKey:key,dahaiDispatchKey:key,campsDispatchKey:key,sahraDispatchKey:key,
      category:lane.people?'passenger':'freight',cargo:{label:lane.label,massClass:lane.mass<=4?'light':'standard',massTons:lane.mass},
      likelihood:0.65,generosity:lane.people?0.6:0.8,compensationRatio:lane.people?0.6:0.45,maxCompAllowance:2,
      details:lane.purpose,
    } satisfies FactionContractCandidate];
  }));
}
