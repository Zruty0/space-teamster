import { calatravaGeometry, drawCalatravaDisc, CALATRAVA_SEED } from '../src/calatrava-appearance';
import { almadenGeometry, drawAlmadenDisc, ALMADEN_SEED } from '../src/almaden-appearance';
import { marismaGeometry, drawMarismaDisc, MARISMA_SEED } from '../src/marisma-appearance';
export const FINAL_MOONS = [
  {id:'estella-xd', name:'Calatrava', stage:9, seed:CALATRAVA_SEED, paint:drawCalatravaDisc, model:calatravaGeometry,
   base:'#9d7159', atmosphere:[0,0,0], note:'Old crater fields / local geothermal belts',
   targets:[['estella-xd-chem-station','Alembic Ring',null],['estella-xd-geothermal-extraction','Marcher Wells',-1.2],['estella-xd-proving-grounds','Calatrava Keep',1.45],['estella-xd-iron-lists','Iron Lists',2.55],['estella-xd-redoubt-field','Redoubt Field',-2.45]]},
  {id:'estella-xia', name:'Almaden', stage:10, seed:ALMADEN_SEED, paint:drawAlmadenDisc, model:almadenGeometry,
   base:'#c5a04d', atmosphere:[38000,.22,8000], note:'Sulfur terrain / dark volcanic calderas',
   targets:[['estella-xia-chem-station','Almaden Orbital',null],['estella-xia-sulfur-mine','Yellow Pit',.2],['estella-xia-sealed-worker-hab','Castle Almaden',1.65],['estella-xia-rare-element-extraction','Cinnabar Cut',-2.25]]},
  {id:'estella-xib', name:'Marisma', stage:11, seed:MARISMA_SEED, paint:drawMarismaDisc, model:marismaGeometry,
   base:'#688fa6', atmosphere:[85000,1.6,13000], note:'Cool lowlands / pale surface relief',
   targets:[['estella-xib-cryo-transit','Coldgate',-.15],['estella-xib-methane-refinery','Blue Fen Refinery',.85],['estella-xib-organic-chemistry','Marisma Cauldron',1.75],['estella-xib-hydrocarbon-extraction','Blackwater Fields',2.65],['estella-xib-science-settlement','Castle Marisma',-2.4]]},
] as const;
