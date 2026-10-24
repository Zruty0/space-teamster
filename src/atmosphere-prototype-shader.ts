// Two dimensional shell shading, not volumetric ray marching or flight weather.
// Integer turns and periodic distortions make phase 0 and phase 1 identical.
export const ATMOSPHERE_VERTEX=`#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position;gl_Position=vec4(position,0.,1.);}
`;
export const ATMOSPHERE_FRAGMENT=`#version 300 es
precision highp float;
precision highp sampler3D;
in vec2 uv;
out vec4 result;
uniform sampler3D noiseVolume;
uniform float phase,coverage,scale,fronts,detail,shear,evolution,cirrus,opticalDepth;
uniform float zonalTurns,tropicalTurns,cirrusTurns;
uniform vec3 cloudColor;
const float TAU=6.28318530718;
const mat3 ROT=mat3(.00,.80,.60,-.80,.36,-.48,-.60,-.48,.64);
float noise3(vec3 p){return texture(noiseVolume,(p+.5)/64.).r;}
float fbm(vec3 p){
  float value=0.;float weight=.53;
  for(int i=0;i<5;i++){value+=weight*noise3(p);p=ROT*p*2.03+vec3(7.1,3.4,9.2);weight*=.49;}
  return value;
}
vec3 rotateY(vec3 p,float angle){float c=cos(angle),s=sin(angle);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 weatherPosition(vec3 n,float turns){
  float t=phase*TAU;
  // Net drift stays directional; shear/evolution close continuously at the seam.
  float angle=t*turns+.22*shear*sin(t)*sin(n.y*5.);
  vec3 p=rotateY(n,angle);
  vec3 warp=vec3(noise3(p*4.+11.),noise3(p*4.+23.),noise3(p*4.+37.))-.5;
  return p+.13*shear*warp+.055*evolution*vec3(sin(t+p.y*3.),cos(t+p.z*3.),sin(t+p.x*3.));
}
float cloudField(vec3 p,bool temperate){
  float latitude=asin(clamp(p.y,-1.,1.));
  float longitude=atan(p.x,p.z);
  float north=.43+.15*sin(2.*longitude+.8)+.065*sin(3.*longitude-.4);
  float south=-.42+.14*sin(3.*longitude+2.)+.055*sin(2.*longitude);
  float front=exp(-pow((latitude-north)/.095,2.))+exp(-pow((latitude-south)/.11,2.));
  front*=smoothstep(.30,.65,fbm(p*2.7+vec3(13.,7.,19.)));
  vec3 q=p*scale;
  float broad=fbm(q*3.3+vec3(8.,31.,4.));
  float billows=fbm(q*17.+vec3(21.,2.,17.));
  float erosion=fbm(q*65.+vec3(4.,8.,3.));
  float field=.52*broad+.48*billows+front*fronts*.32;
  if(!temperate)field+=.035;
  field-=detail*.11*erosion;
  float threshold=.64-.34*coverage;
  return max(0.,(field-threshold)*7.5);
}
void main(){
  float rr=dot(uv,uv);
  if(rr>=1.){result=vec4(0.);return;}
  vec3 n=vec3(uv,sqrt(max(0.,1.-rr)));
  vec3 p=weatherPosition(n,zonalTurns);
  vec3 trop=weatherPosition(n,tropicalTurns);
  float equator=1.-smoothstep(.12,.42,abs(n.y));
  float density=mix(cloudField(p,true),cloudField(trop,false),equator);
  // Coverage zero genuinely removes the lower deck, not just its mean.
  density*=smoothstep(0.,.05,coverage);
  float slant=1./max(.38,n.z);
  float low=1.-exp(-density*opticalDepth*slant);
  vec3 high=weatherPosition(n,cirrusTurns);
  vec3 wisps=vec3(high.x*19.,high.y*95.+noise3(high*9.)*2.3,high.z*19.);
  float streaks=.65*noise3(wisps)+.35*noise3(wisps*2.1);
  float upper=smoothstep(.51,.73,streaks)*smoothstep(.41,.64,fbm(high*4.+41.))*cirrus*.65;
  float alpha=1.-(1.-low)*(1.-upper);
  alpha*=1.-smoothstep(.991,1.,sqrt(rr));
  vec3 light=normalize(vec3(-.4,.55,.8));
  float relief=noise3(p*43.+light*.45)-noise3(p*43.-light*.45);
  float lighting=.77+.23*max(0.,dot(n,light))+.17*detail*relief;
  vec3 color=clamp(cloudColor*lighting,0.,1.);
  // Canvas2D consumes a premultiplied transparent image of the cloud shell.
  result=vec4(color*alpha,alpha);
}
`;
