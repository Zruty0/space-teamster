// Same seeded/advection field as filled weather; only its final presentation
// changes. Compile separately so the original production shader stays exact.
import { ATMOSPHERE_FRAGMENT } from './atmosphere-prototype-shader';
const shading=ATMOSPHERE_FRAGMENT.indexOf('  vec3 light=');
if(shading<0)throw Error('Atmosphere outline shader hook missing');
export const ATMOSPHERE_OUTLINE_FRAGMENT=ATMOSPHERE_FRAGMENT.slice(0,shading)+`
  // Two density contours, eroded into wisps. No deck, glow, shadow or haze fill.
  // Contour pre-opacity density: opaque Acheron must not lose its weather
  // merely because the filled renderer saturates its alpha almost everywhere.
  float field=density+upper;
  float level=.16+.90*coverage;
  float aa=max(.003,fwidth(field));
  float contour=1.-smoothstep(aa*.30,aa*1.05,abs(field-level));
  float secondary=1.-smoothstep(aa*.25,aa*.85,abs(field-level-.28));
  float breakup=smoothstep(.40,.57,noise3(p*8.+vec3(17.,29.,4.)));
  float taper=1.-smoothstep(.965,1.,sqrt(rr));
  float ink=(contour*.7+secondary*.32)*breakup*taper;
  // Keep each world's authored weather hue, without restoring its filled deck.
  vec3 color=clamp(cloudColor,0.,1.);
  result=vec4(color*ink,ink);
}
`;
