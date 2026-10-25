import { APPROACH_LEVELS, createApproachState, getApproachTerrainHeight, renderApproach, drawOriginalApproachScenery, type ApproachLevel } from '../src/approach';
import { HARTWELL_APPROACH_TARGETS, hartwellApproachRegion } from '../src/approach-biomes';
import { createHartwellScenery } from '../src/approach-scenery';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { BODIES, SURFACE_POIS, surfacePoiById } from '../src/world';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ui = { height: $<HTMLSelectElement>('height'), phase: $<HTMLSelectElement>('phase'),
  offset: $<HTMLInputElement>('offset'), detail: $<HTMLInputElement>('detail'), original: $<HTMLInputElement>('original'), overlays: $<HTMLInputElement>('overlays') };
const views = { regional: { zoom: .065, y: 2300 }, wide: { zoom: .026, y: 5900 }, close: { zoom: .11, y: 1500 } };
type Options = { height: keyof typeof views; phase: 'approach' | 'departure'; offset: number; detail: boolean; original: boolean; overlays: boolean };
const defaults: Options = { height: 'regional', phase: 'approach', offset: 0, detail: true, original: false, overlays: true };
let options = { ...defaults };
function flight(target: string, departure: boolean): ApproachLevel {
  const before = new Set(APPROACH_LEVELS.map(l => l.id));
  createPlayableEstellaMission(departure ? target : 'estella-iii-main-customs', departure ? 'estella-iii-main-customs' : target, undefined, 12345);
  const level = APPROACH_LEVELS.find(l => !before.has(l.id) && l.poi.id === target && !!l.departure === departure);
  if (!level) throw new Error(`Missing approach fixture: ${target}/${departure}`);
  return level;
}
const worldBefore = JSON.stringify([BODIES, SURFACE_POIS]);
try {
  const cards = HARTWELL_APPROACH_TARGETS.map(id => {
    const region = hartwellApproachRegion(id), painter = createHartwellScenery(region), plainPainter = createHartwellScenery(region, false);
    const approach = flight(id, false), departure = flight(id, true), name = surfacePoiById(id).name;
    const article = document.createElement('article');
    const header = document.createElement('header'), title = document.createElement('div');
    const heading = document.createElement('h2'); heading.textContent = name;
    const subtitle = document.createElement('small'); subtitle.textContent = `${region.biome.name} · seed ${region.seed}`;
    title.append(heading, subtitle); header.append(title);
    const save = document.createElement('button'); save.textContent = 'Save PNG'; header.append(save);
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 420;
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    const footer = document.createElement('footer'); footer.textContent = `Target: ${id} · same biome, target-seeded distant relief/materials · existing foreground contour`;
    article.append(header, canvas, footer); $('views').append(article);
    save.onclick = () => { const a = document.createElement('a'); a.download = `${id}-${options.phase}-${options.height}.png`; a.href = canvas.toDataURL('image/png'); a.click(); };
    return { id, name, region, painter, plainPainter, approach, departure, canvas, ctx };
  });
  function draw(): void {
    const preset = views[options.height];
    for (const card of cards) {
      const level = options.phase === 'approach' ? card.approach : card.departure;
      const cam = { x: options.offset, y: preset.y, zoom: preset.zoom };
      const x = cam.x - 280 / cam.zoom;
      const state = createApproachState(level, { x, y: Math.max(getApproachTerrainHeight(x, level)+900, cam.y+200),
        vx: options.phase === 'approach' ? 125 : 160, vy: options.phase === 'approach' ? -25 : 70, angle: 1.3, localDir: 1 });
      const scenery = options.original ? drawOriginalApproachScenery : options.detail ? card.painter : card.plainPainter;
      if (options.overlays) renderApproach(card.ctx, card.canvas, cam, state, level, 0, true, scenery);
      else scenery(card.ctx, cam, state, level, card.canvas.width, card.canvas.height);
    }
    $('distance').textContent = `${(options.offset/1000).toFixed(2)} km`;
  }
  function set(input: Partial<Options>): void {
    const next = { ...options, ...input };
    if (!(next.height in views) || !['approach','departure'].includes(next.phase) || !Number.isFinite(next.offset) || Math.abs(next.offset)>16000) throw new Error('Invalid preview view');
    options = next;
    ui.height.value = options.height; ui.phase.value = options.phase; ui.offset.value = String(options.offset);
    ui.original.checked = options.original; ui.overlays.checked = options.overlays; ui.detail.checked = options.detail; draw();
  }
  for (const element of Object.values(ui)) element.oninput = () => set({ height: ui.height.value as Options['height'], phase: ui.phase.value as Options['phase'],
    offset: Number(ui.offset.value), detail: ui.detail.checked, original: ui.original.checked, overlays: ui.overlays.checked });
  $('reset').onclick = () => set(defaults);
  function checks() {
    let count = 0;
    const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); count++; };
    const hash = (canvas: HTMLCanvasElement) => { let h=2166136261; for(const v of canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data)h=Math.imul(h^v,16777619);return h>>>0; };
    const saved = { ...options };
    try {
      assert(cards.length===5 && new Set(cards.map(c=>c.region.seed)).size===5, 'five distinct target seeds');
      assert(cards.every(c=>c.region.biome===cards[0].region.biome), 'one shared biome');
      assert(JSON.stringify([BODIES,SURFACE_POIS])===worldBefore, 'catalog/physics/sites unchanged');
      const levelsBefore=JSON.stringify(cards.map(c=>[c.approach,c.departure]));
      set({ ...defaults, overlays:false }); const hashes=cards.map(c=>hash(c.canvas));
      assert(new Set(hashes).size===5, 'five visually different landscapes');
      set({detail:false});
      const plain=cards.map(c=>c.ctx.getImageData(0,0,1200,420).data);
      set({detail:true});
      cards.forEach((c,i)=>{
        const detailed=c.ctx.getImageData(0,0,1200,420).data;
        let backdropSame=true,changed=0,groundPixels=0;
        for(let x=0;x<1200;x++){
          const edge=210-(getApproachTerrainHeight((x-600)/.065,c.approach)-2300)*.065;
          for(let y=0;y<420;y++){
            const at=(y*1200+x)*4;
            const equal=detailed[at]===plain[i][at]&&detailed[at+1]===plain[i][at+1]&&detailed[at+2]===plain[i][at+2];
            if(y<edge-3&&!equal)backdropSame=false;
            if(y>edge+3){groundPixels++;if(!equal)changed++;}
          }
        }
        assert(backdropSame,`${c.id}: detailed material leaves sky/background unchanged`);
        assert(changed>groundPixels*.25,`${c.id}: substantial visible foreground detail`);
        assert(hash(c.canvas)===hashes[i],`${c.id}: detail toggle exact replay`);
      });
      set({phase:'departure'});
      cards.forEach((c,i)=>assert(hash(c.canvas)===hashes[i], `${c.id}: same landscape departing`));
      for(const height of ['wide','close'] as const)for(const offset of [-16000,16000]){
        set({height,offset});cards.forEach(c=>assert(c.ctx.getImageData(600,0,1,1).data[3]===255,`${c.id}: opaque sky at ${height}/${offset}`));
      }
      set({...defaults,overlays:false});cards.forEach((c,i)=>assert(hash(c.canvas)===hashes[i],`${c.id}: pan/zoom replay`));
      for(const c of cards){
        const level=c.approach, cam={x:0,y:2300,zoom:.065}, s=createApproachState(level);
        const before=JSON.stringify(s);
        c.ctx.fillStyle='#abcdef';c.ctx.lineWidth=7;c.ctx.globalAlpha=.7;c.ctx.setLineDash([3,5]);
        c.painter(c.ctx,cam,s,level,1200,420);
        assert(c.ctx.fillStyle==='#abcdef'&&c.ctx.lineWidth===7&&c.ctx.globalAlpha===.7&&c.ctx.getLineDash().join(',')==='3,5',`${c.id}: canvas state restored`);
        c.ctx.globalAlpha=1;c.ctx.setLineDash([]);c.ctx.lineWidth=1;
        assert(JSON.stringify(s)===before,`${c.id}: flight state unchanged`);
        renderApproach(c.ctx,c.canvas,cam,s,level,0);const old=hash(c.canvas);
        renderApproach(c.ctx,c.canvas,cam,s,level,0,true,()=>false);
        assert(hash(c.canvas)===old,`${c.id}: original rendering remains default/fallback`);
        const newRegion=hartwellApproachRegion(c.id);assert(newRegion.seed===c.region.seed,`${c.id}: rebuild stable`);
        const foreign={...level,body:{...level.body,id:'estella-iii'}};
        assert(c.painter(c.ctx,cam,s,foreign,1200,420)===false,`${c.id}: no other-world opt-in`);
      }
      for(const phase of ['approach','departure'] as const){set({...defaults,phase});cards.forEach(c=>assert(c.ctx.getImageData(600,419,1,1).data[3]===255,`${c.id}: production ${phase} render`));}
      assert(JSON.stringify(cards.map(c=>[c.approach,c.departure]))===levelsBefore,'levels/weather/gates unchanged');
      return { passed:true,checks:count,hashes,seeds:cards.map(c=>({id:c.id,seed:c.region.seed})) };
    } finally { set(saved); }
  }
  $('checks').onclick=()=>{try{const result=checks();$('status').textContent=`PASS — ${result.checks} native checks. Five stable targets, one biome; no save changes.`;}catch(e){$('error').textContent=String(e);throw e;}};
  draw(); $('status').textContent='Five Hartwell surface approaches ready. Adjust view, pan or phase; no saves are loaded.';
  (window as any).hartwellApproachPreview={ready:true,render:set,checks,canvas:(id:string)=>cards.find(c=>c.id===id)?.canvas,
    snapshot:()=>({options:{...options},targets:cards.map(c=>({id:c.id,name:c.name,region:c.region}))})};
} catch(error) {
  $('error').textContent=String(error);$('status').textContent='Preview unavailable';
  (window as any).hartwellApproachPreview={ready:false,error:String(error)};throw error;
}
