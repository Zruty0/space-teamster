import { atmosphereNoise, atmosphereVortices, atmospherePhase, atmosphereProfile, type AtmosphereProfile } from './atmosphere-prototype-profile';
import { ATMOSPHERE_VERTEX, ATMOSPHERE_FRAGMENT } from './atmosphere-prototype-shader';
import { createAtmosphereGpuTimer } from './atmosphere-prototype-timing';
export { GAIA_ATMOSPHERE_PROFILE, atmosphereProfile, atmospherePhase } from './atmosphere-prototype-profile';
export type { AtmosphereProfile } from './atmosphere-prototype-profile';

/** Gaia review tool only. One bounded noise volume / one output texture; no
 * accumulated frame cache. This generator can later be used by an offline baker.
 * No imports from orbital, missions, physics, weather, saves or world catalog. */
export function createAtmospherePrototype(resolution=512){
  if(!Number.isInteger(resolution)||resolution<64||resolution>1024)throw Error('Atmosphere resolution must be 64–1024');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=resolution;
  const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false});
  if(!gl)throw Error('This atmosphere preview needs WebGL2. The game renderer is unchanged.');
  const timer=createAtmosphereGpuTimer(gl);
  const shaders:WebGLShader[]=[];
  let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null,texture:WebGLTexture|null=null;
  const cleanup=()=>{timer.dispose();if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));};
  try{
    const compile=(type:number,source:string)=>{
      const s=gl.createShader(type);if(!s)throw Error('Cannot create atmosphere shader');shaders.push(s);
      gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)??'Atmosphere shader compilation failed');return s;
    };
    const vertex=compile(gl.VERTEX_SHADER,ATMOSPHERE_VERTEX),fragment=compile(gl.FRAGMENT_SHADER,ATMOSPHERE_FRAGMENT);
    program=gl.createProgram();if(!program)throw Error('Cannot create atmosphere program');
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)??'Atmosphere linking failed');
    gl.useProgram(program);buffer=gl.createBuffer();texture=gl.createTexture();
    if(!buffer||!texture)throw Error('Cannot allocate atmosphere resources');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_3D,texture);
    gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_3D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T,gl.TEXTURE_WRAP_R])gl.texParameteri(gl.TEXTURE_3D,axis,gl.REPEAT);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.uniform1i(gl.getUniformLocation(program,'noiseVolume'),0);
    const keys=['phase','coverage','scale','fronts','detail','shear','evolution','cirrus','opticalDepth','zonalTurns','tropicalTurns','cirrusTurns','vortexCount','vortexSize','vortexStrength','vortexEye','vortexSpeed']as const;
    const locations=Object.fromEntries(keys.map(k=>[k,gl.getUniformLocation(program!,k)]))as Record<typeof keys[number],WebGLUniformLocation|null>;
    const color=gl.getUniformLocation(program,'cloudColor');
    const vortices=gl.getUniformLocation(program,'vortexCenters[0]');
    const vortexProperties=gl.getUniformLocation(program,'vortexProperties[0]');
    const shadow=document.createElement('canvas');shadow.width=shadow.height=resolution;
    const shadowCtx=shadow.getContext('2d')!;
    // Successive 2x area reductions avoid sparkling fine clouds on tiny markers.
    // These are spatial LODs of ONE frame, not an accumulating animation cache.
    const mipmaps=[{cloud:canvas,shadow}];
    for(let size=Math.floor(resolution/2);size>=4;size=Math.floor(size/2)){
      const cloud=document.createElement('canvas'),mask=document.createElement('canvas');
      cloud.width=cloud.height=mask.width=mask.height=size;mipmaps.push({cloud,shadow:mask});
    }
    let seed=-1,disposed=false;
    const check=()=>{if(disposed)throw Error('Atmosphere preview disposed');if(gl.isContextLost())throw Error('Atmosphere WebGL context lost; reload the preview.');};
    return {
      canvas,resolution,
      render(seconds:number,input:Partial<AtmosphereProfile>){
        check();const profile=atmosphereProfile(input);
        if(profile.seed!==seed){
          gl.texImage3D(gl.TEXTURE_3D,0,gl.R8,64,64,64,0,gl.RED,gl.UNSIGNED_BYTE,atmosphereNoise(profile.seed));
          const systems=atmosphereVortices(profile.seed);
          gl.uniform4fv(vortices,new Float32Array(systems.flatMap(v=>[...v.center,v.phase])));
          gl.uniform4fv(vortexProperties,new Float32Array(systems.flatMap(v=>[v.sizeScale,v.strengthScale,v.eyeScale,v.turns])));
          seed=profile.seed;
        }
        gl.viewport(0,0,resolution,resolution);
        for(const key of keys)gl.uniform1f(locations[key],key==='phase'?atmospherePhase(seconds,profile.loopSeconds):profile[key]);
        gl.uniform3f(color,...profile.cloudColor);timer.begin();gl.drawArrays(gl.TRIANGLES,0,6);timer.end();
        shadowCtx.clearRect(0,0,resolution,resolution);shadowCtx.globalCompositeOperation='source-over';shadowCtx.drawImage(canvas,0,0);
        shadowCtx.globalCompositeOperation='source-in';shadowCtx.fillStyle='#081321';shadowCtx.fillRect(0,0,resolution,resolution);shadowCtx.globalCompositeOperation='source-over';
        for(let i=1;i<mipmaps.length;i++)for(const key of ['cloud','shadow']as const){
          const target=mipmaps[i][key],context=target.getContext('2d')!;
          context.clearRect(0,0,target.width,target.height);context.drawImage(mipmaps[i-1][key],0,0,target.width,target.height);
        }
        return profile;
      },
      /** Draw AFTER unchanged base globe, BEFORE labels. No per-size regeneration. */
      composite(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number,profile:AtmosphereProfile){
        check();if(!(radius>0)||![cx,cy,radius].every(Number.isFinite))return;
        const p=atmosphereProfile(profile),rgb=p.hazeColor.map(c=>Math.round(c*255)).join(',');
        let lod=0;while(lod+1<mipmaps.length&&mipmaps[lod+1].cloud.width>=radius*2*(1+p.cloudHeight))lod++;
        const image=mipmaps[lod];
        ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();
        ctx.globalAlpha=p.shadow;ctx.drawImage(image.shadow,cx-radius+radius*.012,cy-radius+radius*.016,radius*2,radius*2);ctx.globalAlpha=1;
        const veil=ctx.createRadialGradient(cx,cy,radius*.15,cx,cy,radius);
        veil.addColorStop(0,`rgba(${rgb},${p.haze*.025})`);veil.addColorStop(.75,`rgba(${rgb},${p.haze*.065})`);veil.addColorStop(1,`rgba(${rgb},${p.haze*.44})`);
        ctx.fillStyle=veil;ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);ctx.restore();
        ctx.save();const r=radius*(1+p.cloudHeight);ctx.drawImage(image.cloud,cx-r,cy-r,r*2,r*2);
        // Smooth visual limb, independent of the flight atmosphere boundary.
        const halo=ctx.createRadialGradient(cx,cy,radius*.985,cx,cy,radius*1.04);
        halo.addColorStop(0,`rgba(${rgb},0)`);halo.addColorStop(.25,`rgba(${rgb},${p.haze*.22})`);halo.addColorStop(1,`rgba(${rgb},0)`);
        ctx.fillStyle=halo;ctx.fillRect(cx-radius*1.04,cy-radius*1.04,radius*2.08,radius*2.08);ctx.restore();
      },
      timing(){return timer.snapshot();},
      resetTiming(){timer.reset();},
      diagnostics(){return{gpu:timer.snapshot(),renderer:String(gl.getParameter(gl.RENDERER)),error:gl.getError(),resolution,noiseBytes:64**3};},
      dispose(){if(!disposed){cleanup();for(const mip of mipmaps)for(const c of [mip.cloud,mip.shadow])c.width=c.height=1;disposed=true;}},
    };
  }catch(error){cleanup();throw error;}
}
