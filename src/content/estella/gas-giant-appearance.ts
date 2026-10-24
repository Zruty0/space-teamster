import { defineGasGiantProfile, type GasGiantProfile } from '../../gas-giant-geometry';

// Stage 4 artwork only: no rings, changes to atmosphere/skim physics or moon orbits.
export const ESTELLA_GAS_GIANT_PROFILES: Readonly<Partial<Record<string,GasGiantProfile>>> = Object.freeze({
  'estella-x': defineGasGiantProfile('estella-x', {
    edges:[-.94,-.84,-.76,-.65,-.58,-.46,-.39,-.30,-.23,-.10,-.04,.05,.13,.24,.31,.43,.50,.64,.73,.84,.93],
    colors:[0,1,3,2,3,1,0,3,1,3,4,1,3,0,1,2,3,1,0,3,1,0],
    palette:[[209,181,130],[228,210,170],[193,160,106],[218,194,148],[239,222,183]],
    turbulence:.018,filamentCount:16,filamentOpacity:.10,
    stormColors:[[202,175,123],[236,218,178]],
    storms:[{x:-.28,y:.28,rx:.10,ry:.035,angle:.05},{x:.42,y:-.46,rx:.07,ry:.025,angle:-.1}],
  }),
  'estella-xi': defineGasGiantProfile('estella-xi', {
    edges:[-.90,-.73,-.62,-.49,-.34,-.21,-.12,.04,.16,.33,.43,.57,.72,.88],
    colors:[2,0,1,3,0,2,4,0,3,1,0,4,2,0,3],
    palette:[[220,205,175],[188,145,104],[156,100,69],[203,169,126],[240,222,184]],
    turbulence:.085,filamentCount:22,filamentOpacity:.20,
    stormColors:[[164,81,48],[237,196,151]],
    storms:[{x:.34,y:.25,rx:.24,ry:.095,angle:-.10},{x:-.40,y:-.43,rx:.11,ry:.04,angle:.08,light:true},{x:-.28,y:.52,rx:.09,ry:.032,angle:0,light:true},{x:.52,y:-.22,rx:.065,ry:.025,angle:-.05,light:true}],
  }),
  'estella-xii': defineGasGiantProfile('estella-xii', {
    edges:[-.82,-.58,-.19,.17,.56,.80],colors:[0,2,0,1,0,2,0],
    palette:[[83,137,193],[95,158,208],[70,121,181],[101,163,207]],
    turbulence:.014,filamentCount:4,filamentOpacity:.07,
    stormColors:[[36,77,132],[90,140,188]],
    storms:[{x:-.28,y:-.24,rx:.19,ry:.085,angle:.12},{x:.41,y:.49,rx:.075,ry:.03,angle:-.15}],
  }),
});
export function gasGiantProfileFor(id:string): GasGiantProfile|undefined {
  return Object.prototype.hasOwnProperty.call(ESTELLA_GAS_GIANT_PROFILES,id)?ESTELLA_GAS_GIANT_PROFILES[id]:undefined;
}
